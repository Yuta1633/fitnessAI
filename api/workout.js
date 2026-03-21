// api/workout.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { user_email } = req.method === 'GET' ? req.query : req.body;
  if (!user_email) return res.status(400).json({ error: 'user_email required' });

  // 購入日から3ヶ月以内のデータのみ
  const { data: userData } = await supabase
    .from('allowed_users')
    .select('created_at')
    .eq('email', user_email)
    .single();

  const purchaseDate = userData?.created_at
    ? new Date(userData.created_at)
    : new Date();
  const expireDate = new Date(purchaseDate);
  expireDate.setMonth(expireDate.getMonth() + 3);
  const fromDate = purchaseDate.toISOString().split('T')[0];

  // POST: 記録を保存
  if (req.method === 'POST') {
    const { date, exercise, sets, reps, weight } = req.body;
    const { data, error } = await supabase
      .from('workout_logs')
      .insert([{ user_email, date, exercise, sets, reps, weight }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ log: data });
  }

  // DELETE: 記録を削除
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id)
      .eq('user_email', user_email);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // GET: 記録を取得（購入日〜3ヶ月）
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_email', user_email)
      .gte('date', fromDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ logs: data, expireDate: expireDate.toISOString() });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}