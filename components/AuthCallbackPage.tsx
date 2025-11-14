import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.ts';
import { Loader, AlertTriangle } from './Icons.tsx';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('セッションを交換中...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exchangeSession = async () => {
      try {
        // Supabase SDK will automatically parse the code from the URL
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          throw error;
        }

        if (data.session) {
          setMessage('ログイン成功！ダッシュボードへリダイレクトします。');
          // Redirect to the dashboard after successful session exchange
          window.location.replace('/analysis_dashboard');
        } else {
          setMessage('セッションの交換に成功しましたが、セッションデータが見つかりません。');
          setError('セッションデータの取得に失敗しました。再度ログインしてください。');
        }
      } catch (e: any) {
        console.error('Failed to exchange session:', e);
        setMessage('セッションの交換に失敗しました。');
        setError(e?.message ?? '不明なエラー');
      }
    };
    exchangeSession();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#0d1117] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-fade-in-up text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">認証中...</h1>
        {error ? (
          <>
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200 justify-center">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{message} {error}</span>
            </div>
            <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">ログインページに戻る</a>
          </>
        ) : (
          <>
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-lg text-slate-700 dark:text-slate-300">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}