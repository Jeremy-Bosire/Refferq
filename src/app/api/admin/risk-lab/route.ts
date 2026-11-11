import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { simulateRecruitmentRisk } from '@/lib/recruitment-risk-simulation';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const admin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true } });
    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active admin access required' }, { status: 403 });
    }
    const limit = await checkRateLimit(userId, 'admin/risk-lab', 30, 60 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many simulations' }, { status: 429 });

    const body = await request.json();
    const result = simulateRecruitmentRisk({
      initialParticipants: body.initialParticipants,
      directRecruits: body.directRecruits,
      generations: body.generations,
      contributionKes: body.contributionKes,
    });
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'RECRUITMENT_RISK_SIMULATED',
        objectType: 'SIMULATION',
        objectId: 'recruitment-risk-lab',
        payload: {
          parameters: {
            initialParticipants: result.parameters.initialParticipants,
            directRecruits: result.parameters.directRecruits,
            generations: result.parameters.generations,
            contributionKes: result.parameters.contributionKes,
          },
          totalParticipants: result.totalParticipants,
          totalContributionsMinor: result.totalContributionsMinor,
          totalTheoreticalObligationsMinor: result.totalTheoreticalObligationsMinor,
          availableVirtualFundsMinor: result.availableVirtualFundsMinor,
        },
      },
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json({ error: 'Scenario values are outside the supported simulation bounds' }, { status: 400 });
    }
    console.error('Recruitment risk simulation failed');
    return NextResponse.json({ error: 'Could not run risk simulation' }, { status: 500 });
  }
}
