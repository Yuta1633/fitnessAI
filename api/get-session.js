import Stripe from 'stripe';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://fitprojectai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id が必要です' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const referralCode = session.metadata?.referral_code || '';

    return res.status(200).json({ referral_code: referralCode });
  } catch (error) {
    console.error('get-session error:', error);
    return res.status(500).json({ error: error.message });
  }
}