'use client';

import React, { useState, useEffect } from 'react';
import { formatDateEAT } from '@/lib/date';
import { useI18n } from '@/i18n/provider';
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
  Users, Plus, UserPlus, Shield, Eye, Trash2, Mail, UserCheck, UserX,
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: any;
  invitedBy: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

const ROLES = [
  { value: 'OWNER', labelKey: 'ownerRole', descriptionKey: 'ownerDescription' },
  { value: 'ADMIN', labelKey: 'adminRole', descriptionKey: 'adminDescription' },
  { value: 'MANAGER', labelKey: 'managerRole', descriptionKey: 'managerDescription' },
  { value: 'VIEWER', labelKey: 'viewerRole', descriptionKey: 'viewerDescription' },
];

export default function TeamPage() {
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'MANAGER' });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (data.success) setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        setDialogOpen(false);
        setForm({ email: '', name: '', role: 'MANAGER' });
      } else {
        alert(t('inviteFailed'));
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchMembers();
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm(t('removeTeamMemberConfirm'))) return;
    try {
      await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' });
      await fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, 'default' | 'secondary' | 'outline'> = {
      OWNER: 'default', ADMIN: 'default', MANAGER: 'secondary', VIEWER: 'outline',
    };
    const roleKey = role === 'OWNER' ? 'ownerRole' : role === 'ADMIN' ? 'adminRole' : role === 'MANAGER' ? 'managerRole' : 'viewerRole';
    return <Badge variant={map[role] || 'outline'}>{t(roleKey)}</Badge>;
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={status === 'ACTIVE' ? 'default' : status === 'PENDING' ? 'secondary' : 'destructive'} className="gap-1 text-xs">
      {status === 'ACTIVE' ? <UserCheck className="h-3 w-3" /> : status === 'PENDING' ? <Mail className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
      {status === 'ACTIVE' ? t('active') : status === 'PENDING' ? t('pending') : status}
    </Badge>
  );

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'ACTIVE').length,
    pending: members.filter(m => m.status === 'PENDING').length,
    admins: members.filter(m => ['OWNER', 'ADMIN'].includes(m.role)).length,
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
          <h1 className="text-2xl font-bold tracking-tight">{t('teamMembers')}</h1>
          <p className="text-muted-foreground">{t('manageAdminAccess')}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('inviteMember')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalMembers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('active')}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingInvites')}</CardTitle>
            <Mail className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admins')}</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.admins}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allMembers')}</CardTitle>
          <CardDescription>{t('adminAccessMembers')}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('noTeamMembers')}</h3>
              <p className="text-sm text-muted-foreground">{t('inviteFirstMember')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('joined')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateEAT(member.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {member.status === 'PENDING' && (
                          <Button variant="ghost" size="sm" onClick={() => updateMember(member.id, { status: 'ACTIVE' })}>
                            {t('activate')}
                          </Button>
                        )}
                        {member.status === 'ACTIVE' && member.role !== 'OWNER' && (
                          <Button variant="ghost" size="sm" onClick={() => updateMember(member.id, { status: 'DEACTIVATED' })}>
                            {t('deactivate')}
                          </Button>
                        )}
                        {member.role !== 'OWNER' && (
                          <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Invite Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inviteTeamMember')}</DialogTitle>
            <DialogDescription>{t('invitationAdminTeam')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('name')} *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label>{t('email')} *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>{t('role')}</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <span className="font-medium">{t(role.labelKey as 'ownerRole' | 'adminRole' | 'managerRole' | 'viewerRole')}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{t(role.descriptionKey as 'ownerDescription' | 'adminDescription' | 'managerDescription' | 'viewerDescription')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleInvite} disabled={saving || !form.email || !form.name}>
              {saving ? t('sendingInvite') : t('sendInvite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
