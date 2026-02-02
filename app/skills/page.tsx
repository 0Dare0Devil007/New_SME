"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import Link from "next/link";

interface Skill {
  name: string;
  experts: number;
  description: string;
  gradient: string;
  imageUrl: string;
  topExperts?: string[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ViewAllSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 5,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch skills with pagination
  async function fetchSkills(page: number, search: string) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        ...(search && { search })
      });
      
      const response = await fetch(`/api/skills?${params}`);
      const data = await response.json();
      
      setSkills(data.skills || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 5,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } catch (error) {
      console.error("Error fetching skills:", error);
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchSkills(1, searchQuery);
  }, []);

  // Debounced search (reset to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSkills(1, searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Page navigation handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSkills(newPage, searchQuery);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(pagination.currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(pagination.currentPage + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-primary/90 dark:via-primary/80 dark:to-primary/70 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute top-8 right-40 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 py-12">
          {/* Back to Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>

          {/* Title and Description */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white mb-3">All Skills</h2>
            <p className="text-lg text-blue-100">
              Browse all {pagination.totalCount} skill areas and find the right expert for you
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search skills by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-card text-foreground rounded-[14px] border-none shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Skills List */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Results count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {pagination.totalCount > 0 
                ? `${(pagination.currentPage - 1) * pagination.limit + 1}-${Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}`
                : "0"}
            </span>{" "}
            of <span className="font-semibold text-foreground">{pagination.totalCount}</span> skills
          </p>
        </div>

        {/* Skills Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {searchQuery 
                ? "No skills found matching your search."
                : "No skills available."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {skills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPreviousPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    !pagination.hasPreviousPage
                      ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        pagination.currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    !pagination.hasNextPage
                      ? "border-border text-muted-foreground cursor-not-allowed"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
