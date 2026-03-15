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

    // サーバーサイド利用回数チェック
    const serviceSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData } = await serviceSupabase
      .from('usage_limits')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (usageData && usageData.count >= 100) {
      return res.status(429).json({ error: '本日の利用回数が上限（100回）に達しました。' });
    }
  } catch (e) {
    console.error('Auth check failed:', e.message);
    return res.status(401).json({ error: '認証チェックに失敗しました' });
  }

  const { messages } = req.body;

  // 入力検証
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messagesが必要です' });
  }
  if (messages.length > 20) {
    return res.status(400).json({ error: 'メッセージ数が多すぎます（最大20）' });
  }
  const totalLength = JSON.stringify(messages).length;
  if (totalLength > 100000) {
    return res.status(400).json({ error: 'メッセージが大きすぎます' });
  }

  // ストリーミングモード判定
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isStream = url.searchParams.get('stream') === 'true';

  const models = ['claude-haiku-4-5-20251001', 'claude-haiku-4-5-20251001'];

  // ストリーミングモード
  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for (const model of models) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            messages,
            stream: true
          })
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 529) continue;
          continue;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'content_block_delta' && event.delta?.text) {
                  res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
                }
              } catch {}
            }
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (err) {
        console.error(`Stream ${model} failed:`, err.message);
        continue;
      }
    }

    res.write(`data: ${JSON.stringify({ error: 'AIが混雑しています。しばらくしてから再度お試しください。' })}\n\n`);
    res.end();
    return;
  }

  // 通常モード（フォールバック）
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 1000,
            messages: messages
          })
        });

        const data = await response.json();

        if (data.error && (data.error.type === 'overloaded_error' || response.status === 429 || response.status === 529)) {
          console.log(`${model} overloaded, attempt ${attempt}...`);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          break;
        }

        return res.status(200).json(data);
      } catch (err) {
        console.error(`${model} attempt ${attempt} failed:`, err.message);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }
    }
    console.log(`${model} failed, trying next model...`);
  }

  return res.status(500).json({ error: { message: 'AIが混雑しています。しばらくしてから再度お試しください。' } });
}
