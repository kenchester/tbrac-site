// Enums
export enum IndustrySector {
  TECHNOLOGY = "technology",
  TELECOMMUNICATIONS = "telecommunications",
  SEMICONDUCTORS = "semiconductors",
  DEFENSE = "defense",
  HEALTHCARE = "healthcare",
  FINANCIAL_SERVICES = "financial_services",
  ENERGY = "energy",
  MANUFACTURING = "manufacturing",
  CONSUMER_GOODS = "consumer_goods",
  RETAIL = "retail",
  AGRICULTURE = "agriculture",
  OTHER = "other",
}

export enum OwnershipType {
  PRIVATE = "private",
  STATE_OWNED = "state_owned",
  MIXED = "mixed",
  PUBLIC_LISTED = "public_listed",
  JOINT_VENTURE = "joint_venture",
}

export enum DocumentType {
  BUSINESS_LICENSE = "business_license",
  OWNERSHIP_CERTIFICATE = "ownership_certificate",
  FINANCIAL_STATEMENT = "financial_statement",
  ARTICLES_OF_ASSOCIATION = "articles_of_association",
  BOARD_RESOLUTION = "board_resolution",
  REGULATORY_APPROVAL = "regulatory_approval",
  LEGAL_FILING = "legal_filing",
  TAX_REGISTRATION = "tax_registration",
  BANK_REFERENCE = "bank_reference",
  OTHER = "other",
}

export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REQUIRES_REVIEW = "requires_review",
}

// Customer types
export interface CustomerBase {
  name: string;
  chinese_name?: string;
  industry_sector: IndustrySector;
  ownership_type: OwnershipType;
  state_ownership_percentage?: number;
  headquarters_country: string;
  headquarters_city?: string;
  us_presence?: string;
  us_subsidiary_name?: string;
  parent_company_id?: string;
  website?: string;
  notes?: string;
}

export interface CustomerCreate extends Partial<CustomerBase> {
  name: string;
}

export interface CustomerUpdate extends Partial<CustomerBase> {}

export interface Customer extends CustomerBase {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  chinese_name?: string;
  industry_sector: IndustrySector;
  ownership_type: OwnershipType;
  headquarters_country: string;
  headquarters_city?: string;
  created_at: string;
}

// Document types
export interface Document {
  id: string;
  customer_id: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  file_hash: string;
  document_type?: DocumentType;
  document_type_confidence?: number;
  document_type_override?: DocumentType;
  processing_status: ProcessingStatus;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  page_count?: number;
  ocr_applied: boolean;
  language?: string;
  extraction_confidence?: number;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface DocumentListItem {
  id: string;
  customer_id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  document_type?: DocumentType;
  processing_status: ProcessingStatus;
  uploaded_at: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  file_size_bytes: number;
  status: ProcessingStatus;
}

export interface DocumentDownloadResponse {
  download_url: string;
  expires_at: string;
  filename: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Assessment types
export type AssessmentStatus = "in_progress" | "completed" | "submitted";
export type ModuleStatus = "not_started" | "in_progress" | "completed";
export type RiskTier = "low" | "medium" | "high" | "very_high";

/** An answer that triggers a red-flag gate (backend services/red_flags.py). */
export interface RedFlag {
  question_id: string;
  module_key: string;
  severity: "hard" | "soft";
  label: string;
}

export interface AssessmentModuleSummary {
  id: string;
  assessment_id: string;
  module_number: number;
  module_key: string;
  status: ModuleStatus;
  score: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentModule extends AssessmentModuleSummary {
  responses: Record<string, number>;
  analyst_notes: string | null;
}

export interface Assessment {
  id: string;
  customer_id: string;
  status: AssessmentStatus;
  total_score: number | null;
  risk_tier: RiskTier | null;
  version: number;
  modules: AssessmentModuleSummary[];
  red_flags?: RedFlag[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentListItem {
  id: string;
  customer_id: string;
  status: AssessmentStatus;
  total_score: number | null;
  risk_tier: RiskTier | null;
  version: number;
  modules_completed: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentCreate {
  customer_id: string;
}

export interface SaveModuleAnswersRequest {
  responses: Record<string, number>;
  complete: boolean;
  analyst_notes?: string;
}
