

import React from 'react';
import { X, BookOpen, ArrowRight } from './Icons.tsx';

interface Props {
    onRetry: () => void;
}

const sqlScript = `BEGIN;

-- 1) public.users は壊さない：不足カラムだけ追加
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS can_use_anything_analysis boolean DEFAULT true;

-- 2) updated_at トリガー（存在するテーブルにだけ付与）
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    ALTER TABLE public.applications
      ADD COLUMN IF NOT EXISTS updated_at timestamptz;
    DROP TRIGGER IF EXISTS on_applications_update ON public.applications;
    CREATE TRIGGER on_applications_update
      BEFORE UPDATE ON public.applications
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF to_regclass('public.estimates') IS NOT NULL THEN
    ALTER TABLE public.estimates
      ADD COLUMN IF NOT EXISTS updated_at timestamptz;
    DROP TRIGGER IF EXISTS on_estimates_update ON public.estimates;
    CREATE TRIGGER on_estimates_update
      BEFORE UPDATE ON public.estimates
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF to_regclass('public.projects') IS NOT NULL THEN
    ALTER TABLE public.projects
      ADD COLUMN IF NOT EXISTS updated_at timestamptz;
    DROP TRIGGER IF EXISTS on_projects_update ON public.projects;
    CREATE TRIGGER on_projects_update
      BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 3) 参照系のみ RLS を段階導入（ALL権限は付けない）
ALTER TABLE IF EXISTS public.forms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_routes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.forms') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.forms;
    CREATE POLICY "Allow authenticated read access" ON public.forms
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF to_regclass('public.application_codes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.application_codes;
    CREATE POLICY "Allow authenticated read access" ON public.application_codes
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF to_regclass('public.approval_routes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.approval_routes;
    CREATE POLICY "Allow authenticated read access" ON public.approval_routes
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.invoices;
    CREATE POLICY "Allow authenticated read access" ON public.invoices
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF to_regclass('public.invoice_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.invoice_items;
    CREATE POLICY "Allow authenticated read access" ON public.invoice_items
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 4) 基本権限
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 5) RLS policies for user profiles to fix login loop
ALTER TABLE IF EXISTS public.users     ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role BEFORE applying policies
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

-- Policies for public.users table (id = auth.uid())
DROP POLICY IF EXISTS "Allow individual access on users" ON public.users;
CREATE POLICY "Allow individual access on users" ON public.users
  FOR ALL TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6) PostgREST にスキーマ変更通知
NOTIFY pgrst, 'reload schema';

COMMIT;`;

export const ConnectionSetupPage: React.FC<Props> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex justify-center items-center z-[200] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">データベースセットアップガイド</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            アプリケーションの初回起動時に必要なデータベースのテーブルとポリシーを設定します。
          </p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="text-base text-slate-700 dark:text-slate-300 space-y-3">
                <p className="flex items-center gap-2">
                    <span className="font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">1</span>
                    Supabaseプロジェクトの <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SQL Editor</a> を開きます。
                    <ArrowRight className="w-4 h-4" />
                    「New query」をクリックします。
                </p>
                 <p className="flex items-center gap-2">
                    <span className="font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">2</span>
                    以下のスクリプトを全文コピーして、SQL Editorに貼り付けます。
                </p>
            </div>
             <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-80 overflow-auto">
                <code>{sqlScript}</code>
            </pre>
            <div className="text-base text-slate-700 dark:text-slate-300 space-y-3">
                <p className="flex items-center gap-2">
                    <span className="font-bold bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">3</span>
                    「RUN」ボタンをクリックしてスクリプトを実行します。
                </p>
            </div>
        </div>
        <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onRetry}
            className="w-48 flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700"
          >
            設定完了、アプリを再読み込み
          </button>
        </div>
      </div>
    </div>
  );
};