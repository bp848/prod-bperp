import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import JobList from './components/JobList.tsx';
import CreateJobModal from './components/CreateJobModal.tsx';
import JobDetailModal from './components/JobDetailModal.tsx';
import CustomerList from './components/CustomerList.tsx';
import CustomerDetailModal from './components/CustomerDetailModal.tsx';
import { CompanyAnalysisModal } from './components/CompanyAnalysisModal.tsx';
import LeadManagementPage from './components/sales/LeadManagementPage.tsx';
import CreateLeadModal from './components/sales/CreateLeadModal.tsx';
import PlaceholderPage from './components/PlaceholderPage.tsx';
import { UserManagementPage } from './components/admin/UserManagementPage.tsx';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage.tsx';
import BugReportList from './components/admin/BugReportList.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import AccountingPage from './components/Accounting.tsx';
import SalesPipelinePage from './components/sales/SalesPipelinePage.tsx';
import InventoryManagementPage from './components/inventory/InventoryManagementPage.tsx';
import CreateInventoryItemModal from './components/inventory/CreateInventoryItemModal.tsx';
import ManufacturingPipelinePage from './components/manufacturing/ManufacturingPipelinePage.tsx';
import ManufacturingOrdersPage from './components/manufacturing/ManufacturingOrdersPage.tsx';
import PurchasingManagementPage from './components/purchasing/PurchasingManagementPage.tsx';
import CreatePurchaseOrderModal from './components/purchasing/CreatePurchaseOrderModal.tsx';
import { EstimateManagementPage } from './components/sales/EstimateManagementPage.tsx';
import EstimateCreationPage from './components/sales/EstimateCreationPage.tsx';
import ProjectListPage from './components/sales/ProjectListPage.tsx';
import ProjectCreationPage from './components/sales/ProjectCreationPage.tsx';
import SalesRanking from './components/accounting/SalesRanking.tsx';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage.tsx';
import { ConnectionSetupPage } from './components/DatabaseSetupInstructionsModal.tsx';
import LoginPage from './components/LoginPage.tsx';
import UpdatePasswordForm from './components/UpdatePasswordForm.tsx';
import BugReportModal from './components/BugReportModal.tsx';
import ManufacturingCostManagement from './components/accounting/ManufacturingCostManagement.tsx';
import BusinessSupportPage from './components/BusinessSupportPage.tsx';
import AIChatPage from './components/AIChatPage.tsx';
import MarketResearchPage from './components/MarketResearchPage.tsx';
import LiveChatPage from './components/LiveChatPage.tsx';
import AnythingAnalysisPage from './components/AnythingAnalysisPage.tsx';
import AuditLogPage from './components/admin/AuditLogPage.tsx';
import JournalQueuePage from './components/admin/JournalQueuePage.tsx';
import MasterManagementPage from './components/admin/MasterManagementPage.tsx';
import { ToastContainer } from './components/Toast.tsx';
import ConfirmationDialog from './components/ConfirmationDialog.tsx';
import BusinessPlanPage from './components/BusinessPlanPage.tsx';
import OrganizationChartPage from './components/hr/OrganizationChartPage.tsx';
import AuthCallbackPage from './components/AuthCallbackPage.tsx'; // Import the new callback page
// FIX: Import AppSiteUrlModal
import AppSiteUrlModal from './components/AppSiteUrlModal.tsx';


import * as dataService from './services/dataService.ts';
import * as geminiService from './services/geminiService.ts';
import { supabase, hasSupabaseCredentials } from './services/supabaseClient.ts';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getEnvValue } from './utils.ts';

import { Page, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Toast, ConfirmationDialogProps, BugReport, Estimate, ApplicationWithDetails, Invoice, EmployeeUser, Department, PaymentRecipient, MasterAccountItem, AllocationDivision, Title, Project, ApplicationCode } from './types.ts';
import { PlusCircle, Loader, AlertTriangle, RefreshCw, Settings, Bug } from './components/Icons.tsx';

const PAGE_TITLES: Record<Page, string> = {
    analysis_dashboard: 'ホーム',
    sales_leads: '問い合わせ管理',
    sales_customers: '取引先管理',
    sales_pipeline: '進捗管理',
    sales_estimates: '見積管理',
    sales_orders: '受注管理',
    sales_billing: '売上・請求管理',
    sales_delivery: '納品管理',
    analysis_ranking: '売上ランキング',
    purchasing_orders: '発注 (PO)',
    purchasing_invoices: '仕入計上 (AP)',
    purchasing_payments: '支払管理',
    purchasing_suppliers: '発注先一覧',
    inventory_management: '在庫管理',
    manufacturing_orders: '製造指示',
    manufacturing_progress: '製造パイプライン',
    manufacturing_cost: '製造原価',
    hr_attendance: '勤怠',
    hr_man_hours: '工数',
    hr_labor_cost: '人件費配賦',
    hr_org_chart: '組織図',
    approval_list: '承認一覧',
    approval_form_expense: '経費精算',
    approval_form_transport: '交通費申請',
    approval_form_leave: '休暇申請',
    approval_form_approval: '経費なし稟議申請',
    approval_form_daily: '日報',
    approval_form_weekly: '週報',
    report_other: '営業・セミナー・その他報告',
    accounting_journal: '仕訳帳',
    accounting_general_ledger: '総勘定元帳',
    accounting_trial_balance: '試算表',
    accounting_tax_summary: '消費税集計',
    accounting_period_closing: '締処理',
    accounting_business_plan: '経営計画',
    business_support_proposal: '提案書作成',
    ai_anything_analysis: 'なんでも分析',
    ai_business_consultant: 'AI業務支援',
    ai_market_research: 'AI市場調査',
    ai_live_chat: 'AIライブチャット',
    estimate_creation: '新規見積作成',
    project_list: '案件一覧',
    project_creation: '新規案件作成',
    admin_audit_log: '監査ログ',
    admin_journal_queue: 'ジャーナル・キュー',
    admin_user_management: 'ユーザー管理',
    admin_route_management: '承認ルート管理',
    admin_master_management: 'マスタ管理',
    admin_bug_reports: '改善要望一覧',
    settings: '設定',
};

