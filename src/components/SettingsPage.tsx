
import React, { useState, useEffect, useRef } from 'react';
import SupabaseCredentialsModal from './SupabaseCredentialsModal.tsx'; // Changed to default import
import { Loader, Save, Mail, CheckCircle, Database, Key, Link } from './Icons.tsx'; // Import Link icon
import { hasSupabaseCredentials } from '../services/supabaseClient.ts';
import { Lightbulb } from './Icons.tsx';
import { Toast } from '../types.ts';
import { SUPABASE_URL as HARDCODED_SUPABASE_URL, SUPABASE_KEY as HARDCODED_SUPABASE_KEY } from '../supabaseCredentials.ts';
import { getEnvValue } from '../utils.ts'; // Import getEnvValue to show effective SITE_URL

interface SettingsPageProps {
    addToast: (message: string, type: Toast['type']) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ addToast }) => {
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
    const [appSiteUrl, setAppSiteUrl] = useState(''); // New state for app SITE_URL
    const [googleClientId, setGoogleClientId] = useState('');
    const [googleClientSecret, setGoogleClientSecret] = useState('');

    const [smtpSettings, setSmtpSettings] = useState({
        host: '',
        port: 587,
        username: '',
        password: '',
        senderEmail: '',
        senderName: 'MQ会計管理システム',
        encryption: 'tls',
    });

    const [signatureSettings, setSignatureSettings] = useState({
        companyName: '',
        department: '',
        yourName: '',
        phone: '',
        email: '',
        website: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showSupabaseModal, setShowSupabaseModal] = useState(false);
    const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
    const [effectiveAppSiteUrl, setEffectiveAppSiteUrl] = useState<string | undefined>(undefined); // To display actual resolved SITE_URL
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        
        try {
            const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
            const savedSupabaseAnonKey = localStorage.getItem('supabaseAnonKey');
            const savedAppSiteUrl = localStorage.getItem('appSiteUrl'); // Load app SITE_URL

            // Prioritize localStorage, then fallback to hardcoded values from supabaseCredentials.ts
            setSupabaseUrl(savedSupabaseUrl || HARDCODED_SUPABASE_URL);
            setSupabaseAnonKey(savedSupabaseAnonKey || HARDCODED_SUPABASE_KEY);
            setAppSiteUrl(savedAppSiteUrl || ''); // Initialize with loaded value

            const savedGoogleClientId = localStorage.getItem('googleClientId');
            const savedGoogleClientSecret = localStorage.getItem('googleClientSecret');

            if (savedGoogleClientId) setGoogleClientId(savedGoogleClientId);
            if (savedGoogleClientSecret) setGoogleClientSecret(savedGoogleClientSecret);

            setIsSupabaseConfigured(hasSupabaseCredentials());
            setEffectiveAppSiteUrl(getEnvValue('SITE_URL')); // Get the currently effective SITE_URL

            const savedSignature = localStorage.getItem('signatureSettings');
            if (savedSignature) setSignatureSettings(JSON.parse(savedSignature));

            const savedSmtp = localStorage.getItem('smtpSettings');
            if(savedSmtp) setSmtpSettings(JSON.parse(savedSmtp));
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
            addToast('設定の読み込みに失敗しました。', 'error');
        }

        return () => {
            mounted.current = false;
        };
    }, [addToast]);

    const handleSupabaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'supabaseUrl') setSupabaseUrl(value);
        if (name === 'supabaseAnonKey') setSupabaseAnonKey(value);
    };

    const handleAppSiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAppSiteUrl(e.target.value);
    };

    const handleGoogleOAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'googleClientId') setGoogleClientId(value);
        if (name === 'googleClientSecret') setGoogleClientSecret(value);
    };

    const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSmtpSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSignatureSettings(prev => ({...prev, [name]: value}));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            localStorage.setItem('supabaseUrl', supabaseUrl);
            localStorage.setItem('supabaseAnonKey', supabaseAnonKey);
            localStorage.setItem('appSiteUrl', appSiteUrl); // Save app SITE_URL
            localStorage.setItem('googleClientId', googleClientId);
            localStorage.setItem('googleClientSecret', googleClientSecret);
            localStorage.setItem('signatureSettings', JSON.stringify(signatureSettings));
            localStorage.setItem('smtpSettings', JSON.stringify(smtpSettings));
            
            addToast('設定を保存しました。変更を適用するためにリロードします。', 'success');
            
            setTimeout(() => {
                if (mounted.current) {
                    window.location.reload();
                }
            }, 2000);

        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
            addToast('設定の保存に失敗しました。', 'error');
            if(mounted.current) {
                setIsSaving(false);
            }
        }
    };

    const handleTestConnection = () => {
        setIsTesting(true);
        setTimeout(() => {
            if (mounted.current) {
                setIsTesting(false);
                console.log('Testing connection with:', smtpSettings);
                if (Math.random() > 0.2) {
                    addToast('テストメールが正常に送信されました。', 'success');
                } else {
                    addToast('接続に失敗しました。設定を確認してください。', 'error');
                }
            }
        }, 2000);
    };

    const inputClass = "w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500";
    const labelClass = "block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5";

    return (
        <form onSubmit={handleSave} className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Supabase 接続設定</h2>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        SupabaseプロジェクトのURLとAnon Keyを設定します。これはアプリケーションの基盤となります。
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-7 h-7 text-green-500"/>
                            <p className="font-semibold text-slate-800 dark:text-white">Supabaseの接続状態:</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSupabaseConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isSupabaseConfigured ? '接続済み' : '未接続'}
                            </span>
                        </div>
                        <button type="button" onClick={() => setShowSupabaseModal(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700">
                            <Key className="w-5 h-5"/> {isSupabaseConfigured ? '接続情報を編集' : '接続情報を設定'}
                        </button>
                    </div>
                </div>
            </div>

            {/* New section for Application Site URL */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">アプリケーションのサイトURL</h2>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Googleログインのリダイレクトや、一部のAI機能からのリンク生成に使用されます。<br />
                        現在の環境変数 `SITE_URL` の値: <code className="font-mono text-blue-500">{effectiveAppSiteUrl || '未設定'}</code>
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="appSiteUrl" className={labelClass}>アプリケーションのベースURL *</label>
                        <input
                            type="url"
                            id="appSiteUrl"
                            name="appSiteUrl"
                            value={appSiteUrl}
                            onChange={handleAppSiteUrlChange}
                            className={inputClass}
                            placeholder="例: https://yourdomain.com または http://localhost:8080"
                            required
                        />
                         <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            これはSupabaseダッシュボードの「Authentication」→「URL Configuration」の「Site URL」と一致させる必要があります。<br/>
                            パスに `/auth/callback` は含めないでください。
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Google OAuth 設定</h2>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Googleアカウントでのログインを有効にするための設定です。
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="googleClientId" className={labelClass}>Google Client ID</label>
                        <input type="text" id="googleClientId" name="googleClientId" value={googleClientId} onChange={handleGoogleOAuthChange} className={inputClass} placeholder="YOUR_GOOGLE_CLIENT_ID" />
                    </div>
                    <div>
                        <label htmlFor="googleClientSecret" className={labelClass}>Google Client Secret</label>
                        <input type="password" id="googleClientSecret" name="googleClientSecret" value={googleClientSecret} onChange={handleGoogleOAuthChange} className={inputClass} placeholder="YOUR_GOOGLE_CLIENT_SECRET" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">通知メール設定 (SMTP)</h2>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        申請の承認・却下などの通知をメールで送信するためのSMTPサーバー設定です。
                    </p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="host" className={labelClass}>SMTPホスト</label>
                            <input type="text" id="host" name="host" value={smtpSettings.host} onChange={handleSmtpChange} className={inputClass} placeholder="smtp.example.com" />
                        </div>
                        <div>
                            <label htmlFor="port" className={labelClass}>SMTPポート</label>
                            <input type="number" id="port" name="port" value={smtpSettings.port} onChange={handleSmtpChange} className={inputClass} placeholder="587" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="username" className={labelClass}>ユーザー名</label>
                            <input type="text" id="username" name="username" value={smtpSettings.username} onChange={handleSmtpChange} className={inputClass} placeholder="user@example.com" />
                        </div>
                        <div>
                            <label htmlFor="password" className={labelClass}>パスワード</label>
                            <input type="password" id="password" name="password" value={smtpSettings.password} onChange={handleSmtpChange} className={inputClass} placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="senderEmail" className={labelClass}>送信元メールアドレス</label>
                            <input type="email" id="senderEmail" name="senderEmail" value={smtpSettings.senderEmail} onChange={handleSmtpChange} className={inputClass} placeholder="noreply@example.com" />
                        </div>
                         <div>
                            <label htmlFor="senderName" className={labelClass}>送信元名</label>
                            <input type="text" id="senderName" name="senderName" value={smtpSettings.senderName} onChange={handleSmtpChange} className={inputClass} placeholder="MQ会計管理システム" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="encryption" className={labelClass}>暗号化</label>
                        <select id="encryption" name="encryption" value={smtpSettings.encryption} onChange={handleSmtpChange} className={inputClass}>
                            <option value="none">なし</option>
                            <option value="ssl">SSL/TLS</option>
                            <option value="tls">STARTTLS</option>
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting || isSaving}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                        {isTesting ? <Loader className="w-5 h-5 animate-spin"/> : <Mail className="w-5 h-5" />}
                        <span>{isTesting ? '送信中...' : '接続テスト'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Eメール署名設定</h2>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        「AI提案メール作成」などで使用されるメールの署名を設定します。
                    </p>
                </div>
                 <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="companyName" className={labelClass}>会社名</label>
                            <input type="text" id="companyName" name="companyName" value={signatureSettings.companyName} onChange={handleSignatureChange} className={inputClass} placeholder="文唱堂印刷株式会社" />
                        </div>
                        <div>
                            <label htmlFor="department" className={labelClass}>部署名</label>
                            <input type="text" id="department" name="department" value={signatureSettings.department} onChange={handleSignatureChange} className={inputClass} placeholder="システム管理・開発" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="yourName" className={labelClass}>氏名</label>
                            <input type="text" id="yourName" name="yourName" value={signatureSettings.yourName} onChange={handleSignatureChange} className={inputClass} placeholder="石嶋 洋平" />
                        </div>
                         <div>
                            <label htmlFor="phone" className={labelClass}>電話番号・FAX</label>
                            <input type="text" id="phone" name="phone" value={signatureSettings.phone} onChange={handleSignatureChange} className={inputClass} placeholder="TEL：03-3851-0111　FAX：03-3861-1979" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="email" className={labelClass}>E-mail</label>
                            <input type="email" id="email" name="email" value={signatureSettings.email} onChange={handleSignatureChange} className={inputClass} placeholder="sales.system@mqprint.co.jp" />
                        </div>
                         <div>
                            <label htmlFor="website" className={labelClass}>ウェブサイト</label>
                            <input type="url" id="website" name="website" value={signatureSettings.website} onChange={handleSignatureChange} className={inputClass} placeholder="https://new.b-p.co.jp/" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving || isTesting}
                    className="w-48 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
                >
                    {isSaving ? <Loader className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                    <span>{isSaving ? '保存中...' : 'すべての設定を保存'}</span>
                </button>
            </div>
            {showSupabaseModal && (
                <SupabaseCredentialsModal 
                    isOpen={showSupabaseModal} 
                    onClose={() => {
                        setShowSupabaseModal(false);
                        setIsSupabaseConfigured(hasSupabaseCredentials()); // Re-check config after modal close
                        setEffectiveAppSiteUrl(getEnvValue('SITE_URL')); // Refresh effective SITE_URL after closing modal
                    }} 
                    initialSupabaseUrl={supabaseUrl} 
                    initialSupabaseAnonKey={supabaseAnonKey}
                    onSave={(url, key) => {
                        localStorage.setItem('supabaseUrl', url);
                        localStorage.setItem('supabaseAnonKey', key);
                        setSupabaseUrl(url);
                        setSupabaseAnonKey(key);
                        setIsSupabaseConfigured(true);
                        addToast('Supabase接続情報を保存しました。', 'success');
                    }}
                />
            )}
        </form>
    );
};

export default SettingsPage;
