"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  FileText,
  Tag,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  Flag,
  Users,
  Settings,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { CaseService } from "@/service/case/case.service";

interface CaseData {
  id: string;
  caseRef: string;
  title: string;
  clientName: string;
  description: string;
  jurisdiction: string;
  issueCategory: string;
  status: "Pending" | "In Progress" | "Completed" | "Escalated" | "Closed";
  priority: "Low" | "Normal" | "High" | "Critical";
  assignedTo?: string;
  closureReason?: string;
  submissionDate: string;
  updatedAt: string;
}

interface CaseUpdateData {
  clientName?: string;
  jurisdiction?: string;
  status?: "Pending" | "In Progress" | "Completed" | "Escalated" | "Closed";
  priority?: "Low" | "Normal" | "High" | "Critical";
  issueCategory?: string;
  assignedTo?: string;
  closureReason?: string;
  description?: string;
}

export default function CaseEditPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [originalData, setOriginalData] = useState<CaseData | null>(null);
  const [formData, setFormData] = useState<CaseUpdateData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Form options
  const statusOptions = [
    "Pending",
    "In Progress",
    "Completed",
    "Escalated",
    "Closed",
  ];
  const priorityOptions = ["Low", "Normal", "High", "Critical"];
  const issueCategoryOptions = [
    "Corruption - Police",
    "Corruption - Government",
    "Corruption - Judicial",
    "Criminal - Assault",
    "Criminal - Fraud",
    "Criminal - Harassment",
    "Criminal - Murder",
    "Legal - Civil Rights",
    "Legal - Employment",
    "Legal - Housing",
    "Legal - Immigration",
    "Other",
  ];

  const jurisdictionOptions: string[] = [
    "England and Wales",
    "Scotland",
    "Northern Ireland",
    "Greater London",
    "Greater Manchester",
    "West Midlands",
    "West Yorkshire",
    "Merseyside",
    "South Yorkshire",
    "Tyne and Wear",
    "Other",
  ];

  const assignedToOptions = [
    "Inspector Sarah Johnson",
    "Detective Mike Chen",
    "Officer Jane Smith",
    "Sergeant Tom Wilson",
    "Captain Lisa Davis",
  ];

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  useEffect(() => {
    if (originalData) {
      checkForChanges();
    }
  }, [formData, originalData]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      const response = await CaseService.getCase(caseId);

      if (response.status === 200 && response.data?.success) {
        const caseData = response.data.data;
        setOriginalData(caseData);
        setFormData({
          clientName: caseData.clientName,
          jurisdiction: caseData.jurisdiction,
          status: caseData.status,
          priority: caseData.priority,
          issueCategory: caseData.issueCategory,
          assignedTo: caseData.assignedTo,
          closureReason: caseData.closureReason,
          description: caseData.description,
        });
      }
    } catch (error) {
      console.error("Error fetching case data:", error);
      toast.error("Failed to load case data");
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!originalData) return;

    const changes = Object.keys(formData).some((key) => {
      return (
        formData[key as keyof CaseUpdateData] !==
        originalData[key as keyof CaseData]
      );
    });
    setHasChanges(changes);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.clientName?.trim()) {
      errors.clientName = "Client name is required";
    }

    if (!formData.jurisdiction?.trim()) {
      errors.jurisdiction = "Jurisdiction is required";
    }

    if (!formData.description?.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (formData.status === "Closed" && !formData.closureReason?.trim()) {
      errors.closureReason = "Closure reason is required when status is Closed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CaseUpdateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setSaving(true);

      // Only send changed fields
      const changedData: CaseUpdateData = {};
      Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof CaseUpdateData;
        if (formData[typedKey] !== originalData?.[typedKey]) {
          changedData[typedKey as string] = formData[typedKey];
        }
      });

      const response = await CaseService.updateCase(caseId, changedData);

      if (response.status === 200 && response.data?.success) {
        toast.success("Case updated successfully!");
        setHasChanges(false);

        // Update original data to reflect changes
        if (originalData) {
          setOriginalData({ ...originalData, ...changedData });
        }
      }
    } catch (error) {
      console.error("Error updating case:", error);
      toast.error("Failed to update case");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (originalData) {
      setFormData({
        clientName: originalData.clientName,
        jurisdiction: originalData.jurisdiction,
        status: originalData.status,
        priority: originalData.priority,
        issueCategory: originalData.issueCategory,
        assignedTo: originalData.assignedTo,
        closureReason: originalData.closureReason,
        description: originalData.description,
      });
      setValidationErrors({});
      toast.info("Changes discarded");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "In Progress":
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Escalated":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Closed":
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "text-green-600 bg-green-100";
      case "Normal":
        return "text-blue-600 bg-blue-100";
      case "High":
        return "text-orange-600 bg-orange-100";
      case "Critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!originalData) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Case Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The case you're trying to edit doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Edit Case</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {originalData.caseRef}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created{" "}
                      {new Date(
                        originalData.submissionDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 hover:bg-white/30 transition-colors flex items-center space-x-2"
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </span>
                </button>
              </div>
            </div>

            {hasChanges && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 flex items-center space-x-2">
                <Info className="w-4 h-4 text-yellow-200" />
                <span className="text-sm text-yellow-100">
                  You have unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName || ""}
                    onChange={(e) =>
                      handleInputChange("clientName", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.clientName
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter client name"
                  />
                  {validationErrors.clientName && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.clientName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jurisdiction *
                  </label>
                  <select
                    value={formData.jurisdiction || ""}
                    onChange={(e) =>
                      handleInputChange("jurisdiction", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.jurisdiction
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select jurisdiction</option>
                    {jurisdictionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {validationErrors.jurisdiction && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors.jurisdiction}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Case Details
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Category
                  </label>
                  <select
                    value={formData.issueCategory || ""}
                    onChange={(e) =>
                      handleInputChange("issueCategory", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {issueCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                      validationErrors.description
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Describe the case details..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    {validationErrors.description ? (
                      <p className="text-red-600 text-sm">
                        {validationErrors.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        {formData.description?.length || 0} characters
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Case Management
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || ""}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority || ""}
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.assignedTo
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>

                  <input
                    value={formData.assignedTo || ""}
                    onChange={(e) =>
                      handleInputChange("assignedTo", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.assignedTo
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                </div>

                {formData.status === "Closed" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closure Reason *
                    </label>
                    <textarea
                      value={formData.closureReason || ""}
                      onChange={(e) =>
                        handleInputChange("closureReason", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                        validationErrors.closureReason
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Explain why the case is being closed..."
                    />
                    {validationErrors.closureReason && (
                      <p className="text-red-600 text-sm mt-1">
                        {validationErrors.closureReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleDiscard}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Case Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Case Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Case Reference</span>
                  <span className="text-sm font-medium font-mono">
                    {originalData.caseRef}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(originalData.status)}
                    <span className="text-sm font-medium">
                      {originalData.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Priority</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                      originalData.priority
                    )}`}
                  >
                    {originalData.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">
                    {new Date(originalData.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Changes */}
            {showPreview && hasChanges && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Preview Changes
                </h3>
                <div className="space-y-3">
                  {Object.entries(formData).map(([key, value]) => {
                    const originalValue = originalData[key as keyof CaseData];
                    if (value !== originalValue && value !== undefined) {
                      return (
                        <div key={key} className="bg-white rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-red-600 line-through">
                              {originalValue || "None"}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              {value || "None"}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Changes are automatically tracked</p>
                <p>• Required fields are marked with *</p>
                <p>• Closure reason is required when status is "Closed"</p>
                {/* <p>• All changes are logged for audit purposes</p> */}
              </div>
              {/* <button className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Documentation →
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
