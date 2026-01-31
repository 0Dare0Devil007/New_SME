"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  ThumbsUp,
  Clock,
  TrendingUp,
  Building,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  MapPin,
  Search,
  Eye,
  Timer,
  Target,
  Zap,
  Star,
} from "lucide-react";
import DepartmentBarChart from "./components/DepartmentBarChart";
import SitePieChart from "./components/SitePieChart";
import TrainingAreaChart from "./components/TrainingAreaChart";
import ActivityLineChart from "./components/ActivityLineChart";
import SkillProgressBar from "./components/SkillProgressBar";
import MostEndorsedSkillsTable from "./components/MostEndorsedSkillsTable";
import DashboardFilters from "./components/DashboardFilters";

interface DashboardStats {
  overview: {
    totalSmes: number;
    approvedSmes: number;
    suspendedSmes: number;
    pendingNominations: number;
    totalEndorsements: number;
    totalSkills: number;
    activeCourses: number;
    studentsTrained: number;
  };
  trends: {
    smesGrowth: number;
    coursesGrowth: number;
    endorsementsGrowth: number;
    studentsGrowth: number;
  };
  smesByStatus: Array<{
    status: string;
    count: number;
  }>;
  smesByDepartment: Array<{
    department: string;
    count: number;
  }>;
  smesBySite: Array<{
    site: string;
    count: number;
  }>;
  recentNominations: Array<{
    id: string;
    status: string;
    requestedAt: string;
    nominee: {
      name: string;
      department?: string;
      avatarUrl?: string;
    };
    nominatedBy: string;
  }>;
  topEndorsedSmes: Array<{
    id: string;
    name: string;
    position?: string;
    department?: string;
    avatarUrl?: string;
    totalEndorsements: number;
  }>;
  topSearchedSkills: Array<{
    rank: number;
    skill: string;
    searchCount: number;
    growthPercent: number;
  }>;
  mostEndorsedSkills: Array<{
    rank: number;
    skillId: string;
    skillName: string;
    totalEndorsements: number;
    smeCount: number;
    avgPerSme: number;
    trend: number;
  }>;
  trainingTrends: Array<{
    month: string;
    coursesDelivered: number;
    studentsEnrolled: number;
    avgSatisfaction: number;
  }>;
  platformActivity: Array<{
    week: string;
    profileViews: number;
    searches: number;
    endorsements: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "search" | "endorsement" | "profile_view";
    description: string;
    timestamp: string;
    user: { name: string; avatar?: string };
  }>;
  bottomMetrics: {
    avgResponseTime: string;
    courseCompletionRate: number;
    engagementScore: number;
    knowledgeSharingIndex: number;
  };
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/dashboard/stats?days=${dateRange}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || "Failed to fetch dashboard stats");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard";
        console.error("Dashboard fetch error:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/stats?days=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to fetch dashboard stats");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard";
      console.error("Dashboard fetch error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!stats) return;
    
    // Create CSV content
    const csvContent = `SME Dashboard Export - ${new Date().toLocaleDateString()}\n\n` +
      `Overview Statistics\n` +
      `Total SMEs,${stats.overview.totalSmes}\n` +
      `Approved SMEs,${stats.overview.approvedSmes}\n` +
      `Suspended SMEs,${stats.overview.suspendedSmes}\n` +
      `Pending Nominations,${stats.overview.pendingNominations}\n` +
      `Total Endorsements,${stats.overview.totalEndorsements}\n` +
      `Total Skills,${stats.overview.totalSkills}\n` +
      `Active Courses,${stats.overview.activeCourses}\n` +
      `Students Trained,${stats.overview.studentsTrained}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sme-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load dashboard"}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    if (status === "SUBMITTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return <span className="text-xs text-gray-500">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Management Dashboard</h1>
              <p className="text-gray-600">Comprehensive analytics and insights into SME program</p>
            </div>
            <DashboardFilters
              onRefresh={handleRefresh}
              onExport={handleExport}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Top Stats Row - 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total SMEs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +{stats.trends.smesGrowth}% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalSmes}</p>
            <p className="text-sm text-gray-500">Total SMEs</p>
            <p className="text-xs text-gray-400 mt-2">from last month</p>
          </div>

          {/* Active Courses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +{stats.trends.coursesGrowth}% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.activeCourses}</p>
            <p className="text-sm text-gray-500">Active Courses</p>
            <p className="text-xs text-gray-400 mt-2">from last month</p>
          </div>

          {/* Total Endorsements */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +{stats.trends.endorsementsGrowth}% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalEndorsements}</p>
            <p className="text-sm text-gray-500">Total Endorsements</p>
            <p className="text-xs text-gray-400 mt-2">from last month</p>
          </div>

          {/* Students Trained */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +{stats.trends.studentsGrowth}% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.studentsTrained}</p>
            <p className="text-sm text-gray-500">Students Trained</p>
            <p className="text-xs text-gray-400 mt-2">from last month</p>
          </div>
        </div>

        {/* Charts Row 1 - SMEs by Department (Bar) & SMEs by Site (Pie) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SMEs by Department */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">SMEs by Department</h2>
            </div>
            {stats.smesByDepartment.length > 0 ? (
              <DepartmentBarChart data={stats.smesByDepartment} />
            ) : (
              <div className="text-center py-12 text-gray-500">No department data available</div>
            )}
          </div>

          {/* SMEs by Site */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">SMEs by Site</h2>
            </div>
            {stats.smesBySite.length > 0 ? (
              <SitePieChart data={stats.smesBySite} />
            ) : (
              <div className="text-center py-12 text-gray-500">No site data available</div>
            )}
          </div>
        </div>

        {/* Charts Row 2 - Top Searched Skills & Top Endorsed SMEs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Searched Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top Searched Skills</h2>
            </div>
            <div className="space-y-1">
              {stats.topSearchedSkills.map((skill) => (
                <SkillProgressBar
                  key={skill.rank}
                  rank={skill.rank}
                  label={skill.skill}
                  count={skill.searchCount}
                  growth={skill.growthPercent}
                  value={skill.searchCount}
                  maxValue={Math.max(...stats.topSearchedSkills.map((s) => s.searchCount))}
                />
              ))}
            </div>
          </div>

          {/* Top Endorsed SMEs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Endorsed SMEs</h2>
              <Link
                href="/experts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {stats.topEndorsedSmes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No endorsements yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topEndorsedSmes.map((sme, index) => (
                  <Link
                    key={sme.id}
                    href={`/experts/${sme.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {sme.avatarUrl ? (
                        <img
                          src={sme.avatarUrl}
                          alt={sme.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        sme.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{sme.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {sme.department} • {sme.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{sme.totalEndorsements}</p>
                      <p className="text-xs text-gray-400">endorsements</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Endorsed Skills Table - Full Width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Most Endorsed Skills</h2>
          </div>
          {stats.mostEndorsedSkills.length > 0 ? (
            <MostEndorsedSkillsTable skills={stats.mostEndorsedSkills} />
          ) : (
            <div className="text-center py-8 text-gray-500">No skill endorsement data available</div>
          )}
        </div>

        {/* Training Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Training Delivery Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Training Delivery Trends</h2>
            </div>
            <TrainingAreaChart data={stats.trainingTrends} />
          </div>

          {/* Satisfaction Ratings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Satisfaction Ratings</h2>
            </div>
            <div className="space-y-6">
              {/* Overall Satisfaction */}
              <div className="text-center pb-6 border-b border-gray-200">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {(
                    stats.trainingTrends.reduce((sum, t) => sum + t.avgSatisfaction, 0) /
                    stats.trainingTrends.length
                  ).toFixed(1)}
                  <span className="text-2xl text-gray-500">/5</span>
                </div>
                <p className="text-sm text-gray-600">Overall Satisfaction</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">4.8</p>
                  <p className="text-xs text-gray-600 mt-1">Course Quality</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">4.7</p>
                  <p className="text-xs text-gray-600 mt-1">Instructor Rating</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">4.5</p>
                  <p className="text-xs text-gray-600 mt-1">Content Relevance</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">4.4</p>
                  <p className="text-xs text-gray-600 mt-1">Platform UX</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Platform Activity Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Platform Activity Trends</h2>
            </div>
            <ActivityLineChart data={stats.platformActivity} />
          </div>

          {/* Recent Platform Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Platform Activity</h2>
            </div>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => {
                const icon =
                  activity.type === "search" ? (
                    <Search className="w-4 h-4 text-blue-600" />
                  ) : activity.type === "endorsement" ? (
                    <ThumbsUp className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-600" />
                  );

                const bgColor =
                  activity.type === "search"
                    ? "bg-blue-100"
                    : activity.type === "endorsement"
                    ? "bg-purple-100"
                    : "bg-green-100";

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.user.name}</p>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Stats Row - 4 metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Average Response Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Timer className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.bottomMetrics.avgResponseTime}</p>
            <p className="text-sm text-gray-500">Average Response Time</p>
          </div>

          {/* Course Completion Rate */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.bottomMetrics.courseCompletionRate}%
            </p>
            <p className="text-sm text-gray-500">Course Completion Rate</p>
          </div>

          {/* Platform Engagement Score */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.bottomMetrics.engagementScore}
            </p>
            <p className="text-sm text-gray-500">Platform Engagement Score</p>
          </div>

          {/* Knowledge Sharing Index */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.bottomMetrics.knowledgeSharingIndex}
            </p>
            <p className="text-sm text-gray-500">Knowledge Sharing Index</p>
          </div>
        </div>
      </div>
    </div>
  );
}
