"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Case, CaseFilters } from "@/types/case.types";
import { CaseService } from "@/service/case/case.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DeleteCaseModal,
  useDeleteCase,
} from "@/components/cases/DeleteCaseModal";

export default function CasesListing() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState<CaseFilters>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const fetchCases = async () => {
    try {
      const isRefresh = !loading;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await CaseService.getCases(filters);

      if (response.status === 200 && response.data?.success) {
        setCases(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
    }, 750);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const closeDeleteModal = () => {
    setSelectedCase(null);
    setIsModalOpen(false);
    fetchCases();
  };
  const handleDeleteConfirm = async () => {
    console.log("Value: ");
    await CaseService.deleteCase(selectedCase.id);
  };
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCaseAction = (
    action: "edit" | "delete" | "escalate" | "view",
    _case: Case
  ) => {
    setSelectedCase(_case);
    switch (action) {
      case "view":
        // Navigate to case details page
        router.push(`/cases/${_case.id}/details`);
        break;

      case "edit":
        // Navigate to edit page or open edit modal
        router.push(`/cases/${_case.id}/edit`);
        // OR open edit modal
        // setIsEditModalOpen(true);
        // setSelectedCaseId(caseId);
        break;

      case "escalate":
        // Handle escalation logic
        // handleEscalation(caseId);
        break;

      case "delete":
        console.log("open delete modal");
        setIsModalOpen(true);
        console.log("Case: ", _case);
        break;

      default:
        console.log(`${action} case:`, _case.id);
    }
  };

  const handleBulkAction = (action: "delete" | "escalate" | "export") => {
    console.log(`Bulk ${action}:`, selectedCases);
    // Implement bulk action logic
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "in progress":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "escalated":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      "in progress": "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      escalated: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          statusClasses[status.toLowerCase()] ||
          "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
          priorityClasses[priority.toLowerCase()] || priorityClasses["normal"]
        }`}
      >
        {priority}
      </span>
    );
  };
  const getEscalationBadege = (escalationLevel: string) => {
    const escalationLevelClasses = {
      basic: "bg-blue-100 text-blue-800",
      priority: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
          escalationLevelClasses[escalationLevel.toLowerCase()] ||
          escalationLevelClasses["normal"]
        }`}
      >
        {escalationLevel}
      </span>
    );
  };

  const ActionDropdown = (caseProps: Case) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <button
                onClick={() => {
                  handleCaseAction("view", caseProps);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
              <button
                onClick={() => {
                  handleCaseAction("edit", caseProps);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Case
              </button>
              <button
                onClick={() => {
                  handleCaseAction("escalate", caseProps);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Escalate
              </button>
              <hr className="my-1" />
              <button
                onClick={() => {
                  handleCaseAction("delete", caseProps);
                  //setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Case
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border-b border-gray-100"
        >
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <AppLayout>
      {selectedCase && (
        <DeleteCaseModal
          isOpen={isModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          caseTitle={selectedCase.title}
          caseRef={selectedCase.caseRef}
        />
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Cases Management</h1>
              <p className="text-blue-100">
                Track, manage, and resolve corruption cases effectively
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <button
                onClick={() => setRefreshing(true)}
                disabled={refreshing}
                className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <Link
                href="/cases/case-submission-form"
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Case</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search cases by title, client, or case ref..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>

              {selectedCases.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedCases.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction("export")}
                    className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleBulkAction("escalate")}
                    className="bg-orange-100 text-orange-600 px-3 py-1 rounded-md text-sm hover:bg-orange-200 transition-colors"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}

              <button
                onClick={() =>
                  setViewMode(viewMode === "table" ? "cards" : "table")
                }
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                {viewMode === "table" ? "📋" : "📄"}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority || ""}
                    onChange={(e) =>
                      handleFilterChange("priority", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.issueCategory || ""}
                    onChange={(e) =>
                      handleFilterChange("issueCategory", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Corruption - Police">
                      Corruption - Police
                    </option>
                    <option value="Corruption - Government">
                      Corruption - Government
                    </option>
                    <option value="Corruption - Judicial">
                      Corruption - Judicial
                    </option>
                    <option value="Criminal - Assault">
                      Criminal - Assault
                    </option>
                    <option value="Criminal - Fraud">Criminal - Fraud</option>
                    <option value="Criminal - Harassment">
                      Criminal - Harassment
                    </option>
                    <option value="Criminal - Murder">Criminal - Murder</option>
                    <option value="Legal - Civil Rights">
                      Legal - Civil Rights
                    </option>
                    <option value="Legal - Employment">
                      Legal - Employment
                    </option>
                    <option value="Legal - Housing">Legal - Housing</option>
                    <option value="Legal - Immigration">
                      Legal - Immigration
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escalation
                  </label>
                  <select
                    value={filters.escalationLevel || ""}
                    onChange={(e) =>
                      handleFilterChange("escalationLevel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="Basic">Basic</option>
                    <option value="Priority">Priority</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cases Table/Cards */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <LoadingSkeleton />
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/*   <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCases(cases.map((c) => c.id));
                          } else {
                            setSelectedCases([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th> */}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Escalation Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cases.map((case_) => (
                    <tr
                      key={case_.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCases.includes(case_.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCases([...selectedCases, case_.id]);
                            } else {
                              setSelectedCases(
                                selectedCases.filter((id) => id !== case_.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td> */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {case_.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {case_.caseRef}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {case_.issueCategory}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {case_.clientName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {case_.jurisdiction}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(case_.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(case_.priority)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {Math.round(case_.aiConfidence * 100)}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${case_.aiConfidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getEscalationBadege(case_.escalationLevel)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(case_.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(case_.updatedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActionDropdown {...case_} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Cards View
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((case_) => (
                  <div
                    key={case_.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {case_.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {case_.caseRef}
                        </p>
                        <p className="text-xs text-gray-500">
                          {case_.issueCategory}
                        </p>
                      </div>
                      <ActionDropdown {...case_} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Client:</span>
                        <span className="text-sm font-medium">
                          {case_.clientName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(case_.status)}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Priority:</span>
                        {getPriorityBadge(case_.priority)}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Confidence:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {Math.round(case_.aiConfidence * 100)}%
                          </span>
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${case_.aiConfidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Updated:{" "}
                          {new Date(case_.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-1">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          pagination.page === i + 1
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
