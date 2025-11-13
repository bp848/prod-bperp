

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.ts';
import { Loader, Save, AlertTriangle } from './Icons.tsx';

interface UpdatePasswordFormProps {
  onPasswordUpdate: () => void;
}

const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({ onPasswordUpdate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onPasswordUpdate(); // Notify parent component to close this form
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const buttonClass = "w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400";

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#0d1117] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white">
          パスワードを設定
        </h1>
        {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {error}
            </div>
        )}
        {success && (
          <div className="text-center text-green-600 dark:text-green-400 font-medium">
            パスワードが正常に更新されました。
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className={labelClass}>新しいパスワード</label>
            <input
              type="password"
              id="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>パスワードを再入力</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className={buttonClass} disabled={loading}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'パスワードを設定'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordForm;