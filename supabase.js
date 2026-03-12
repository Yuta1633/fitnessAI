import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://xlaboiimqsesglstdjqj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9fxRahudPNG9gHRJKkPD3Q_s8m-OUna';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// checkout等の非モジュールスクリプトからアクセスできるようにする
window.__supabaseClient__ = supabase;
