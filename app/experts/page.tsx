"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  RiArrowLeftLine, 
  RiFilterLine, 
  RiMapPinLine, 
  RiBuilding2Line, 
  RiMagicLine, 
  RiAwardLine, 
  RiLineChartLine, 
  RiArrowDownSLine, 
  RiSearchLine 
} from "@remixicon/react";
import { SmeCard } from "@/components/SmeCard";

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

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedCertification, setSelectedCertification] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    async function fetchExperts() {
      try {
        const response = await fetch("/api/experts");
        const data = await response.json();
        setExperts(data);
        setFilteredExperts(data);
      } catch (error) {
        console.error("Error fetching experts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExperts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...experts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (expert) =>
          expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expert.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expert.skills.some((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((expert) => expert.siteName === selectedLocation);
    }

    // Department filter
    if (selectedDepartment !== "all") {
      filtered = filtered.filter((expert) => expert.department === selectedDepartment);
    }

    // Skill filter
    if (selectedSkill !== "all") {
      filtered = filtered.filter((expert) =>
        expert.skills.some((skill) => skill.name === selectedSkill)
      );
    }

    setFilteredExperts(filtered);
  }, [searchQuery, selectedLocation, selectedDepartment, selectedSkill, selectedCertification, selectedLevel, experts]);

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
              Browse {experts.length} subject matter experts across the organization
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
              <FilterButton icon={<RiMapPinLine className="w-4 h-4" />} label="All Locations" />
              <FilterButton icon={<RiBuilding2Line className="w-4 h-4" />} label="All Departments" />
              <FilterButton icon={<RiMagicLine className="w-4 h-4" />} label="All Skills" />
              <FilterButton icon={<RiAwardLine className="w-4 h-4" />} label="All Certifications" />
              <FilterButton icon={<RiLineChartLine className="w-4 h-4" />} label="All Levels" />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-8">
          Found <span className="font-semibold text-foreground">{filteredExperts.length}</span> experts
        </p>

        {/* Experts List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredExperts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No experts found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExperts.map((expert) => (
              <SmeCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center justify-between gap-3 bg-muted hover:bg-accent border border-transparent rounded-lg px-3.5 py-2 transition-colors">
      {icon}
      <span className="text-sm font-medium text-foreground">{label}</span>
      <RiArrowDownSLine className="w-4 h-4 text-foreground" />
    </button>
  );
}
