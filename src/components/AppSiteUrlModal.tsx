import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Loader, Link } from './Icons.tsx';

interface AppSiteUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndRetry: (url: string) => Promise<void>;
  initialSiteUrl?: string;
}

const AppSiteUrlModal: React.FC<AppSiteUrlModalProps> = ({
  isOpen,
  onClose,
  onSaveAndRetry,
  initialSiteUrl = '',
}) => {
  const [siteUrl, setSiteUrl] = useState(initialSiteUrl);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSiteUrl(initialSiteUrl);
  }, [initialSiteUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!siteUrl.trim()) {
      setError('アプリケーションのサイトURLは必須です。');
      return;
    }
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
        setError('有効なHTTPまたはHTTPSのURLを入力してください。');
        return;
    }

    setIsSaving(true);
    try {
      await onSaveAndRetry(siteUrl);
      // If onSaveAndRetry doesn't throw, it will handle closing itself or redirecting
    } catch (err: any) {
      setError(err.message || '設定の保存中にエラーが発生しました。');
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Link className="w-6 h-6"/>
            アプリケーションのサイトURLを設定
          </h2>
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
          <p className="text-base text-slate-600 dark:text-slate-300">
            Googleログインのリダイレクトには、アプリケーションの正確なサイトURLが必要です。
            以下のフィールドに現在のURLを入力してください。
          </p>
          <div>
            <label htmlFor="app-site-url" className={labelClass}>アプリケーションのベースURL *</label>
            <input
              type="url"
              id="app-site-url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="例: https://yourdomain.com または http://localhost:8080"
              className={inputClass}
              required
              disabled={isSaving}
              autoComplete="url"
            />
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                このURLは、Supabaseプロジェクトの「Authentication」→「URL Configuration」の「Site URL」と一致させる必要があります。
                パスに `/auth/callback` は含めないでください。
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={onClose} disabled={isSaving} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50">
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-48 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存して再試行</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppSiteUrlModal;