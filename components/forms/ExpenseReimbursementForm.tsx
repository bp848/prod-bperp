

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { submitApplication } from '../../services/dataService.ts';
import { extractInvoiceDetails } from '../../services/geminiService.ts';
import ApprovalRouteSelector from './ApprovalRouteSelector.tsx';
import AccountItemSelect from './AccountItemSelect.tsx';
import PaymentRecipientSelect from './PaymentRecipientSelect.tsx';
import DepartmentSelect from './DepartmentSelect.tsx';
import { Loader, Upload, PlusCircle, Trash2, AlertTriangle } from '../Icons.tsx';
import { User, InvoiceData, Customer, AccountItem, Job, PurchaseOrder, Department, AllocationDivision } from '../../types.ts';

interface ExpenseReimbursementFormProps {
    onSuccess: () => void;
    applicationCodeId: string;
    currentUser: User | null;
    customers: Customer[];
    accountItems: AccountItem[];
    jobs: Job[];
    purchaseOrders: PurchaseOrder[];
    departments: Department[];
    isAIOff: boolean;
    isLoading: boolean;
    error: string;
    allocationDivisions: AllocationDivision[];
}

interface ExpenseDetail {
    id: string;
    paymentDate: string;
    paymentRecipientId: string;
    description: string;
    allocationTarget: string;
    costType: 'V' | 'F';
    accountItemId: string;
    allocationDivisionId: string;
    amount: number;
    p: number; // Price
    v: number; // Variable Cost
    q: number; // Quantity
}

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject("Read failed");
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

