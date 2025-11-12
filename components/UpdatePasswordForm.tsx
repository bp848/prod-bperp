import React, { useState } from "react";
import { supabase } from '../services/supabaseClient';
import { Package, Loader, Save } from './Icons.tsx';

interface UpdatePasswordFormProps {
    onPasswordUpdated: () => void;
}

const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
        setMsg("新しいパスワードを入力してください。");
        return;
    }
    setLoading(true);
    setMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
    }

    setLoading(false);
    setSuccessMsg("パスワードが正常に更新されました。自動的にリダイレクトします...");

    setTimeout(() => {
        onPasswordUpdated();
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl dark:bg-slate-800">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Package className="w-10 h-10 text-blue-600" />
            <h2 className="text-3xl font-bold">パスワード再設定</h2>
          </div>
          <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
            新しいパスワードを入力してください。
          </p>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新しいパスワード"
            className="border p-2 w-full rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="new-password"
          />
          <button disabled={loading || !!successMsg} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400">
            {loading ? <><Loader className="w-5 h-5 animate-spin" /> <span>更新中...</span></> : <><Save className="w-5 h-5"/><span>パスワードを更新</span></>}
          </button>
          {msg && <p className="text-red-600 text-sm text-center">{msg}</p>}
          {successMsg && <p className="text-green-600 text-sm text-center">{successMsg}</p>}
        </form>
      </div>
    </div>
  );
}

export default UpdatePasswordForm;