

import React, { useState, useEffect, useMemo } from 'react';
import ApplicationList from '../ApplicationList.tsx';
import ApplicationDetailModal from '../ApplicationDetailModal.tsx';
import { getApplications, getApplicationCodes, approveApplication, rejectApplication } from '../../services/dataService.ts';
import { ApplicationWithDetails, ApplicationCode, EmployeeUser, Toast, Customer, AccountItem, Job, PurchaseOrder, Department, AllocationDivision } from '../../types.ts';
import { Loader, AlertTriangle } from '../Icons.tsx';

// Form components
import { ExpenseReimbursementForm } from '../forms/ExpenseReimbursementForm.tsx';
import TransportExpenseForm from '../forms/TransportExpenseForm.tsx';
import LeaveApplicationForm from '../forms/LeaveApplicationForm.tsx';
import ApprovalForm from '../forms/ApprovalForm.tsx';
import DailyReportForm from '../forms/DailyReportForm.tsx';
import WeeklyReportForm from '../forms/WeeklyReportForm.tsx';

interface ApprovalWorkflowPageProps {
    currentUser: EmployeeUser | null;
    view: 'list' | 'form';
    formCode?: string;
    searchTerm?: string;
    addToast: (message: string, type: Toast['type']) => void;
    customers?: Customer[];
    accountItems?: AccountItem[];
    jobs?: Job[];
    purchaseOrders?: PurchaseOrder[];
    departments?: Department[];
    isAIOff?: boolean;
    allocationDivisions?: AllocationDivision[];
    onSuccess?: () => void; // Added for form submission success callback
    onRefreshData?: () => void; // Added for list data refresh
}

const TABS_CONFIG = {
    pending: { title: "あなたが承認する申請", description: "あなたが承認する必要がある申請の一覧です。" },
    submitted: { title: "自分の申請", description: "あなたが過去に提出したすべての申請履歴です。" },
    completed: { title: "完了済", description: "承認または却下されたすべての申請の履歴です。" },
};