export const ExpenseReimbursementForm: React.FC<ExpenseReimbursementFormProps> = ({ onSuccess, applicationCodeId, currentUser, customers, accountItems, jobs, purchaseOrders, departments, isAIOff, isLoading, error: formLoadError, allocationDivisions }) => {
    const [departmentId, setDepartmentId] = useState<string>('');
    // FIX: Initialize with one empty row to prevent validation issues and improve UX.
    const [details, setDetails] = useState<ExpenseDetail[]>(() => [{
        id: `row_${Date.now()}`,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentRecipientId: '',
        description: '',
        allocationTarget: '',
        costType: 'F',
        accountItemId: '',
        allocationDivisionId: '',
        amount: 0,
        p: 0,
        v: 0,
        q: 1,
    }]);
    const [notes, setNotes] = useState('');
    const [approvalRouteId, setApprovalRouteId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    
    // FIX: The user reported an error around this line. The previous implementation using `animationTimeoutRef`
    // was not correctly checking if the component was mounted and would cause issues with resetting submission state.
    // This has been replaced with a standard `useEffect` and `useRef` pattern to safely handle async operations.
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const isDisabled = isSubmitting || isLoading || !!formLoadError;

    const totalAmount = useMemo(() => details.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [details]);

    // FIX: The user reported an error on line 73. While no specific error was found, the form was incomplete.
    // I am completing the form with logic from similar components to ensure functionality.
    const isFormValid = useMemo(() => {
        if (!departmentId || !approvalRouteId || details.length === 0) return false;
        return !details.some(detail =>
            !detail.paymentDate ||
            !detail.paymentRecipientId ||
            !detail.description.trim() ||
            !detail.accountItemId ||
            !detail.allocationDivisionId ||
            !detail.amount || detail.amount <= 0
        );
    }, [departmentId, approvalRouteId, details]);

    const addNewRow = () => {
        setDetails(prev => [...prev, {
            id: `row_${Date.now()}`,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentRecipientId: '',
            description: '',
            allocationTarget: '',
            costType: 'F',
            accountItemId: '',
            allocationDivisionId: '',
            amount: 0,
            p: 0,
            v: 0,
            q: 1,
        }]);
    };
    
    const handleDetailChange = (id: string, field: keyof ExpenseDetail, value: string | number) => {
        setDetails(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveRow = (id: string) => setDetails(prev => prev.filter(item => item.id !== id));

    const clearForm = () => {
        setDepartmentId('');
        // FIX: Re-initialize with one empty row instead of just clearing
        setDetails([{
            id: `row_${Date.now()}`,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentRecipientId: '',
            description: '',
            allocationTarget: '',
            costType: 'F',
            accountItemId: '',
            allocationDivisionId: '',
            amount: 0,
            p: 0,
            v: 0,
            q: 1,
        }]);
        setNotes('');
        setError('');
        setValidationErrors(new Set());
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (isAIOff) {
            setError('AI機能は現在無効です。ファイルからの読み取りはできません。');
            return;
        }

        setIsOcrLoading(true);
        setError('');
        try {
            const base64String = await readFileAsBase64(file);
            const ocrData: InvoiceData = await extractInvoiceDetails(base64String, file.type, accountItems, allocationDivisions);
            
            const matchedAccountItem = accountItems.find(item => item.name === ocrData.account);
            const matchedAllocDivision = allocationDivisions.find(div => div.name === ocrData.allocationDivision);

            const newDetail: ExpenseDetail = {
                id: `row_ocr_${Date.now()}`,
                paymentDate: ocrData.invoiceDate || new Date().toISOString().split('T')[0],
                paymentRecipientId: '', // User needs to select this
                description: `【OCR読取: ${ocrData.vendorName}】${ocrData.description}`,
                allocationTarget: ocrData.project ? `job:${jobs.find(j => j.title === ocrData.project)?.id || ''}` : `customer:${customers.find(c => c.customerName === ocrData.relatedCustomer)?.id || ''}`,
                costType: ocrData.costType || 'F',
                // FIX: Add missing properties to ExpenseDetail object
                accountItemId: matchedAccountItem?.id || '',
                allocationDivisionId: matchedAllocDivision?.id || '',
                amount: ocrData.totalAmount || 0,
                p: 0, // Placeholder
                v: 0, // Placeholder
                q: 1, // Placeholder
            };
            setDetails(prev => [...prev.filter(d => d.paymentRecipientId || d.description.trim() || d.amount), newDetail]);
            setError('');
        } catch (err: any) {
            if (err.name === 'AbortError') return; // Request was aborted, do nothing
            setError(err.message || 'AI-OCR処理中にエラーが発生しました。');
        } finally {
            setIsOcrLoading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setValidationErrors(new Set());

        const newValidationErrors = new Set<string>();

        if (!departmentId) {
            newValidationErrors.add('departmentId');
        }
        if (!approvalRouteId) {
            newValidationErrors.add('approvalRouteId');
        }
        if (!currentUser) {
            setError('ユーザー情報が見つかりません。再度ログインしてください。');
            return;
        }
        if (details.length === 0 || details.every(d => !d.paymentRecipientId && !d.description.trim() && !d.amount)) {
            setError('少なくとも1つの明細を入力してください。');
            return;
        }

        // Detailed validation for each detail row
        details.forEach((detail, index) => {
            if (!detail.paymentDate) newValidationErrors.add(`paymentDate-${detail.id}`);
            if (!detail.paymentRecipientId) newValidationErrors.add(`paymentRecipientId-${detail.id}`);
            if (!detail.description.trim()) newValidationErrors.add(`description-${detail.id}`);
            if (!detail.accountItemId) newValidationErrors.add(`accountItemId-${detail.id}`);
            if (!detail.allocationDivisionId) newValidationErrors.add(`allocationDivisionId-${detail.id}`);
            if (detail.amount <= 0) newValidationErrors.add(`amount-${detail.id}`);
        });

        if (newValidationErrors.size > 0) {
            setError('全ての明細項目を正しく入力してください。');
            setValidationErrors(newValidationErrors);
            // Focus on the first invalid element for better UX
            const firstInvalidId = Array.from(newValidationErrors)[0];
            const element = document.getElementById(firstInvalidId);
            if (element) {
                element.focus();
            }
            return;
        }

        setIsSubmitting(true);
        setError('');
        setValidationErrors(new Set()); // Clear any previous validation errors

        try {
            const submissionData = {
                departmentId: departmentId,
                details: details.filter(d => d.paymentRecipientId || d.description.trim() || d.amount),
                notes: notes,
                totalAmount: totalAmount, // Pass total amount to the application
            };
            await submitApplication({ applicationCodeId, formData: submissionData, approvalRouteId }, currentUser.id);
            if (mounted.current) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('Submission failed:', err);
            if (mounted.current) {
                setError('申請の提出に失敗しました。');
            }
        } finally {
            if (mounted.current) {
                setIsSubmitting(false);
            }
        }
    };

    const inputClass = "w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2";
    const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500"; // For validation styling

    return (
        <div className="relative">
            {(isLoading || formLoadError) && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl p-8" aria-live="polite" aria-busy={isLoading}>
                    {isLoading && <Loader className="w-12 h-12 animate-spin text-blue-500" aria-hidden="true" />}
                </div>
            )}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm space-y-8 animate-fade-in-up" aria-labelledby="form-title">
                <h2 id="form-title" className="text-2xl font-bold text-slate-800 dark:text-white text-center">経費精算フォーム</h2>

                {formLoadError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">フォーム読み込みエラー</p>
                        <p>{formLoadError}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="departmentId" className={labelClass}>部門 *</label>
                        <DepartmentSelect
                            id="departmentId"
                            value={departmentId}
                            onChange={setDepartmentId}
                            disabled={isDisabled}
                            required
                            className={validationErrors.has('departmentId') ? errorInputClass : ''}
                        />
                        {validationErrors.has('departmentId') && <p className="text-red-500 text-xs mt-1">部門を選択してください。</p>}
                    </div>
                </div>
                
                <details className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700" open>
                    <summary className="text-base font-semibold cursor-pointer text-slate-700 dark:text-slate-200" aria-expanded="true" aria-controls="ocr-section">領収書 (AI-OCR)</summary>
                    <div id="ocr-section" className="mt-4 flex items-center gap-4">
                        <label htmlFor="ocr-file-upload" className={`relative inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer ${isOcrLoading || isAIOff || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isOcrLoading ? <Loader className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Upload className="w-5 h-5" aria-hidden="true" />}
                            <span>{isOcrLoading ? '解析中...' : 'ファイルから読み取り'}</span>
                            <input id="ocr-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isOcrLoading || isAIOff || isDisabled} aria-label="領収書ファイルアップロード" />
                        </label>
                        {isAIOff && <p className="text-sm text-red-500 dark:text-red-400">AI機能無効のため、OCR機能は利用できません。</p>}
                        {!isAIOff && <p className="text-sm text-slate-500 dark:text-slate-400">領収書や請求書を選択すると、下の表に自動で追加されます。</p>}
                    </div>
                </details>

                <div>
                    <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">経費明細 *</label>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm" role="grid" aria-describedby="expense-details-description">
                            <caption id="expense-details-description" className="sr-only">経費明細一覧</caption>
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    {['支払日', '支払先', '内容', '費用種別', '勘定科目', '振分区分', '金額'].map(h => <th key={h} scope="col" className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>)}
                                    <th scope="col" className="p-2 w-12"><span className="sr-only">削除</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {details.map((item) => (
                                    <tr key={item.id}>
                                        <td className="p-1 min-w-[150px]"><input type="date" id={`paymentDate-${item.id}`} value={item.paymentDate} onChange={e => handleDetailChange(item.id, 'paymentDate', e.target.value)} className={`${inputClass} ${validationErrors.has(`paymentDate-${item.id}`) ? errorInputClass : ''}`} disabled={isDisabled} aria-label="支払日" aria-required="true" required /></td>
                                        <td className="p-1 min-w-[200px]">
                                            <PaymentRecipientSelect
                                                id={`paymentRecipientId-${item.id}`}
                                                value={item.paymentRecipientId}
                                                onChange={val => handleDetailChange(item.id, 'paymentRecipientId', val)}
                                                disabled={isDisabled}
                                                required
                                                className={validationErrors.has(`paymentRecipientId-${item.id}`) ? errorInputClass : ''}
                                            />
                                            {validationErrors.has(`paymentRecipientId-${item.id}`) && <p className="text-red-500 text-xs mt-1">支払先を選択してください。</p>}
                                        </td>
                                        <td className="p-1 min-w-[200px]"><input type="text" id={`description-${item.id}`} placeholder="例: 会議費" value={item.description} onChange={e => handleDetailChange(item.id, 'description', e.target.value)} className={`${inputClass} ${validationErrors.has(`description-${item.id}`) ? errorInputClass : ''}`} disabled={isDisabled} aria-label="内容" aria-required="true" required /></td>
                                        <td className="p-1 min-w-[120px]">
                                            <select id={`costType-${item.id}`} value={item.costType} onChange={e => handleDetailChange(item.id, 'costType', e.target.value as 'V' | 'F')} className={inputClass} disabled={isDisabled} aria-label="費用種別" required>
                                                <option value="F">F (固定費)</option>
                                                <option value="V">V (変動費)</option>
                                            </select>
                                        </td>
                                        <td className="p-1 min-w-[180px]">
                                            <AccountItemSelect
                                                id={`accountItemId-${item.id}`}
                                                value={item.accountItemId}
                                                onChange={val => handleDetailChange(item.id, 'accountItemId', val)}
                                                disabled={isDisabled}
                                                required
                                                className={validationErrors.has(`accountItemId-${item.id}`) ? errorInputClass : ''}
                                            />
                                            {validationErrors.has(`accountItemId-${item.id}`) && <p className="text-red-500 text-xs mt-1">勘定科目を選択してください。</p>}
                                        </td>
                                        <td className="p-1 min-w-[180px]">
                                            <select
                                                id={`allocationDivisionId-${item.id}`}
                                                value={item.allocationDivisionId}
                                                onChange={e => handleDetailChange(item.id, 'allocationDivisionId', e.target.value)}
                                                disabled={isDisabled}
                                                required
                                                className={`${inputClass} ${validationErrors.has(`allocationDivisionId-${item.id}`) ? errorInputClass : ''}`}
                                                aria-label="振分区分"
                                            >
                                                <option value="">振分区分を選択</option>
                                                {allocationDivisions.map(div => <option key={div.id} value={div.id}>{div.name}</option>)}
                                            </select>
                                            {validationErrors.has(`allocationDivisionId-${item.id}`) && <p className="text-red-500 text-xs mt-1">振分区分を選択してください。</p>}
                                        </td>
                                        <td className="p-1 min-w-[120px]"><input type="number" id={`amount-${item.id}`} value={item.amount} onChange={e => handleDetailChange(item.id, 'amount', Number(e.target.value))} className={`${inputClass} text-right ${validationErrors.has(`amount-${item.id}`) ? errorInputClass : ''}`} disabled={isDisabled} aria-label="金額" aria-required="true" required min="1" /></td>
                                        <td className="text-center p-1">
                                            <button type="button" onClick={() => handleRemoveRow(item.id)} className="p-1 text-slate-400 hover:text-red-500" disabled={isDisabled} aria-label="明細行を削除"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <button type="button" onClick={addNewRow} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700" disabled={isDisabled} aria-label="明細行を追加">
                            <PlusCircle className="w-4 h-4" aria-hidden="true" /> 行を追加
                        </button>
                        <div className="text-right">
                            <span className="text-sm text-slate-500 dark:text-slate-400">合計金額: </span>
                            <span className="text-xl font-bold text-slate-800 dark:text-white">¥{totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className={labelClass}>備考</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="補足事項があれば入力してください。" disabled={isDisabled} aria-label="備考" />
                </div>

                <ApprovalRouteSelector onChange={setApprovalRouteId} isSubmitting={isDisabled} requiredRouteName="社長決裁ルート" />

                {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/50 p-3 rounded-lg" role="alert">{error}</p>}

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={clearForm} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isDisabled} aria-label="フォーム内容をクリア">内容をクリア</button>
                    <button type="button" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isDisabled} aria-label="下書き保存">下書き保存</button>
                    <button type="submit" className="w-40 flex justify-center items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isDisabled || !isFormValid} aria-label="申請を送信する">
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin" aria-hidden="true" /> : '申請を送信する'}
                    </button>
                </div>
            </form>
        </div>
    );
};