"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { CaseService } from "@/service/case/case.service";

interface DashboardData {
  stats: any;
  trendData: any[];
  statusDistribution: any[];
  priorityDistribution: any[];
  recentActivity: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState("30d");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUrgencyLevels, setSelectedUrgencyLevels] = useState<string[]>(
    []
  );
  const [filterOptions, setFilterOptions] = useState<any>({
    statuses: ["Pending", "In Progress", "Completed", "Escalated", "Resolved"],
    urgencyLevels: ["Low", "Medium", "High", "Critical"],
    dateRanges: [
      { label: "7 Days", value: "7d" },
      { label: "30 Days", value: "30d" },
      { label: "90 Days", value: "90d" },
      { label: "1 Year", value: "1y" },
    ],
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedStatuses, selectedUrgencyLevels]);

  const fetchDashboardData = async () => {
    try {
      const isRefresh = !loading;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        dateRange,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        urgencyLevel:
          selectedUrgencyLevels.length > 0 ? selectedUrgencyLevels : undefined,
      };

      const response = await CaseService.getDashboardStats(filters);

      if (response.status === 200 && response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getStatCards = () => {
    if (!data?.stats) return [];

    return [
      {
        title: "Total Cases",
        value: data.stats.total_cases,
        icon: Users,
        color: "bg-gradient-to-r from-blue-500 to-blue-600",
        change: `+${data.stats.total_change}%`,
        trend: "up",
      },
      {
        title: "Pending Cases",
        value: data.stats.pending_cases,
        icon: Clock,
        color: "bg-gradient-to-r from-amber-500 to-orange-500",
        change: "-5%",
        trend: "down",
      },
      {
        title: "In Progress",
        value: data.stats.in_progress_cases,
        icon: TrendingUp,
        color: "bg-gradient-to-r from-purple-500 to-purple-600",
        change: "+8%",
        trend: "up",
      },
      {
        title: "Completed",
        value: data.stats.completed_cases,
        icon: CheckCircle,
        color: "bg-gradient-to-r from-green-500 to-green-600",
        change: "+15%",
        trend: "up",
      },
      {
        title: "Urgent Cases",
        value: data.stats.urgent_cases,
        icon: AlertTriangle,
        color: "bg-gradient-to-r from-red-500 to-red-600",
        change: "+3%",
        trend: "up",
      },
      {
        title: "Avg Confidence",
        value: data.stats.avg_confidence
          ? `${data.stats.avg_confidence}%`
          : "N/A",
        icon: TrendingUp,
        color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
        change: "+2.5%",
        trend: "up",
      },
    ];
  };

  const StatCard = ({ title, value, icon: Icon, color, change, trend }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`${color} p-3 rounded-lg shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <div
          className={`text-sm font-semibold ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </div>
      </div>
    </div>
  );

  const FilterButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {user?.email?.split("@")[0]}!
                </h1>
                <p className="text-blue-100 text-lg">
                  Here's what's happening with your cases today
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-4">
                <div className="bg-white/20 backdrop-blur-md rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-white">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 backdrop-blur-md rounded-lg p-4 hover:bg-white/30 transition-colors"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-white ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col space-y-4">
            {/* Date Range Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Date Range:</span>
                <div className="flex space-x-2">
                  {filterOptions?.dateRanges?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dateRange === option.value
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/*  <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">More Filters</span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div> */}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions?.statuses?.map((status) => (
                      <FilterButton
                        key={status}
                        label={status}
                        active={selectedStatuses.includes(status)}
                        onClick={() => {
                          setSelectedStatuses((prev) =>
                            prev.includes(status)
                              ? prev.filter((s) => s !== status)
                              : [...prev, status]
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Urgency Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Urgency Level:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions?.urgencyLevels?.map((level) => (
                      <FilterButton
                        key={level}
                        label={level}
                        active={selectedUrgencyLevels.includes(level)}
                        onClick={() => {
                          setSelectedUrgencyLevels((prev) =>
                            prev.includes(level)
                              ? prev.filter((l) => l !== level)
                              : [...prev, level]
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedStatuses([]);
                      setSelectedUrgencyLevels([]);
                      setDateRange("30d");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getStatCards().map((card, index) => (
              <StatCard key={index} {...card} />
            ))}
          </div>
        )}

        {/* Charts Section */}
        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart - Cases Trend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cases Trend
                </h3>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Cases</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Resolved</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Case Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value, name) => [
                      `${value} (${
                        data.statusDistribution.find(
                          (item) => item.name === name
                        )?.percentage
                      }%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {data.statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Priority Distribution & Recent Activity */}
        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart - Priority Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Priority Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {data.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {data.recentActivity?.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          activity.status === "Pending"
                            ? "bg-amber-500"
                            : activity.status === "In Progress"
                            ? "bg-blue-500"
                            : activity.status === "Completed"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Case{" "}
                          {activity.action_type === "submitted"
                            ? "submitted"
                            : "updated"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.case_id}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {activity.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          activity.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : activity.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : activity.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {activity.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time_ago}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data.recentActivity || data.recentActivity.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && data && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.stats.total_cases}
                </div>
                <div className="text-sm text-gray-600">Total Cases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {data.stats.completed_cases && data.stats.total_cases
                    ? Math.round(
                        (parseInt(data.stats.completed_cases) /
                          parseInt(data.stats.total_cases)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Resolution Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {data.stats.avg_confidence || "N/A"}
                  {data.stats.avg_confidence && "%"}
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {data.stats.avg_urgency || "N/A"}
                  {data.stats.avg_urgency && "/10"}
                </div>
                <div className="text-sm text-gray-600">Avg Urgency</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
