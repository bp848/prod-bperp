import React, { useMemo, useState } from "react";
import { supabase } from '../services/supabaseClient';
import { Package, Loader } from './Icons.tsx';

type AuthMode = 'login' | 'forgotPassword' | 'magicLink';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<'success' | 'error' | null>(null);
  
  const { title, description, submitLabel } = useMemo(() => {
    switch (mode) {
      case 'forgotPassword':
        return {
          title: 'パスワードをお忘れですか？',
          description: '登録済みのメールアドレスにパスワード再設定用のリンクを送信します。',
          submitLabel: '再設定メールを送信',
        };
      case 'magicLink':
        return {
          title: 'メールでログイン',
          description: '入力したメールアドレス宛にマジックリンクを送信します。リンクを開くと自動的にログインされます。',
          submitLabel: 'マジックリンクを送信',
        };
      default:
        return {
          title: 'MQ会計ERP',
          description: 'メールアドレスとパスワードでログインしてください',
          submitLabel: 'ログイン',
        };
    }
  }, [mode]);

  const loadingLabel = mode === 'login' ? 'ログイン中...' : '送信中...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setMsgType(null);
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

    if (!email) {
      setMsgType('error');
      setMsg('メールアドレスを入力してください。');
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsgType('error');
        setMsg(error.message);
        setLoading(false);
        return;
      }

      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !user) {
        setMsgType('error');
        setMsg(getUserError?.message || "ユーザー情報の取得に失敗しました。");
        setLoading(false);
        return;
      }

      // Note: The upsert logic is now handled in App.tsx onAuthStateChange for consistency
      // across all login methods.
      return;
    }

    setLoading(true);

    try {
      if (mode === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email,
          redirectUrl ? { redirectTo: redirectUrl } : undefined
        );
        if (error) {
          throw error;
        }
        setMsgType('success');
        setMsg('パスワード再設定用のメールを送信しました。メールに記載のリンクから再設定を完了してください。');
      } else if (mode === 'magicLink') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
        });
        if (error) {
          throw error;
        }
        setMsgType('success');
        setMsg('マジックリンクを送信しました。メールボックスを確認し、リンクからログインしてください。');
      }
    } catch (error: any) {
      setMsgType('error');
      setMsg(error?.message || '送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const renderModeToggles = () => {
    if (mode === 'login') {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-blue-600 dark:text-blue-400">
          <button
            type="button"
            onClick={() => { setMode('forgotPassword'); setMsg(''); setMsgType(null); setLoading(false); }}
            className="hover:underline"
          >
            パスワードをお忘れの方はこちら
          </button>
          <button
            type="button"
            onClick={() => { setMode('magicLink'); setMsg(''); setMsgType(null); setLoading(false); }}
            className="hover:underline"
          >
            メールのリンクでログインする
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => { setMode('login'); setMsg(''); setMsgType(null); setLoading(false); setPassword(''); }}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← ログイン画面に戻る
        </button>
        {mode === 'forgotPassword' && (
          <button
            type="button"
            onClick={() => { setMode('magicLink'); setMsg(''); setMsgType(null); setLoading(false); }}
            className="text-slate-600 dark:text-slate-300 hover:underline"
          >
            マジックリンクを試す
          </button>
        )}
        {mode === 'magicLink' && (
          <button
            type="button"
            onClick={() => { setMode('forgotPassword'); setMsg(''); setMsgType(null); setLoading(false); }}
            className="text-slate-600 dark:text-slate-300 hover:underline"
          >
            パスワードを再設定する
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl dark:bg-slate-800">
        <div className="flex flex-col items-center text-slate-800 dark:text-white">
          <div className="flex items-center gap-2">
            <Package className="w-10 h-10 text-blue-600" />
            <h2 className="text-3xl font-bold">{title}</h2>
          </div>
          <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
          />
          {mode === 'login' && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border p-2 w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="current-password"
            />
          )}
          <button
            disabled={loading || (mode === 'login' && password.length === 0)}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400"
          >
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> <span>{loadingLabel}</span></> : submitLabel}
          </button>
          {msg && (
            <p
              className={`text-sm text-center ${msgType === 'success' ? 'text-green-600' : 'text-red-600'}`}
            >
              {msg}
            </p>
          )}
          {renderModeToggles()}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;