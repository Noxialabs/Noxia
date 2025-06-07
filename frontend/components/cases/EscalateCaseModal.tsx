"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  X,
  Send,
  CheckCircle,
  XCircle,
  TrendingUp,
  Shield,
  Target,
  Brain,
  Flag,
  Clock,
  Loader2,
  Info,
  ArrowRight,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";
import { CaseService } from "@/service/case/case.service";

interface EscalationData {
  reason: string;
  priority: "High" | "Critical";
}

interface EscalationAnalysis {
  shouldEscalate: boolean;
  confidence: number;
  reasons: string[];
  suggestedPriority: "Normal" | "High" | "Critical";
  urgencyScore: number;
  riskFactors: string[];
  recommendation: string;
}

interface EscalationResponse {
  case: any;
  aiAnalysis: EscalationAnalysis;
  escalationApproved: boolean;
}

interface EscalateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  caseRef: string;
  currentPriority: string;
  onEscalationComplete?: (response: EscalationResponse) => void;
}

export const EscalateCaseModal = ({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  caseRef,
  currentPriority,
  onEscalationComplete,
}: EscalateCaseModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "result">("form");
  const [formData, setFormData] = useState<EscalationData>({
    reason: "",
    priority: "High",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escalationResponse, setEscalationResponse] =
    useState<EscalationResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setStep("form");
      setFormData({ reason: "", priority: "High" });
      setEscalationResponse(null);
      setValidationErrors({});
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.reason.trim()) {
      errors.reason = "Escalation reason is required";
    } else if (formData.reason.trim().length < 10) {
      errors.reason =
        "Please provide a detailed reason (minimum 10 characters)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setIsSubmitting(true);
      setStep("processing");

      const response = await CaseService.escalateCase(caseId, formData);

      if (response.status === 200 && response.data?.success) {
        setEscalationResponse(response.data.data);
        setStep("result");

        if (onEscalationComplete) {
          onEscalationComplete(response.data.data);
        }
      }
    } catch (error) {
      console.error("Escalation error:", error);
      let message = "Failed to change password";
      if (error.message === "Current password is incorrect") {
        message = "Current password is incorrect";
      } else if (error.response?.data?.message) {
        message = "Current password is incorrect";
      }
      toast.error(message);
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleInputChange = (field: keyof EscalationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 8) return "text-red-600 bg-red-100";
    if (score >= 6) return "text-orange-600 bg-orange-100";
    if (score >= 4) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-transparent transition-opacity" />

        {/* Center the modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Form Step */}
          {step === "form" && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Escalate Case</h3>
                      <p className="text-orange-100 text-sm">
                        Prioritize this case for urgent attention
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {/* Case Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Case Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Reference:</span>
                      <span className="ml-2 font-medium font-mono">
                        {caseRef}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Priority:</span>
                      <span className="ml-2 font-medium">
                        {currentPriority}
                      </span>
                    </div>
                    <div className="col-span-full">
                      <span className="text-gray-600">Title:</span>
                      <span className="ml-2 font-medium">{caseTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Priority Level *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["High", "Critical"].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            handleInputChange(
                              "priority",
                              priority as "High" | "Critical"
                            )
                          }
                          className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                            formData.priority === priority
                              ? priority === "Critical"
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {priority === "Critical" ? (
                              <Zap className="w-5 h-5" />
                            ) : (
                              <Flag className="w-5 h-5" />
                            )}
                            <span className="font-medium">{priority}</span>
                          </div>
                          <p className="text-xs mt-1 opacity-75">
                            {priority === "Critical"
                              ? "Immediate attention required"
                              : "Elevated priority level"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escalation Reason *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        handleInputChange("reason", e.target.value)
                      }
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none ${
                        validationErrors.reason
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Explain why this case needs escalation (e.g., new evidence, increased urgency, public interest...)"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {validationErrors.reason ? (
                        <p className="text-red-600 text-sm">
                          {validationErrors.reason}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          {formData.reason.length} characters
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Escalation Notice:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          This case will be marked as escalated and moved to
                          priority queue
                        </li>
                        {/* <li>Senior investigators will be automatically notified</li> */}
                        <li>
                          AI analysis will be performed to validate escalation
                        </li>
                        {/* <li>All stakeholders will receive immediate alerts</li> */}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.reason.trim()}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Escalate Case</span>
                </button>
              </div>
            </>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="px-6 py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 rounded-full animate-spin mx-auto"></div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Processing Escalation
                </h3>
                <p className="text-gray-600 mb-4">
                  AI is analyzing the case for escalation validation...
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating escalation criteria</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing risk factors</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && escalationResponse && (
            <>
              {/* Header */}
              <div
                className={`px-6 py-6 text-white ${
                  escalationResponse.escalationApproved
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-red-500 to-pink-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      {escalationResponse.escalationApproved ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Escalation{" "}
                        {escalationResponse.escalationApproved
                          ? "Approved"
                          : "Rejected"}
                      </h3>
                      <p className="text-white/80 text-sm">
                        AI analysis completed
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-96 overflow-y-auto">
                {/* AI Analysis Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      AI Analysis Summary
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div
                        className={`text-2xl font-bold ${getConfidenceColor(
                          escalationResponse.aiAnalysis.confidence
                        )}`}
                      >
                        {Math.round(
                          escalationResponse.aiAnalysis.confidence * 100
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div
                        className={`text-2xl font-bold ${getUrgencyColor(
                          escalationResponse.aiAnalysis.urgencyScore
                        )}`}
                      >
                        {escalationResponse.aiAnalysis.urgencyScore}/10
                      </div>
                      <div className="text-xs text-gray-600">Urgency Score</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {escalationResponse.aiAnalysis.suggestedPriority}
                      </div>
                      <div className="text-xs text-gray-600">
                        Suggested Priority
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Recommendation
                    </h5>
                    <p className="text-sm text-gray-700">
                      {escalationResponse.aiAnalysis.recommendation}
                    </p>
                  </div>
                </div>

                {/* Analysis Details */}
                <div className="space-y-4">
                  {/* Reasons */}
                  {/*  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      Analysis Reasons
                    </h5>
                    <ul className="space-y-2">
                      {escalationResponse.aiAnalysis.reasons.map((reason, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-700">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div> */}

                  {/* Risk Factors */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-orange-600" />
                      Risk Factors
                    </h5>
                    <ul className="space-y-2">
                      {escalationResponse.aiAnalysis.riskFactors.map(
                        (factor, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            <span className="text-gray-700">{factor}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Case Update */}
                  {escalationResponse.escalationApproved && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h5 className="font-medium text-green-900 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Case Updated
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Status:</span>
                          <span className="font-medium text-green-900">
                            {escalationResponse.case.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Priority:</span>
                          <span className="font-medium text-green-900">
                            {escalationResponse.case.priority}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">
                            Escalation Level:
                          </span>
                          <span className="font-medium text-green-900">
                            {escalationResponse.case.escalationLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Done</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Hook for using escalation modal
export const useEscalateCase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<{
    id: string;
    title: string;
    caseRef: string;
    currentPriority: string;
  } | null>(null);

  const openEscalationModal = (caseData: {
    id: string;
    title: string;
    caseRef: string;
    currentPriority: string;
  }) => {
    setSelectedCase(caseData);
    setIsModalOpen(true);
  };

  const closeEscalationModal = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
  };

  const handleEscalationComplete = (response: EscalationResponse) => {
    if (response.escalationApproved) {
      toast.success("Case escalated successfully!");
    } else {
      toast.warning("Escalation was not approved by AI analysis");
    }
  };

  return {
    isModalOpen,
    selectedCase,
    openEscalationModal,
    closeEscalationModal,
    handleEscalationComplete,
    EscalationModal: () =>
      selectedCase ? (
        <EscalateCaseModal
          isOpen={isModalOpen}
          onClose={closeEscalationModal}
          caseId={selectedCase.id}
          caseTitle={selectedCase.title}
          caseRef={selectedCase.caseRef}
          currentPriority={selectedCase.currentPriority}
          onEscalationComplete={handleEscalationComplete}
        />
      ) : null,
  };
};
