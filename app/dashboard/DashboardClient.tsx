"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiTeamLine,
  RiAwardLine,
  RiThumbUpLine,
  RiTimeLine,
  RiLineChartLine,
  RiBuilding2Line,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiArrowRightUpLine,
  RiBarChartLine,
  RiBookLine,
  RiGraduationCapLine,
  RiMapPinLine,
  RiSearchLine,
  RiEyeLine,
  RiTimer2Line,
  RiFocusLine,
  RiFlashlightLine,
  RiStarLine,
} from "@remixicon/react";
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
      imageUrl?: string;
    };
    nominatedBy: string;
  }>;
  topEndorsedSmes: Array<{
    id: string;
    name: string;
    position?: string;
    department?: string;
    imageUrl?: string;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RiLoader4Line className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Failed to load dashboard"}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
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
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-pending/20 text-status-pending">
          <RiTimeLine className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-success/20 text-status-success">
          <RiCheckboxCircleLine className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-error/20 text-status-error">
          <RiCloseCircleLine className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return <span className="text-xs text-muted-foreground">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Management Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive analytics and insights into SME program</p>
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
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <RiTeamLine className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-status-success bg-status-success/10 px-2 py-1 rounded-full">
                +{stats.trends.smesGrowth}% <RiLineChartLine className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.overview.totalSmes}</p>
            <p className="text-sm text-muted-foreground">Total SMEs</p>
            <p className="text-xs text-muted-foreground mt-2">from last month</p>
          </div>

          {/* Active Courses */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center">
                <RiBookLine className="w-6 h-6 text-chart-2" />
              </div>
              <span className="text-xs font-medium text-status-success bg-status-success/10 px-2 py-1 rounded-full">
                +{stats.trends.coursesGrowth}% <RiLineChartLine className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.overview.activeCourses}</p>
            <p className="text-sm text-muted-foreground">Active Courses</p>
            <p className="text-xs text-muted-foreground mt-2">from last month</p>
          </div>

          {/* Total Endorsements */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center">
                <RiThumbUpLine className="w-6 h-6 text-status-success" />
              </div>
              <span className="text-xs font-medium text-status-success bg-status-success/10 px-2 py-1 rounded-full">
                +{stats.trends.endorsementsGrowth}% <RiLineChartLine className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.overview.totalEndorsements}</p>
            <p className="text-sm text-muted-foreground">Total Endorsements</p>
            <p className="text-xs text-muted-foreground mt-2">from last month</p>
          </div>

          {/* Students Trained */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-4/10 rounded-xl flex items-center justify-center">
                <RiGraduationCapLine className="w-6 h-6 text-chart-4" />
              </div>
              <span className="text-xs font-medium text-status-success bg-status-success/10 px-2 py-1 rounded-full">
                +{stats.trends.studentsGrowth}% <RiLineChartLine className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.overview.studentsTrained}</p>
            <p className="text-sm text-muted-foreground">Students Trained</p>
            <p className="text-xs text-muted-foreground mt-2">from last month</p>
          </div>
        </div>

        {/* Charts Row 1 - SMEs by Department (Bar) & SMEs by Site (Pie) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SMEs by Department */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiBarChartLine className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">SMEs by Department</h2>
            </div>
            {stats.smesByDepartment.length > 0 ? (
              <DepartmentBarChart data={stats.smesByDepartment} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">No department data available</div>
            )}
          </div>

          {/* SMEs by Site */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiMapPinLine className="w-5 h-5 text-chart-2" />
              <h2 className="text-lg font-semibold text-foreground">SMEs by Site</h2>
            </div>
            {stats.smesBySite.length > 0 ? (
              <SitePieChart data={stats.smesBySite} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">No site data available</div>
            )}
          </div>
        </div>

        {/* Charts Row 2 - Top Searched Skills & Top Endorsed SMEs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Searched Skills */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiSearchLine className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Top Searched Skills</h2>
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
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Top Endorsed SMEs</h2>
              <Link
                href="/experts"
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                View all
                <RiArrowRightUpLine className="w-4 h-4" />
              </Link>
            </div>

            {stats.topEndorsedSmes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RiThumbUpLine className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No endorsements yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topEndorsedSmes.map((sme, index) => (
                  <Link
                    key={sme.id}
                    href={`/experts/${sme.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-status-pending flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                      {sme.imageUrl ? (
                        <img
                          src={sme.imageUrl}
                          alt={sme.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        sme.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{sme.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sme.department} • {sme.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-chart-2">{sme.totalEndorsements}</p>
                      <p className="text-xs text-muted-foreground">endorsements</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Endorsed Skills Table - Full Width */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <RiAwardLine className="w-5 h-5 text-chart-2" />
            <h2 className="text-lg font-semibold text-foreground">Most Endorsed Skills</h2>
          </div>
          {stats.mostEndorsedSkills.length > 0 ? (
            <MostEndorsedSkillsTable skills={stats.mostEndorsedSkills} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">No skill endorsement data available</div>
          )}
        </div>

        {/* Training Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Training Delivery Trends */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiLineChartLine className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Training Delivery Trends</h2>
            </div>
            <TrainingAreaChart data={stats.trainingTrends} />
          </div>

          {/* Satisfaction Ratings */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiStarLine className="w-5 h-5 text-status-pending" />
              <h2 className="text-lg font-semibold text-foreground">Satisfaction Ratings</h2>
            </div>
            <div className="space-y-6">
              {/* Overall Satisfaction */}
              <div className="text-center pb-6 border-b border-border">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {(
                    stats.trainingTrends.reduce((sum, t) => sum + t.avgSatisfaction, 0) /
                    stats.trainingTrends.length
                  ).toFixed(1)}
                  <span className="text-2xl text-muted-foreground">/5</span>
                </div>
                <p className="text-sm text-muted-foreground">Overall Satisfaction</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RiStarLine
                      key={star}
                      className="w-5 h-5 fill-status-pending text-status-pending"
                    />
                  ))}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">4.8</p>
                  <p className="text-xs text-muted-foreground mt-1">Course Quality</p>
                </div>
                <div className="bg-chart-2/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-chart-2">4.7</p>
                  <p className="text-xs text-muted-foreground mt-1">Instructor Rating</p>
                </div>
                <div className="bg-status-success/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-status-success">4.5</p>
                  <p className="text-xs text-muted-foreground mt-1">Content Relevance</p>
                </div>
                <div className="bg-chart-4/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-chart-4">4.4</p>
                  <p className="text-xs text-muted-foreground mt-1">Platform UX</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Platform Activity Trends */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiFlashlightLine className="w-5 h-5 text-status-pending" />
              <h2 className="text-lg font-semibold text-foreground">Platform Activity Trends</h2>
            </div>
            <ActivityLineChart data={stats.platformActivity} />
          </div>

          {/* Recent Platform Activity */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <RiTimeLine className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recent Platform Activity</h2>
            </div>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => {
                const icon =
                  activity.type === "search" ? (
                    <RiSearchLine className="w-4 h-4 text-primary" />
                  ) : activity.type === "endorsement" ? (
                    <RiThumbUpLine className="w-4 h-4 text-chart-2" />
                  ) : (
                    <RiEyeLine className="w-4 h-4 text-status-success" />
                  );

                const bgColor =
                  activity.type === "search"
                    ? "bg-primary/10"
                    : activity.type === "endorsement"
                    ? "bg-chart-2/10"
                    : "bg-status-success/10";

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{activity.user.name}</p>
                        <span className="text-muted-foreground/50">•</span>
                        <p className="text-xs text-muted-foreground">
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
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <RiTimer2Line className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.bottomMetrics.avgResponseTime}</p>
            <p className="text-sm text-muted-foreground">Average Response Time</p>
          </div>

          {/* Course Completion Rate */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center mb-4">
              <RiCheckboxCircleLine className="w-6 h-6 text-status-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.bottomMetrics.courseCompletionRate}%
            </p>
            <p className="text-sm text-muted-foreground">Course Completion Rate</p>
          </div>

          {/* Platform Engagement Score */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center mb-4">
              <RiFocusLine className="w-6 h-6 text-chart-2" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.bottomMetrics.engagementScore}
            </p>
            <p className="text-sm text-muted-foreground">Platform Engagement Score</p>
          </div>

          {/* Knowledge Sharing Index */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="w-12 h-12 bg-status-pending/10 rounded-xl flex items-center justify-center mb-4">
              <RiTeamLine className="w-6 h-6 text-status-pending" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.bottomMetrics.knowledgeSharingIndex}
            </p>
            <p className="text-sm text-muted-foreground">Knowledge Sharing Index</p>
          </div>
        </div>
      </div>
    </div>
  );
}
