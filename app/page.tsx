"use client";

import { useState, useEffect } from "react";
import { Grid3X3 } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import Link from "next/link";

// Figma asset URLs (valid for 7 days)
const icons = {
  dataAnalytics: "https://www.figma.com/api/mcp/asset/f22b2b4a-198e-4088-9346-d2546b2e7eac",
  projectManagement: "https://www.figma.com/api/mcp/asset/e49359a9-b7e2-4d06-aa17-e7e7c069b442",
  cloudArchitecture: "https://www.figma.com/api/mcp/asset/1ce4173a-a361-4345-b677-252eb53f9dc9",
  machineLearning: "https://www.figma.com/api/mcp/asset/c7451f0f-24b5-4c31-bf85-76fbe03638ba",
  uxDesign: "https://www.figma.com/api/mcp/asset/89bc3c8b-f464-4da2-afb8-8e2c7dcf443a",
  cybersecurity: "https://www.figma.com/api/mcp/asset/aba9223a-c604-4df9-ad09-cf3827554538",
  financialModeling: "https://www.figma.com/api/mcp/asset/9df26c40-a0d2-430a-985f-5718e2972548",
  supplyChain: "https://www.figma.com/api/mcp/asset/2dfa4fde-e412-4407-bb5d-d6fa3d84459d",
  starIcon: "https://www.figma.com/api/mcp/asset/a4136c9c-8377-41dc-9a13-3cdcc04066fb",
  featuredExperts: "https://www.figma.com/api/mcp/asset/a5ff9a17-a878-4c41-abc5-516df7b642fb",
  endorsement: "https://www.figma.com/api/mcp/asset/2228c919-0b36-4fb1-9b5f-9562cea6034e",
  crownIcon: "https://www.figma.com/api/mcp/asset/e9f7105a-6d94-451e-9eca-f20e0afd8bf1",
  logo: "https://www.figma.com/api/mcp/asset/5620935f-81a4-4a77-92b8-6f7daf97b245",
};

interface Skill {
  name: string;
  experts: number;
  description: string;
  gradient: string;
  icon: string;
  topExperts: string[];
}

interface FeaturedExpert {
  name: string;
  role: string;
  skills: string;
  endorsements: number;
  verified: boolean;
}

function ExpertCard({ expert }: { expert: FeaturedExpert }) {
  return (
    <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-100" />
        {expert.verified && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <img src={icons.crownIcon} alt="Verified" className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{expert.name}</p>
        <p className="text-gray-500 text-xs">{expert.role}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-lg">
            {expert.skills}
          </span>
          <div className="flex items-center gap-1 text-gray-500">
            <img src={icons.endorsement} alt="Endorsements" className="w-3 h-3" />
            <span className="text-xs">{expert.endorsements}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [featuredExperts, setFeaturedExperts] = useState<FeaturedExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSMEs, setTotalSMEs] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [skillsRes, expertsRes] = await Promise.all([
          fetch("/api/skills?limit=8"), // Fetch first 8 skills for homepage preview
          fetch("/api/featured-experts"),
        ]);

        const skillsData = await skillsRes.json();
        const expertsData = await expertsRes.json();

        // Handle new paginated API response format
        const skills = skillsData.skills || skillsData;
        setSkills(skills);
        setFeaturedExperts(expertsData);
        
        // Calculate total SMEs across displayed skills
        const total = skills.reduce((sum: number, skill: Skill) => sum + skill.experts, 0);
        setTotalSMEs(total);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute top-8 right-40 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center px-8">
              <p className="text-3xl font-bold text-white">
                {isLoading ? "..." : `${totalSMEs}+`}
              </p>
              <p className="text-sm text-blue-100">Active SMEs</p>
            </div>
            <div className="text-center px-8 border-x border-blue-400/30">
              <p className="text-3xl font-bold text-white">
                {isLoading ? "..." : skills.length}
              </p>
              <p className="text-sm text-blue-100">Skill Areas</p>
            </div>
            <div className="text-center px-8">
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-sm text-blue-100">Departments</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-3">
              Find Your Subject Matter Expert
            </h2>
            <p className="text-lg text-blue-100">
              Connect with internal experts across skills, departments, and locations
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex gap-8">
          {/* Skills Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Browse Skills</h3>
                <p className="text-gray-600">Discover experts by skill area and connect with top talent</p>
              </div>
              <Link href="/skills" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">View All</span>
              </Link>
            </div>

            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-80 shrink-0 space-y-6">
            {/* Featured Experts */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <img src={icons.featuredExperts} alt="Featured" className="w-5 h-5" />
                <h4 className="font-bold text-gray-900">Featured Experts</h4>
              </div>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  featuredExperts.map((expert) => (
                    <ExpertCard key={expert.name} expert={expert} />
                  ))
                )}
              </div>
              <Link href="/experts" className="block w-full mt-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center">
                View All Experts
              </Link>
            </div>

            {/* Platform Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[14px] p-6">
              <h4 className="font-bold text-gray-900 mb-4">Platform Insights</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New SMEs This Month</span>
                  <span className="font-bold text-blue-600">+12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Courses</span>
                  <span className="font-bold text-blue-600">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Endorsements</span>
                  <span className="font-bold text-blue-600">2.4K</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
