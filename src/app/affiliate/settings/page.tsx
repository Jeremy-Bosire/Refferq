'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/provider';
import { KENYAN_COUNTIES } from '@/lib/country-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Building2,
  Mail,
  Globe,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Copy,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [kycStatus, setKycStatus] = useState('NOT_STARTED');
  const [kycEnabled, setKycEnabled] = useState(false);
  const [kycPrivacyNoticeUrl, setKycPrivacyNoticeUrl] = useState('');
  const [kycSaving, setKycSaving] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneChannel, setPhoneChannel] = useState<'sms' | 'email' | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [kycForm, setKycForm] = useState({ legalName: '', documentType: 'NATIONAL_ID', documentNumber: '', kraPin: '', consent: false });

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    company: '',
    email: '',
    country: 'Kenya',
    county: '',
    paymentMethod: '',
    paymentEmail: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/profile');
      const data = await res.json();
      if (data.success) {
        const pd = data.affiliate?.payoutDetails || {};
        setReferralCode(data.affiliate?.referralCode || '');
        setKycStatus(data.user?.kycStatus || 'NOT_STARTED');
        setPhoneVerified(data.user?.phoneVerified === true);
        setKycEnabled(data.kycSubmissionEnabled === true);
        setKycPrivacyNoticeUrl(data.kycPrivacyNoticeUrl || '');
        setSettingsForm({
          name: data.user?.name || user?.name || '',
          company: pd.company || '',
          email: data.user?.email || user?.email || '',
          country: pd.country || 'Kenya',
          paymentMethod: pd.paymentMethod || '',
          paymentEmail: pd.paymentEmail || data.user?.email || '',
          county: data.user?.county || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      // This function updates state only after its profile request settles.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadProfile();
    }
  }, [authLoading, user, loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settingsForm, countryCode: 'KE' }),
      });
      if (res.ok) {
        showNotification('success', t('settingsSaved'));
      } else {
        const data = await res.json();
        showNotification('error', data.error || t('settingsSaveFailed'));
      }
    } catch {
      showNotification('error', t('unexpectedError'));
    } finally {
      setSaving(false);
    }
  };

  const handleKycSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setKycSaving(true);
    try {
      const response = await fetch('/api/affiliate/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycForm),
      });
      if (response.ok) {
        setKycStatus('PENDING');
        setKycForm({ legalName: '', documentType: 'NATIONAL_ID', documentNumber: '', kraPin: '', consent: false });
        showNotification('success', t('kycSubmitted'));
      } else {
        showNotification('error', t('kycSubmissionFailed'));
      }
    } catch {
      showNotification('error', t('kycSubmissionFailed'));
    } finally {
      setKycSaving(false);
    }
  };

  const requestPhoneCode = async () => {
    setPhoneBusy(true);
    setPhoneChannel(null);
    try {
      const response = await fetch('/api/affiliate/phone/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('phoneCodeSendFailed'));
      setPhoneChannel(data.channel === 'sms' ? 'sms' : 'email');
      showNotification('success', t(data.channel === 'sms' ? 'phoneCodeSentSms' : 'phoneCodeSentEmail'));
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : t('phoneCodeSendFailed'));
    } finally { setPhoneBusy(false); }
  };

  const verifyPhoneCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setPhoneBusy(true);
    try {
      const response = await fetch('/api/affiliate/phone/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('phoneVerificationFailed'));
      setPhoneVerified(true);
      setPhoneCode('');
      showNotification('success', t('phoneVerified'));
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : t('phoneVerificationFailed'));
    } finally { setPhoneBusy(false); }
  };

  const handleGenerateCode = async () => {
    try {
      const res = await fetch('/api/affiliate/generate-code', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', t('referralCodeGenerated'));
        loadProfile();
      } else {
        showNotification('error', t('failedToGenerateCode', { error: String(data.error || '') }));
      }
    } catch {
      showNotification('error', t('referralCodeGenerationFailed'));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('accountPreferences')}</p>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            {t('referralCodeTitle')}
          </CardTitle>
          <CardDescription>{t('uniqueReferralIdentifier')}</CardDescription>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={referralCode} className="font-mono max-w-xs" />
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('noReferralCodeGenerated')}</p>
              <Button onClick={handleGenerateCode}>{t('generateCode')}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" />{t('phoneVerificationTitle')}</CardTitle>
          <CardDescription>{t('phoneVerificationDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phoneVerified ? <p className="text-sm text-emerald-700">{t('phoneVerified')}</p> : (
            <>
              <p className="text-sm text-muted-foreground">{t('phoneNotVerified')}</p>
              <Button type="button" variant="outline" disabled={phoneBusy} onClick={requestPhoneCode}>
                {phoneBusy ? t('sendingPhoneCode') : t('sendPhoneCode')}
              </Button>
              {phoneChannel && <form onSubmit={verifyPhoneCode} className="flex max-w-md items-end gap-2">
                <div className="flex-1 space-y-2"><Label htmlFor="phone-otp">{t('phoneCodeLabel')}</Label>
                  <Input id="phone-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
                </div>
                <Button type="submit" disabled={phoneBusy || phoneCode.length !== 6}>{phoneBusy ? t('verifyingPhone') : t('verifyPhoneCode')}</Button>
              </form>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t('personalDetails')}
          </CardTitle>
          <CardDescription>{t('personalAccountInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {t('fullName')}
              </Label>
              <Input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {t('company')}
              </Label>
              <Input
                value={settingsForm.company}
                onChange={(e) => setSettingsForm({ ...settingsForm, company: e.target.value })}
                placeholder={t('company')}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {t('emailAddress')}
              </Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                placeholder={t('emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {t('country')}
              </Label>
              <Select
                value={settingsForm.country}
                onValueChange={(v) => setSettingsForm({ ...settingsForm, country: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kenya">{t('kenya')}</SelectItem>
                  {settingsForm.country && settingsForm.country !== 'Kenya' && (
                    <SelectItem value={settingsForm.country}>{settingsForm.country}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-county">{t('countyOptional')}</Label>
              <select
                id="profile-county"
                value={settingsForm.county}
                onChange={(event) => setSettingsForm({ ...settingsForm, county: event.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('selectCounty')}</option>
                {KENYAN_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            {t('identityVerification')}
          </CardTitle>
          <CardDescription>{t('identityVerificationDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!kycEnabled ? (
            <p className="text-sm text-muted-foreground">{t('kycNotEnabled')}</p>
          ) : kycStatus === 'PENDING' ? (
            <p className="text-sm text-muted-foreground">{t('kycPending')}</p>
          ) : kycStatus === 'VERIFIED' ? (
            <p className="text-sm text-emerald-700">{t('kycVerified')}</p>
          ) : (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('kycPrivacyNotice')}</p>
              <p className="text-sm"><a className="underline" href={kycPrivacyNoticeUrl} target="_blank" rel="noreferrer">{t('readPrivacyNotice')}</a></p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legal-name">{t('legalName')}</Label>
                  <Input id="legal-name" autoComplete="name" required minLength={2} maxLength={120} value={kycForm.legalName} onChange={(event) => setKycForm({ ...kycForm, legalName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity-document-type">{t('identityDocumentType')}</Label>
                  <select id="identity-document-type" value={kycForm.documentType} onChange={(event) => setKycForm({ ...kycForm, documentType: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="NATIONAL_ID">{t('nationalId')}</option>
                    <option value="PASSPORT">{t('passport')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity-document-number">{t('identityDocumentNumber')}</Label>
                  <Input id="identity-document-number" type="password" autoComplete="off" required minLength={5} maxLength={20} value={kycForm.documentNumber} onChange={(event) => setKycForm({ ...kycForm, documentNumber: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kra-pin">{t('kraPinOptional')}</Label>
                  <Input id="kra-pin" type="password" autoComplete="off" maxLength={11} value={kycForm.kraPin} onChange={(event) => setKycForm({ ...kycForm, kraPin: event.target.value })} />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" required checked={kycForm.consent} onChange={(event) => setKycForm({ ...kycForm, consent: event.target.checked })} className="mt-1" />
                <span>{t('identityDataConsent')}</span>
              </label>
              <Button type="submit" disabled={kycSaving}>
                {kycSaving ? t('submittingIdentity') : t('submitIdentity')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {t('paymentDetails')}
          </CardTitle>
          <CardDescription>{t('configurePayoutDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('payoutMethod')}</Label>
              <Select
                value={settingsForm.paymentMethod}
                onValueChange={(v) => setSettingsForm({ ...settingsForm, paymentMethod: v })}
              >
                <SelectTrigger><SelectValue placeholder={t('payoutMethodNotConfigured')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MPESA" disabled>{t('mpesaNotEnabled')}</SelectItem>
                  {settingsForm.paymentMethod && (
                    <SelectItem value={settingsForm.paymentMethod} disabled>
                      {t('storedMethodUnavailable', { method: settingsForm.paymentMethod })}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('payoutAccountDetails')}</Label>
              <Input
                value={settingsForm.paymentEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, paymentEmail: e.target.value })}
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </div>

          <Separator />

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('payoutDetailsNotice')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
