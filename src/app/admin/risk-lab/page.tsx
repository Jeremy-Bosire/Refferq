'use client';

import { FormEvent, useState } from 'react';
import { Activity, AlertTriangle, Users, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/provider';
import { formatMoney } from '@/lib/currency';
import type { MessageKey } from '@/i18n/messages';

const riskFlagTranslations: Record<RiskResult['riskFlags'][number], MessageKey> = {
  NO_EXTERNAL_REVENUE: 'riskFlagNO_EXTERNAL_REVENUE',
  RECRUITMENT_STOP: 'riskFlagRECRUITMENT_STOP',
  FUNDING_DEFICIT: 'riskFlagFUNDING_DEFICIT',
  EXPONENTIAL_GROWTH: 'riskFlagEXPONENTIAL_GROWTH',
};

interface RiskResult {
  disclaimer: string;
  parameters: { initialParticipants: number; directRecruits: number; generations: number; contributionKes: number };
  rewardSharesBps: number[];
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
  externalProductRevenueMinor: number;
  riskFlags: string[];
}

export default function RecruitmentRiskLabPage() {
  const { t } = useI18n();
  const [scenario, setScenario] = useState({ initialParticipants: 1, directRecruits: 3, generations: 5, contributionKes: 5000 });
  const [result, setResult] = useState<RiskResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const runSimulation = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/risk-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('riskLabFailed'));
      setResult(data.result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('riskLabFailed'));
    } finally {
      setBusy(false);
    }
  };

  const maxCount = Math.max(1, ...(result?.generationRows.map((row) => row.participants) || [1]));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold tracking-tight">{t('riskLabTitle')}</h1></div>
        <p className="mt-1 text-muted-foreground">{t('riskLabDescription')}</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t('riskLabDisclaimer')}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle>{t('riskScenario')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={runSimulation} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2"><Label htmlFor="roots">{t('scenarioStartingParticipants')}</Label><Input id="roots" type="number" min={1} max={100} step={1} value={scenario.initialParticipants} onChange={(e) => setScenario({ ...scenario, initialParticipants: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="recruits">{t('scenarioDirectRecruits')}</Label><Input id="recruits" type="number" min={0} max={5} step={1} value={scenario.directRecruits} onChange={(e) => setScenario({ ...scenario, directRecruits: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="generations">{t('scenarioGenerations')}</Label><Input id="generations" type="number" min={0} max={8} step={1} value={scenario.generations} onChange={(e) => setScenario({ ...scenario, generations: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="contribution">{t('scenarioContributionKes')}</Label><Input id="contribution" type="number" min={0} max={50000} step={1} value={scenario.contributionKes} onChange={(e) => setScenario({ ...scenario, contributionKes: Number(e.target.value) })} /></div>
            <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full">{busy ? t('riskLabRunning') : t('runRiskScenario')}</Button></div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">{t('riskScenarioBounds')}</p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          <Alert variant="destructive"><AlertDescription>{t('riskLabDisclaimer')}</AlertDescription></Alert>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Users className="h-4 w-4" />} label={t('simulatedParticipants')} value={result.totalParticipants.toLocaleString('en-KE')} />
            <Metric icon={<Wallet className="h-4 w-4" />} label={t('simulatedContributions')} value={formatMoney(result.totalContributionsMinor)} />
            <Metric icon={<Activity className="h-4 w-4" />} label={t('simulatedObligations')} value={formatMoney(result.totalTheoreticalObligationsMinor)} />
            <Metric icon={<AlertTriangle className="h-4 w-4" />} label={t('virtualFundsBeforeCashouts')} value={formatMoney(result.availableVirtualFundsMinor)} tone={result.availableVirtualFundsMinor < 0 ? 'danger' : 'normal'} />
          </div>

          <Card>
            <CardHeader><CardTitle>{t('simulatedFinancialPosition')}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Breakdown label={t('commissionObligations')} amount={result.totalCommissionObligationsMinor} />
              <Breakdown label={t('simulatedOperatingCosts')} amount={result.simulatedOperatingCostsMinor} />
              <Breakdown label={t('externalProductRevenue')} amount={result.externalProductRevenueMinor} />
              <div><p className="text-sm text-muted-foreground">{t('contributionFundingShare')}</p><p className="mt-1 text-xl font-semibold">{(result.fundingSourceContributionShareBps / 100).toFixed(0)}%</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('fixedIllustrativeRewardShares')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {result.rewardSharesBps.map((share, index) => (
                <div key={index} className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">{t('tierShare', { tier: String(index + 1) })}</p>
                  <p className="text-lg font-semibold">{(share / 100).toFixed(0)}%</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('generationBreakdown')}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {result.generationRows.map((row) => (
                <div key={row.generation} className="space-y-2">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold">{t('generationLabel', { generation: String(row.generation) })} · {row.participants.toLocaleString('en-KE')} {t('participantsLabel')}</span>
                    <span className={row.cohortNetPositionMinor < 0 ? 'font-medium text-red-700' : 'font-medium text-emerald-700'}>{t('cohortNetPosition')}: {formatMoney(row.cohortNetPositionMinor)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${Math.max(2, row.participants / maxCount * 100)}%` }} /></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground md:grid-cols-4">
                    <span>{t('simulatedContributions')}: {formatMoney(row.simulatedContributionsMinor)}</span>
                    <span>{t('simulatedObligations')}: {formatMoney(row.theoreticalObligationsMinor)}</span>
                    <span>{t('commissionsReceived')}: {formatMoney(row.estimatedCommissionsReceivedMinor)}</span>
                    <span>{t('activeParticipants')}: {row.activeParticipants.toLocaleString('en-KE')}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('riskSignals')}</CardTitle></CardHeader>
            <CardContent><ul className="list-disc space-y-2 pl-5 text-sm">{result.riskFlags.map((flag) => <li key={flag}>{t(riskFlagTranslations[flag])}</li>)}</ul></CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value, tone = 'normal' }: { icon: React.ReactNode; label: string; value: string; tone?: 'normal' | 'danger' }) {
  return <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div><p className={`mt-3 text-2xl font-bold ${tone === 'danger' ? 'text-red-700' : ''}`}>{value}</p></CardContent></Card>;
}

function Breakdown({ label, amount }: { label: string; amount: number }) {
  return <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{formatMoney(amount)}</p></div>;
}
