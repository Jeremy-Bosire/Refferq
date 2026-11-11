import { NextRequest, NextResponse } from 'next/server';
import { KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { decryptKycValue } from '@/lib/phone-protection';

async function getActiveAdmin(request: NextRequest) {
  const id = request.headers.get('x-user-id');
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } });
  return user?.role === 'ADMIN' && user.status === 'ACTIVE' ? user : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getActiveAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Active admin access required' }, { status: 403 });
    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        legalNameEncrypted: true,
        identityDocumentType: true,
        identityDocumentEncrypted: true,
        kraPinEncrypted: true,
        kycStatus: true,
        kycSubmittedAt: true,
      },
    });
    if (!user || user.kycStatus !== KycStatus.PENDING || !user.legalNameEncrypted || !user.identityDocumentEncrypted) {
      return NextResponse.json({ error: 'Pending KYC submission not found' }, { status: 404 });
    }

    // A PII-read audit record is mandatory before the identity values are returned.
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'KYC_PII_VIEWED',
        objectType: 'USER',
        objectId: user.id,
        payload: { fields: ['legalName', 'identityDocument', ...(user.kraPinEncrypted ? ['kraPin'] : [])] },
      },
    });

    return NextResponse.json({
      identity: {
        legalName: decryptKycValue(user.legalNameEncrypted),
        documentType: user.identityDocumentType,
        documentNumber: decryptKycValue(user.identityDocumentEncrypted),
        kraPin: user.kraPinEncrypted ? decryptKycValue(user.kraPinEncrypted) : null,
        submittedAt: user.kycSubmittedAt,
      },
    });
  } catch {
    console.error('KYC identity access failed');
    return NextResponse.json({ error: 'Could not access identity details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getActiveAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Active admin access required' }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const status = body.status;
    if (status !== KycStatus.VERIFIED && status !== KycStatus.REJECTED) {
      return NextResponse.json({ error: 'Choose verified or rejected' }, { status: 400 });
    }

    const submission = await prisma.user.findUnique({ where: { id }, select: { kycStatus: true, kycSubmittedAt: true } });
    if (!submission || submission.kycStatus !== KycStatus.PENDING || !submission.kycSubmittedAt) {
      return NextResponse.json({ error: 'Pending KYC submission not found' }, { status: 404 });
    }
    const viewed = await prisma.auditLog.findFirst({
      where: {
        actorId: admin.id,
        action: 'KYC_PII_VIEWED',
        objectType: 'USER',
        objectId: id,
        createdAt: { gte: submission.kycSubmittedAt },
      },
      select: { id: true },
    });
    if (!viewed) return NextResponse.json({ error: 'Review the submitted identity details before deciding' }, { status: 409 });

    await prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: { id, kycStatus: KycStatus.PENDING },
        data: { kycStatus: status, kycReviewedAt: new Date(), kycReviewedBy: admin.id },
      });
      if (changed.count !== 1) throw new Error('KYC review conflict');
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: status === KycStatus.VERIFIED ? 'KYC_VERIFIED' : 'KYC_REJECTED',
          objectType: 'USER',
          objectId: id,
          payload: { previousStatus: KycStatus.PENDING, newStatus: status },
        },
      });
    });
    return NextResponse.json({ success: true, status });
  } catch {
    console.error('KYC review decision failed');
    return NextResponse.json({ error: 'Could not save review decision' }, { status: 500 });
  }
}
