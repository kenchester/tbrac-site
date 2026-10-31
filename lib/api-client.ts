import { upload as blobUpload } from "@vercel/blob/client";
import { getAccessToken } from "./auth-client";
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerListItem,
  Document,
  DocumentListItem,
  DocumentUploadResponse,
  DocumentDownloadResponse,
  PaginatedResponse,
  Assessment,
  AssessmentListItem,
  AssessmentCreate,
  AssessmentModule,
  AssessmentModuleSummary,
  SaveModuleAnswersRequest,
} from "./api-types";

// Same origin by default: next.config.mjs rewrites /api/v1/* to the FastAPI project.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();

  if (!token) {
    throw new APIError("Not authenticated", 401);
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail || `HTTP ${response.status}`,
        response.status,
        error.error_code,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => {
      throw new APIError("Invalid response from server", response.status);
    });
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error", 0);
  }
}

async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Files go straight from the browser to private Vercel Blob storage (Vercel
// functions cap request bodies at 4.5MB), then get registered with the API.
async function uploadDocuments(
  customerId: string,
  files: File[],
  assessmentModuleId?: string,
): Promise<DocumentUploadResponse[]> {
  const results: DocumentUploadResponse[] = [];
  for (const file of files) {
    const fileHash = await sha256Hex(file);
    const pathname = `documents/${customerId}/${fileHash}`;

    try {
      await blobUpload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type,
      });
    } catch (error) {
      throw new APIError(
        error instanceof Error ? error.message : "Upload failed",
        0,
      );
    }

    results.push(
      await authenticatedRequest<DocumentUploadResponse>(
        `/api/v1/customers/${customerId}/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            pathname,
            filename: file.name,
            content_type: file.type,
            size: file.size,
            file_hash: fileHash,
            assessment_module_id: assessmentModuleId ?? null,
          }),
        },
      ),
    );
  }
  return results;
}

export const api = {
  // Health checks (no auth required)
  health: () => apiRequest<{ message: string }>("/health"),

  healthReady: () =>
    apiRequest<{
      database: string;
      overall: string;
    }>("/health/ready"),

  // Customers
  customers: {
    list: async (params?: {
      page?: number;
      page_size?: number;
      search?: string;
      industry_sector?: string;
      ownership_type?: string;
      sort_by?: string;
      sort_order?: "asc" | "desc";
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.page_size)
        searchParams.set("page_size", params.page_size.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.industry_sector)
        searchParams.set("industry_sector", params.industry_sector);
      if (params?.ownership_type)
        searchParams.set("ownership_type", params.ownership_type);
      if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

      const query = searchParams.toString();
      return authenticatedRequest<PaginatedResponse<CustomerListItem>>(
        `/api/v1/customers${query ? `?${query}` : ""}`,
      );
    },

    get: (id: string) =>
      authenticatedRequest<Customer>(`/api/v1/customers/${id}`),

    create: (data: CustomerCreate) =>
      authenticatedRequest<Customer>("/api/v1/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CustomerUpdate) =>
      authenticatedRequest<Customer>(`/api/v1/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      authenticatedRequest<void>(`/api/v1/customers/${id}`, {
        method: "DELETE",
      }),

    documents: (id: string, params?: { page?: number; page_size?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.page_size)
        searchParams.set("page_size", params.page_size.toString());

      const query = searchParams.toString();
      return authenticatedRequest<PaginatedResponse<DocumentListItem>>(
        `/api/v1/customers/${id}/documents${query ? `?${query}` : ""}`,
      );
    },
  },

  // Documents
  documents: {
    get: (id: string) =>
      authenticatedRequest<Document>(`/api/v1/documents/${id}`),

    upload: (customerId: string, files: File[]) =>
      uploadDocuments(customerId, files),

    getDownloadUrl: (id: string) =>
      authenticatedRequest<DocumentDownloadResponse>(
        `/api/v1/documents/${id}/download`,
      ),

    download: async (id: string): Promise<Blob> => {
      const { download_url } =
        await authenticatedRequest<DocumentDownloadResponse>(
          `/api/v1/documents/${id}/download`,
        );

      // Same-origin site route that streams the private blob (session cookie auth)
      const response = await fetch(download_url);
      if (!response.ok) {
        throw new APIError("Failed to download file", response.status);
      }
      return await response.blob();
    },

    updateClassification: (id: string, documentType: string) =>
      authenticatedRequest<Document>(`/api/v1/documents/${id}/classification`, {
        method: "PUT",
        body: JSON.stringify({ document_type: documentType }),
      }),

    // Site route: deletes the API record, then the Blob file.
    delete: (id: string) =>
      apiRequest<void>(`/api/documents/${id}/file`, { method: "DELETE" }),
  },

  // Assessments
  assessments: {
    create: (data: AssessmentCreate) =>
      authenticatedRequest<Assessment>("/api/v1/assessments", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    get: (id: string) =>
      authenticatedRequest<Assessment>(`/api/v1/assessments/${id}`),

    submit: (id: string) =>
      authenticatedRequest<Assessment>(`/api/v1/assessments/${id}/submit`, {
        method: "POST",
      }),

    listByCustomer: async (
      customerId: string,
      params?: {
        page?: number;
        page_size?: number;
        status?: string;
      },
    ) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.page_size)
        searchParams.set("page_size", params.page_size.toString());
      if (params?.status) searchParams.set("status", params.status);

      const query = searchParams.toString();
      return authenticatedRequest<PaginatedResponse<AssessmentListItem>>(
        `/api/v1/customers/${customerId}/assessments${query ? `?${query}` : ""}`,
      );
    },

    listModules: (assessmentId: string) =>
      authenticatedRequest<AssessmentModuleSummary[]>(
        `/api/v1/assessments/${assessmentId}/modules`,
      ),

    getModule: (assessmentId: string, moduleKey: string) =>
      authenticatedRequest<AssessmentModule>(
        `/api/v1/assessments/${assessmentId}/modules/${moduleKey}`,
      ),

    saveModuleAnswers: (
      assessmentId: string,
      moduleKey: string,
      data: SaveModuleAnswersRequest,
    ) =>
      authenticatedRequest<AssessmentModule>(
        `/api/v1/assessments/${assessmentId}/modules/${moduleKey}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      ),
  },

  // Chat
  chat: {
    stream: async (assessmentId: string, messages: {role: string, content: string}[], language: string): Promise<Response> => {
      const headers = await getAuthHeaders();
      return fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ assessment_id: assessmentId, messages, language }),
      });
    }
  },

  // Document upload with optional module association
  moduleDocuments: {
    upload: async (
      customerId: string,
      files: File[],
      assessmentModuleId?: string,
    ) => uploadDocuments(customerId, files, assessmentModuleId),
  },
};
