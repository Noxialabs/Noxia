import { CookieHelper } from "../../helper/cookie.helper";
import { Fetch } from "../../lib/Fetch";

interface CaseUpdateData {
  clientName?: string;
  description?: string;
  jurisdiction?: string;
  status?: "Pending" | "In Progress" | "Completed" | "Escalated" | "Closed";
  priority?: "Low" | "Normal" | "High" | "Critical";
  assignedTo?: string;
  closureReason?: string;
}

interface CaseFilters {
  status?: string;
  priority?: string;
  issueCategory?: string;
  escalationLevel?: string;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface EscalationData {
  reason: string;
  escalationLevel: "Priority" | "Urgent";
  assignedTo?: string;
  notes?: string;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = CookieHelper.get({ key: "token" });
  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

export const CaseService = {
  submit: async (formData: any) => {
    return await Fetch.post("/cases", formData, {
      headers: getAuthHeaders(),
    });
  },

  // Get all cases for current user
  getCases: async (filters?: CaseFilters) => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/cases?${queryString}` : "/cases";

    return await Fetch.get(url, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Get single case by ID
  getCase: async (caseId: string) => {
    return await Fetch.get(`/cases/${caseId}`, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Update case
  updateCase: async (caseId: string, updateData: CaseUpdateData) => {
    return await Fetch.put(`/cases/${caseId}`, updateData, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Delete case
  deleteCase: async (caseId: string) => {
    return await Fetch.delete(`/cases/${caseId}`, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Escalate case
  escalateCase: async (caseId: string, escalationData: EscalationData) => {
    return await Fetch.post(`/cases/${caseId}/escalate`, escalationData, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Upload additional documents to existing case - accepts FormData directly
  uploadDocuments: async (caseId: string, formData: FormData) => {
    return await Fetch.post(`/cases/${caseId}/documents`, formData, {
      headers: getAuthHeaders(),
    });
  },

  // Get case statistics
  getCaseStats: async () => {
    return await Fetch.get("/cases/stats", {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Search cases
  searchCases: async (searchTerm: string, filters?: Partial<CaseFilters>) => {
    const params = new URLSearchParams();
    params.append("search", searchTerm);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return await Fetch.get(`/cases/search?${params.toString()}`, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Get case activities/history
  getCaseActivities: async (caseId: string) => {
    return await Fetch.get(`/cases/${caseId}/activities`, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Get case documents
  getCaseDocuments: async (caseId: string) => {
    return await Fetch.get(`/cases/${caseId}/documents`, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Close case
  closeCase: async (caseId: string, closureReason: string) => {
    const data = {
      status: "Closed",
      closureReason: closureReason,
    };

    return await Fetch.put(`/cases/${caseId}`, data, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Reopen case
  reopenCase: async (caseId: string, reason: string) => {
    const data = {
      status: "In Progress",
      reopenReason: reason,
    };

    return await Fetch.put(`/cases/${caseId}`, data, {
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
    });
  },

  // Export cases
  exportCases: async (
    format: "csv" | "pdf" | "excel",
    filters?: CaseFilters
  ) => {
    const params = new URLSearchParams();
    params.append("format", format);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return await Fetch.get(`/cases/export?${params.toString()}`, {
      headers: getAuthHeaders(),
      responseType: "blob", // For file downloads
    });
  },

  // Helper methods
  getCasesByStatus: async (status: string) => {
    return await CaseService.getCases({ status });
  },

  getRecentCases: async (limit: number = 10) => {
    return await CaseService.getCases({ limit, page: 1 });
  },

  getHighPriorityCases: async () => {
    return await CaseService.getCases({ priority: "High" });
  },

  getUrgentCases: async () => {
    return await CaseService.getCases({ escalationLevel: "Urgent" });
  },
};