const ApprovalWorkflowPage: React.FC<ApprovalWorkflowPageProps> = ({ currentUser, view, formCode, searchTerm, addToast, customers, accountItems, jobs, purchaseOrders, departments, isAIOff, allocationDivisions, onSuccess, onRefreshData }) => {
    // State for list view
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'completed'>('pending');

    // State for form view
    const [applicationCodes, setApplicationCodes] = useState<ApplicationCode[]>([]);
    const [isCodesLoading, setIsCodesLoading] = useState(true);

    const fetchListData = async () => {
        if (!currentUser) return;
        try {
            setIsLoading(true);
            setError('');
            // FIX: Pass currentUser.id for filtering applications relevant to the current user
            const apps = await getApplications(currentUser);
            setApplications(apps);
        } catch (err: any) {
            setError(err.message || '申請データの取得に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFormData = async () => {
        setIsCodesLoading(true);
        setError('');
        try {
            const codes = await getApplicationCodes();
            setApplicationCodes(codes);
        } catch (err: any) {
             setError(err.message || '申請フォームの基本データの読み込みに失敗しました。');
        } finally {
            setIsCodesLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list' && currentUser) {
            fetchListData();
        } else if (view === 'form') {
            fetchFormData();
        }
    }, [view, currentUser]);

    // List View Logic
    const handleSelectApplication = (app: ApplicationWithDetails) => {
        setSelectedApplication(app);
        setIsDetailModalOpen(true);
    };

    const handleModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedApplication(null);
    };

    const handleApprove = async (application: ApplicationWithDetails) => {
        if (!currentUser) return;
        try {
            await approveApplication(application, currentUser as any);
            addToast('申請を承認しました。', 'success');
            handleModalClose();
            await fetchListData(); // Refresh list after action
            onRefreshData?.(); // Notify parent to refresh if needed
        } catch (err: any) {
            addToast(`エラー: ${err.message}`, 'error');
        }
    };

    const handleReject = async (application: ApplicationWithDetails, reason: string) => {
        if (!currentUser) return;
        try {
            await rejectApplication(application, reason, currentUser as any);
            addToast('申請を差し戻しました。', 'success');
            handleModalClose();
            await fetchListData(); // Refresh list after action
            onRefreshData?.(); // Notify parent to refresh if needed
        } catch (err: any) {
            addToast(`エラー: ${err.message}`, 'error');
        }
    };
    
    const { displayedApplications, tabCounts } = useMemo(() => {
        const pendingApps = applications.filter(app => app.approverId === currentUser?.id && app.status === 'pending_approval');
        const submittedApps = applications.filter(app => app.applicantId === currentUser?.id);
        const completedApps = applications.filter(app => app.status === 'approved' || app.status === 'rejected');

        const counts = {
            pending: pendingApps.length,
            submitted: submittedApps.length,
            completed: completedApps.length
        };

        let filteredByTab: ApplicationWithDetails[];
        switch(activeTab) {
            case 'pending':
                filteredByTab = pendingApps;
                break;
            case 'submitted':
                filteredByTab = submittedApps;
                break;
            case 'completed':
                filteredByTab = completedApps;
                break;
            default:
                filteredByTab = [];
        }
        
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filteredByTab = filteredByTab.filter(app =>
                app.applicant?.name?.toLowerCase().includes(lowercasedTerm) ||
                app.applicationCode?.name?.toLowerCase().includes(lowercasedTerm) ||
                app.status.toLowerCase().includes(lowercasedTerm)
            );
        }
        return { displayedApplications: filteredByTab, tabCounts: counts };
    }, [applications, activeTab, searchTerm, currentUser]);


    // Form View Logic
    const handleFormSuccess = () => {
        addToast('申請が提出されました。承認一覧で確認できます。', 'success');
        onSuccess?.(); // Call parent onSuccess to trigger global data reload
    };

    const renderActiveForm = () => {
        const activeApplicationCode = applicationCodes.find(c => c.code === formCode);

        const formError = error || (!isCodesLoading && !activeApplicationCode) ? (error || `申請種別'${formCode}'の定義が見つかりません。`) : '';
        
        if (!currentUser) {
            return (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">致命的なエラー</p>
                    <p>ユーザー情報が読み込めませんでした。再ログインしてください。</p>
                </div>
            );
        }

        const formProps = {
            onSuccess: handleFormSuccess,
            applicationCodeId: activeApplicationCode?.id || '',
            currentUser: currentUser as any,
            addToast: addToast,
            isAIOff: isAIOff,
            isLoading: isCodesLoading,
            error: formError,
        };

        switch(formCode) {
            case 'EXP': return <ExpenseReimbursementForm {...formProps} customers={customers || []} accountItems={accountItems || []} jobs={jobs || []} purchaseOrders={purchaseOrders || []} departments={departments || []} allocationDivisions={allocationDivisions || []} />;
            case 'TRP': return <TransportExpenseForm {...formProps} accountItems={accountItems || []} allocationDivisions={allocationDivisions || []} />;
            case 'LEV': return <LeaveApplicationForm {...formProps} />;
            case 'APL': return <ApprovalForm {...formProps} />;
            case 'DLY': return <DailyReportForm {...formProps} />;
            case 'WKR': return <WeeklyReportForm {...formProps} />;
            default: return (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                    <h3 className="mt-4 text-xl font-semibold text-red-600 dark:text-red-400">不明な申請フォーム</h3>
                    <p className="mt-2 text-base text-red-500 dark:text-red-300">
                        申請コード <strong>{formCode}</strong> に対応するフォームが見つかりません。
                    </p>
                </div>
            );
        }
    };
    
    if (view === 'form') {
        return renderActiveForm();
    }

    // List View Render
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <div className="px-6 border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8">
                        {Object.entries(TABS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as any)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base transition-colors ${
                                    activeTab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                            >
                                {config.title} ({tabCounts[key as keyof typeof tabCounts]})
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{TABS_CONFIG[activeTab].title}</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400">{TABS_CONFIG[activeTab].description}</p>
                </div>

                {isLoading ? (
                    <div className="p-16 text-center">
                        <Loader className="w-8 h-8 mx-auto animate-spin" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">申請データを読み込み中...</p>
                    </div>
                ) : error ? (
                    <div className="p-16 text-center text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-12 h-12 mx-auto" />
                        <p className="mt-4 font-semibold">エラーが発生しました。</p>
                        <p className="mt-2">{error}</p>
                    </div>
                ) : (
                    <ApplicationList applications={displayedApplications} onApplicationSelect={handleSelectApplication} selectedApplicationId={selectedApplication?.id || null} />
                )}
            </div>

            {isDetailModalOpen && (
                <ApplicationDetailModal
                    application={selectedApplication}
                    currentUser={currentUser as any}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default ApprovalWorkflowPage;