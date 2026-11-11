import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getActiveAdmin(request: NextRequest) {
  const id = request.headers.get('x-user-id');
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true } });
  return user?.role === 'ADMIN' && user.status === 'ACTIVE' ? user : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getActiveAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Active admin access required' }, { status: 403 });

    const submissions = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        county: true,
        identityDocumentType: true,
        kycSubmittedAt: true,
      },
      orderBy: { kycSubmittedAt: 'asc' },
    });
    return NextResponse.json({ submissions });
  } catch {
    console.error('KYC review queue failed');
    return NextResponse.json({ error: 'Could not load review queue' }, { status: 500 });
  }
}
