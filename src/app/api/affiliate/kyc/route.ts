import { NextRequest, NextResponse } from 'next/server';
import { KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { encryptKycValue, hashIdentityDocument } from '@/lib/phone-protection';

const documentTypes = new Set(['NATIONAL_ID', 'PASSPORT']);
const consentVersion = 'kyc-consent-v1';
const kycEnabled = process.env.KYC_SUBMISSIONS_ENABLED === 'true'
  && Boolean(process.env.KYC_PRIVACY_NOTICE_URL?.trim())
  && process.env.KYC_REVIEW_WORKFLOW_ENABLED === 'true';

export async function POST(request: NextRequest) {
  if (!kycEnabled) return NextResponse.json({ error: 'Identity verification is not enabled' }, { status: 503 });
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const rateLimit = await checkRateLimit(userId, 'affiliate/kyc', 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, kycStatus: true } });
    if (!user || user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Affiliate account required' }, { status: 403 });
    }
    if (user.kycStatus === KycStatus.PENDING || user.kycStatus === KycStatus.VERIFIED) {
      return NextResponse.json({ error: 'KYC submission is already in progress or complete' }, { status: 409 });
    }

    const body = await request.json();
    const legalName = typeof body.legalName === 'string' ? body.legalName.trim().replace(/\s+/g, ' ') : '';
    const documentType = body.documentType;
    const documentNumber = typeof body.documentNumber === 'string' ? body.documentNumber.trim() : '';
    const kraPin = typeof body.kraPin === 'string' ? body.kraPin.trim().toUpperCase() : '';
    const consent = body.consent === true;

    if (!/^[\p{L}\p{M} .,'’-]{2,120}$/u.test(legalName)) {
      return NextResponse.json({ error: 'Enter your full legal name' }, { status: 400 });
    }
    if (typeof documentType !== 'string' || !documentTypes.has(documentType)) {
      return NextResponse.json({ error: 'Choose National ID or passport' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9/-]{5,20}$/.test(documentNumber)) {
      return NextResponse.json({ error: 'Enter a valid ID or passport number' }, { status: 400 });
    }
    if (kraPin && !/^[A-Z]\d{9}[A-Z]$/.test(kraPin)) {
      return NextResponse.json({ error: 'Enter a valid KRA PIN or leave it blank' }, { status: 400 });
    }
    if (!consent) return NextResponse.json({ error: 'Consent is required' }, { status: 400 });

    const encryptedData = {
      legalNameEncrypted: encryptKycValue(legalName),
      identityDocumentType: documentType,
      identityDocumentEncrypted: encryptKycValue(documentNumber.toUpperCase()),
      identityDocumentHash: hashIdentityDocument(documentType as 'NATIONAL_ID' | 'PASSPORT', documentNumber),
      kraPinEncrypted: kraPin ? encryptKycValue(kraPin) : null,
      kycStatus: KycStatus.PENDING,
      kycSubmittedAt: new Date(),
      identityConsentAt: new Date(),
      identityConsentVersion: consentVersion,
    };

    await prisma.user.update({ where: { id: userId }, data: encryptedData });
    return NextResponse.json({ success: true, status: KycStatus.PENDING });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'This identity document is already associated with an account' }, { status: 409 });
    }
    // Never log submitted identity values or encrypted payloads.
    console.error('KYC submission failed');
    return NextResponse.json({ error: 'Could not submit identity details' }, { status: 500 });
  }
}
