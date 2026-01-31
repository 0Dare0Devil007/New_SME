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
} from "lucide-react";

interface DashboardStats {
  overview: {
    totalSmes: number;
    approvedSmes: number;
    suspendedSmes: number;
    pendingNominations: number;
    totalEndorsements: number;
    totalSkills: number;
  };
  smesByStatus: Array<{
    status: string;
    count: number;
  }>;
  smesByDepartment: Array<{
    department: string;
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
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          throw new Error("Failed to fetch dashboard stats");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of SME program metrics and activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total SMEs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalSmes}</p>
            <p className="text-sm text-gray-500">Total SMEs</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-green-600">{stats.overview.approvedSmes} active</span>
              <span className="text-gray-300">|</span>
              <span className="text-red-600">{stats.overview.suspendedSmes} suspended</span>
            </div>
          </div>

          {/* Pending Nominations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.pendingNominations}</p>
            <p className="text-sm text-gray-500">Pending Nominations</p>
            <p className="text-xs text-gray-400 mt-2">Awaiting profile creation</p>
          </div>

          {/* Total Endorsements */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +8% <TrendingUp className="w-3 h-3 inline" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalEndorsements}</p>
            <p className="text-sm text-gray-500">Total Endorsements</p>
            <p className="text-xs text-gray-400 mt-2">Across all SMEs</p>
          </div>

          {/* Active Skills */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalSkills}</p>
            <p className="text-sm text-gray-500">Active Skills</p>
            <p className="text-xs text-gray-400 mt-2">In the skill catalog</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Nominations */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Nominations</h2>
              <Link
                href="/nominations"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {stats.recentNominations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent nominations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentNominations.slice(0, 5).map((nom) => (
                  <div
                    key={nom.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {nom.nominee.avatarUrl ? (
                          <img
                            src={nom.nominee.avatarUrl}
                            alt={nom.nominee.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          nom.nominee.name.split(" ").map((n) => n[0]).join("")
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{nom.nominee.name}</p>
                        <p className="text-xs text-gray-500">
                          Nominated by {nom.nominatedBy}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(nom.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(nom.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Endorsed SMEs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Endorsed SMEs</h2>
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
                      <p className="text-xs text-gray-500 truncate">{sme.department}</p>
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

        {/* Department Breakdown */}
        {stats.smesByDepartment.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">SMEs by Department</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.smesByDepartment.map((dept) => (
                <div
                  key={dept.department}
                  className="bg-gray-50 rounded-xl p-4 text-center"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{dept.count}</p>
                  <p className="text-xs text-gray-500 truncate" title={dept.department}>
                    {dept.department}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
