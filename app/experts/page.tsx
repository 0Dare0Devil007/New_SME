"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, MapPin, Building2, Sparkles, Award, TrendingUp, ChevronDown, Search } from "lucide-react";
import { SmeCard } from "@/components/SmeCard";

interface Expert {
  id: string;
  name: string;
  position: string;
  department: string;
  siteName: string;
  avatarUrl?: string;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-12 pb-[72px]">
        <div className="max-w-[1200px] mx-auto px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-9">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <h2 className="text-4xl font-bold text-white">All Experts</h2>
            <p className="text-lg text-blue-100">
              Browse {experts.length} subject matter experts across the organization
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white/95 rounded-lg px-3 py-1 flex items-center gap-2 max-w-[672px] mx-auto">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search experts by name, department, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-2.5 text-sm bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-8 -mt-[48px] pb-12">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm p-6 mb-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-900" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <FilterButton icon={<MapPin className="w-4 h-4" />} label="All Locations" />
              <FilterButton icon={<Building2 className="w-4 h-4" />} label="All Departments" />
              <FilterButton icon={<Sparkles className="w-4 h-4" />} label="All Skills" />
              <FilterButton icon={<Award className="w-4 h-4" />} label="All Certifications" />
              <FilterButton icon={<TrendingUp className="w-4 h-4" />} label="All Levels" />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-8">
          Found <span className="font-semibold text-gray-900">{filteredExperts.length}</span> experts
        </p>

        {/* Experts List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExperts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">No experts found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
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
    <button className="flex items-center justify-between gap-3 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-lg px-3.5 py-2 transition-colors">
      {icon}
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <ChevronDown className="w-4 h-4 text-gray-900" />
    </button>
  );
}
