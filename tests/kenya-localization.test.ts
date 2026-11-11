import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyFractionToMoney,
  applyPercentToMoney,
  formatMoney,
  toMinorUnits,
} from '../src/lib/currency';
import { formatDateEAT, formatDateTimeEAT, getMonthKeyEAT } from '../src/lib/date';
import { normalizeKenyanMobile } from '../src/lib/phone';
import { decryptKycValue, decryptPhone, encryptKycValue, encryptPhone, hashIdentityDocument, hashPhone, hashPhoneOtp, maskPhone } from '../src/lib/phone-protection';
import { COUNTRY_CONFIG, getCountryConfig, isKenyanCounty, KENYAN_COUNTIES } from '../src/lib/country-config';
import { simulateRecruitmentRisk } from '../src/lib/recruitment-risk-simulation';
import { AfricaTalkingSmsProvider } from '../src/lib/sms';

test('KES formatting uses Intl currency output for integer minor units', () => {
  const value = formatMoney(123456);
  const expected = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(1234.56);
  assert.equal(value, expected);
  assert.ok(new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })
    .formatToParts(1).some((part) => part.type === 'currency' && part.value.length > 0));
});

test('major-unit input converts to minor units without floating-point arithmetic', () => {
  assert.equal(toMinorUnits('550'), 55000);
  assert.equal(toMinorUnits('550.5'), 55050);
  assert.equal(toMinorUnits('0.005'), 1);
  assert.throws(() => toMinorUnits('-1'), TypeError);
});

test('fraction and percentage reward calculations use integer minor units', () => {
  assert.equal(applyFractionToMoney(12345, '0.2'), 2469);
  assert.equal(applyPercentToMoney(55000, '12.5'), 6875);
  assert.throws(() => applyPercentToMoney(1.5, 10), TypeError);
});

test('date helpers render Nairobi time and day/month/year', () => {
  assert.equal(formatDateEAT('2024-01-01T21:30:00.000Z'), '02/01/2024');
  assert.match(formatDateTimeEAT('2024-01-01T21:30:00.000Z'), /^02\/01\/2024/);
  assert.equal(formatDateEAT('not-a-date'), '');
  assert.equal(getMonthKeyEAT('2024-01-31T21:30:00.000Z'), '2024-02');
  assert.equal(getMonthKeyEAT('invalid'), '');
});

test('Kenyan mobile formats normalize to E.164', () => {
  assert.equal(normalizeKenyanMobile('0712 345 678'), '+254712345678');
  assert.equal(normalizeKenyanMobile('01 12 345 678'), '+254112345678');
  assert.equal(normalizeKenyanMobile('712345678'), '+254712345678');
  assert.equal(normalizeKenyanMobile('254712345678'), '+254712345678');
  assert.equal(normalizeKenyanMobile('+254 712 345 678'), '+254712345678');
});

test('Kenyan mobile normalization rejects invalid and non-Kenyan numbers', () => {
  assert.equal(normalizeKenyanMobile('+255712345678'), null);
  assert.equal(normalizeKenyanMobile('0201234567'), null);
  assert.equal(normalizeKenyanMobile('letters'), null);
});

test('phone PII is encrypted, authenticated, hashable, and masked', () => {
  const previousKey = process.env.PII_MASTER_KEY;
  process.env.PII_MASTER_KEY = 'test-only-key-material-with-at-least-32-chars';
  try {
    const encrypted = encryptPhone('+254712345678');
    assert.notEqual(encrypted, '+254712345678');
    assert.equal(decryptPhone(encrypted), '+254712345678');
    assert.equal(hashPhone('+254712345678'), hashPhone('+254712345678'));
    assert.equal(hashPhoneOtp('user-1', '123456'), hashPhoneOtp('user-1', '123456'));
    assert.notEqual(hashPhoneOtp('user-1', '123456'), hashPhoneOtp('user-2', '123456'));
    assert.match(hashPhone('+254712345678'), /^[a-f0-9]{64}$/);
    assert.equal(maskPhone('+254712345678'), '+254•••••5678');
    const tampered = encrypted.split('.');
    tampered[2] = `${tampered[2][0] === 'A' ? 'B' : 'A'}${tampered[2].slice(1)}`;
    assert.throws(() => decryptPhone(tampered.join('.')));
  } finally {
    if (previousKey === undefined) delete process.env.PII_MASTER_KEY;
    else process.env.PII_MASTER_KEY = previousKey;
  }
});

test('Africa\'s Talking sandbox adapter posts an international SMS without exposing provider details', async () => {
  let capturedUrl = '';
  let capturedBody = '';
  const provider = new AfricaTalkingSmsProvider({
    apiKey: 'test-api-key', username: 'sandbox', environment: 'sandbox',
  }, async (input, init) => {
    capturedUrl = String(input);
    capturedBody = String(init?.body);
    return new Response('{}', { status: 201 });
  });
  await provider.send({ to: '+254712345678', message: 'Test code 123456' });
  assert.equal(capturedUrl, 'https://api.sandbox.africastalking.com/version1/messaging');
  assert.match(capturedBody, /to=%2B254712345678/);
  assert.match(capturedBody, /username=sandbox/);
  assert.doesNotMatch(capturedBody, /apiKey/);
});

test('Africa\'s Talking adapter reports non-201 provider responses as failures', async () => {
  const provider = new AfricaTalkingSmsProvider({
    apiKey: 'test-api-key', username: 'sandbox', environment: 'sandbox',
  }, async () => new Response('{}', { status: 401 }));
  await assert.rejects(provider.send({ to: '+254712345678', message: 'Test' }), /rejected/);
});

test('KYC values use authenticated encryption and keyed document deduplication', () => {
  const previousKey = process.env.PII_MASTER_KEY;
  process.env.PII_MASTER_KEY = 'test-only-key-material-with-at-least-32-chars';
  try {
    const encrypted = encryptKycValue('12345678');
    assert.notEqual(encrypted, '12345678');
    assert.equal(decryptKycValue(encrypted), '12345678');
    assert.equal(hashIdentityDocument('NATIONAL_ID', '12-345678'), hashIdentityDocument('NATIONAL_ID', '12345678'));
    assert.notEqual(hashIdentityDocument('NATIONAL_ID', '12345678'), hashIdentityDocument('PASSPORT', '12345678'));
  } finally {
    if (previousKey === undefined) delete process.env.PII_MASTER_KEY;
    else process.env.PII_MASTER_KEY = previousKey;
  }
});

test('Kenya country configuration defaults payments and withholding tax to disabled', () => {
  assert.equal(COUNTRY_CONFIG.KE.currency, 'KES');
  assert.equal(COUNTRY_CONFIG.KE.timezone, 'Africa/Nairobi');
  assert.equal(COUNTRY_CONFIG.KE.paymentMethods.MPESA.enabled, false);
  assert.equal(COUNTRY_CONFIG.KE.paymentMethods.AIRTEL_MONEY.enabled, false);
  assert.equal(COUNTRY_CONFIG.KE.tax.withholdingEnabled, false);
  assert.equal(getCountryConfig('ZZ'), null);
});

test('Kenyan county allowlist contains 47 unique counties', () => {
  assert.equal(KENYAN_COUNTIES.length, 47);
  assert.equal(new Set(KENYAN_COUNTIES).size, 47);
  assert.equal(isKenyanCounty('Nairobi'), true);
  assert.equal(isKenyanCounty('Nairobi County'), false);
});

test('recruitment risk simulation is deterministic and uses bounded synthetic generations', () => {
  const input = { initialParticipants: 1, directRecruits: 3, generations: 5, contributionKes: 5000 };
  const first = simulateRecruitmentRisk(input);
  const second = simulateRecruitmentRisk(input);
  assert.deepEqual(first, second);
  assert.deepEqual(first.generationRows.map((row) => row.participants), [1, 3, 9, 27, 81, 243]);
  assert.equal(first.totalParticipants, 364);
  assert.equal(first.externalProductRevenueMinor, 0);
  assert.equal(first.fundingSourceContributionShareBps, 10000);
  assert.equal(first.totalTheoreticalObligationsMinor,
    first.totalCommissionObligationsMinor + first.simulatedOperatingCostsMinor);
});

test('deep synthetic growth can show a contribution-funded deficit and rejects unbounded inputs', () => {
  const result = simulateRecruitmentRisk({ initialParticipants: 1, directRecruits: 5, generations: 8, contributionKes: 5000 });
  assert.ok(result.availableVirtualFundsMinor < 0);
  assert.ok(result.riskFlags.includes('FUNDING_DEFICIT'));
  assert.throws(() => simulateRecruitmentRisk({ initialParticipants: 1, directRecruits: 6, generations: 8, contributionKes: 5000 }), RangeError);
  assert.throws(() => simulateRecruitmentRisk({ initialParticipants: 1, directRecruits: 2, generations: 9, contributionKes: 5000 }), RangeError);
  assert.throws(() => simulateRecruitmentRisk({ initialParticipants: 1, directRecruits: 2, generations: 2, contributionKes: 1.5 }), RangeError);
});
