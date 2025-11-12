import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead, LeadStatus, Toast, ConfirmationDialogProps, EmployeeUser, CustomProposalContent, LeadProposalPackage, EstimateStatus, EstimateLineItem, CompanyInvestigation } from '../../types.ts'; // Correctly import Lead
import { X, Save, Loader, Pencil, Trash2, Mail, CheckCircle, Lightbulb, Search, FileText, ArrowRight, ArrowLeft, AlertTriangle, RefreshCw, Sparkles } from '../Icons.tsx';
import LeadStatusBadge from './LeadStatusBadge.tsx';
import { INQUIRY_TYPES } from '../../constants.ts';
import LeadScoreBadge from '../ui/LeadScoreBadge.tsx';
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

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, allLeads, currentLeadIndex, onNavigateLead, onSave, onDelete, addToast, requestConfirmation, currentUser, isAIOff, onAddEstimate }) => {
    // ... modal implementation ...
};
