import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead, LeadStatus, Toast, ConfirmationDialogProps, EmployeeUser, CustomProposalContent, LeadProposalPackage, EstimateStatus, EstimateLineItem, CompanyInvestigation } from '../../types.ts'; // Correctly import Lead
import { X, Save, Loader, Pencil, Trash2, Mail, CheckCircle, Lightbulb, Search, FileText, ArrowRight, ArrowLeft, AlertTriangle, RefreshCw, Sparkles } from '../Icons.tsx';
import LeadStatusBadge from './LeadStatusBadge.tsx';
import { INQUIRY_TYPES } from '../../constants.ts';
import LeadScoreBadge from '../ui/LeadScoreBadge.tsx';
// FIX: Add missing geminiService imports
import { createLeadProposalPackage, investigateLeadCompany, generateLeadReplyEmail } from '../../services/geminiService.ts';
import ProposalPdfContent from './ProposalPdfContent.tsx';
import { generateMultipagePdf, formatDate, formatJPY, formatDateTime, createSignature } from '../../utils.ts';
import InvestigationReportPdfContent from '../reports/InvestigationReportPdfContent.tsx';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    allLeads: Lead[];
    currentLeadIndex: number;
    onNavigateLead: (index: number) => void;
    onSave: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
    onDelete: (leadId: string) => Promise<void>;
    addToast: (message: string, type: Toast['type']) => void;
    requestConfirmation: (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => void;
    currentUser: EmployeeUser | null;
    isAIOff: boolean;
    onAddEstimate: (estimate: any) => Promise<void>;
    // FIX: Add onRefresh prop
    onRefresh: () => void;
}

