import { randomInt } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { decryptPhone, hashPhoneOtp } from '@/lib/phone-protection';
import { getConfiguredSmsProvider } from '@/lib/sms';

const OTP_TTL_MS = 5 * 60 * 1000;
const GENERIC_SEND_FAILURE = 'Unable to send a verification code right now.';

function requestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown';
}

async function sendFallbackEmail(email: string, code: string, locale: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return false;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const swahili = locale === 'sw-KE';
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: swahili ? 'Msimbo wa kuthibitisha simu' : 'Your phone verification code',
      html: `<p>${swahili ? 'Msimbo wako wa kuthibitisha nambari ya simu ni:' : 'Your phone verification code is:'}</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>${swahili ? 'Msimbo huu unaisha baada ya dakika 5. Usimshirikishe mtu yeyote.' : 'This code expires in 5 minutes. Do not share it with anyone.'}</p>`,
    });
    return !result.error;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body: { locale?: unknown } = {};
  try { body = await request.json(); } catch { /* Locale is optional. */ }
  const locale = body.locale === 'sw-KE' ? 'sw-KE' : 'en-KE';
  const ip = requestIp(request);
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(userId, 'affiliate/phone/send-otp/user', 3, 60 * 60 * 1000),
    checkRateLimit(ip, 'affiliate/phone/send-otp/ip', 5, 60 * 60 * 1000),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: {
    id: true, email: true, phoneEncrypted: true, phoneVerifiedAt: true,
  } });
  if (!user?.phoneEncrypted) return NextResponse.json({ error: 'No phone number is saved on this account.' }, { status: 400 });
  if (user.phoneVerifiedAt) return NextResponse.json({ error: 'This phone number is already verified.' }, { status: 409 });

  const recent = await prisma.phoneOTP.findFirst({
    where: { userId, createdAt: { gte: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) return NextResponse.json({ error: 'Wait one minute before requesting another code.' }, { status: 429 });

  let phone: string;
  try { phone = decryptPhone(user.phoneEncrypted); }
  catch { return NextResponse.json({ error: GENERIC_SEND_FAILURE }, { status: 503 }); }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const smsProvider = getConfiguredSmsProvider();
  let channel: 'sms' | 'email' = 'sms';
  let delivered = false;
  if (smsProvider) {
    try {
      await smsProvider.send({
        to: phone,
        message: locale === 'sw-KE'
          ? `Msimbo wako wa GanjiLink ni ${code}. Unaisha baada ya dakika 5. Usimshirikishe mtu yeyote.`
          : `Your GanjiLink verification code is ${code}. It expires in 5 minutes. Do not share it.`,
      });
      delivered = true;
    } catch { /* Fall back to the verified account email, without logging provider PII. */ }
  }
  if (!delivered) {
    channel = 'email';
    delivered = await sendFallbackEmail(user.email, code, locale);
  }
  if (!delivered) return NextResponse.json({ error: GENERIC_SEND_FAILURE }, { status: 503 });

  const now = new Date();
  await prisma.$transaction([
    prisma.phoneOTP.updateMany({ where: { userId, isUsed: false }, data: { isUsed: true } }),
    prisma.phoneOTP.create({ data: {
      userId, codeHash: hashPhoneOtp(userId, code), channel,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    } }),
  ]);
  return NextResponse.json({ success: true, channel });
}
