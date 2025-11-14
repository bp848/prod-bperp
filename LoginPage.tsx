
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient.ts';
import { Loader, Mail, GoogleIcon } from './Icons.tsx'; // Import GoogleIcon
import { getEnvValue } from '../utils.ts'; // Import getEnvValue

interface LoginPageProps {
  onMagicLinkSent: () => void;
  magicLinkSent: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onMagicLinkSent, magicLinkSent }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and sign-up
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user && !data.user.email_confirmed_at) {
        onMagicLinkSent();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      onMagicLinkSent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
        const envSiteUrl = getEnvValue('SITE_URL'); // This will now prioritize NEXT_PUBLIC_SITE_URL
        const windowOrigin = window.location.origin;

        console.log("--- Google Login Debug Info ---");
        console.log("1. Environment variable 'SITE_URL' (via getEnvValue):", envSiteUrl);
        console.log("2. window.location.origin:", windowOrigin);

        let baseRedirectUrl: string;
        if (envSiteUrl && envSiteUrl.trim() !== '') {
            baseRedirectUrl = envSiteUrl.trim();
            console.log("3. Using envSiteUrl as baseRedirectUrl:", baseRedirectUrl);
        } else {
            baseRedirectUrl = windowOrigin;
            console.log("3. envSiteUrl not found or empty, falling back to window.location.origin as baseRedirectUrl:", baseRedirectUrl);
        }
        
        const redirectToUrl = `${baseRedirectUrl}/auth/callback`;
        console.log("4. Final constructed redirectTo URL (for Supabase):", redirectToUrl);
        console.log("-------------------------------");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectToUrl,
            },
        });
        if (error) throw error;
    } catch (err: any) {
        console.error("Google login error (full object):", err); // Log the full error object as well
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const buttonClass = "w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400";
  const toggleLinkClass = "text-sm text-blue-600 hover:underline cursor-pointer";

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#0d1117] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white">
          {isSignUp ? '新規登録' : 'ログイン'}
        </h1>
        {magicLinkSent ? (
          <div className="text-center text-green-600 dark:text-green-400 font-medium">
            マジックリンクを送信しました。メールを確認してください。
          </div>
        ) : (
          <>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  ref={emailInputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>パスワード</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
              <button type="submit" className={buttonClass} disabled={loading}>
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isSignUp ? '登録' : 'ログイン')}
              </button>
            </form>
            <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                    {isSignUp ? 'アカウントをお持ちですか？ ' : 'アカウントをお持ちではありませんか？ '}
                </span>
                <a onClick={() => setIsSignUp(prev => !prev)} className={toggleLinkClass}>
                    {isSignUp ? 'ログイン' : '新規登録'}
                </a>
            </div>
            <div className="flex items-center">
              <hr className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              <span className="px-3 text-slate-500 dark:text-slate-400 text-sm">または</span>
              <hr className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            </div>
            <button onClick={handleMagicLinkLogin} className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 disabled:bg-slate-400" disabled={loading}>
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                マジックリンクでログイン
            </button>
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-red-600 disabled:bg-slate-400" disabled={loading}>
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <GoogleIcon className="w-5 h-5" />}
                Googleでログイン
            </button>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              ご不明な点はシステム管理者にお問い合わせください。
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
