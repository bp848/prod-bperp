
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, SortConfig, Toast, EmployeeUser } from '../types.ts';
import { Pencil, Eye, Mail, Lightbulb, Users, PlusCircle, Loader, Save, X, Search } from './Icons.tsx';
import EmptyState from './ui/EmptyState.tsx';
import SortableHeader from './ui/SortableHeader.tsx';
import { generateSalesEmail, enrichCustomerData } from '../services/geminiService.ts';
import { createSignature } from '../utils.ts';

interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  onSelectCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customerId: string, customerData: Partial<Customer>) => Promise<void>;
  onAnalyzeCustomer: (customer: Customer) => void;
  addToast: (message: string, type: Toast['type']) => void;
  currentUser: EmployeeUser | null;
  onNewCustomer: () => void;
  isAIOff: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, searchTerm, onSelectCustomer, onUpdateCustomer, onAnalyzeCustomer, addToast, currentUser, onNewCustomer, isAIOff }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'customerName', direction: 'ascending' });
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Customer>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
        mounted.current = false;
    };
  }, []);

  const handleEditClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditingRowId(customer.id);
    setEditedData(customer);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(null);
    setEditedData({});
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingRowId) return;
    setIsSaving(true);
    try {
        await onUpdateCustomer(editingRowId, editedData);
    } finally {
        if (mounted.current) {
            setIsSaving(false);
            setEditingRowId(null);
        }
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateProposal = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (isAIOff) {
        addToast('AI機能は現在無効です。', 'error');
        return;
    }
    if (!currentUser) {
      addToast('ログインユーザー情報が見つかりません。', 'error');
      return;
    }
    setIsGeneratingEmail(customer.id);
    try {
      const { subject, body } = await generateSalesEmail(customer, currentUser.name);
      const signature = createSignature();
      const finalBody = `${body}\n\n${signature}`;
      const mailto = `mailto:${customer.customerContactInfo || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
      window.open(mailto, '_blank');
      addToast('提案メールの下書きを作成しました。', 'success');
    } catch (err) {
      if (mounted.current) {
          addToast(err instanceof Error ? err.message : 'メール作成に失敗しました。', 'error');
      }
    } finally {
        if (mounted.current) {
            setIsGeneratingEmail(null);
        }
    }
  };

  const handleEnrichData = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (isAIOff) {
        addToast('AI機能は現在無効です。', 'error');
        return;
    }
    setEnrichingId(customer.id);
    try {
        const enrichedData = await enrichCustomerData(customer.customerName);
        await onUpdateCustomer(customer.id, enrichedData);
        addToast(`${customer.customerName} の情報をAIで更新しました。`, 'success');
    } catch (err) {
        if (mounted.current) {
            addToast(err instanceof Error ? err.message : '情報更新に失敗しました。', 'error');
        }
    } finally {
        if (mounted.current) {
            setEnrichingId(null);
        }
    }
  };


  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.customerName.toLowerCase().includes(lowercasedTerm) ||
      (c.representative && c.representative.toLowerCase().includes(lowercasedTerm)) ||
      (c.phoneNumber && c.phoneNumber.includes(lowercasedTerm))
    );
  }, [customers, searchTerm]);

  const sortedCustomers = useMemo(() => {
    let sortableItems = [...filteredCustomers];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Customer] as any;
        const bValue = b[sortConfig.key as keyof Customer] as any;
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCustomers, sortConfig]);

  const requestSort = (key: string) => {
    const direction = sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    setSortConfig({ key, direction });
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <SortableHeader sortKey="customerName" label="顧客名" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="representative" label="担当者" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="phoneNumber" label="電話番号" sortConfig={sortConfig} requestSort={requestSort} />
              <th scope="col" className="px-6 py-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.length > 0 ? sortedCustomers.map((customer) => (
              <tr key={customer.id} className="group bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer" onClick={() => onSelectCustomer(customer)}>
                <td className="px-6 py-4">
                  {editingRowId === customer.id ? (
                      <input type="text" name="customerName" value={editedData.customerName || ''} onChange={handleFieldChange} onClick={e => e.stopPropagation()} className="w-full bg-slate-100 dark:bg-slate-700 p-1 rounded" />
                  ) : customer.customerName }
                </td>
                <td className="px-6 py-4">
                  {editingRowId === customer.id ? (
                      <input type="text" name="representative" value={editedData.representative || ''} onChange={handleFieldChange} onClick={e => e.stopPropagation()} className="w-full bg-slate-100 dark:bg-slate-700 p-1 rounded" />
                  ) : customer.representative || '-'}
                </td>
                <td className="px-6 py-4">
                  {editingRowId === customer.id ? (
                      <input type="text" name="phoneNumber" value={editedData.phoneNumber || ''} onChange={handleFieldChange} onClick={e => e.stopPropagation()} className="w-full bg-slate-100 dark:bg-slate-700 p-1 rounded" />
                  ) : customer.phoneNumber || '-'}
                </td>
                <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2" onClick={e => e.stopPropagation()}>
                    {editingRowId === customer.id ? (
                        <>
                            <button onClick={handleSaveEdit} className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50" disabled={isSaving}>
                                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>}
                            </button>
                            <button onClick={handleCancelEdit} className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50">
                                <X className="w-5 h-5"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={(e) => handleEditClick(e, customer)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" title="簡易編集"><Pencil className="w-5 h-5"/></button>
                            <button onClick={(e) => { e.stopPropagation(); onAnalyzeCustomer(customer); }} disabled={isAIOff} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50" title="AI企業分析"><Lightbulb className="w-5 h-5"/></button>
                            <button onClick={(e) => handleGenerateProposal(e, customer)} disabled={isGeneratingEmail === customer.id || isAIOff} className="p-2 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50" title="AI提案メール作成">
                                {isGeneratingEmail === customer.id ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5"/>}
                            </button>
                            <button onClick={(e) => handleEnrichData(e, customer)} disabled={enrichingId === customer.id || isAIOff} className="p-2 rounded-full text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/50 disabled:opacity-50" title="AIで情報拡充">
                                {enrichingId === customer.id ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5"/>}
                            </button>
                        </>
                    )}
                    </div>
                </td>
              </tr>
            )) : (
              <tr>
                  <td colSpan={4}>
                      <EmptyState 
                          icon={Users}
                          title={searchTerm ? '検索結果がありません' : '顧客が登録されていません'}
                          message={searchTerm ? '検索条件を変更してください。' : '「新規顧客登録」ボタンから最初の顧客を登録してください。'}
                          action={!searchTerm ? { label: "新規顧客登録", onClick: onNewCustomer, icon: PlusCircle } : undefined}
                      />
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;