'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Banknote,
  TrendingUp,
  Target,
  Users,
  Download,
  Calendar,
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { getMonthKeyEAT } from '@/lib/date';

interface ReportStats {
  totalEarnings: number;
  totalClicks: number;
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
}

interface MonthlyData {
  month: string;
  referrals: number;
  conversions: number;
  earnings: number;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');
  const [stats, setStats] = useState<ReportStats>({
    totalEarnings: 0,
    totalClicks: 0,
    totalLeads: 0,
    totalConversions: 0,
    conversionRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/profile');
      const data = await res.json();
      if (data.success) {
        const referrals = data.referrals || [];
        const commissions = data.commissions || [];
        const conversions = data.conversions || [];

        const totalEarnings = commissions
          .filter((c: any) => c.status === 'PAID')
          .reduce((sum: number, c: any) => sum + c.amountCents, 0);

        setStats({
          totalEarnings,
          totalClicks: data.stats?.totalClicks || 0,
          totalLeads: referrals.length,
          totalConversions: conversions.length,
          conversionRate: data.stats?.conversionRate || 0,
        });

        // Generate monthly breakdown
        const months: Record<string, MonthlyData> = {};
        const monthCount = period === '3months' ? 3 : period === '12months' ? 12 : 6;
        const [currentYear, currentMonth] = getMonthKeyEAT(new Date()).split('-').map(Number);
        for (let i = monthCount - 1; i >= 0; i--) {
          const monthIndex = currentYear * 12 + currentMonth - 1 - i;
          const year = Math.floor(monthIndex / 12);
          const month = (monthIndex % 12) + 1;
          const key = `${year}-${String(month).padStart(2, '0')}`;
          const d = new Date(Date.UTC(year, month - 1, 15, 12));
          months[key] = {
            month: new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }).format(d),
            referrals: 0,
            conversions: 0,
            earnings: 0,
          };
        }

        referrals.forEach((r: any) => {
          const key = getMonthKeyEAT(r.createdAt);
          if (months[key]) months[key].referrals++;
        });

        conversions.forEach((c: any) => {
          const key = getMonthKeyEAT(c.createdAt);
          if (months[key]) months[key].conversions++;
        });

        commissions
          .filter((c: any) => c.status === 'PAID')
          .forEach((c: any) => {
            const key = getMonthKeyEAT(c.createdAt);
            if (months[key]) months[key].earnings += c.amountCents;
          });

        setMonthlyData(Object.values(months));
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }, [locale, period]);

  useEffect(() => {
    if (!authLoading && user) void fetchReportData();
  }, [authLoading, user, fetchReportData]);

  const formatCurrency = formatMoney;

  const exportCSV = () => {
    const headers = [t('month'), t('referrals'), t('conversions'), `${t('earnings')} (KES)`];
    const rows = monthlyData.map((m) => [m.month, m.referrals, m.conversions, formatMoney(m.earnings)]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const maxEarnings = Math.max(...monthlyData.map((m) => m.earnings), 1);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('reports')}</h1>
          <p className="text-muted-foreground">{t('analyzeAffiliatePerformance')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">{t('lastThreeMonths')}</SelectItem>
              <SelectItem value="6months">{t('lastSixMonths')}</SelectItem>
              <SelectItem value="12months">{t('lastTwelveMonths')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            {t('exportCsv')}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-xs text-muted-foreground">{t('totalEarnings')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
                <p className="text-xs text-muted-foreground">{t('totalLeads')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalConversions}</p>
                <p className="text-xs text-muted-foreground">{t('conversions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{t('conversionRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart (CSS bar chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('monthlyEarnings')}</CardTitle>
          <CardDescription>{t('earningsFromReferrals')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{formatCurrency(m.earnings)}</span>
                <div
                  className="w-full bg-emerald-500 rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${Math.max((m.earnings / maxEarnings) * 100, 2)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{m.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('monthlyBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('month')}</TableHead>
                <TableHead className="text-center">{t('referrals')}</TableHead>
                <TableHead className="text-center">{t('conversions')}</TableHead>
                <TableHead className="text-right">{t('earnings')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-center">{m.referrals}</TableCell>
                  <TableCell className="text-center">{m.conversions}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(m.earnings)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>{t('total')}</TableCell>
                <TableCell className="text-center">{monthlyData.reduce((s, m) => s + m.referrals, 0)}</TableCell>
                <TableCell className="text-center">{monthlyData.reduce((s, m) => s + m.conversions, 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(monthlyData.reduce((s, m) => s + m.earnings, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
