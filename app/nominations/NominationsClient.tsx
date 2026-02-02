"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Loader2,
  User,
  Building,
  MapPin,
  Mail
} from "lucide-react";

interface Employee {
  id: string;
  empNumber: string;
  name: string;
  email: string;
  position: string;
  department: string;
  siteName: string;
  imageUrl?: string;
}

interface Nomination {
  id: string;
  status: string;
  requestedAt: string;
  decisionAt?: string;
  decisionNote?: string;
  nominee: {
    id: string;
    name: string;
    email: string;
    position: string;
    department: string;
    siteName: string;
    imageUrl?: string;
    hasProfile: boolean;
    profileStatus?: string;
  };
}

export default function NominationsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [searching, setSearching] = useState(false);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loadingNominations, setLoadingNominations] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [nominating, setNominating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing nominations
  useEffect(() => {
    async function fetchNominations() {
      try {
        const response = await fetch("/api/nominations");
        if (response.ok) {
          const data = await response.json();
          setNominations(data.nominations || []);
        }
      } catch (err) {
        console.error("Failed to fetch nominations:", err);
      } finally {
        setLoadingNominations(false);
      }
    }
    fetchNominations();
  }, []);

  // Search employees
  const searchEmployees = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/employees?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to search employees:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEmployees(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchEmployees]);

  // Submit nomination
  const handleNominate = async () => {
    if (!selectedEmployee) return;

    setNominating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/nominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomineeEmployeeId: selectedEmployee.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to nominate employee");
      }

      setSuccess(`Successfully nominated ${selectedEmployee.name} as an SME!`);
      setSelectedEmployee(null);
      setSearchTerm("");
      setSearchResults([]);

      // Refresh nominations list
      const nomResponse = await fetch("/api/nominations");
      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        setNominations(nomData.nominations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to nominate");
    } finally {
      setNominating(false);
    }
  };

  const getStatusBadge = (status: string, hasProfile: boolean) => {
    if (status === "SUBMITTED" && !hasProfile) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          <Clock className="w-3 h-3" />
          Pending Profile
        </span>
      );
    }
    if (status === "APPROVED" || hasProfile) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          Active SME
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Nominate SMEs</h1>
          <p className="text-muted-foreground">
            As a Team Leader, you can nominate team members to become Subject Matter Experts.
          </p>
        </div>

        {/* Nomination Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            New Nomination
          </h2>

          {/* Search Input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searching ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search employees by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedEmployee && (
            <div className="border border-border rounded-xl overflow-hidden mb-4">
              {searchResults.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors border-b border-border last:border-0 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                    {employee.imageUrl ? (
                      <img
                        src={employee.imageUrl}
                        alt={employee.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      employee.name.split(" ").map((n) => n[0]).join("")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {employee.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {employee.siteName}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Employee */}
          {selectedEmployee && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-lg">
                    {selectedEmployee.imageUrl ? (
                      <img
                        src={selectedEmployee.imageUrl}
                        alt={selectedEmployee.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedEmployee.name.split(" ").map((n) => n[0]).join("")
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">{selectedEmployee.name}</p>
                    <p className="text-muted-foreground">{selectedEmployee.position}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {selectedEmployee.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedEmployee.email}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleNominate}
            disabled={!selectedEmployee || nominating}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {nominating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Nominating...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Nominate as SME
              </>
            )}
          </button>
        </div>

        {/* Previous Nominations */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Your Nominations
          </h2>

          {loadingNominations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : nominations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>You haven&apos;t nominated anyone yet.</p>
              <p className="text-sm">Search for an employee above to make your first nomination.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nominations.map((nomination) => (
                <div
                  key={nomination.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                      {nomination.nominee.imageUrl ? (
                        <img
                          src={nomination.nominee.imageUrl}
                          alt={nomination.nominee.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        nomination.nominee.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{nomination.nominee.name}</p>
                      <p className="text-sm text-muted-foreground">{nomination.nominee.position}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nominated on {new Date(nomination.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(nomination.status, nomination.nominee.hasProfile)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