const GlobalErrorBanner: React.FC<{ error: string; onRetry: () => void; }> = ({ error, onRetry }) => (
    <div className="bg-red-600 text-white p-3 flex items-center justify-between gap-4 flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-bold">データベースエラー</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={onRetry} 
          className="bg-red-700 hover:bg-red-800 text-white font-semibold text-sm py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors">
          <RefreshCw className="w-4 h-4" />
          再接続
        </button>
      </div>
    </div>
);

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginRequired, setLoginRequired] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [userExistsInDB, setUserExistsInDB] = useState(true);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [needsPasswordUpdate, setNeedsPasswordUpdate] = useState(false);
    // FIX: Add state for showing the AppSiteUrlModal
    const [showAppSiteUrlModal, setShowAppSiteUrlModal] = useState(false);


    const [currentPage, setCurrentPage] = useState<Page>('analysis_dashboard');
    const [allUsers, setAllUsers] = useState<EmployeeUser[]>([]);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [applicationCodes, setApplicationCodes] = useState<ApplicationCode[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Master data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [paymentRecipients, setPaymentRecipients] = useState<PaymentRecipient[]>([]);
    // const [masterAccountItems, setMasterAccountItems] = useState<MasterAccountItem[]>([]); // 現在未使用のためコメントアウト
    const [allocationDivisions, setAllocationDivisions] = useState<AllocationDivision[]>([]);
    const [titles, setTitles] = useState<Title[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateJobModal, setIsCreateJobModal] = useState(false);
    const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
    const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerModalMode, setCustomerModalMode] = useState<'view' | 'edit' | 'new'>('view');

    const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);

    const [isCreatePurchaseOrderModalOpen, setIsCreatePurchaseOrderModalOpen] = useState(false);
    const [isCreateInventoryItemModalOpen, setIsCreateInventoryItemModalOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

    const [isCompanyAnalysisModalOpen, setIsCompanyAnalysisModalOpen] = useState(false);
    const [analysisTargetCustomer, setAnalysisTargetCustomer] = useState<Customer | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [analysisError, setAnalysisError] = useState('');

    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogProps>({
      isOpen: false, title: '', message: '', onConfirm: () => {}, onClose: () => {}
    });
    
    const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false);
    const isAIOff = getEnvValue('NEXT_PUBLIC_AI_OFF') === '1';

    const addToast = useCallback((message: string, type: Toast['type']) => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const requestConfirmation = useCallback((dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
      setConfirmationDialog({ ...dialog, isOpen: true, onClose: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false })) });
    }, []);
    
    useEffect(() => {
        let isMounted = true;
        const credentialsConfigured = hasSupabaseCredentials();
        if (!credentialsConfigured) {
            setError('Supabaseの接続情報が設定されていません。');
            setShowSetupModal(true);
            setAuthLoading(false);
            return;
        }

        // Handle OAuth callback explicitly
        if (window.location.pathname === '/auth/callback') {
            setAuthLoading(false); // AuthCallbackPage will handle its own loading/redirect
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) {
                setSession(session);
                setAuthLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (isMounted) {
                    setSession(session);
                    setAuthLoading(false);

                    if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
                        // All users will now go through profile resolution/upsert
                        try {
                            const userProfile = await dataService.resolveUserSession(session!.user); // session! as it's SIGNED_IN
                            setCurrentUser(userProfile);
                            setLoginRequired(false);
                            setUserExistsInDB(true);
                            setNeedsPasswordUpdate(false);
                        } catch (e: any) {
                            console.error("Error resolving user session or profile:", e);
                            if (e.message === 'user profile not found') {
                                setUserExistsInDB(false);
                            } else {
                                setError("ユーザープロファイルの読み込みに失敗しました。");
                            }
                            setCurrentUser(null);
                            setLoginRequired(true);
                        }
                    } else if (_event === 'SIGNED_OUT') {
                        setCurrentUser(null);
                        setLoginRequired(true);
                        setNeedsPasswordUpdate(false);
                    } else if (_event === 'USER_UPDATED' && session?.user?.email_confirmed_at && !session?.user?.last_sign_in_at) {
                        // User has just confirmed email and needs to set password for the first time
                        setNeedsPasswordUpdate(true);
                        setLoginRequired(false);
                    }
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const ensureProfileUpsert = useCallback(async (user: { id: string; email?: string | null }) => {
        try {
            const userProfile = await dataService.resolveUserSession(user);
            setCurrentUser(userProfile);
            setUserExistsInDB(true);
            setLoginRequired(false);
        }<ctrl63>