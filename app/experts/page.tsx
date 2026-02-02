"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  RiArrowLeftLine, 
  RiFilterLine, 
  RiMapPinLine, 
  RiBuilding2Line, 
  RiMagicLine, 
  RiArrowDownSLine, 
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine
} from "@remixicon/react";
import { SmeCard } from "@/components/SmeCard";

const ITEMS_PER_PAGE = 10;

interface Expert {
  id: string;
  name: string;
  position: string;
  department: string;
  siteName: string;
  imageUrl?: string;
  bio?: string;
  skills: Array<{
    name: string;
    color: string;
  }>;
  certifications: Array<{
    title: string;
    color: string;
  }>;
  endorsementCount: number;
}

interface FilterOptions {
  locations: string[];
  departments: string[];
  skills: string[];
}

interface APIResponse {
  experts: Expert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: FilterOptions;
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  
  // Available filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: [],
    departments: [],
    skills: [],
  });

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedLocation, selectedDepartment, selectedSkill]);

  // Fetch experts with server-side pagination
  useEffect(() => {
    async function fetchExperts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedLocation !== "all") params.set("location", selectedLocation);
        if (selectedDepartment !== "all") params.set("department", selectedDepartment);
        if (selectedSkill !== "all") params.set("skill", selectedSkill);

        const response = await fetch(`/api/experts?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error fetching experts:", errorData?.error || response.statusText, errorData?.details || "");
          setExperts([]);
          setTotalCount(0);
          setTotalPages(1);
          return;
        }
        
        const data: APIResponse = await response.json();
        
        setExperts(data.experts);
        setTotalCount(data.total);
        setTotalPages(data.totalPages);
        setFilterOptions(data.filters);
      } catch (error) {
        console.error("Error fetching experts:", error);
        setExperts([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExperts();
  }, [currentPage, debouncedSearch, selectedLocation, selectedDepartment, selectedSkill]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Memoize page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary pt-12 pb-[72px]">
        <div className="max-w-[1200px] mx-auto px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors mb-9">
            <RiArrowLeftLine className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <h2 className="text-4xl font-bold text-primary-foreground">All Experts</h2>
            <p className="text-lg text-primary-foreground/80">
              Browse {totalCount} subject matter experts across the organization
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-card/95 rounded-lg px-3 py-1 flex items-center gap-2 max-w-[672px] mx-auto">
            <RiSearchLine className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search experts by name, department, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2.5 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-8 -mt-[48px] pb-12">
        {/* Filters */}
        <div className="bg-card border border-border rounded-[14px] shadow-sm p-6 mb-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <RiFilterLine className="w-5 h-5 text-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {/* Location Filter */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "location" ? null : "location")}
                  className="flex items-center justify-between gap-3 bg-muted hover:bg-accent border border-transparent rounded-lg px-3.5 py-2 transition-colors"
                >
                  <RiMapPinLine className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">
                    {selectedLocation === "all" ? "All Locations" : selectedLocation}
                  </span>
                  <RiArrowDownSLine className="w-4 h-4 text-foreground" />
                </button>
                {openDropdown === "location" && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedLocation("all"); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedLocation === "all" ? "bg-muted font-medium" : ""}`}
                    >
                      All Locations
                    </button>
                    {filterOptions.locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => { setSelectedLocation(loc); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedLocation === loc ? "bg-muted font-medium" : ""}`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Department Filter */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "department" ? null : "department")}
                  className="flex items-center justify-between gap-3 bg-muted hover:bg-accent border border-transparent rounded-lg px-3.5 py-2 transition-colors"
                >
                  <RiBuilding2Line className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">
                    {selectedDepartment === "all" ? "All Departments" : selectedDepartment}
                  </span>
                  <RiArrowDownSLine className="w-4 h-4 text-foreground" />
                </button>
                {openDropdown === "department" && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedDepartment("all"); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedDepartment === "all" ? "bg-muted font-medium" : ""}`}
                    >
                      All Departments
                    </button>
                    {filterOptions.departments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => { setSelectedDepartment(dept); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedDepartment === dept ? "bg-muted font-medium" : ""}`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Filter */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "skill" ? null : "skill")}
                  className="flex items-center justify-between gap-3 bg-muted hover:bg-accent border border-transparent rounded-lg px-3.5 py-2 transition-colors"
                >
                  <RiMagicLine className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">
                    {selectedSkill === "all" ? "All Skills" : selectedSkill}
                  </span>
                  <RiArrowDownSLine className="w-4 h-4 text-foreground" />
                </button>
                {openDropdown === "skill" && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedSkill("all"); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedSkill === "all" ? "bg-muted font-medium" : ""}`}
                    >
                      All Skills
                    </button>
                    {filterOptions.skills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => { setSelectedSkill(skill); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedSkill === skill ? "bg-muted font-medium" : ""}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(selectedLocation !== "all" || selectedDepartment !== "all" || selectedSkill !== "all" || debouncedSearch) && (
                <button
                  onClick={() => {
                    setSelectedLocation("all");
                    setSelectedDepartment("all");
                    setSelectedSkill("all");
                    setSearchQuery("");
                    setOpenDropdown(null);
                  }}
                  className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg px-3.5 py-2 transition-colors"
                >
                  <RiCloseLine className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{totalCount}</span> experts
            {experts.length > 0 && (
              <span className="ml-2">
                (showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)})
              </span>
            )}
          </p>
        </div>

        {/* Experts List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No experts found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {experts.map((expert) => (
                <SmeCard key={expert.id} expert={expert} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RiArrowLeftSLine className="w-4 h-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, index) => (
                    typeof page === 'number' ? (
                      <button
                        key={index}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-muted'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-2 text-muted-foreground">
                        {page}
                      </span>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <RiArrowRightSLine className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
