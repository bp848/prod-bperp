import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Database, Settings, Save, Loader, AlertTriangle } from './Icons.tsx';
// Removed direct import of SUPABASE_URL, SUPABASE_KEY and specific isValid functions to simplify logic

interface ConnectionSetupPageProps {
  onSetupComplete: () => void;
}

export const ConnectionSetupPage: React.FC<ConnectionSetupPageProps> = ({ onSetupComplete }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Prefill from localStorage if available, otherwise leave empty for user input
    setSupabaseUrl(localStorage.getItem('supabaseUrl') || '');
    setSupabaseAnonKey(localStorage.getItem('supabaseAnonKey') || '');
  }, []);

  const handleSaveAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setError('Supabase Project URL と Anon Key は必須です。');
      return;
    }
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        setError('有効なHTTPまたはHTTPSのURLを入力してください。');
        return;
    }
    
    setIsSaving(true);
    try {
      localStorage.setItem('supabaseUrl', supabaseUrl.trim());
      localStorage.setItem('supabaseAnonKey', supabaseAnonKey.trim());
      setIsDismissed(true);
      onSetupComplete();
    } catch (err) {
      setError('設定の保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  if (isDismissed) return null;

  const inputClass = "w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[200] p-4 font-sans">
      <form onSubmit={handleSaveAndComplete} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 text-center">
        <div className="flex justify-center items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Supabase接続設定が必要です</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          アプリケーションの動作にはSupabaseデータベースへの接続情報が必要です。
          以下のフィールドに <strong className="text-blue-600 dark:text-blue-400">Project URL</strong> と <strong className="text-blue-600 dark:text-blue-400">Anon Key</strong> を入力し、保存してください。
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          これらの情報はSupabaseプロジェクトの <span className="font-mono text-blue-500">API設定</span> ページで確認できます。
        </p>

        {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {error}
            </div>
        )}

        <div className="space-y-4 text-left">
          <div>
            <label htmlFor="supabase-url" className={labelClass}>Supabase Project URL *</label>
            <input
              type="url"
              id="supabase-url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="例: https://abcdefghijklmnop.supabase.co"
              className={inputClass}
              required
              disabled={isSaving}
              autoComplete="url"
            />
          </div>
          <div>
            <label htmlFor="supabase-anon-key" className={labelClass}>Supabase Project Anon Key *</label>
            <input
              type="text"
              id="supabase-anon-key"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="例: eyJhbGciOiJIUzI1NiI..."
              className={inputClass}
              required
              disabled={isSaving}
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-center gap-4 pt-4">
          <button type="submit" disabled={isSaving} className="w-64 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400">
            {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : '設定を保存して開始'}
          </button>
        </div>
      </form>
    </div>
  );
};