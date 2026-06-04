/**
 * Swychr / AccountPe payment gateway service
 * -------------------------------------------
 * Authenticates once, refreshes the Bearer token every ~23 hours.
 * Exposes helpers:
 *   createPaymentLink   – redirect user to pay
 *   getPaymentLinkStatus – poll after callback
 *   convertToLocal      – USD → local currency via payin rate API
 *   verifySignature     – validate inbound webhooks
 */
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';

// ─── Axios instances ──────────────────────────────────────────────
const ALLOW_INSECURE = process.env.SWYCHR_ALLOW_INSECURE_TLS === 'true';
const httpsAgent = ALLOW_INSECURE ? new https.Agent({ rejectUnauthorized: false }) : undefined;

const payinApi = axios.create({
  baseURL: 'https://api.accountpe.com/api/payin',
  headers: { 'Content-Type': 'application/json' },
});

const payoutApi = axios.create({
  baseURL: 'https://api.accountpe.com/api/payout',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth token cache ─────────────────────────────────────────────
let authToken: string | null = null;
let tokenExpiresAt: Date | null = null;

const refreshToken = async () => {
  const email = process.env.SWYCHR_EMAIL;
  const password = process.env.SWYCHR_PASSWORD;

  if (!email || !password) {
    throw new Error('SWYCHR_EMAIL / SWYCHR_PASSWORD are not configured.');
  }

  const { data } = await payinApi.post('/admin/auth', { email, password }, { httpsAgent });
  const token = data?.token;
  if (!token) throw new Error('AccountPe auth response did not include a token.');

  authToken = token;
  // Expire 1 hour early to avoid edge-case token reuse
  tokenExpiresAt = new Date(Date.now() + 22 * 60 * 60 * 1000);
  console.log('[Swychr] Auth token refreshed.');
};

const authInterceptor = async (config: any) => {
  if (config.url === '/admin/auth') return config;
  if (!authToken || !tokenExpiresAt || new Date() > tokenExpiresAt) {
    await refreshToken();
  }
  config.headers['Authorization'] = `Bearer ${authToken}`;
  return config;
};

payinApi.interceptors.request.use(authInterceptor, (e) => Promise.reject(e));
payoutApi.interceptors.request.use(authInterceptor, (e) => Promise.reject(e));

// ─── Public helpers ───────────────────────────────────────────────

export interface PaymentLinkPayload {
  country_code: string;
  currency: string;
  amount: number;
  name: string;
  email: string;
  transaction_id: string;
  description: string;
  pass_digital_charge?: boolean;
  callback_url: string;
}

/**
 * Create a hosted payment link. Returns the URL string or throws.
 */
export const createPaymentLink = async (payload: PaymentLinkPayload): Promise<string> => {
  const response = await payinApi.post('/create_payment_links', payload, {
    httpsAgent,
    headers: { 'Idempotency-Key': payload.transaction_id },
  });
  const link =
    response.data?.data?.payment_link ||
    response.data?.payment_link;

  if (!link) throw new Error('Swychr did not return a payment link.');
  return link;
};

/**
 * Poll the status of a previously created payment link.
 */
export const getPaymentLinkStatus = async (transactionId: string) => {
  const { data } = await payinApi.post(
    '/payment_link_status',
    { transaction_id: transactionId },
    { httpsAgent }
  );
  return data;
};

/**
 * Convert a USD amount to the local currency for a given country.
 */
export const convertToLocal = async (countryCode: string, usdAmount: number): Promise<{ amount: number; currency: string }> => {
  const { data } = await payoutApi.post(
    '/pusd_to_fiat_rate',
    { country_code: countryCode, amount: usdAmount },
    { httpsAgent }
  );

  const localAmount = Number(
    data?.data?.local_amount ||
    data?.data?.amount ||
    data?.local_amount ||
    data?.amount
  );

  if (!localAmount || Number.isNaN(localAmount)) {
    throw new Error('Swychr did not return a valid conversion amount.');
  }

  // Try to get currency code from the response; fall back to the expected currency by country.
  const FALLBACK_CURRENCY: Record<string, string> = {
    CM: 'XAF', SN: 'XOF', CI: 'XOF', BJ: 'XOF', BF: 'XOF', ML: 'XOF',
    NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', EG: 'EGP',
    US: 'USD', GB: 'GBP', EUR: 'EUR',
  };

  const currency: string =
    data?.data?.currency ||
    data?.currency ||
    FALLBACK_CURRENCY[countryCode] || 'XAF';

  return { amount: Math.ceil(localAmount), currency };
};

/**
 * Verify an inbound Swychr webhook signature (HMAC-SHA256).
 * Returns true if the signature is valid (or if the secret is missing in dev).
 */
export const verifySignature = (rawBody: string, signature: string | undefined): boolean => {
  const secret = process.env.SWYCHR_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Swychr] SWYCHR_WEBHOOK_SECRET not set — rejecting webhook.');
      return false;
    }
    console.warn('[Swychr] No webhook secret (dev mode — accepting unsigned webhooks).');
    return true;
  }
  if (!signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

export const isPaymentSuccessful = (status: unknown): boolean => {
  if (status === 1 || status === '1') return true;
  if (typeof status === 'string' && status.toLowerCase() === 'success') return true;
  return false;
};
