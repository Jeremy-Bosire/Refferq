/**
 * Educational model only. It has no database or payment integration and uses
 * fixed illustrative rates so it cannot be mistaken for a live compensation plan.
 */
export const SIMULATED_REWARD_SHARES_BPS = [4_000, 2_500, 2_000, 1_500] as const;
export const SIMULATED_OPERATING_COST_BPS = 1_200;
const MAX_GENERATIONS = 8;
const MAX_DIRECT_RECRUITS = 5;
const MAX_ROOTS = 100;
const MAX_CONTRIBUTION_KES = 50_000;

export interface RecruitmentRiskInput {
  initialParticipants: number;
  directRecruits: number;
  generations: number;
  contributionKes: number;
}

export interface RecruitmentRiskResult {
  disclaimer: string;
  parameters: RecruitmentRiskInput;
  rewardSharesBps: readonly number[];
  generationRows: Array<{
    generation: number;
    participants: number;
    activeParticipants: number;
    simulatedContributionsMinor: number;
    theoreticalObligationsMinor: number;
    estimatedCommissionsReceivedMinor: number;
    cohortNetPositionMinor: number;
  }>;
  totalParticipants: number;
  totalContributionsMinor: number;
  totalCommissionObligationsMinor: number;
  simulatedOperatingCostsMinor: number;
  totalTheoreticalObligationsMinor: number;
  availableVirtualFundsMinor: number;
  fundingSourceContributionShareBps: number;
  externalProductRevenueMinor: 0;
  riskFlags: Array<'NO_EXTERNAL_REVENUE' | 'RECRUITMENT_STOP' | 'FUNDING_DEFICIT' | 'EXPONENTIAL_GROWTH'>;
}

function requireInteger(name: string, value: number, min: number, max: number): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
}

function safeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Simulation result exceeds safe integer range');
  }
  return Number(value);
}

export function simulateRecruitmentRisk(input: RecruitmentRiskInput): RecruitmentRiskResult {
  requireInteger('initialParticipants', input.initialParticipants, 1, MAX_ROOTS);
  requireInteger('directRecruits', input.directRecruits, 0, MAX_DIRECT_RECRUITS);
  requireInteger('generations', input.generations, 0, MAX_GENERATIONS);
  requireInteger('contributionKes', input.contributionKes, 0, MAX_CONTRIBUTION_KES);

  const contributionMinor = BigInt(input.contributionKes) * 100n;
  const participantCounts: bigint[] = [BigInt(input.initialParticipants)];
  for (let generation = 1; generation <= input.generations; generation += 1) {
    participantCounts.push(participantCounts[generation - 1] * BigInt(input.directRecruits));
  }

  const contributionsByGeneration = participantCounts.map((count) => count * contributionMinor);
  const commissionsByGeneration = participantCounts.map(() => 0n);
  const commissionsReceivedByGeneration = participantCounts.map(() => 0n);

  for (let payerGeneration = 1; payerGeneration < participantCounts.length; payerGeneration += 1) {
    for (let distance = 1; distance <= SIMULATED_REWARD_SHARES_BPS.length && distance <= payerGeneration; distance += 1) {
      const obligation = participantCounts[payerGeneration]
        * contributionMinor
        * BigInt(SIMULATED_REWARD_SHARES_BPS[distance - 1])
        / 10_000n;
      commissionsByGeneration[payerGeneration] += obligation;
      commissionsReceivedByGeneration[payerGeneration - distance] += obligation;
    }
  }

  const rows = participantCounts.map((count, generation) => {
    const contribution = contributionsByGeneration[generation];
    const commissionObligations = commissionsByGeneration[generation];
    const operatingCosts = contribution * BigInt(SIMULATED_OPERATING_COST_BPS) / 10_000n;
    const obligations = commissionObligations + operatingCosts;
    const received = commissionsReceivedByGeneration[generation];
    return {
      generation,
      participants: safeNumber(count),
      // Synthetic only: all generated records are considered active in the model.
      activeParticipants: safeNumber(count),
      simulatedContributionsMinor: safeNumber(contribution),
      theoreticalObligationsMinor: safeNumber(obligations),
      estimatedCommissionsReceivedMinor: safeNumber(received),
      cohortNetPositionMinor: safeNumber(received - contribution - operatingCosts),
    };
  });

  const totalParticipants = participantCounts.reduce((sum, value) => sum + value, 0n);
  const totalContributions = contributionsByGeneration.reduce((sum, value) => sum + value, 0n);
  const totalCommissionObligations = commissionsByGeneration.reduce((sum, value) => sum + value, 0n);
  const simulatedOperatingCosts = totalContributions * BigInt(SIMULATED_OPERATING_COST_BPS) / 10_000n;
  const totalObligations = totalCommissionObligations + simulatedOperatingCosts;
  const flags: RecruitmentRiskResult['riskFlags'] = ['NO_EXTERNAL_REVENUE', 'RECRUITMENT_STOP'];
  if (totalObligations > totalContributions) {
    flags.push('FUNDING_DEFICIT');
  }
  if (input.directRecruits > 1 && input.generations >= 4) {
    flags.push('EXPONENTIAL_GROWTH');
  }

  return {
    disclaimer: 'Educational simulation using synthetic participants and virtual KES. It is not a product, earnings forecast, or payment instruction.',
    parameters: input,
    rewardSharesBps: SIMULATED_REWARD_SHARES_BPS,
    generationRows: rows,
    totalParticipants: safeNumber(totalParticipants),
    totalContributionsMinor: safeNumber(totalContributions),
    totalCommissionObligationsMinor: safeNumber(totalCommissionObligations),
    simulatedOperatingCostsMinor: safeNumber(simulatedOperatingCosts),
    totalTheoreticalObligationsMinor: safeNumber(totalObligations),
    availableVirtualFundsMinor: safeNumber(totalContributions - totalObligations),
    fundingSourceContributionShareBps: totalObligations === 0n ? 0 : 10_000,
    externalProductRevenueMinor: 0,
    riskFlags: flags,
  };
}
