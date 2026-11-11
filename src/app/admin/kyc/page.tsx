'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/i18n/provider';
import { formatDateTimeEAT } from '@/lib/date';

interface Submission {
  id: string;
  name: string;
  email: string;
  county: string | null;
  identityDocumentType: string | null;
  kycSubmittedAt: string | null;
}

interface IdentityDetails {
  legalName: string;
  documentType: string | null;
  documentNumber: string;
  kraPin: string | null;
  submittedAt: string | null;
}

export default function KycReviewPage() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [identity, setIdentity] = useState<IdentityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/kyc');
      const data = await response.json();
      if (!response.ok) throw new Error();
      setSubmissions(data.submissions || []);
      setError('');
    } catch {
      setError(t('kycQueueLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  const openSubmission = async (submission: Submission) => {
    setSelected(submission);
    setIdentity(null);
    setError('');
    try {
      const response = await fetch(`/api/admin/kyc/${submission.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error();
      setIdentity(data.identity);
    } catch {
      setError(t('kycIdentityLoadFailed'));
    }
  };

  const decide = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selected || !identity) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/kyc/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      setSelected(null);
      setIdentity(null);
      await loadQueue();
    } catch {
      setError(t('kycDecisionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('kycReviews')}</h1>
        <p className="text-muted-foreground">{t('kycReviewDescription')}</p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle>{t('pendingIdentitySubmissions')}</CardTitle>
          <CardDescription>{t('kycReviewPrivacy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">{t('kycLoading')}</p>
            : submissions.length === 0 ? <p className="text-sm text-muted-foreground">{t('noPendingKyc')}</p>
              : submissions.map((submission) => (
                <div key={submission.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{submission.name}</p>
                    <p className="text-sm text-muted-foreground">{submission.email}{submission.county ? ` · ${submission.county}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{submission.identityDocumentType || ''} · {submission.kycSubmittedAt ? formatDateTimeEAT(submission.kycSubmittedAt) : ''}</p>
                  </div>
                  <Button variant="outline" onClick={() => void openSubmission(submission)}>{t('reviewIdentity')}</Button>
                </div>
              ))}
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>{t('identityDetails')}</CardTitle>
            <CardDescription>{selected.name} · {selected.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!identity ? <p className="text-sm text-muted-foreground">{t('kycLoading')}</p> : (
              <>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div><dt className="text-sm text-muted-foreground">{t('legalName')}</dt><dd className="font-medium">{identity.legalName}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">{t('identityDocumentType')}</dt><dd className="font-medium">{identity.documentType}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">{t('identityDocumentNumber')}</dt><dd className="font-mono font-medium">{identity.documentNumber}</dd></div>
                  {identity.kraPin && <div><dt className="text-sm text-muted-foreground">{t('kraPinOptional')}</dt><dd className="font-mono font-medium">{identity.kraPin}</dd></div>}
                  <div><dt className="text-sm text-muted-foreground">{t('submittedAt')}</dt><dd>{identity.submittedAt ? formatDateTimeEAT(identity.submittedAt) : ''}</dd></div>
                </dl>
                <p className="text-xs text-muted-foreground">{t('kycAuditNotice')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => void decide('VERIFIED')}>{t('markIdentityVerified')}</Button>
                  <Button disabled={busy} variant="destructive" onClick={() => void decide('REJECTED')}>{t('rejectIdentity')}</Button>
                  <Button disabled={busy} variant="outline" onClick={() => { setSelected(null); setIdentity(null); }}>{t('close')}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
