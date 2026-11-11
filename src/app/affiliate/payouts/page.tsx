'use client';

import React, { useState, useEffect } from 'react';
import { formatMoney } from '@/lib/currency';
import { formatDateEAT } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  CheckCircle2,
  Ban,
  Wallet,
  CreditCard,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string;
}

export default function PayoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!authLoading && user) fetchPayouts();
  }, [authLoading, user]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const [payRes, profileRes] = await Promise.all([
        fetch('/api/affiliate/payouts'),
        fetch('/api/affiliate/profile'),
      ]);
      const payData = await payRes.json();
      const profileData = await profileRes.json();
      if (payData.success) setPayouts(payData.payouts || []);
      if (profileData.success) {
        setBalance(profileData.affiliate?.balanceCents || 0);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    formatDateEAT(date, { year: 'numeric', month: 'short', day: 'numeric' });

  const formatCurrency = formatMoney;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      COMPLETED: { variant: 'default', icon: CheckCircle2 },
      PAID: { variant: 'default', icon: CheckCircle2 },
      PENDING: { variant: 'secondary', icon: Clock },
      PROCESSING: { variant: 'secondary', icon: Loader2 },
      FAILED: { variant: 'destructive', icon: Ban },
    };
    const { variant, icon: Icon } = map[status] || { variant: 'outline' as const, icon: Clock };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status === 'COMPLETED' || status === 'PAID'
          ? t('approved')
          : status === 'PENDING' || status === 'PROCESSING'
            ? t('pending')
            : status === 'FAILED'
              ? t('rejected')
              : status}
      </Badge>
    );
  };

  const totalPaid = payouts.filter((p) => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = payouts.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

  const exportCSV = () => {
    const headers = [t('date'), t('method'), t('status'), t('amount')];
    const rows = payouts.map((p) => [
      formatDate(p.paidAt || p.createdAt),
      p.method,
      p.status,
      formatMoney(p.amount),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('payouts')}</h1>
          <p className="text-muted-foreground">{t('payoutsTitleDescription')}</p>
        </div>
        {payouts.length > 0 && (
          <Button variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            {t('exportCsv')}
          </Button>
        )}
      </div>

      {/* Earnings Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-sm font-bold text-emerald-600">KSh</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
                <p className="text-xs text-muted-foreground">{t('currentBalance')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-muted-foreground">{t('totalPaid')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingPayout)}</p>
                <p className="text-xs text-muted-foreground">{t('pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <CreditCard className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{payouts.length}</p>
                <p className="text-xs text-muted-foreground">{t('totalPayouts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">{t('payoutInformation')}</p>
            <p className="text-sm text-blue-700">
              {t('payoutTimingNotice')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('payoutHistory')}</CardTitle>
          <CardDescription>{payouts.length === 1
            ? t('payoutCountOne', { count: String(payouts.length) })
            : t('payoutCount', { count: String(payouts.length) })}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">{t('noPayoutsYet')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('referToEarn')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-sm">{formatDate(payout.paidAt || payout.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{payout.method || t('notAvailable')}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(payout.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