const Field: React.FC<{
    label: string;
    name: keyof Lead;
    value: string | string[] | number | null | undefined;
    isEditing: boolean;
    onChange: (e: React.ChangeEvent<any>) => void;
    type?: 'text' | 'email' | 'select' | 'textarea' | 'date' | 'number';
    options?: any[];
    className?: string;
    colSpan?: string;
}> = ({ label, name, value, isEditing, onChange, type = 'text', options = [], className = '', colSpan = 'col-span-1' }) => {
    const fieldInputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-base text-slate-900 dark:text-white rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 leading-tight";
    
    let displayValue: React.ReactNode = Array.isArray(value) ? value.join(', ') : (value !== null && value !== undefined ? String(value) : '-');

    if (!isEditing && type === 'date' && value) {
        displayValue = formatDate(value as string);
    }
    if (!isEditing && name === 'score' && typeof value === 'number') {
        displayValue = <LeadScoreBadge score={value} />;
    }

    return (
        <div className={`${className} ${colSpan}`}>
            <label htmlFor={String(name)} className="text-base font-medium text-slate-500 dark:text-slate-400 leading-tight">{label}</label>
            <div className="mt-1">
                {isEditing ? (
                    <>
                        {type === 'textarea' && <textarea id={String(name)} name={String(name)} value={(value as string) || ''} onChange={onChange} className={fieldInputClass} rows={5} />}
                        {type === 'select' && <select id={String(name)} name={String(name)} value={(value as string) || ''} onChange={onChange} className={fieldInputClass}>{options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select>}
                        {['text', 'email', 'date', 'number'].includes(type) && <input id={String(name)} type={type} name={String(name)} value={String(value || '')} onChange={onChange} className={fieldInputClass} />}
                    </>
                ) : (
                    <div className="text-base text-slate-900 dark:text-white min-h-[38px] flex items-center">{displayValue}</div>
                )}
            </div>
        </div>
    )
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, allLeads, currentLeadIndex, onNavigateLead, onSave, onDelete, addToast, requestConfirmation, currentUser, isAIOff, onAddEstimate, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Lead>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isInvestigating, setIsInvestigating] = useState(false);
    const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [error, setError] = useState('');
    const [proposalPackage, setProposalPackage] = useState<LeadProposalPackage | null>(null);
    const [investigationReport, setInvestigationReport] = useState<CompanyInvestigation | null>(null);
    const [isProposalPdfLoading, setIsProposalPdfLoading] = useState(false);
    const [isInvestigationPdfLoading, setIsInvestigationPdfLoading] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (lead) {
            setFormData(lead);
            setIsEditing(false);
            setProposalPackage(lead.aiDraftProposal ? JSON.parse(lead.aiDraftProposal) : null);
            setInvestigationReport(lead.aiInvestigation);
            setError('');
        }
    }, [lead]);

    if (!isOpen || !lead) return null;

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInquiryTypeChange = (type: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentTypes = prev.inquiryTypes || [];
            if (isChecked) {
                return { ...prev, inquiryTypes: [...currentTypes, type] };
            } else {
                return { ...prev, inquiryTypes: currentTypes.filter(t => t !== type) };
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await onSave(lead.id, formData);
            addToast('リード情報が更新されました。', 'success');
            setIsEditing(false);
            onRefresh(); // Refresh parent data
        } catch (err: any) {
            if (mounted.current) {
                setError(err.message || '保存に失敗しました。');
                addToast(err.message || '保存に失敗しました。', 'error');
            }
        } finally {
            if (mounted.current) {
                setIsSaving(false);
            }
        }
    };

    const handleDelete = () => {
        requestConfirmation({
            title: 'リードの削除',
            message: `本当にリード「${lead.company} / ${lead.name}」を削除しますか？この操作は元に戻せません。`,
            onConfirm: async () => {
                await onDelete(lead.id);
                onClose();
            },
        });
    };

    const handleInvestigate = async () => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        setIsInvestigating(true);
        setError('');
        try {
            const report = await investigateLeadCompany(lead.company);
            setInvestigationReport(report);
            await onSave(lead.id, { aiInvestigation: report });
            addToast('AIが企業情報を調査しました。', 'success');
            onRefresh(); // Refresh parent data
        } catch (err: any) {
            if (mounted.current) {
                setError(err.message || '企業情報の調査に失敗しました。');
                addToast(err.message || '企業情報の調査に失敗しました。', 'error');
            }
        } finally {
            if (mounted.current) {
                setIsInvestigating(false);
            }
        }
    };

    const handleGenerateProposal = async () => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        setIsGeneratingProposal(true);
        setError('');
        try {
            const result = await createLeadProposalPackage(lead);
            setProposalPackage(result);
            await onSave(lead.id, { aiDraftProposal: JSON.stringify(result) });
            if (result.isSalesLead) {
                addToast('AIが提案書パッケージを作成しました。', 'success');
            } else {
                addToast(`このリードは営業リードではないと判断されました: ${result.reason}`, 'info');
            }
            onRefresh(); // Refresh parent data
        } catch (err: any) {
            if (mounted.current) {
                setError(err.message || '提案書パッケージの生成に失敗しました。');
                addToast(err.message || '提案書パッケージの生成に失敗しました。', 'error');
            }
        } finally {
            if (mounted.current) {
                setIsGeneratingProposal(false);
            }
        }
    };

    const handleGenerateEmail = async () => {
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        if (!lead.email) {
            addToast('返信先のメールアドレスが登録されていません。', 'error');
            return;
        }
        if (!currentUser) {
            addToast('ログインユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsGeneratingEmail(true);
        setError('');
        try {
            const { subject, bodyText } = await generateLeadReplyEmail(lead);
            const signature = createSignature();
            const finalBody = `${bodyText}\n\n${signature}`.trim();

            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
            window.open(gmailUrl, '_blank');

            const timestamp = formatDateTime(new Date().toISOString());
            const logMessage = `[${timestamp}] AI返信メールを作成しました。`;
            const updatedInfo = `${logMessage}\n${lead.infoSalesActivity || ''}`.trim();

            await onSave(lead.id, {
                infoSalesActivity: updatedInfo,
                status: LeadStatus.Contacted,
                updatedAt: new Date().toISOString(),
            });
            addToast('Gmailの下書きを作成しました。', 'success');
            onRefresh(); // Refresh parent data
        } catch (err: any) {
            if (mounted.current) {
                setError(err.message || 'AIによるメール作成に失敗しました。');
                addToast(err.message || 'AIによるメール作成に失敗しました。', 'error');
            }
        } finally {
            if (mounted.current) {
                setIsGeneratingEmail(false);
            }
        }
    };

    const handleCreateEstimateFromProposal = async () => {
        if (!proposalPackage || !proposalPackage.estimate) {
            addToast('見積項目が生成されていません。', 'error');
            return;
        }
        try {
            const newEstimate = {
                customerName: lead.company,
                // FIX: customerId does not exist on Lead type, remove direct assignment.
                // If mapping to an existing customer is desired, this logic needs to be added.
                // customerId: lead.customerId || null, 
                title: proposalPackage.proposal?.coverTitle || `${lead.company}様向けご提案`,
                items: proposalPackage.estimate.map(item => ({
                    name: item.name, // FIX: Map content to name
                    qty: item.qty, // FIX: Map quantity to qty
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    taxRate: 0.1, // Default tax rate
                    description: item.description, // FIX: Use description from AI
                })) as EstimateLineItem[],
                issueDate: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days validity
                deliveryMethod: 'メール送付',
                paymentTerms: '月末締め翌月末払い',
                notes: 'AIが生成した提案書に基づいて作成。',
                status: EstimateStatus.Draft,
                userId: currentUser?.id,
                // FIX: Sum item.unitPrice * item.qty for totalAmount calculation
                totalAmount: proposalPackage.estimate.reduce((sum, item) => sum + (item.unitPrice * item.qty || 0), 0), 
            };
            await onAddEstimate(newEstimate);
            addToast('見積が作成されました。', 'success');
            await onSave(lead.id, { status: LeadStatus.Converted, updatedAt: new Date().toISOString() });
            onClose();
            onRefresh(); // Refresh parent data
        } catch (err) {
            addToast(err instanceof Error ? err.message : '見積の作成に失敗しました。', 'error');
        }
    };

    const handleGenerateProposalPdf = async () => {
        if (!proposalPackage?.proposal || !lead) return;
        setIsProposalPdfLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow content to render
            await generateMultipagePdf(
                'proposal-pdf-content',
                `提案書_${lead.company}.pdf`
            );
            addToast('提案書PDFが正常に生成されました。', 'success');
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'PDFの生成に失敗しました。', 'error');
        } finally {
            setIsProposalPdfLoading(false);
        }
    };

    const handleGenerateInvestigationPdf = async () => {
        if (!investigationReport || !lead) return;
        setIsInvestigationPdfLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Allow content to render
            await generateMultipagePdf(
                'investigation-report-pdf-content',
                `企業調査レポート_${lead.company}.pdf`
            );
            addToast('調査レポートPDFが正常に生成されました。', 'success');
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'PDFの生成に失敗しました。', 'error');
        } finally {
            setIsInvestigationPdfLoading(false);
        }
    };

    const canNavigatePrev = currentLeadIndex > 0;
    const canNavigateNext = currentLeadIndex < allLeads.length - 1;

    const navButtonClass = "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <button onClick={() => onNavigateLead(currentLeadIndex - 1)} disabled={!canNavigatePrev} className={navButtonClass}>
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lead.company} <span className="text-xl font-normal text-slate-500">/ {lead.name}</span></h2>
                            <button onClick={() => onNavigateLead(currentLeadIndex + 1)} disabled={!canNavigateNext} className={navButtonClass}>
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Field label="会社名" name="company" value={formData.company} isEditing={isEditing} onChange={handleFieldChange} />
                            <Field label="担当者名" name="name" value={formData.name} isEditing={isEditing} onChange={handleFieldChange} />
                            <Field label="ステータス" name="status" value={formData.status} isEditing={isEditing} onChange={handleFieldChange} type="select" options={Object.values(LeadStatus)} />

                            <Field label="メール" name="email" value={formData.email} isEditing={isEditing} onChange={handleFieldChange} type="email" />
                            <Field label="電話" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleFieldChange} type="text" />
                            <Field label="流入経路" name="source" value={formData.source} isEditing={isEditing} onChange={handleFieldChange} />

                            <Field label="スコア" name="score" value={formData.score} isEditing={isEditing} onChange={handleFieldChange} type="number" />
                            <Field label="最終更新" name="updatedAt" value={lead.updatedAt ? formatDateTime(lead.updatedAt) : formatDateTime(lead.createdAt)} isEditing={false} onChange={() => { }} />
                            <Field label="作成日" name="createdAt" value={formatDateTime(lead.createdAt)} isEditing={false} onChange={() => { }} />

                            <div className="md:col-span-3">
                                <label className="text-base font-medium text-slate-500 dark:text-slate-400 leading-tight">お問い合わせ種別</label>
                                <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {INQUIRY_TYPES.map(type => (
                                        <label key={type} className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                                            {isEditing ? (
                                                <input
                                                    type="checkbox"
                                                    checked={formData.inquiryTypes?.includes(type) || false}
                                                    onChange={(e) => handleInquiryTypeChange(type, e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            ) : (
                                                (formData.inquiryTypes?.includes(type) || false) && <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Field label="メッセージ" name="message" value={formData.message} isEditing={isEditing} onChange={handleFieldChange} type="textarea" colSpan="md:col-span-3" />
                            <Field label="営業活動情報" name="infoSalesActivity" value={formData.infoSalesActivity} isEditing={isEditing} onChange={handleFieldChange} type="textarea" colSpan="md:col-span-3" />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-500" />AIツール
                            </h3>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleInvestigate}
                                    disabled={isInvestigating || isAIOff}
                                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50"
                                >
                                    {isInvestigating ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    AIで企業調査
                                </button>
                                <button
                                    onClick={handleGenerateProposal}
                                    disabled={isGeneratingProposal || isAIOff}
                                    className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 disabled:opacity-50"
                                >
                                    {isGeneratingProposal ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                    AIで提案書作成
                                </button>
                                <button
                                    onClick={handleGenerateEmail}
                                    disabled={isGeneratingEmail || isAIOff || !lead.email}
                                    className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50 disabled:opacity-50"
                                >
                                    {isGeneratingEmail ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                                    AIで返信メール作成
                                </button>
                            </div>

                            {isAIOff && <p className="text-sm text-red-500 mt-2">AI機能無効のため、AIツールは利用できません。</p>}

                            {investigationReport && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        企業調査レポート
                                        <button onClick={handleGenerateInvestigationPdf} disabled={isInvestigationPdfLoading} className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:underline disabled:opacity-50">
                                            {isInvestigationPdfLoading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}PDFダウンロード
                                        </button>
                                    </h4>
                                    <p className="text-sm whitespace-pre-wrap">{investigationReport.summary}</p>
                                    {investigationReport.sources && investigationReport.sources.length > 0 && (
                                        <div className="mt-3">
                                            <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400">情報源:</h5>
                                            <ul className="list-disc pl-4 text-xs space-y-1 mt-1">
                                                {investigationReport.sources.map((src, i) => (
                                                    <li key={i}><a href={src.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{src.title || src.uri}</a></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {proposalPackage && proposalPackage.isSalesLead && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        AI提案書パッケージ
                                        <button onClick={handleGenerateProposalPdf} disabled={isProposalPdfLoading} className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:underline disabled:opacity-50">
                                            {isProposalPdfLoading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}PDFダウンロード
                                        </button>
                                    </h4>
                                    <p className="text-sm mb-2">{proposalPackage.reason}</p>
                                    {proposalPackage.proposal && (
                                        <>
                                            <h5 className="font-semibold text-base mt-3">{proposalPackage.proposal.coverTitle}</h5>
                                            <p className="text-sm whitespace-pre-wrap">{proposalPackage.proposal.businessUnderstanding}</p>
                                            {/* ... Display other proposal sections as needed ... */}
                                        </>
                                    )}
                                    {proposalPackage.estimate && proposalPackage.estimate.length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="font-semibold text-base mb-2">見積項目案</h5>
                                            <ul className="list-disc pl-5 text-sm space-y-1">
                                                {proposalPackage.estimate.map((item, i) => (
                                                    <li key={i}>{item.name} - {item.qty}{item.unit} @{formatJPY(item.unitPrice)}</li>
                                                ))}
                                            </ul>
                                            <div className="text-right mt-2">
                                                <button onClick={handleCreateEstimateFromProposal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg text-sm ml-auto">
                                                    <CheckCircle className="w-4 h-4" /> 見積を作成
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {proposalPackage && !proposalPackage.isSalesLead && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">AI提案判断</h4>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{proposalPackage.reason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            {isEditing ? (
                                <button onClick={handleDelete} className="flex items-center gap-2 text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50">
                                    <Trash2 className="w-4 h-4" /> 削除
                                </button>
                            ) : (
                                <button
                                    onClick={onRefresh} // FIX: Call onRefresh prop
                                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <RefreshCw className="w-4 h-4" /> 最新の情報に更新
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {!isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                                        <Pencil className="w-4 h-4" /> 編集
                                    </button>
                                    <button onClick={onClose} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">閉じる</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg">キャンセル</button>
                                    <button onClick={handleSave} disabled={isSaving} className="w-32 flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-slate-400">
                                        {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />保存</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isProposalPdfLoading && proposalPackage?.proposal && lead && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <ProposalPdfContent content={proposalPackage.proposal} lead={lead} />
                </div>
            )}
            {isInvestigationPdfLoading && investigationReport && lead && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <InvestigationReportPdfContent report={{ title: `企業調査レポート: ${lead.company}`, sections: investigationReport }} />
                </div>
            )}
        </>
    );
};