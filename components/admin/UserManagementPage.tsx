import React, { useState, useEffect, useCallback } from 'react';
import { User, Toast, ConfirmationDialogProps, EmployeeUser, Department, Title } from '../../types';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/dataService';
import { Loader, PlusCircle, X, Save, Trash2, Pencil } from '../Icons.tsx';
import DepartmentSelect from '../forms/DepartmentSelect.tsx';
import TitleSelect from '../forms/TitleSelect.tsx'; // New import for TitleSelect
// FIX: Add missing imports for EmptyState and Users
import EmptyState from '../ui/EmptyState.tsx';
import { Users } from '../Icons.tsx';

interface UserModalProps {
    user: EmployeeUser | null;
    onClose: () => void;
    onSave: (user: Partial<EmployeeUser>) => Promise<void>;
    departments: Department[]; // Passed from parent
    titles: Title[]; // Passed from parent
}

export const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave, departments, titles }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<'admin' | 'user'>(user?.role || 'user');
    const [canUseAnythingAnalysis, setCanUseAnythingAnalysis] = useState(user?.canUseAnythingAnalysis ?? true);
    const [employeeNumber, setEmployeeNumber] = useState(user?.employeeNumber || '');
    const [departmentId, setDepartmentId] = useState<string>(user?.departmentId || '');
    const [positionId, setPositionId] = useState<string>(user?.positionId || '');
    const [startDate, setStartDate] = useState(user?.startDate || '');
    const [endDate, setEndDate] = useState(user?.endDate || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) return;
        setIsSaving(true);
        await onSave({ 
            ...user, 
            name, 
            email, 
            role, 
            canUseAnythingAnalysis,
            employeeNumber: employeeNumber || null,
            departmentId: departmentId || null,
            positionId: positionId || null,
            startDate: startDate || null,
            endDate: endDate || null,
        });
        setIsSaving(false);
    };

    const inputClass = "w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5";
    const labelClass = "block text-sm font-medium mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">{user ? 'ユーザー編集' : '新規ユーザー作成'}</h2>
                    <button type="button" onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label htmlFor="name" className={labelClass}>氏名 *</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} autoComplete="name" />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClass}>メールアドレス *</label>
                        <input id="email" type="email" value={email || ''} onChange={e => setEmail(e.target.value)} required className={inputClass} autoComplete="email" />
                    </div>
                    <div>
                        <label htmlFor="employeeNumber" className={labelClass}>従業員番号</label>
                        <input id="employeeNumber" type="text" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} className={inputClass} autoComplete="off" />
                    </div>
                    <div>
                        <label htmlFor="departmentId" className={labelClass}>部門</label>
                        <DepartmentSelect id="departmentId" value={departmentId} onChange={setDepartmentId} disabled={isSaving} />
                    </div>
                    <div>
                        <label htmlFor="positionId" className={labelClass}>役職</label>
                        <TitleSelect id="positionId" value={positionId} onChange={setPositionId} disabled={isSaving} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className={labelClass}>入社日</label>
                            <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} autoComplete="on" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClass}>退職日</label>
                            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} autoComplete="on" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="role" className={labelClass}>役割 *</label>
                        <select id="role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')} className={inputClass}>
                            <option value="user">一般ユーザー</option>
                            <option value="admin">管理者</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">権限</label>
                        <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input id="canUseAnythingAnalysis" name="canUseAnythingAnalysis" type="checkbox" checked={canUseAnythingAnalysis} onChange={e => setCanUseAnythingAnalysis(e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="canUseAnythingAnalysis" className="text-sm">「なんでも分析」機能の利用を許可</label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button type="button" onClick={onClose} disabled={isSaving} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-lg">キャンセル</button>
                    <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-400">
                        {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export interface UserManagementPageProps {
    addToast: (message: string, type: Toast['type']) => void;
    requestConfirmation: (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => void;
    departments: Department[];
    titles: Title[];
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ addToast, requestConfirmation, departments, titles }) => {
    const [users, setUsers] = useState<EmployeeUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<EmployeeUser | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getUsers();
            setUsers(data.filter(user => !user.endDate)); // Filter out ended users by default
            setError('');
        } catch (err: any) {
            setError(err.message || 'ユーザーデータの読み込みに失敗しました。');
            addToast(err.message || 'ユーザーデータの読み込みに失敗しました。', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleOpenModal = (user: EmployeeUser | null = null) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleSaveUser = async (userData: Partial<EmployeeUser>) => {
        try {
            if (userData.id) {
                await updateUser(userData.id, userData);
                addToast('ユーザー情報が更新されました。', 'success');
            } else {
                // For new user, instruct to use Supabase Auth to invite
                addToast('新しいユーザーの追加は、Supabaseダッシュボードから招待を行ってください。', 'info');
            }
            await loadUsers();
            handleCloseModal();
        } catch (err: any) {
            addToast(`保存に失敗しました: ${err.message}`, 'error');
        }
    };

    const handleDeleteUser = (user: EmployeeUser) => {
        requestConfirmation({
            title: 'ユーザーを退職済みにする',
            message: `本当にユーザー「${user.name}」を退職済みにしますか？この操作は論理削除（end_date設定）として扱われ、元に戻すことも可能です。`,
            onConfirm: async () => {
                try {
                    await deleteUser(user.id);
                    addToast('ユーザーが退職済みになりました。', 'success');
                    await loadUsers();
                } catch (err: any) {
                    addToast(`処理に失敗しました: ${err.message}`, 'error');
                }
            }
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">ユーザー管理</h2>
                    <p className="mt-1 text-base text-slate-500">従業員のプロファイルと権限を管理します。</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                    <PlusCircle className="w-5 h-5" />
                    ユーザーを追加
                </button>
            </div>
            {isLoading ? (
                <div className="p-16 text-center"><Loader className="w-8 h-8 mx-auto animate-spin" /></div>
            ) : error ? (
                <div className="p-16 text-center text-red-600">{error}</div>
            ) : users.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="ユーザーが登録されていません"
                    message="最初のユーザーを登録して、システム利用を開始しましょう。"
                    action={{label: "ユーザーを追加", onClick: () => handleOpenModal(), icon: PlusCircle}}
                />
            ) : (
                <table className="w-full text-base text-left">
                    <thead className="text-sm uppercase bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3">氏名</th>
                            <th className="px-6 py-3">メールアドレス</th>
                            <th className="px-6 py-3">役割</th>
                            <th className="px-6 py-3">部門</th>
                            <th className="px-6 py-3">役職</th>
                            <th className="px-6 py-3 text-center">AI分析利用</th>
                            <th className="px-6 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium">{user.name}</td>
                                <td className="px-6 py-4 text-sm">{user.email}</td>
                                <td className="px-6 py-4 capitalize">{user.role}</td>
                                <td className="px-6 py-4">{user.departmentName || '-'}</td>
                                <td className="px-6 py-4">{user.positionName || '-'}</td>
                                <td className="px-6 py-4 text-center">{user.canUseAnythingAnalysis ? '許可' : '不可'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-500 hover:text-blue-600"><Pencil className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUser(user)} className="p-2 text-slate-500 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {isModalOpen && <UserModal user={selectedUser} onClose={handleCloseModal} onSave={handleSaveUser} departments={departments} titles={titles} />}
        </div>
    );
};