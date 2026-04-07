// createClient は index.html の UMD <script> タグで読み込まれた window.supabase から取得
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://xlaboiimqsesglstdjqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYWJvaWltcXNlc2dsc3RkanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTUxMDcsImV4cCI6MjA4NzM5MTEwN30.mqbfnYn72-8Dkq5p_6MhndXOoMRuenTMnOuadg5yeAA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// checkout等の非モジュールスクリプトからアクセスできるようにする
window.__supabaseClient__ = supabase;
