import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvValue } from '../utils.ts';
import { SUPABASE_URL as HARDCODED_URL, SUPABASE_KEY as HARDCODED_KEY } from '../supabaseCredentials.ts';

// Supabase URL and Key are obtained from environment variables, localStorage, or a credentials file as a fallback.
const SUPABASE_URL = getEnvValue('VITE_SUPABASE_URL') || localStorage.getItem('supabaseUrl') || HARDCODED_URL;
const SUPABASE_KEY = getEnvValue('VITE_SUPABASE_ANON_KEY') || localStorage.getItem('supabaseAnonKey') || HARDCODED_KEY;


// Supabaseクライアントを一度だけ初期化してエクスポート
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost', // Fallback to avoid crash, but will be caught by hasSupabaseCredentials
  SUPABASE_KEY || 'dummy_key',        // Fallback to avoid crash
  {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Essential for OAuth callback
        flowType: 'pkce',         // Recommended for OAuth
    },
});

// 既存コードとの互換性のためにgetSupabaseもエクスポート
export const getSupabase = (): SupabaseClient => {
    if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === 'http://localhost' || SUPABASE_KEY === 'dummy_key') {
        throw new Error("Supabase client is not properly configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables, configure via settings, or fill supabaseCredentials.ts.");
    }
    return supabase;
};

// 接続情報が設定されているか確認する関数
export const hasSupabaseCredentials = (): boolean => {
    // 環境変数、localStorage、またはcredentialsファイルに有効な値が設定されているかを確認
    return !!(SUPABASE_URL && SUPABASE_KEY && 
              SUPABASE_URL !== 'http://localhost' && SUPABASE_KEY !== 'dummy_key' &&
              !SUPABASE_URL.includes('ここにURLを貼り付け') && !SUPABASE_KEY.includes('ここにキーを貼り付け'));
};