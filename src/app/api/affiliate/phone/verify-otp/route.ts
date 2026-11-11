import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashPhoneOtp } from '@/lib/phone-protection';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown';
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(userId, 'affiliate/phone/verify-otp/user', 10, 60 * 60 * 1000),
    checkRateLimit(ip, 'affiliate/phone/verify-otp/ip', 20, 60 * 60 * 1000),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: { code?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Enter the six-digit code.' }, { status: 400 }); }
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: 'Enter the six-digit code.' }, { status: 400 });

  const now = new Date();
  const otp = await prisma.phoneOTP.findFirst({
    where: { userId, isUsed: false, expiresAt: { gt: now }, attempts: { lt: 5 } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return NextResponse.json({ error: 'The code is invalid or expired. Request a new one.' }, { status: 400 });

  const expected = Buffer.from(otp.codeHash, 'hex');
  const supplied = Buffer.from(hashPhoneOtp(userId, code), 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    const attempts = otp.attempts + 1;
    await prisma.phoneOTP.updateMany({
      where: { id: otp.id, isUsed: false, attempts: otp.attempts },
      data: { attempts, ...(attempts >= 5 ? { isUsed: true } : {}) },
    });
    return NextResponse.json({ error: 'The code is invalid or expired. Request a new one.' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const consumed = await tx.phoneOTP.updateMany({
      where: { id: otp.id, userId, isUsed: false, attempts: { lt: 5 }, expiresAt: { gt: new Date() } },
      data: { isUsed: true },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
    await tx.auditLog.create({ data: {
      actorId: userId, action: 'PHONE_VERIFIED', objectType: 'User', objectId: userId,
      payload: { channel: otp.channel },
    } });
    return true;
  });
  if (!result) return NextResponse.json({ error: 'The code is invalid or expired. Request a new one.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
