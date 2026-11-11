'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, Plus, Eye, Banknote, CheckCircle2, Clock, AlertCircle, Trash2,
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { formatDateEAT } from '@/lib/date';
import { useI18n } from '@/i18n/provider';

interface Invoice {
  id: string;
  invoiceNumber: string;
  affiliateId: string;
  amountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: string;
  lineItems: any[];
  billingInfo: any;
  notes?: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    affiliateId: '', amountCents: '', taxCents: '0', notes: '', dueAt: '',
  });

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices');
      const data = await res.json();
      if (data.success) setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: form.affiliateId,
          amountCents: parseInt(form.amountCents),
          taxCents: parseInt(form.taxCents) || 0,
          notes: form.notes || null,
          dueAt: form.dueAt || null,
        }),
      });
      if (res.ok) {
        await fetchInvoices();
        setDialogOpen(false);
        setForm({ affiliateId: '', amountCents: '', taxCents: '0', notes: '', dueAt: '' });
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteInvoice'))) return;
    try {
      const res = await fetch(`/api/admin/invoices?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchInvoices();
      } else {
        alert(t('deleteInvoiceFailed'));
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  const formatCurrency = formatMoney;

  const formatDate = formatDateEAT;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      PAID: { variant: 'default', icon: CheckCircle2 },
      ISSUED: { variant: 'secondary', icon: Clock },
      DRAFT: { variant: 'outline', icon: FileText },
      OVERDUE: { variant: 'destructive', icon: AlertCircle },
      CANCELLED: { variant: 'destructive', icon: AlertCircle },
    };
    const { variant, icon: Icon } = map[status] || { variant: 'outline' as const, icon: Clock };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status === 'PAID'
          ? t('paid')
          : status === 'ISSUED'
            ? t('issued')
            : status === 'DRAFT'
              ? t('draft')
              : status === 'OVERDUE'
                ? t('overdue')
                : status === 'CANCELLED'
                  ? t('cancelled')
                  : status}
      </Badge>
    );
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    outstanding: invoices.filter(i => ['ISSUED', 'OVERDUE'].includes(i.status)).reduce((s, i) => s + i.totalCents, 0),
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalCents, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('invoices')}</h1>
          <p className="text-muted-foreground">{t('invoicesDescription')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createInvoice')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalInvoices')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('paid')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.paid}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outstanding')}</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPaid')}</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allInvoices')}</CardTitle>
          <CardDescription>{t('trackPayoutInvoices')}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('noInvoicesYet')}</h3>
              <p className="text-sm text-muted-foreground">{t('createFirstInvoice')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('affiliate')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('tax')}</TableHead>
                  <TableHead>{t('total')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('issued')}</TableHead>
                  <TableHead>{t('due')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.affiliateId.slice(0, 8)}...</TableCell>
                    <TableCell>{formatCurrency(inv.amountCents)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(inv.taxCents)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inv.totalCents)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.issuedAt ? formatDate(inv.issuedAt) : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.dueAt ? formatDate(inv.dueAt) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewInvoice(inv)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {inv.status === 'ISSUED' && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(inv.id, 'PAID')}>
                            {t('markPaid')}
                          </Button>
                        )}
                        {inv.status !== 'PAID' && (
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createInvoice')}</DialogTitle>
            <DialogDescription>{t('createInvoiceForAffiliate')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('affiliateId')} *</Label>
              <Input value={form.affiliateId} onChange={e => setForm({...form, affiliateId: e.target.value})} placeholder={t('affiliateId')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('amountMinorUnits')} *</Label>
                <Input type="number" value={form.amountCents} onChange={e => setForm({...form, amountCents: e.target.value})} placeholder="100000" />
                <p className="text-xs text-muted-foreground">{t('minorUnitExample')}</p>
              </div>
              <div className="grid gap-2">
                <Label>{t('taxMinorUnits')}</Label>
                <Input type="number" value={form.taxCents} onChange={e => setForm({...form, taxCents: e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('dueDate')}</Label>
              <Input type="date" value={form.dueAt} onChange={e => setForm({...form, dueAt: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>{t('notes')}</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t('optionalNotes')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={saving || !form.affiliateId || !form.amountCents}>
              {saving ? t('creating') : t('createInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('invoice')} {viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('status')}</p>
                  <div className="mt-1">{getStatusBadge(viewInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('affiliate')}</p>
                  <p className="font-mono mt-1">{viewInvoice.affiliateId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('amount')}</p>
                  <p className="font-semibold mt-1">{formatCurrency(viewInvoice.amountCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('tax')}</p>
                  <p className="mt-1">{formatCurrency(viewInvoice.taxCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('total')}</p>
                  <p className="font-bold text-lg mt-1">{formatCurrency(viewInvoice.totalCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('dueDate')}</p>
                  <p className="mt-1">{viewInvoice.dueAt ? formatDate(viewInvoice.dueAt) : '—'}</p>
                </div>
              </div>
              {viewInvoice.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">{t('notes')}</p>
                  <p className="text-sm mt-1">{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
