/**
 * Wallet routes — Swychr / AccountPe payment gateway integration
 *
 * Flow:
 *   1. POST /wallet/topup-initiate  → creates a Swychr payment link, returns the URL
 *   2. User pays on Swychr hosted page
 *   3. Swychr hits POST /wallet/webhook  → credits company wallet
 *   4. Swychr also redirects browser to our backend:
 *      GET  /wallet/callback?transaction_id=… → redirects to frontend verify page
 *   5. Frontend polls GET /wallet/topup-verify/:txId until confirmed
 *
 * Other:
 *   GET  /wallet/balance
 *   GET  /wallet/history
 *   GET  /wallet/rate?amount=…&countryCode=…  (live USD→local preview)
 */
import express from 'express';
import { protect } from '../middleware/auth';
import User from '../models/User';
import Company from '../models/Company';
import {
  createPaymentLink,
  getPaymentLinkStatus,
  convertToLocal,
  verifySignature,
  isPaymentSuccessful,
} from '../services/swychrService';

// Country → currency map (extend as needed)
const COUNTRY_CURRENCY: Record<string, string> = {
  CM: 'XAF', SN: 'XOF', CI: 'XOF', BJ: 'XOF', BF: 'XOF', ML: 'XOF',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', EG: 'EGP',
  US: 'USD', GB: 'GBP',
};

const router = express.Router();

// ─── helpers ─────────────────────────────────────────────────────

async function getCompany(userId: string) {
  const user = await User.findById(userId).populate('company');
  const company = user?.company as any;
  if (!company) throw new Error('Company not found.');
  return company;
}

function buildTxId(companyId: string, usdCents: number) {
  return `BH-WALLET-${companyId}-${usdCents}-${Date.now()}`;
}

