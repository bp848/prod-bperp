import React, { useState, useMemo } from 'react';
import { Customer, Job, Estimate, EmployeeUser, Toast } from '../types.ts';
import { generateProposalSection } from '../services/geminiService.ts';
import { Loader, Sparkles, FileText } from './Icons.tsx';
import { formatJPY } from '../utils.ts';

declare const jspdf: any;
declare const html2canvas: any;

interface BusinessSupportPageProps {
    customers: Customer[];
    jobs: Job[];
    estimates: Estimate[];
    currentUser: EmployeeUser | null;
    addToast: (message: string, type: Toast['type']) => void;
    isAIOff: boolean;
}

const BusinessSupportPage: React.FC<BusinessSupportPageProps> = ({ customers, jobs, estimates, currentUser, addToast, isAIOff }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null); // Changed to nullable string
    const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null); // Changed to nullable string
    
    const [proposal, setProposal] = useState({
        title: '',
        executiveSummary: '',
        currentSituation: '',
        proposalContent: '',
        expectedBenefits: '',
        schedule: '',
        costEstimate: '',
    });

    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
    const relatedJobs = useMemo(() => selectedCustomer ? jobs.filter(j => j.customerId === selectedCustomer.id) : [], [jobs, selectedCustomer]); // Filter by customerId
    const relatedEstimates = useMemo(() => selectedCustomer ? estimates.filter(e => e.customerId === selectedCustomer.id) : [], [estimates, selectedCustomer]); // Filter by customerId
    const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId]);
    const selectedEstimate = useMemo(() => estimates.find(e => e.id === selectedEstimateId), [estimates, selectedEstimateId]);
    
    const handleGenerateSection = async (section: keyof typeof proposal, sectionTitle: string) => {
        if (!selectedCustomer) {
            addToast('提案の対象となる顧客を選択してください。', 'info');
            return;
        }
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        setLoadingStates(prev => ({ ...prev, [section]: true }));
        try {
            const content = await generateProposalSection(sectionTitle, selectedCustomer, selectedJob, selectedEstimate);
            setProposal(prev => ({ ...prev, [section]: content }));
        } catch (error: any) {
            console.error(error);
            addToast(`「${sectionTitle}」の生成に失敗しました。${error.message || ''}`, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, [section]: false }));
        }
    };
    
    const handleGeneratePdf = async () => {
        setIsPdfLoading(true);
        const input = document.getElementById('proposal-preview');
        if (!input) {
            addToast('プレビュー要素が見つかりません。', 'error');
            setIsPdfLoading(false);
            return;
        }
    
        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            const customerName = selectedCustomer?.customerName || 'customer';
            const date = new Date().toISOString().split('T')[0];
            pdf.save(`提案書_${customerName}_${date}.pdf`);
            addToast('提案書PDFが正常に生成されました。', 'success');
        } catch (error) {
            console.error("PDF generation failed", error);
            addToast('PDFの生成に失敗しました。', 'error');
        } finally {
            setIsPdfLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">AI提案書作成支援</h2>
                <p className="text-base text-slate-500 dark:text-slate-400">
                    顧客、案件、見積情報を選択し、AIが生成する提案書をカスタマイズしてPDF出力できます。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="customer-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">顧客を選択</label>
                        <select
                            id="customer-select"
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white"
                        >
                            <option value="">顧客を選択してください</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="job-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">関連案件を選択</label>
                        <select
                            id="job-select"
                            value={selectedJobId || ''}
                            onChange={(e) => setSelectedJobId(e.target.value || null)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            disabled={!selectedCustomerId}
                        >
                            <option value="">案件なし</option>
                            {relatedJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="estimate-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">関連見積を選択</label>
                        <select
                            id="estimate-select"
                            value={selectedEstimateId || ''}
                            onChange={(e) => setSelectedEstimateId(e.target.value || null)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            disabled={!selectedCustomerId}
                        >
                            <option value="">見積なし</option>
                            {relatedEstimates.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">提案書コンテンツ</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">タイトル</label>
                            <input
                                type="text"
                                value={proposal.title}
                                onChange={(e) => setProposal(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white"
                            />
                        </div>
                        {[
                            { key: 'executiveSummary', label: 'エグゼクティブサマリー' },
                            { key: 'currentSituation', label: '現状分析' },
                            { key: 'proposalContent', label: '提案内容' },
                            { key: 'expectedBenefits', label: '期待効果' },
                            { key: 'schedule', label: 'スケジュール' },
                            { key: 'costEstimate', label: '費用見積' },
                        ].map((section) => (
                            <div key={section.key}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{section.label}</label>
                                    <button
                                        onClick={() => handleGenerateSection(section.key as keyof typeof proposal, section.label)}
                                        disabled={loadingStates[section.key as keyof typeof proposal] || !selectedCustomer || isAIOff}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                    >
                                        {loadingStates[section.key as keyof typeof proposal] ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        AI生成
                                    </button>
                                </div>
                                <textarea
                                    value={proposal[section.key as keyof typeof proposal]}
                                    onChange={(e) => setProposal(prev => ({ ...prev, [section.key]: e.target.value }))}
                                    rows={5}
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white"
                                    placeholder={`${section.label}を記述...`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleGeneratePdf}
                            disabled={isPdfLoading || !selectedCustomer || (!proposal.executiveSummary && !proposal.proposalContent)}
                            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-slate-400"
                        >
                            {isPdfLoading ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            PDFダウンロード
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">提案書プレビュー</h3>
                    <div id="proposal-preview" className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-y-auto h-[700px] bg-white text-black text-sm p-4">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-blue-800">{proposal.title || 'AI提案書'}</h1>
                            <p className="text-blue-600 mt-2">{selectedCustomer?.customerName} 御中</p>
                            <p className="text-xs text-slate-600 mt-4">文唱堂印刷株式会社</p>
                            <p className="text-xs text-slate-600">{new Date().toLocaleDateString('ja-JP')}</p>
                        </div>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">エグゼクティブサマリー</h2>
                        <p className="whitespace-pre-wrap">{proposal.executiveSummary || 'AI生成または入力してください。'}</p>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">現状分析</h2>
                        <p className="whitespace-pre-wrap">{proposal.currentSituation || 'AI生成または入力してください。'}</p>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">提案内容</h2>
                        <p className="whitespace-pre-wrap">{proposal.proposalContent || 'AI生成または入力してください。'}</p>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">期待効果</h2>
                        <p className="whitespace-pre-wrap">{proposal.expectedBenefits || 'AI生成または入力してください。'}</p>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">スケジュール</h2>
                        <p className="whitespace-pre-wrap">{proposal.schedule || 'AI生成または入力してください。'}</p>
                        <h2 className="text-lg font-semibold text-blue-700 mt-4 mb-2">費用見積</h2>
                        <p className="whitespace-pre-wrap">{proposal.costEstimate || 'AI生成または入力してください。'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessSupportPage;