"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Building,
  Award,
  ThumbsUp,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface SmeProfile {
  id: string;
  status: string;
  statusReason?: string;
  createdAt: string;
  employee: {
    id: string;
    empNumber: string;
    name: string;
    email: string;
    position: string;
    department: string;
    siteName: string;
    avatarUrl?: string;
  };
  skills: Array<{
    id: string;
    name: string;
    endorsementCount: number;
  }>;
  totalEndorsements: number;
}

export default function DepartmentSmesClient() {
  const [smes, setSmes] = useState<SmeProfile[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch SMEs
  useEffect(() => {
    async function fetchSmes() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (searchTerm) params.set("search", searchTerm);

        const response = await fetch(`/api/department-smes?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSmes(data.smes || []);
          setDepartments(data.departments || []);
        }
      } catch (err) {
        console.error("Failed to fetch SMEs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSmes();
  }, [statusFilter, searchTerm]);

  const handleStatusToggle = async (smeId: string, currentStatus: string) => {
    setActionLoading(smeId);
    setError(null);
    setSuccess(null);

    const newStatus = currentStatus === "APPROVED" ? "SUSPENDED" : "APPROVED";

    try {
      const response = await fetch(`/api/department-smes/${smeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      // Update local state
      setSmes(smes.map((sme) =>
        sme.id === smeId ? { ...sme, status: newStatus } : sme
      ));

      setSuccess(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (smeId: string) => {
    setActionLoading(smeId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/department-smes/${smeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete SME");
      }

      // Remove from local state
      setSmes(smes.filter((sme) => sme.id !== smeId));
      setDeleteConfirm(null);
      setSuccess(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete SME");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      );
    }
    if (status === "SUSPENDED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Department SMEs</h1>
          <p className="text-gray-600">
            Manage Subject Matter Experts in your department
            {departments.length > 0 && (
              <span className="ml-2 text-sm">
                ({departments.join(", ")})
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {["ALL", "APPROVED", "SUSPENDED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status === "ALL" ? "All" : status === "APPROVED" ? "Active" : "Suspended"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* SME List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : smes.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No SMEs found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No SMEs in your department yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {smes.map((sme) => (
                <div key={sme.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                        {sme.employee.avatarUrl ? (
                          <img
                            src={sme.employee.avatarUrl}
                            alt={sme.employee.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          sme.employee.name.split(" ").map((n) => n[0]).join("")
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">{sme.employee.name}</h3>
                          {getStatusBadge(sme.status)}
                        </div>
                        <p className="text-gray-600 text-sm">{sme.employee.position}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {sme.employee.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {sme.skills.length} skills
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {sme.totalEndorsements} endorsements
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/experts/${sme.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>

                      <button
                        onClick={() => handleStatusToggle(sme.id, sme.status)}
                        disabled={actionLoading === sme.id}
                        className={`p-2 rounded-lg transition-colors ${
                          sme.status === "APPROVED"
                            ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title={sme.status === "APPROVED" ? "Suspend" : "Activate"}
                      >
                        {actionLoading === sme.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : sme.status === "APPROVED" ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(sme.id)}
                        disabled={actionLoading === sme.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Skills Preview */}
                  {sme.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sme.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs"
                        >
                          {skill.name}
                          <span className="text-gray-400">({skill.endorsementCount})</span>
                        </span>
                      ))}
                      {sme.skills.length > 5 && (
                        <span className="text-xs text-gray-400">
                          +{sme.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete SME Profile</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this SME profile? All skills, endorsements,
                certifications, and courses associated with this profile will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={actionLoading === deleteConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteConfirm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
