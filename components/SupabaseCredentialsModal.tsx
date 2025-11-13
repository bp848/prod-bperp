

import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Loader } from './Icons.tsx';

interface SupabaseCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, key: string) => void;
  initialSupabaseUrl?: string;
  initialSupabaseAnonKey?: string;
}

const SupabaseCredentialsModal: React.FC<SupabaseCredentialsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSupabaseUrl = '',
  initialSupabaseAnonKey = '',
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialSupabaseAnonKey);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSupabaseUrl(initialSupabaseUrl);
    setSupabaseAnonKey(initialSupabaseAnonKey);
  }, [initialSupabaseUrl, initialSupabaseAnonKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setError('Supabase URLとAnon Keyは必須です。');
      return;
    }
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        setError('有効なHTTPまたはHTTPSのURLを入力してください。');
        return;
    }

    setIsSaving(true);
    try {
      onSave(supabaseUrl, supabaseAnonKey);
      onClose();
    } catch (err) {
      setError('設定の保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4 font-sans">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supabase 接続情報を設定</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {error}
            </div>
          )}
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            これらの情報は、Supabaseプロジェクトの <span className="font-mono text-blue-500">API設定</span> ページで確認できます。
          </p>
        </div>
        <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={onClose} disabled={isSaving} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupabaseCredentialsModal;