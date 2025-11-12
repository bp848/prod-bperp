

export type Page =
  | 'analysis_dashboard' | 'sales_leads' | 'sales_customers' | 'sales_pipeline' | 'sales_delivery'
  | 'sales_estimates' |
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
  | 'estimate_creation' |
  | 'project_list' | 'project_creation' | // New project management pages
  | 'admin_audit_log' | 'admin_journal_queue' | 'admin_user_management' | 'admin_route_management'
  | 'admin_master_management' | 'admin_bug_reports' | 'settings';

export type UUID = string;

export enum JobStatus {
  Pending = '保留',
  InProgress = '進行中',
  Completed = '完了',
  Cancelled = 'キャンセル',
}

export enum InvoiceStatus {
  Uninvoiced = '未請求',
  Invoiced = '請求済',
  Paid = '入金済',
  Issued = '発行済み', // Added 'Issued' status based on DB schema usage in dataService
  Void = '無効', // Added 'Void' status based on DB schema usage
}

export enum LeadStatus {
    Untouched = '未対応',
    New = '新規',
    Contacted = 'コンタクト済',
    Qualified = '有望',
    Disqualified = '失注',
    Converted = '商談化',
    Closed = 'クローズ',
}

export enum PurchaseOrderStatus {
    Ordered = '発注済',
    Received = '受領済',
    Cancelled = 'キャンセル',
}

export enum ManufacturingStatus {
  OrderReceived = '受注',
  DataCheck = 'データチェック',
  Prepress = '製版',
  Printing = '印刷',
  Finishing = '加工',
  AwaitingShipment = '出荷待ち',
  Delivered = '納品済',
}

export enum EstimateStatus {
  Draft = '見積中',
  Ordered = '受注',
  Lost = '失注',
}

export enum ProjectStatus {
  Draft = '下書き',
  New = '新規',
  InProgress = '進行中',
  Completed = '完了',
  Cancelled = 'キャンセル',
  Archived = 'アーカイブ済',
}

export enum BugReportStatus {
    Open = '未対応',
    InProgress = '対応中',
    Closed = '完了',
}

export enum InboxItemStatus { // Use this enum for UI, but DB stores as TEXT
  Processing = 'processing',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Error = 'error',
}

// NOTE: User interface primarily for public.users table (auth-linked role/permissions)
export interface User {
  id: UUID; // PK REFERENCES auth.users(id)
  name?: string | null; // From public.users
  email?: string | null; // From public.users
  role: 'admin' | 'user'; // From public.users
  createdAt: string; // From public.users
  canUseAnythingAnalysis?: boolean | null; // From public.users
}

// EmployeeUser is the primary interface for user profile data, sourced from public.users table with joins
export interface EmployeeUser {
  id: UUID; // user_id from users table / auth.users table
  employeeNumber?: string | null; // From users table
  name: string; // From users table
  departmentId?: UUID | null; // From users table
  departmentName?: string | null; // From departments table (via join)
  positionId?: UUID | null; // From users table
  positionName?: string | null; // From employee_titles table (via join)
  email?: string | null; // From auth.users table / users table
  role: 'admin' | 'user'; // From users table
  canUseAnythingAnalysis?: boolean | null; // From users table
  startDate?: string | null; // From users table
  endDate?: string | null; // From users table
  salary?: number | null; // From users table
  createdAt: string; // From users table
}

export interface Job {
  id: UUID;
  jobNumber?: string | null; // TEXT
  clientName: string; // Derived from customer_id join to customers.customer_name for UI
  title: string;
  status: JobStatus;
  dueDate: string;
  quantity: number;
  paperType: string;
  finishing: string;
  details?: string | null;
  createdAt: string;
  price: number;
  variableCost: number;
  invoiceStatus: InvoiceStatus;
  invoicedAt?: string | null;
  paidAt?: string | null;
  readyToInvoice?: boolean | null;
  invoiceId?: UUID | null;
  manufacturingStatus?: ManufacturingStatus | null;
  projectId?: UUID | null; // Link to project
  projectName?: string | null; // Derived from project for convenience
  userId?: UUID | null; // For reporting/assignment
  customerId?: UUID | null; // Link to customer
}

// Export the Lead interface
export interface Lead { 
  id: UUID;
  name: string;
  email?: string | null;
  phone?: string | null;
  company: string;
  source?: string | null;
  tags?: string[] | null;
  message?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  status: LeadStatus;
  inquiryTypes?: string[] | null;
  infoSalesActivity?: string | null;
  ipAddress?: string | null;
  deviceType?: string | null;
  assigneeId?: UUID | null;
  isFirstVisit?: string | null; // Changed to string per DB
  landingPageUrl?: string | null;
  previousVisitDate?: string | null;
  referrer?: string | null;
  referrerUrl?: string | null;
  searchKeywords?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
  utmTerm?: string | null;
  visitCount?: string | null; // Changed to string per DB
  browserName?: string | null;
  browserVersion?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  screenResolution?: string | null;
  viewportSize?: string | null;
  language?: string | null;
  timezone?: string | null;
  sessionId?: string | null;
  pageLoadTime?: number | null;
  timeOnPage?: number | null;
  ctaSource?: string | null;
  scrollDepth?: string | null;
  sectionsViewed?: string | null;
  printTypes?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  employees?: string | null;
  budget?: string | null;
  timeline?: string | null;
  inquiryType?: string | null;
  score?: number | null;
  aiAnalysisReport?: string | null;
  aiDraftProposal?: string | null;
  aiInvestigation?: any | null; // JSONB
}

export interface JournalEntry {
  id: UUID;
  date: string; // TIMESTAMPTZ
  account: string; // VARCHAR
  debit: number; // NUMERIC
  credit: number; // NUMERIC
  description: string; // TEXT
  status?: 'posted' | 'pending' | 'rejected' | null; // TEXT
}

export interface Customer {
  id: UUID; // PK
  customerCode?: string | null; // TEXT
  customerName: string; // TEXT NOT NULL
  customerNameKana?: string | null; // TEXT
  representative?: string | null; // TEXT
  phoneNumber?: string | null; // TEXT
  address1?: string | null; // TEXT
  companyContent?: string | null; // TEXT
  annualSales?: string | null; // TEXT
  employeesCount?: string | null; // TEXT
  note?: string | null; // TEXT
  infoSalesActivity?: string | null; // TEXT
  infoRequirements?: string | null; // TEXT
  infoHistory?: string | null; // TEXT
  createdAt: string; // TIMESTAMPTZ
  postNo?: string | null; // TEXT
  address2?: string | null; // TEXT
  fax?: string | null; // TEXT
  closingDay?: string | null; // TEXT
  monthlyPlan?: string | null; // TEXT
  payDay?: string | null; // TEXT
  recoveryMethod?: string | null; // TEXT
  userId?: UUID | null; // REFERENCES auth.users (id)
  name2?: string | null; // TEXT
  websiteUrl?: string | null; // TEXT
  zipCode?: string | null; // TEXT (post_no in old schema)
  foundationDate?: string | null; // DATE
  capital?: string | null; // TEXT
  customerRank?: string | null; // TEXT
  customerDivision?: string | null; // TEXT
  salesType?: string | null; // TEXT
  creditLimit?: string | null; // TEXT
  payMoney?: string | null; // TEXT
  bankName?: string | null; // TEXT
  branchName?: string | null; // TEXT
  accountNo?: string | null; // TEXT
  salesUserCode?: string | null; // TEXT
  startDate?: string | null; // DATE
  endDate?: string | null; // DATE
  drawingDate?: string | null; // DATE
  salesGoal?: string | null; // TEXT
  infoSalesIdeas?: string | null; // TEXT
  customerContactInfo?: string | null; // TEXT
  aiAnalysis?: CompanyAnalysis | null; // JSONB
}

export interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface AISuggestions {
    title: string;
    quantity: number;
    paperType: string;
    finishing: string;
    details: string;
    price: number;
    variableCost: number;
}

export interface CompanyAnalysis {
    swot: string;
    painPointsAndNeeds: string;
    suggestedActions: string;
    proposalEmail: {
        subject: string;
        body: string;
    };
    sources?: { uri: string; title: string; }[];
}

export interface CompanyInvestigation {
    summary: string;
    sources: {
        uri: string;
        title: string;
    }[];
}

export interface InvoiceData {
    vendorName: string;
    invoiceDate: string;
    totalAmount: number;
    description: string;
    costType: 'V' | 'F';
    account: string; // AccountItem.name for display
    allocationDivision?: string | null; // AllocationDivision.name for display
    relatedCustomer?: string | null; // Customer.customerName
    project?: string | null; // Project.projectName
}

export interface AIJournalSuggestion {
    account: string;
    description: string;
    debit: number;
    credit: number;
}

export interface MQCode {
  P?: boolean; // Price / 売上高
  V?: boolean; // Variable Cost / 変動費
  M?: boolean; // Margin / 限界利益
  Q?: boolean; // Quantity / 数量
  F?: boolean; // Fixed Cost / 固定費
  G?: boolean; // Profit / 利益
}

// MasterAccountItem interface for public.account_items table
export interface AccountItem {
    id: UUID; // PK
    code: string; // VARCHAR UNIQUE NOT NULL
    name: string; // TEXT NOT NULL
    categoryCode?: string | null; // VARCHAR
    isActive: boolean; // BOOLEAN DEFAULT true
    sortOrder: number; // INTEGER DEFAULT 0
    createdAt: string; // TIMESTAMPTZ
    updatedAt?: string | null; // TIMESTAMPTZ
    mqCode?: any | null; // JSONB
    mqCodeP?: string | null; // TEXT
    mqCodeV?: string | null; // TEXT
    mqCodeM?: string | null; // TEXT
    mqCodeQ?: string | null; // TEXT
    mqCodeF?: string | null; // TEXT
    mqCodeG?: string | null; // TEXT
}

export type MasterAccountItem = AccountItem; // Alias for clarity


// ApplicationCode interface for public.application_codes table
export interface ApplicationCode {
    id: UUID; // PK
    code: string; // VARCHAR UNIQUE NOT NULL
    name: string; // TEXT NOT NULL
    description?: string | null; // TEXT
    createdAt: string; // TIMESTAMPTZ
}

// ApprovalRoute interface for public.approval_routes table
export interface ApprovalRoute {
    id: UUID; // PK
    name: string; // TEXT UNIQUE NOT NULL
    routeData: { // JSONB NOT NULL
        steps: {
            approverId: UUID; // REFERENCES public.users(id)
        }[];
    };
    createdAt: string; // TIMESTAMPTZ
}

// Application interface for public.applications table
export type ApplicationStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'; // TEXT
export interface Application {
    id: UUID; // PK
    applicantId: UUID; // REFERENCES public.users(id)
    applicationCodeId: UUID; // REFERENCES public.application_codes(id)
    approvalRouteId?: UUID | null; // REFERENCES public.approval_routes(id)
    approverId?: UUID | null; // REFERENCES public.users(id)
    formData: any; // JSONB
    status: ApplicationStatus;
    currentLevel?: number | null; // INTEGER
    rejectionReason?: string | null; // TEXT
    submittedAt?: string | null; // TIMESTAMPTZ
    approvedAt?: string | null; // TIMESTAMPTZ
    rejectedAt?: string | null; // TIMESTAMPTZ
    createdAt: string; // TIMESTAMPTZ
    updatedAt?: string | null; // TIMESTAMPTZ
}

export interface ApplicationWithDetails extends Application {
    applicant?: EmployeeUser | null;
    applicationCode?: ApplicationCode | null;
    approvalRoute?: ApprovalRoute | null;
}

// NEW: Estimate creation specific types
export type PostalMethod = 'inhouse_print' | 'outsourced_label';
export type PostalStatus = 'preparing' | 'shipped' | 'delivered';
export type MailOpenStatus = 'opened' | 'unopened' | 'forwarded';

export interface TrackingInfo {
  trackId: UUID;
  mailStatus: MailOpenStatus;     // 🟢 opened / 🟡 unopened / 🔵 forwarded
  lastEventAt?: string | null;           // ISO8601
  firstOpenedAt?: string | null;         // ISO8601
  totalOpens: number;
  totalClicks: number;
}

export interface PostalInfo {
  method: PostalMethod;
  status: PostalStatus;
  toName: string;
  toCompany?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  address1?: string | null;
  address2?: string | null;
  phone?: string | null;
  labelPreviewSvg?: string | null;       // 宛名ラベルSVG（プレビュー用）
}

export interface EstimateLineItem {
  sku?: string | null;
  name: string;
  description?: string | null;
  qty: number;
  unit?: string | null;
  unitPrice: number;
  taxRate?: number | null; // 0.1 = 10%
  subtotal?: number | null;
  taxAmount?: number | null;
  total?: number | null;
}

export interface ExtractedParty {
  company?: string | null;
  department?: string | null;
  title?: string | null;
  person?: string | null;
  email?: string | null;
  tel?: string | null;
  address?: string | null;
  domain?: string | null;
  confidence?: number | null; // 0-1
}

export interface EstimateDraft {
  draftId: UUID;
  sourceSummary?: string | null; // 解析要約
  customerCandidates: ExtractedParty[];
  subjectCandidates: string[];
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  deliveryMethod?: string | null;
  currency: 'JPY';
  taxInclusive?: boolean | null;
  dueDate?: string | null; // ISO
  items: EstimateLineItem[];
  notes?: string | null;
}

// Estimate interface for public.estimates table
export interface Estimate {
    id: UUID; // PK
    estimateNo?: string | null; // TEXT (not used directly, estimateNumber is primary display)
    estimateNumber: number; // SERIAL NOT NULL
    customerName: string; // TEXT NOT NULL
    customerId?: UUID | null; // UUID REFERENCES public.customers(id)
    title: string; // TEXT NOT NULL
    issueDate?: string | null; // DATE (auto-filled, but can be explicitly set if needed in UI)
    validUntil?: string | null; // DATE
    totalAmount?: number | null; // NUMERIC (grand_total is primary, but total_amount exists for older integrations)
    totalCost?: number | null; // NUMERIC
    notes?: string | null; // TEXT
    status: EstimateStatus; // TEXT NOT NULL (maps to EstimateStatus enum) // Changed to use Enum
    createdAt: string; // TIMESTAMPTZ
    deliveryDate?: string | null; // DATE
    deliveryMethod?: string | null; // TEXT
    paymentTerms?: string | null; // TEXT
    deliveryTerms?: string | null; // TEXT
    jsonData?: any | null; // JSONB (for older structures, 'items' is preferred)
    leadId?: UUID | null; // UUID REFERENCES public.leads(id)
    updatedAt?: string | null; // TIMESTAMPTZ
    bodyMd?: string | null; // TEXT
    pdfPath?: string | null; // TEXT
    estimateDate?: string | null; // DATE (redundant with issueDate)
    grandTotal: number; // NUMERIC NOT NULL
    items: EstimateLineItem[]; // JSONB NOT NULL
    subtotal: number; // NUMERIC NOT NULL
    taxTotal: number; // NUMERIC NOT NULL
    userId?: UUID | null; // UUID REFERENCES public.users(id)
    user?: User | null; // Derived from userId for UI
    version: number; // INTEGER NOT NULL DEFAULT 1
    projectId?: UUID | null; // For linking to Project
    projectName?: string | null; // Derived from Project
    taxInclusive?: boolean | null; // BOOLEAN
    pdfUrl?: string | null; // URL to the generated PDF
    tracking?: TrackingInfo | null; // JSONB
    postal?: PostalInfo | null; // JSONB
}

export interface ProjectAttachment {
  id: UUID; // PK
  projectId: UUID; // REFERENCES public.projects(id)
  fileName: string; // TEXT NOT NULL
  filePath: string; // TEXT NOT NULL
  fileUrl: string; // Derived for UI
  mimeType: string; // TEXT NOT NULL
  category?: string | null; // TEXT
  createdAt: string; // TIMESTAMPTZ
}

// Project interface for public.projects table
export interface Project {
  id: UUID; // PK
  projectCode?: string | null; // TEXT UNIQUE
  customerCode?: string | null; // TEXT NOT NULL (may be redundant with customerId)
  customerName: string; // TEXT NOT NULL (from DB)
  customerId?: UUID | null; // UUID REFERENCES public.customers(id)
  salesUserCode?: string | null; // TEXT
  salesUserId?: UUID | null; // UUID REFERENCES public.users(id)
  estimateId?: UUID | null; // UUID REFERENCES public.estimates(id)
  estimateCode?: string | null; // TEXT
  orderId?: UUID | null; // UUID REFERENCES public.orders(id)
  orderCode?: string | null; // TEXT
  projectName: string; // TEXT NOT NULL
  projectStatus: ProjectStatus | string; // TEXT NOT NULL (maps to ProjectStatus enum)
  classificationId?: UUID | null; // UUID
  sectionCodeId?: UUID | null; // UUID
  productClassId?: UUID | null; // UUID
  createDate?: string | null; // TIMESTAMPTZ
  createUserId?: UUID | null; // UUID REFERENCES public.users(id)
  createUserCode?: string | null; // TEXT NOT NULL
  updateDate?: string | null; // TIMESTAMPTZ
  updateUserId?: UUID | null; // UUID REFERENCES public.users(id)
  updateUserCode?: string | null; // TEXT
  overview?: string | null; // TEXT (from AI)
  extracted_details?: string | null; // TEXT (from AI)
  userId?: UUID | null; // UUID REFERENCES public.users(id) (project owner)
  createdAt: string; // TIMESTAMPTZ
  updatedAt?: string | null; // TIMESTAMPTZ
  attachments?: ProjectAttachment[]; // Derived for UI
  relatedEstimates?: Estimate[]; // Derived relation, not direct DB column
  relatedJobs?: Job[]; // Derived relation, not direct DB column
}

export interface PurchaseOrder {
  id: UUID;
  supplierName: string;
  itemName: string;
  orderDate: string;
  quantity: number;
  unitPrice: number;
  status: PurchaseOrderStatus;
  created_at?: string;
}

export interface InventoryItem {
  id: UUID;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  created_at?: string;
}

export interface BugReport {
  id: UUID;
  reporterName: string;
  reportType: 'bug' | 'improvement';
  summary: string;
  description: string;
  status: BugReportStatus;
  createdAt: string;
}

export interface Department {
  id: UUID;
  name: string;
  createdAt: string;
}

export interface PaymentRecipient {
  id: UUID;
  recipientCode?: string | null;
  companyName: string;
  recipientName?: string | null;
  paymentAmount?: number | null; // NUMERIC
  transferFee?: number | null; // NUMERIC
  transferAmount?: number | null; // NUMERIC
  bankCode?: string | null; // TEXT
  bankName?: string | null; // TEXT
  branchCode?: string | null; // TEXT
  branchName?: string | null; // TEXT
  accountType?: string | null; // TEXT
  accountNumber?: string | null; // TEXT
  accountHolder?: string | null; // TEXT
  transferType?: string | null; // TEXT
  lineGroup?: string | null; // TEXT
  bankSubjectCode?: string | null; // TEXT
  bankSubsidiaryCode?: string | null; // TEXT
  paymentCategory?: string | null; // TEXT
  paymentMonth?: string | null; // TEXT
  paymentDate?: string | null; // DATE
  allocation?: string | null; // TEXT
  cashPayment?: number | null; // NUMERIC
  billPayment?: number | null; // NUMERIC
  endorsedBillPayment?: number | null; // NUMERIC
  beginningBalance?: number | null; // NUMERIC
  recordedAmount?: number | null; // NUMERIC
  paymentMade?: number | null; // NUMERIC
  endingBalance?: number | null; // NUMERIC
  currentMonthRecorded?: number | null; // NUMERIC
  currentMonthPaid?: number | null; // NUMERIC
  currentMonthBalance?: number | null; // NUMERIC
  liabilityCategory?: string | null; // TEXT
  postalCode?: string | null; // TEXT
  address1?: string | null; // TEXT
  address2?: string | null; // TEXT
  branchOrDepartment?: string | null; // TEXT
  contactPerson?: string | null; // TEXT
  phone_number?: string | null; // TEXT
  fax_number?: string | null; // TEXT
  remarks?: string | null; // TEXT
  createdAt: string; // TIMESTAMPTZ
  updatedAt?: string | null; // TIMESTAMPTZ
  isActive?: boolean | null; // BOOLEAN
  bankBranch?: string | null; // TEXT
  bankAccountNumber?: string | null; // TEXT
}

export interface AllocationDivision {
  id: UUID;
  name: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Title {
  id: UUID;
  name: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Invoice {
  id: UUID;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string | null;
  customerName: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus; // Changed to use Enum
  createdAt: string;
  paidAt?: string | null;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: UUID;
  invoiceId: UUID;
  jobId?: UUID | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  lineTotal: number;
  sortIndex: number;
  created_at?: string; // TIMESTAMPTZ
}

export interface InboxItem {
  id: UUID;
  fileName: string;
  filePath: string;
  fileUrl: string; // For client-side display, not directly in DB
  mimeType: string;
  status: string; // TEXT in DB, use InboxItemStatus enum for UI logic
  extractedData?: InvoiceData | null;
  errorMessage?: string | null;
  createdAt: string;
  docType?: string; // TEXT NOT NULL DEFAULT 'unknown'::text
}

export interface AnalysisHistory {
  id: UUID;
  userId?: UUID | null; // REFERENCES auth.users(id)
  viewpoint: string;
  dataSources?: {
    filenames?: string[];
    urls?: string[];
  } | null; // JSONB
  result: AnalysisResult; // JSONB
  createdAt: string; // TIMESTAMPTZ
}

export interface AnalysisResult {
  title: string;
  summary: string;
  table: {
    headers: string[];
    rows: string[][];
  };
  chart: {
    type: 'bar' | 'line';
    data: { name: string; value: number }[];
  };
}

export interface MarketResearchReport {
  title: string;
  summary: string;
  trends: string[];
  competitorAnalysis: string;
  opportunities: string[];
  threats: string[];
  sources?: { uri: string; title: string; }[];
}

export interface GeneratedEmailContent {
  subject: string;
  bodyText: string;
}

export interface CustomProposalContent {
    coverTitle?: string;
    businessUnderstanding?: string;
    challenges?: string;
    proposal?: string;
    conclusion?: string;
}

export interface LeadProposalPackage {
    isSalesLead: boolean;
    reason: string;
    proposal?: CustomProposalContent;
    estimate?: EstimateLineItem[];
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

// For ExpenseReimbursementForm details
export interface ExpenseDetail {
    id: string; // Client-side unique ID
    paymentDate: string;
    paymentRecipientId: string;
    description: string;
    allocationTarget: string; // e.g., "job:UUID", "customer:UUID"
    costType: 'V' | 'F';
    accountItemId: string;
    allocationDivisionId: string;
    amount: number;
    p?: number; // Price - for internal calculation, optional
    v?: number; // Variable Cost - for internal calculation, optional
    q?: number; // Quantity - for internal calculation, optional
}

export interface BusinessPlanItemData {
  type: '目標' | '実績' | '前年';
  monthly: (number | string)[];
  cumulative: (number | string)[];
}

export interface BusinessPlanItem {
  name: string;
  totalValue: number | string;
  data: BusinessPlanItemData[];
}

export interface BusinessPlan {
  name: string;
  headers: string[];
  items: BusinessPlanItem[];
}

export interface ClosingChecklistItem {
    id: string;
    description: string;
    count: number;
    status: 'ok' | 'needs_review';
    actionPage: Page;
}