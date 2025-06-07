"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  AlertTriangle,
  Download,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  User,
  MapPin,
  Calendar,
  Activity,
  Shield,
  Target,
  Zap,
  ExternalLink,
  MessageSquare,
  Bell,
  Flag,
  Paperclip,
  Eye,
  MoreVertical,
  Copy,
  Mail,
  Phone,
  Circle,
} from "lucide-react";
import { CaseService } from "@/service/case/case.service";

interface CaseDetails {
  id: string;
  caseRef: string;
  title: string;
  userId?: string;
  clientName: string;
  description: string;
  jurisdiction: string;
  issueCategory: string;
  escalationLevel: string;
  aiConfidence: number;
  status: string;
  priority: string;
  urgencyScore: number;
  ethTxHash?: string;
  ceFileStatus: string;
  submissionDate: string;
  updatedAt: string;
  attachments: any;
  metadata: any;
  suggestedActions: string[];
  user?: UserDetails;
}

interface UserDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  joinedAt: string;
  tier: string;
  casesSubmitted: number;
  casesResolved: number;
  verified: boolean;
}

export default function CaseDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null | any>(
    null
  );
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  useEffect(() => {
    if (caseDetails?.userId && caseDetails.user) {
      setUserDetails(caseDetails.user);
    }
  }, [caseDetails?.userId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await CaseService.getCase(caseId);

      if (response.status === 200 && response.data?.success) {
        const _case = response.data.data;
        const suggestedActions = JSON.parse(_case.suggestedActions);
        console.log("Suggested Actions: ", suggestedActions);
        setCaseDetails({ ..._case, suggestedActions });
      }
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "in progress":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "escalated":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          statusClasses[status.toLowerCase()] ||
          "bg-gray-100 text-gray-800 border-gray-200"
        }`}
      >
        {getStatusIcon(status)}
        <span className="ml-2">{status}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string, urgencyScore: number) => {
    const priorityClasses = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
      <div className="flex items-center space-x-2">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            priorityClasses[priority.toLowerCase()] || priorityClasses["normal"]
          }`}
        >
          {priority}
        </span>
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">Urgency:</span>
          <span className="text-sm font-bold">{urgencyScore}/10</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                urgencyScore >= 8
                  ? "bg-red-500"
                  : urgencyScore >= 6
                  ? "bg-orange-500"
                  : urgencyScore >= 4
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${(urgencyScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here
  };

  const handleActionClick = (action: "edit" | "escalate") => {
    if (action == "edit") {
    router.push(`/cases/${caseId}/edit`)
    }
  };
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <LoadingSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!caseDetails) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Case Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The case you're looking for doesn't exist or has been removed.
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                {/*   <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{caseDetails.title}</h1>
                  {caseDetails.ethTxHash && (
                    <div className="bg-green-500/20 backdrop-blur-md rounded-lg px-3 py-1">
                      <span className="text-sm font-medium flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Blockchain Verified
                      </span>
                    </div>
                  )}
                </div> */}
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {caseDetails.caseRef}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {caseDetails.jurisdiction}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(caseDetails.submissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {/* <button className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 hover:bg-white/30 transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
                <button className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 hover:bg-white/30 transition-colors flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share</span>
                </button> */}
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="bg-white/20 backdrop-blur-md rounded-lg p-2 hover:bg-white/30 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showActionsMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleActionClick("edit")}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Case
                        </button>
                        <button
                          onClick={() => handleActionClick("escalate")}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Escalate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Priority */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusBadge(caseDetails.status)}
                {getPriorityBadge(
                  caseDetails.priority,
                  caseDetails.urgencyScore
                )}
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(caseDetails.aiConfidence * 100)}%
                  </div>
                  <div className="text-xs text-blue-200">AI Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {caseDetails.urgencyScore}/10
                  </div>
                  <div className="text-xs text-blue-200">Urgency Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: FileText },
                { id: "client", label: "Client Info", icon: User },
                { id: "actions", label: "Suggested Actions", icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Case Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {caseDetails.description}
                      </p>
                    </div>

                    {/* Key Details */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Key Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">
                            Issue Category
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {caseDetails.issueCategory}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">
                            Escalation Level
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {caseDetails.escalationLevel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">
                            Client Name
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {caseDetails.clientName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-600">
                            File Status
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {caseDetails.ceFileStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Info */}
                    {caseDetails.ethTxHash && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <Shield className="w-5 h-5 text-green-600 mr-2" />
                          <h3 className="text-lg font-semibold text-green-900">
                            Blockchain Verification
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">
                              Transaction Hash
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono text-green-900">
                                {caseDetails.ethTxHash}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(caseDetails.ethTxHash!)
                                }
                                className="text-green-600 hover:text-green-800"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-700">
                              Status:
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified on Blockchain
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Assigned Info */}
                    {caseDetails.metadata?.assignedTo && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Assignment
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {caseDetails.metadata.assignedTo}
                              </div>
                              <div className="text-xs text-gray-500">
                                Case Investigator
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Last Activity: {caseDetails.metadata.lastActivity}
                          </div>
                          {caseDetails.metadata.estimatedResolution && (
                            <div className="text-sm text-gray-600">
                              Est. Resolution:{" "}
                              {new Date(
                                caseDetails.metadata.estimatedResolution
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Days Open
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.ceil(
                              (new Date().getTime() -
                                new Date(
                                  caseDetails.submissionDate
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </span>
                        </div>
                        {/*  <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Evidence Files
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {(caseDetails.attachments.documents?.length || 0) +
                              (caseDetails.attachments.photos?.length || 0) +
                              (caseDetails.attachments.videos?.length || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Timeline Events
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {caseDetails?.timeline?.length || 0}
                          </span>
                        </div> */}
                      </div>
                    </div>

                    {/* Related Cases */}
                    {caseDetails.metadata?.relatedCases &&
                      caseDetails.metadata.relatedCases.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Related Cases
                          </h3>
                          <div className="space-y-2">
                            {caseDetails.metadata.relatedCases.map(
                              (relatedCase: string, index: number) => (
                                <button
                                  key={index}
                                  className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-between"
                                >
                                  <span className="text-sm text-gray-900">
                                    {relatedCase}
                                  </span>
                                  <ExternalLink className="w-4 h-4 text-gray-400" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Client Info Tab */}
            {activeTab === "client" && (
              <div className="space-y-6">
                {caseDetails.userId ? (
                  userLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ) : userDetails ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* User Profile */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {userDetails.firstName.charAt(0)}
                              {userDetails.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {userDetails.firstName} {userDetails.lastName}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  userDetails.tier === "Premium"
                                    ? "bg-gold-100 text-gold-800"
                                    : userDetails.tier === "Pro"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {userDetails.tier} Member
                              </span>
                              {userDetails.verified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">
                              {userDetails.email}
                            </span>
                          </div>
                          {userDetails.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-700">
                                {userDetails.phone}
                              </span>
                            </div>
                          )}
                          {userDetails.address && (
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-700">
                                {userDetails.address}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">
                              Joined{" "}
                              {new Date(
                                userDetails.joinedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Stats */}
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Case Statistics
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {userDetails.casesSubmitted}
                              </div>
                              <div className="text-sm text-gray-600">
                                Cases Submitted
                              </div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {userDetails.casesResolved}
                              </div>
                              <div className="text-sm text-gray-600">
                                Cases Resolved
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Reputation Score
                          </h4>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                  Reputation
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {userDetails.reputation}/100
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                                  style={{
                                    width: `${userDetails.reputation}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                             <div className="text-center">
                              <div
                                className={`text-2xl ${
                                  userDetails.reputation >= 80
                                    ? "text-green-500"
                                    : userDetails.reputation >= 60
                                    ? "text-yellow-500"
                                    : "text-red-500"
                                }`}
                              >
                                {userDetails.reputation >= 80
                                  ? "⭐"
                                  : userDetails.reputation >= 60
                                  ? "👍"
                                  : "📊"}
                              </div>
                            </div> 
                          </div>
                        </div>

                       <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Contact Actions
                          </h4>
                          <div className="space-y-3">
                            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                              <MessageSquare className="w-4 h-4" />
                              <span>Send Message</span>
                            </button>
                            <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                              <Bell className="w-4 h-4" />
                              <span>Set Notification</span>
                            </button>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Unable to load user information
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-900">
                          Anonymous Submission
                        </h3>
                        <p className="text-yellow-700">
                          This case was submitted anonymously. No user account
                          information is available.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Contact Information
                      </h4>
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Client Name:</strong> {caseDetails.clientName}
                        </p>
                        <p>
                          <strong>Jurisdiction:</strong>{" "}
                          {caseDetails.jurisdiction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === "actions" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Suggested Actions
                </h3>
                <div className="space-y-4">
                  {caseDetails.suggestedActions?.map(
                    (action: string, index: number) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed">
                              {action}
                            </p>
                            {/* <div className="mt-3 flex space-x-2">
                              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                                Mark as Done
                              </button>
                              <button className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                                Add Note
                              </button>
                            </div> */}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Add Custom Action */}
                {/* <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Add Custom Action
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Create a custom action item for this case
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Add Action
                    </button>
                  </div>
                </div> */}
              </div>
            )}
            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Case Timeline
                </h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {caseDetails.timeline?.map((event, index) => (
                      <div
                        key={index}
                        className="relative flex items-start space-x-4"
                      >
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : event.status === "in_progress"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {event.status === "completed" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : event.status === "in_progress" ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {event.action}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString()} at{" "}
                              {new Date(event.date).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Tab */}
            {activeTab === "attachments" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evidence & Attachments
                </h3>

                {/* Documents */}
                {caseDetails.attachments.documents &&
                  caseDetails.attachments.documents.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Documents
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {caseDetails.attachments.documents.map(
                          (doc: string, index: number) => (
                            <div
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {doc}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    PDF Document
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <button className="p-1 text-gray-400 hover:text-blue-600">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-400 hover:text-blue-600">
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Photos */}
                {caseDetails.attachments.photos &&
                  caseDetails.attachments.photos.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Photos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {caseDetails.attachments.photos.map(
                          (photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                                  <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                                      <span className="text-white font-bold">
                                        📷
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 px-2 truncate">
                                      {photo}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-2">
                                  <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100">
                                    <Eye className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100">
                                    <Download className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Videos */}
                {caseDetails.attachments.videos &&
                  caseDetails.attachments.videos.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Videos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {caseDetails.attachments.videos.map(
                          (video: string, index: number) => (
                            <div
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                            >
                              <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white text-2xl">
                                      ▶️
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Video Preview
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {video}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    MP4 Video
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <button className="p-2 text-gray-400 hover:text-blue-600">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-gray-400 hover:text-blue-600">
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
