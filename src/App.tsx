
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
import UserManagementPage from './components/admin/UserManagementPage.tsx';
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
        } catch (e: any) {
            if (e.message === 'user profile not found') {
                const { error: upsertError } = await supabase.from('users').upsert(
                    { id: user.id, email: user.email, name: user.email?.split('@')[0] || '名無し', role: 'user', created_at: new Date().toISOString() },
                    { onConflict: 'id' }
                );
                if (upsertError) throw upsertError;
                const updatedUserProfile = await dataService.resolveUserSession(user);
                setCurrentUser(updatedUserProfile);
                setUserExistsInDB(true);
                setLoginRequired(false);
            } else {
                throw e;
            }
        }
    }, []);

    useEffect(() => {
        if (!authLoading && session && currentUser === null) {
            if (!userExistsInDB) {
                // This state indicates a user signed in but no public.users entry was found
                // We'll try to create it or ensure it exists
                ensureProfileUpsert(session.user).catch((e) => {
                    console.error("Error during profile upsert:", e);
                    setError("ユーザープロファイルの初期化に失敗しました。");
                    setLoginRequired(true); // Fallback to login if profile can't be ensured
                });
            } else {
                // User exists in DB, just load their data
                dataService.resolveUserSession(session.user).then(setCurrentUser).catch((e) => {
                    console.error("Error loading user profile after session:", e);
                    setError("ユーザープロファイルの読み込みに失敗しました。");
                    setLoginRequired(true);
                });
            }
        } else if (!authLoading && !session) {
            setLoginRequired(true);
            setCurrentUser(null);
        } else if (currentUser) {
            setLoginRequired(false);
        }
    }, [authLoading, session, currentUser, userExistsInDB, ensureProfileUpsert]);


    const fetchData = useCallback(async (user: EmployeeUser) => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          jobsData, customersData, journalData, accountsData, leadsData, routesData,
          poData, inventoryData, usersData, bugReportsData, estimatesData, 
          applicationsData, appCodesData, invoicesData, projectsData,
          departmentsData, paymentRecipientsData, allocationDivisionsData, titlesData
        ] = await Promise.all([
          dataService.getJobs(), dataService.getCustomers(), dataService.getJournalEntries(),
          dataService.getAccountItems(), dataService.getLeads(), dataService.getApprovalRoutes(),
          dataService.getPurchaseOrders(), dataService.getInventoryItems(),
          dataService.getUsers(), dataService.getBugReports(), dataService.getEstimates(),
          // FIX: Pass currentUser to getApplications function to filter by user_id_param
          dataService.getApplications(user), dataService.getApplicationCodes(), dataService.getInvoices(),
          dataService.getProjects(), dataService.getDepartments(), dataService.getPaymentRecipients(),
          dataService.getAllocationDivisions(), dataService.getTitles()
        ]);
        setJobs(jobsData);
        setCustomers(customersData);
        setJournalEntries(journalData);
        setAccountItems(accountsData);
        setLeads(leadsData);
        setApprovalRoutes(routesData);
        setPurchaseOrders(poData);
        setInventoryItems(inventoryData);
        setAllUsers(usersData);
        setBugReports(bugReportsData);
        setEstimates(estimatesData);
        setApplications(applicationsData);
        setApplicationCodes(appCodesData);
        setInvoices(invoicesData);
        setProjects(projectsData);
        setDepartments(departmentsData);
        setPaymentRecipients(paymentRecipientsData);
        setAllocationDivisions(allocationDivisionsData);
        setTitles(titlesData);
      } catch (err: any) {
        console.error("Data fetching error:", err);
        setError(`データの読み込みに失敗しました: ${err.message || String(err)}`);
        if (dataService.isSupabaseUnavailableError(err)) {
            setError('データベースに接続できません。Supabaseの認証情報が正しく設定されているか確認してください。');
        }
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    useEffect(() => {
      if (currentUser) {
        fetchData(currentUser);
      }
    }, [currentUser, fetchData]);

    const handleSignOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            addToast('ログアウトしました。', 'info');
        } catch (error) {
            console.error('Error signing out:', error);
            addToast('ログアウトに失敗しました。', 'error');
        }
    }, [addToast]);
    
    const handleAnalyzeCustomer = useCallback(async (customer: Customer) => {
        setAnalysisTargetCustomer(customer);
        setIsCompanyAnalysisModalOpen(true);
        setIsAnalysisLoading(true);
        setAnalysisError('');
        setAnalysisResult(null);
        try {
            const result = await geminiService.analyzeCompany(customer);
            setAnalysisResult(result);
        } catch (e) {
            setAnalysisError(e instanceof Error ? e.message : '分析中にエラーが発生しました。');
        } finally {
            setIsAnalysisLoading(false);
        }
    }, []);

    const handleAddJob = useCallback(async (jobData: any) => {
        await dataService.addJob(jobData);
        if(currentUser) await fetchData(currentUser);
        addToast("新しい案件が追加されました。", "success");
    }, [fetchData, addToast, currentUser]);
    
    const handleUpdateJob = useCallback(async (jobId: string, updatedData: Partial<Job>) => {
        await dataService.updateJob(jobId, updatedData);
        if(currentUser) await fetchData(currentUser);
        addToast("案件情報が更新されました。", "success");
    }, [fetchData, addToast, currentUser]);
    
    const handleDeleteJob = useCallback(async (jobId: string) => {
        await dataService.deleteJob(jobId);
        if(currentUser) await fetchData(currentUser);
        addToast("案件が削除されました。", "success");
        setIsJobDetailModalOpen(false);
    }, [fetchData, addToast, currentUser]);

    const handleAddCustomer = useCallback(async (customerData: Partial<Customer>) => {
        await dataService.addCustomer(customerData);
        if(currentUser) await fetchData(currentUser);
        addToast("新しい顧客が追加されました。", "success");
        setCustomerModalMode('view');
        setIsCustomerDetailModalOpen(false);
    }, [fetchData, addToast, currentUser]);
    
    const handleUpdateCustomer = useCallback(async (customerId: string, updatedData: Partial<Customer>) => {
        await dataService.updateCustomer(customerId, updatedData);
        if(currentUser) await fetchData(currentUser);
        addToast("顧客情報が更新されました。", "success");
    }, [fetchData, addToast, currentUser]);
    
    const handleAddJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'date' | 'status'>) => {
        await dataService.addJournalEntry({ ...entry, date: new Date().toISOString(), status: 'posted' });
        if(currentUser) await fetchData(currentUser);
        addToast("仕訳が追加されました。", "success");
    }, [fetchData, addToast, currentUser]);

    const handleAddLead = useCallback(async (leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => {
        await dataService.addLead(leadData);
        if(currentUser) await fetchData(currentUser);
        addToast("新しいリードが追加されました。", "success");
    }, [fetchData, addToast, currentUser]);

    const handleUpdateLead = useCallback(async (leadId: string, updatedData: Partial<Lead>) => {
        await dataService.updateLead(leadId, updatedData);
        if(currentUser) await fetchData(currentUser);
        addToast("リード情報が更新されました。", "success");
    }, [fetchData, addToast, currentUser]);

    const handleDeleteLead = useCallback(async (leadId: string) => {
        await dataService.deleteLead(leadId);
        if(currentUser) await fetchData(currentUser);
        addToast("リードが削除されました。", "success");
        setIsJobDetailModalOpen(false); // Changed from setIsJobDetailModalOpen to handle lead modal closing if open
    }, [fetchData, addToast, currentUser]);


    const handleAddPurchaseOrder = useCallback(async (orderData: Omit<PurchaseOrder, 'id'>) => {
        await dataService.addPurchaseOrder(orderData);
        if(currentUser) await fetchData(currentUser);
        addToast("新しい発注が作成されました。", "success");
        setIsCreatePurchaseOrderModalOpen(false);
    }, [fetchData, addToast, currentUser]);
    
    const handleSaveInventoryItem = useCallback(async (itemData: Partial<InventoryItem>) => {
        if(itemData.id){
            await dataService.updateInventoryItem(itemData.id, itemData);
            addToast("在庫品目が更新されました。", "success");
        } else {
            await dataService.addInventoryItem(itemData);
            addToast("新しい在庫品目が追加されました。", "success");
        }
        if(currentUser) await fetchData(currentUser);
        setIsCreateInventoryItemModalOpen(false);
        setSelectedInventoryItem(null);
    }, [fetchData, addToast, currentUser]);

    const handleAddBugReport = useCallback(async (reportData: any) => {
        if (!currentUser) return;
        const newReport = { ...reportData, reporterName: currentUser.name };
        await dataService.addBugReport(newReport);
        if(currentUser) await fetchData(currentUser);
        addToast('フィードバックを送信しました。ご協力ありがとうございます！', 'success');
        setIsBugReportModalOpen(false);
    }, [currentUser, fetchData, addToast]);
    
    const handleUpdateBugReport = useCallback(async (reportId: string, updatedData: Partial<BugReport>) => {
        await dataService.updateBugReport(reportId, updatedData);
        if(currentUser) await fetchData(currentUser);
        addToast("レポートのステータスが更新されました。", "success");
    }, [fetchData, addToast, currentUser]);
    
    const handleCreateEstimate = useCallback(async (estimateData: any) => {
        await dataService.addEstimate(estimateData);
        if(currentUser) await fetchData(currentUser);
    }, [fetchData, currentUser]);

    const handleProjectCreated = useCallback(async () => {
        if(currentUser) await fetchData(currentUser);
        addToast("AIによる案件作成が完了しました。", "success");
        setCurrentPage('project_list');
    }, [fetchData, addToast, currentUser]);

    // Master data handlers
    const masterSaveHandler = (saveFn: (item: any) => Promise<any>, entity: string) => async (item: any) => {
        await saveFn(item);
        addToast(`${entity}を保存しました。`, 'success');
        if(currentUser) await fetchData(currentUser);
    };
    const masterDeleteHandler = (deleteFn: (id: string) => Promise<any>, entity: string) => async (id: string) => {
        await deleteFn(id);
        addToast(`${entity}を削除しました。`, 'success');
        if(currentUser) await fetchData(currentUser);
    };


    const renderPage = () => {
        switch (currentPage) {
            case 'analysis_dashboard':
                return <Dashboard jobs={jobs} journalEntries={journalEntries} accountItems={accountItems} pendingApprovalCount={applications.filter(a => a.approverId === currentUser?.id && a.status === 'pending_approval').length} onNavigateToApprovals={() => setCurrentPage('approval_list')} />;
            case 'sales_orders':
                return <JobList jobs={jobs} searchTerm={searchTerm} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} onNewJob={() => setIsCreateJobModal(true)} />;
            case 'sales_customers':
                return <CustomerList customers={customers} searchTerm={searchTerm} onSelectCustomer={(c) => { setSelectedCustomer(c); setCustomerModalMode('view'); setIsCustomerDetailModalOpen(true); }} onUpdateCustomer={handleUpdateCustomer} onAnalyzeCustomer={handleAnalyzeCustomer} addToast={addToast} currentUser={currentUser} onNewCustomer={() => { setCustomerModalMode('new'); setIsCustomerDetailModalOpen(true); }} isAIOff={isAIOff} />;
            case 'sales_leads':
                return <LeadManagementPage leads={leads} searchTerm={searchTerm} onRefresh={() => currentUser && fetchData(currentUser)} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} addToast={addToast} requestConfirmation={requestConfirmation} currentUser={currentUser} isAIOff={isAIOff} onAddEstimate={handleCreateEstimate} />;
            case 'sales_pipeline':
                return <SalesPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'inventory_management':
                return <InventoryManagementPage inventoryItems={inventoryItems} onSelectItem={() => { setSelectedInventoryItem(null); setIsCreateInventoryItemModalOpen(true); }} />;
            case 'manufacturing_progress':
                return <ManufacturingPipelinePage jobs={jobs} onUpdateJob={handleUpdateJob} onCardClick={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'manufacturing_orders':
                return <ManufacturingOrdersPage jobs={jobs} onSelectJob={(job) => { setSelectedJob(job); setIsJobDetailModalOpen(true); }} />;
            case 'purchasing_orders':
                return <PurchasingManagementPage purchaseOrders={purchaseOrders} />;
            case 'sales_estimates':
                return <EstimateManagementPage estimates={estimates} customers={customers} allUsers={allUsers} addToast={addToast} currentUser={currentUser} searchTerm={searchTerm} isAIOff={isAIOff} onNavigateToCreate={setCurrentPage} />;
            case 'estimate_creation':
                 return <EstimateCreationPage customers={customers} allUsers={allUsers} addToast={addToast} currentUser={currentUser} isAIOff={isAIOff} onCreateEstimate={handleCreateEstimate} onNavigateBack={() => setCurrentPage('sales_estimates')} />;
            case 'project_list':
                 return <ProjectListPage projects={projects} onNavigateToCreate={() => setCurrentPage('project_creation')} />;
            case 'project_creation':
                return <ProjectCreationPage onNavigateBack={() => setCurrentPage('project_list')} onProjectCreated={handleProjectCreated} customers={customers} currentUser={currentUser} isAIOff={isAIOff} addToast={addToast} />;
            case 'analysis_ranking':
                return <SalesRanking jobs={jobs} />;
            case 'accounting_business_plan':
                return <BusinessPlanPage allUsers={allUsers} />;
            case 'manufacturing_cost':
                return <ManufacturingCostManagement jobs={jobs} />;
            case 'business_support_proposal':
                return <BusinessSupportPage customers={customers} jobs={jobs} estimates={estimates} currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} />;
            case 'ai_business_consultant':
                return <AIChatPage currentUser={currentUser} jobs={jobs} customers={customers} journalEntries={journalEntries} />;
            case 'ai_market_research':
                return <MarketResearchPage addToast={addToast} isAIOff={isAIOff} />;
            case 'ai_live_chat':
                return <LiveChatPage addToast={addToast} isAIOff={isAIOff} />;
            case 'ai_anything_analysis':
                return currentUser?.canUseAnythingAnalysis ? <AnythingAnalysisPage currentUser={currentUser} addToast={addToast} isAIOff={isAIOff} /> : <PlaceholderPage title="なんでも分析" />;
            
            case 'approval_list':
                return <ApprovalWorkflowPage view="list" currentUser={currentUser} searchTerm={searchTerm} addToast={addToast} onRefreshData={() => currentUser && fetchData(currentUser)} />;
            case 'approval_form_expense':
            case 'approval_form_transport':
            case 'approval_form_leave':
            case 'approval_form_approval':
            case 'approval_form_daily':
            case 'approval_form_weekly':
                const formCode = currentPage.split('_').pop()?.toUpperCase();
                return <ApprovalWorkflowPage 
                    view="form" 
                    formCode={formCode} 
                    currentUser={currentUser} 
                    addToast={addToast}
                    isAIOff={isAIOff}
                    customers={customers}
                    accountItems={accountItems}
                    jobs={jobs}
                    purchaseOrders={purchaseOrders}
                    departments={departments}
                    allocationDivisions={allocationDivisions}
                    onSuccess={() => { setCurrentPage('approval_list'); currentUser && fetchData(currentUser); }}
                />;
            
            case 'accounting_journal':
            case 'purchasing_invoices':
            case 'purchasing_payments':
            case 'hr_labor_cost':
            case 'accounting_general_ledger':
            case 'accounting_trial_balance':
            case 'accounting_period_closing':
            case 'sales_billing':
                 return <AccountingPage 
                    page={currentPage}
                    journalEntries={journalEntries}
                    accountItems={accountItems}
                    onAddEntry={handleAddJournalEntry}
                    addToast={addToast}
                    requestConfirmation={requestConfirmation}
                    isAIOff={isAIOff}
                    jobs={jobs}
                    applications={applications}
                    onNavigate={setCurrentPage}
                    customers={customers}
                    allUsers={allUsers}
                    onRefreshData={() => currentUser && fetchData(currentUser)}
                    allocationDivisions={allocationDivisions}
                />;

            case 'admin_user_management':
                return <UserManagementPage addToast={addToast} requestConfirmation={requestConfirmation} departments={departments} titles={titles} />;
            case 'admin_route_management':
                return <ApprovalRouteManagementPage addToast={addToast} requestConfirmation={requestConfirmation} />;
            case 'admin_bug_reports':
                return <BugReportList reports={bugReports} onUpdateReport={handleUpdateBugReport} searchTerm={searchTerm} />;
            case 'admin_audit_log': return <AuditLogPage />;
            case 'admin_journal_queue': return <JournalQueuePage />;
            case 'admin_master_management': 
                return <MasterManagementPage 
                    accountItems={accountItems}
                    paymentRecipients={paymentRecipients}
                    allocationDivisions={allocationDivisions}
                    departments={departments}
                    titles={titles}
                    onSaveAccountItem={masterSaveHandler(dataService.saveAccountItem, '勘定科目')}
                    onDeleteAccountItem={masterDeleteHandler(dataService.deactivateAccountItem, '勘定科目')}
                    onSavePaymentRecipient={masterSaveHandler(dataService.savePaymentRecipient, '支払先')}
                    onDeletePaymentRecipient={masterDeleteHandler(dataService.deletePaymentRecipient, '支払先')}
                    onSaveAllocationDivision={masterSaveHandler(dataService.saveAllocationDivision, '振分区分')}
                    onDeleteAllocationDivision={masterDeleteHandler(dataService.deleteAllocationDivision, '振分区分')}
                    onSaveDepartment={masterSaveHandler(dataService.saveDepartment, '部署')}
                    onDeleteDepartment={masterDeleteHandler(dataService.deleteDepartment, '部署')}
                    onSaveTitle={masterSaveHandler(dataService.saveTitle, '役職')}
                    onDeleteTitle={masterDeleteHandler(dataService.deleteTitle, '役職')}
                    addToast={addToast}
                    requestConfirmation={requestConfirmation}
                />;

            case 'hr_org_chart':
                return <OrganizationChartPage users={allUsers} />;
            case 'settings':
                return <SettingsPage addToast={addToast} />;

            default:
                return <PlaceholderPage title={PAGE_TITLES[currentPage] || currentPage} />;
        }
    };
    
    // Auth-related rendering logic
    if (showSetupModal) {
        return <ConnectionSetupPage onSetupComplete={() => { setShowSetupModal(false); window.location.reload(); }} />;
    }

    if (authLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader className="w-12 h-12 animate-spin" /></div>;
    }

    if (error && !loginRequired) { // Only show global error if not already forced to login page
        return <GlobalErrorBanner error={error} onRetry={() => window.location.reload()} />;
    }

    if (needsPasswordUpdate) {
        return <UpdatePasswordForm onPasswordUpdate={() => setNeedsPasswordUpdate(false)} />;
    }

    if (loginRequired || !session || !currentUser) {
        // Render login page if not authenticated or user profile not loaded
        return <LoginPage onMagicLinkSent={() => setMagicLinkSent(true)} magicLinkSent={magicLinkSent} />;
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} currentUser={currentUser} onSignOut={handleSignOut} />
            <div className="flex-1 flex flex-col overflow-hidden">
                {error && <GlobalErrorBanner error={error} onRetry={() => currentUser && fetchData(currentUser)} />}
                <main className="flex-1 overflow-y-auto p-8 space-y-6">
                    <Header
                        title={PAGE_TITLES[currentPage] || 'Dashboard'}
                        primaryAction={
                          currentPage === 'sales_orders' ? { label: '新規案件作成', onClick: () => setIsCreateJobModal(true), icon: PlusCircle } :
                          currentPage === 'sales_customers' ? { label: '新規顧客登録', onClick: () => { setCustomerModalMode('new'); setIsCustomerDetailModalOpen(true); }, icon: PlusCircle } :
                          currentPage === 'sales_leads' ? { label: '新規リード作成', onClick: () => setIsCreateLeadModalOpen(true), icon: PlusCircle } :
                          currentPage === 'purchasing_orders' ? { label: '新規発注作成', onClick: () => setIsCreatePurchaseOrderModalOpen(true), icon: PlusCircle } :
                          currentPage === 'inventory_management' ? { label: '新規品目登録', onClick: () => { setSelectedInventoryItem(null); setIsCreateInventoryItemModalOpen(true); }, icon: PlusCircle } :
                          undefined
                        }
                        search={
                          ['sales_orders', 'sales_customers', 'sales_leads', 'admin_bug_reports', 'approval_list'].includes(currentPage) ? {
                            value: searchTerm,
                            onChange: setSearchTerm,
                            placeholder: `${PAGE_TITLES[currentPage]}を検索...`
                          } : undefined
                        }
                    />
                    {isLoading ? <Loader className="w-8 h-8 mx-auto animate-spin" /> : renderPage()}
                </main>
            </div>
            {isCreateJobModal && <CreateJobModal isOpen={isCreateJobModal} onClose={() => setIsCreateJobModal(false)} onAddJob={handleAddJob} />}
            {isJobDetailModalOpen && <JobDetailModal isOpen={isJobDetailModalOpen} job={selectedJob} onClose={() => setIsJobDetailModalOpen(false)} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} requestConfirmation={requestConfirmation} onNavigate={setCurrentPage} addToast={addToast} />}
            {isCustomerDetailModalOpen && <CustomerDetailModal customer={selectedCustomer} mode={customerModalMode} onClose={() => setIsCustomerDetailModalOpen(false)} onSave={customerModalMode === 'new' ? handleAddCustomer : (d) => handleUpdateCustomer(d.id!, d)} onSetMode={setCustomerModalMode} onAnalyzeCustomer={handleAnalyzeCustomer} isAIOff={isAIOff} />}
            {isCreateLeadModalOpen && <CreateLeadModal isOpen={isCreateLeadModalOpen} onClose={() => setIsCreateLeadModalOpen(false)} onAddLead={handleAddLead} />}
            {isCreatePurchaseOrderModalOpen && <CreatePurchaseOrderModal isOpen={isCreatePurchaseOrderModalOpen} onClose={() => setIsCreatePurchaseOrderModalOpen(false)} onAddPurchaseOrder={handleAddPurchaseOrder} />}
            {isCreateInventoryItemModalOpen && <CreateInventoryItemModal isOpen={isCreateInventoryItemModalOpen} onClose={() => { setIsCreateInventoryItemModalOpen(false); setSelectedInventoryItem(null); }} onSave={handleSaveInventoryItem} item={selectedInventoryItem} />}
            {isCompanyAnalysisModalOpen && <CompanyAnalysisModal isOpen={isCompanyAnalysisModalOpen} onClose={() => setIsCompanyAnalysisModalOpen(false)} analysis={analysisResult} customer={analysisTargetCustomer} isLoading={isAnalysisLoading} error={analysisError} currentUser={currentUser} isAIOff={isAIOff} onReanalyze={handleAnalyzeCustomer} />}
            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id === id))} />
            <ConfirmationDialog {...confirmationDialog} />
            <button
                onClick={() => setIsBugReportModalOpen(true)}
                className="fixed bottom-8 right-8 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110"
                title="バグ報告・改善要望"
            >
                <Bug className="w-6 h-6"/>
            </button>
            {isBugReportModalOpen && <BugReportModal isOpen={isBugReportModalOpen} onClose={() => setIsBugReportModalOpen(false)} currentUser={currentUser} onReportSubmit={handleAddBugReport} />}
        </div>
    );
};

export default App;