// ─── GET /wallet/balance ──────────────────────────────────────────
router.get('/balance', protect, async (req: any, res) => {
  try {
    const company = await getCompany(req.user.id);
    res.json({
      balance: company.walletBalance ?? 0,
      currency: 'USD',
      countryCode: company.countryCode ?? 'CM',
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to fetch balance.' });
  }
});

// ─── GET /wallet/history ──────────────────────────────────────────
router.get('/history', protect, async (req: any, res) => {
  try {
    const company = await getCompany(req.user.id);
    const history = (company.walletHistory ?? [])
      .slice()
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);
    res.json(history);
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Failed to fetch history.' });
  }
});

// ─── GET /wallet/rate?amount=5&countryCode=CM ─────────────────────
router.get('/rate', protect, async (req: any, res) => {
  try {
    const usd = Number(req.query.amount);
    const countryCode = String(req.query.countryCode || 'CM').toUpperCase();
    if (!usd || usd <= 0) return res.status(400).json({ message: 'Provide a positive USD amount.' });

    const { amount: localAmount, currency } = await convertToLocal(countryCode, usd);
    res.json({ usd, localAmount, currency, countryCode });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Conversion failed.' });
  }
});

// ─── POST /wallet/topup-initiate ─────────────────────────────────
// Body: { amountUSD: number, countryCode?: string }
router.post('/topup-initiate', protect, async (req: any, res) => {
  try {
    const { amountUSD, countryCode: reqCountry } = req.body;
    const parsedUSD = Number(amountUSD);

    if (!parsedUSD || parsedUSD < 1) {
      return res.status(400).json({ message: 'Minimum deposit is $1 USD.' });
    }

    const user = await User.findById(req.user.id).populate('company');
    const company = user?.company as any;
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const countryCode = String(reqCountry || company.countryCode || 'CM').toUpperCase();
    const currency = COUNTRY_CURRENCY[countryCode] || 'XAF';

    // Live conversion via Swychr
    let localAmount: number;
    let localCurrency = currency;
    try {
      const conv = await convertToLocal(countryCode, parsedUSD);
      localAmount = conv.amount;
      localCurrency = conv.currency;
    } catch {
      // Fallback: use our fixed rates if the live API is unavailable
      const FALLBACK: Record<string, number> = {
        XAF: 600, XOF: 600, NGN: 1600, GHS: 15, KES: 130, ZAR: 19, EGP: 48, USD: 1, EUR: 0.92, GBP: 0.79,
      };
      localAmount = Math.ceil(parsedUSD * (FALLBACK[currency] ?? 600));
    }

    // Persist only the payment country; keep the company currency field for profile settings.
    await Company.findByIdAndUpdate(company._id, { countryCode });

    const usdCents = Math.round(parsedUSD * 100);
    const txId = buildTxId(company._id.toString(), usdCents);

    const backendBase = (process.env.BACKEND_URL || '').replace(/\/api\/?$/, '');
    const callbackUrl = `${backendBase}/api/v1/wallet/callback?transaction_id=${txId}`;

    const paymentLink = await createPaymentLink({
      country_code: countryCode,
      currency: localCurrency,
      amount: localAmount,
      name: company.name,
      email: user!.email,
      transaction_id: txId,
      description: `BuildHub wallet top-up — ${company.name}`,
      pass_digital_charge: true,
      callback_url: callbackUrl,
    });

    res.json({
      paymentLink,
      transactionId: txId,
      localAmount,
      localCurrency,
      amountUSD: parsedUSD,
    });
  } catch (e: any) {
    console.error('[Wallet topup-initiate]', e.message);
    res.status(500).json({ message: e.message || 'Could not create payment link.' });
  }
});

// ─── GET /wallet/callback ─────────────────────────────────────────
// Swychr redirects the browser here after payment; we forward to frontend
router.get('/callback', (req: any, res) => {
  const txId = req.query.transaction_id as string;
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
  return res.redirect(302, `${frontendBase}/dashboard/wallet/verify?transaction_id=${txId || ''}`);
});

// ─── GET /wallet/topup-verify/:txId ──────────────────────────────
// Frontend polls this until confirmed
// ─── GET /wallet/topup-verify/:txId ──────────────────────────────
router.get('/topup-verify/:txId', protect, async (req: any, res) => {
  try {
    const { txId } = req.params;
    if (!txId) return res.status(400).json({ message: 'Missing transaction ID.' });

    const company = await getCompany(req.user.id);

    // Already credited?
    const already = (company.walletHistory ?? []).find((h: any) => h.transactionId === txId);
    if (already) {
      return res.json({ status: 'success', balance: company.walletBalance, alreadyCredited: true });
    }

    // Check with Swychr
    const statusData = await getPaymentLinkStatus(txId);
    const attributes = statusData?.data?.data?.attributes || statusData?.data || statusData;
    const status = attributes?.status;

    if (!isPaymentSuccessful(status)) {
      return res.json({ status: 'pending' });
    }

    const parts = txId.split('-');
    const usdCents = Number(parts[3]) || 0;
    const usdAmount = usdCents / 100; // e.g. 10.00

    const { amount: localAmount, currency: localCurrency } = await convertToLocal(
      company.countryCode ?? 'CM',
      usdAmount
    );

    const updated = await Company.findByIdAndUpdate(
      company._id,
      {
        $inc: { walletBalance: usdAmount },
        $push: {
          walletHistory: {
            type: 'credit',
            amount: localAmount,
            amountUSD: usdAmount,
            currency: localCurrency,
            note: `Swychr top-up ($${usdAmount} USD)`,
            transactionId: txId,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({ status: 'success', balance: updated?.walletBalance ?? 0 });
  } catch (e: any) {
    console.error('[Wallet topup-verify]', e.message);
    res.status(500).json({ message: e.message || 'Verification failed.' });
  }
});

// ─── POST /wallet/webhook ─────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-swychr-signature'] as string | undefined;

    if (!verifySignature(rawBody, signature)) {
      console.warn('[Wallet webhook] Invalid Swychr signature.');
      return res.status(403).send('Forbidden');
    }

    const payload = JSON.parse(rawBody);
    const attributes = payload?.data?.data?.attributes ?? payload?.data ?? payload;
    const txId: string = attributes?.transaction_id ?? '';
    const status = attributes?.status;

    if (isPaymentSuccessful(status) && txId.startsWith('BH-WALLET-')) {
      const parts = txId.split('-');
      const companyId = parts[2];
      const usdCents = Number(parts[3]);
      const usdAmount = usdCents / 100;

      const company = await Company.findById(companyId);
      if (!company) return res.status(404).send('Company not found.');

      const alreadyCredited = (company.walletHistory ?? []).find((h: any) => h.transactionId === txId);
      if (alreadyCredited) {
        return res.status(200).send('Already processed');
      }

      const { amount: localAmount, currency: localCurrency } = await convertToLocal(
        company.countryCode ?? 'CM',
        usdAmount
      );

      company.walletBalance = (company.walletBalance ?? 0) + usdAmount;
      company.walletHistory = [
        ...(company.walletHistory ?? []),
        {
          type: 'credit',
          amount: localAmount,
          amountUSD: usdAmount,
          currency: localCurrency,
          note: `Swychr top-up ($${usdAmount} USD)`,
          transactionId: txId,
          date: new Date(),
        },
      ];
      await company.save();
    }

    res.status(200).send('OK');
  } catch (e: any) {
    console.error('[Wallet webhook] Error:', e.message);
    res.status(500).send('Internal error.');
  }
});

export default router;
