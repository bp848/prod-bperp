
export type Page =
  | 'analysis_dashboard' | 'sales_leads' | 'sales_customers' | 'sales_pipeline' | 'sales_delivery'
  | 'sales_estimates' 
  | 'sales_orders' | 'sales_billing' | 'analysis_ranking'
  | 'purchasing_orders' | 'purchasing_invoices' | 'purchasing_payments' | 'purchasing_suppliers'
  | 'inventory_management' | 'manufacturing_orders' | 'manufacturing_progress' | 'manufacturing_cost'
  | 'hr_attendance' | 'hr_man_hours' | 'hr_labor_cost' | 'hr_org_chart'
  | 'approval_list' | 'approval_form_expense' | 'approval_form_transport' | 'approval_form_leave'
  | 'approval_form_approval' | 'approval_form_daily' | 'approval_form_weekly'
  | 'report_other' // New report page
  | 'accounting_journal' | 'accounting_general_ledger' | 'accounting_trial_balance'
  | 'accounting_tax_summary'
  | 'accounting_period_closing'
  | 'accounting_business_plan'
  | 'business_support_proposal'
  | 'ai_business_consultant'
  | 'ai_market_research'
  | 'ai_live_chat'
  | 'ai_anything_analysis' // New "Analyze Anything" page
  | 'estimate_creation' 
  | 'project_list' | 'project_creation' | // New project management pages
  | 'admin_audit_log' | 'admin_journal_queue' | 'admin_user_management' | 'admin_route_management'
  | 'admin_master_management' | 'admin_bug_reports' | 'settings';

export type UUID = string;
