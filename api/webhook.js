import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);

    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.metadata?.gmail || session.customer_email;

    // ① Supabaseにユーザー追加（既存処理）
    if (email) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
          .from('allowed_users')
          .upsert(
            {
              email: email,
              memo: `Stripe決済 (${session.id})`,
            },
            { onConflict: 'email' }
          );

        if (error) {
          console.error('Supabase insert error:', error);
        } else {
          console.log('Added ' + email + ' to allowed_users');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // ② サブスクリプション（分割払い）の自動停止設定
    if (session.mode === 'subscription' && session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const months = parseInt(subscription.metadata.cancel_after_months, 10);

        if (months) {
          // カレンダー月で正確に計算
          const cancelDate = new Date();
          cancelDate.setMonth(cancelDate.getMonth() + months);
          const cancelAt = Math.floor(cancelDate.getTime() / 1000);
          await stripe.subscriptions.update(session.subscription, {
            cancel_at: cancelAt,
          });
          console.log(`Subscription ${session.subscription} set to cancel after ${months} months`);
        }
      } catch (err) {
        console.error('Failed to set cancel_at:', err.message);
      }
    }
  }

  res.status(200).json({ received: true });
}
