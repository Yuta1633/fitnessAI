import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://fitprojectai.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: '認証が無効です' });
    }
  } catch (e) {
    console.error('Auth check failed:', e.message);
    return res.status(401).json({ error: '認証チェックに失敗しました' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { email, plan } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'メールアドレスが必要です' });
    }

    // メールアドレスの簡易バリデーション
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
    }

    const origin = req.headers.origin || 'https://fitprojectai.vercel.app';

    // 一括払い
    if (!plan || plan === 'onetime') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'Fit Project AI コーチング',
                description: '3ヶ月パーソナルコーチング + AI長期利用権',
              },
              unit_amount: 99800,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: origin,
        metadata: { gmail: email, plan: 'onetime' },
      });
      return res.status(200).json({ url: session.url });
    }

    // 分割払い（3回 or 6回）
    const plans = {
      split3: { amount: 33267, months: 3, label: '3回分割払い' },
      split6: { amount: 16634, months: 6, label: '6回分割払い' },
    };

    const selected = plans[plan];
    if (!selected) {
      return res.status(400).json({ error: '無効なプランです' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `Fit Project AI コーチング（${selected.label}）`,
              description: `3ヶ月パーソナルコーチング + AI長期利用権 / 月額¥${selected.amount.toLocaleString()} × ${selected.months}回`,
            },
            unit_amount: selected.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: { gmail: email, plan: plan, cancel_after_months: String(selected.months) },
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
      metadata: { gmail: email, plan: plan },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: error.message });
  }
}
