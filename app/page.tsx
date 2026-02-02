"use client";

import { useState, useEffect } from "react";
import {
  RiGridLine,
  RiStarFill,
  RiThumbUpLine,
  RiVipCrownFill,
} from "@remixicon/react";
import { SkillCard } from "@/components/SkillCard";
import Link from "next/link";

interface Skill {
  name: string;
  experts: number;
  description: string;
  gradient: string;
  imageUrl: string;
  topExperts: string[];
}

interface FeaturedExpert {
  id: string;
  name: string;
  role: string;
  skills: string;
  endorsements: number;
  verified: boolean;
  imageUrl?: string;
}

function ExpertCard({ expert }: { expert: FeaturedExpert }) {
  return (
    <Link href={`/experts/${expert.id}`} className="flex gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
      <div className="relative shrink-0">
        {expert.imageUrl ? (
          <img 
            src={expert.imageUrl} 
            alt={expert.name}
            className="w-12 h-12 rounded-full border-2 border-border object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary border-2 border-border" />
        )}
        {expert.verified && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-status-pending rounded-full flex items-center justify-center">
            <RiVipCrownFill className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{expert.name}</p>
        <p className="text-muted-foreground text-xs">{expert.role}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-muted text-foreground text-[10px] font-medium px-2 py-0.5 rounded-lg">
            {expert.skills}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <RiThumbUpLine className="w-3 h-3" />
            <span className="text-xs">{expert.endorsements}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [featuredExperts, setFeaturedExperts] = useState<FeaturedExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSMEs, setTotalSMEs] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [skillsRes, expertsRes, allExpertsRes] = await Promise.all([
          fetch("/api/skills?limit=8"), // Fetch first 8 skills for homepage preview
          fetch("/api/featured-experts"),
          fetch("/api/experts"), // Fetch all experts to get accurate count
        ]);

        const skillsData = await skillsRes.json();
        const expertsData = await expertsRes.json();
        const allExpertsData = await allExpertsRes.json();

        // Handle new paginated API response format
        const skills = Array.isArray(skillsData) ? skillsData : (skillsData.skills || []);
        setSkills(skills);
        
        // Handle featured experts - ensure it's an array
        const experts = Array.isArray(expertsData) ? expertsData : [];
        setFeaturedExperts(experts);
        
        // Set total SMEs from actual expert count
        const allExperts = Array.isArray(allExpertsData) ? allExpertsData : [];
        setTotalSMEs(allExperts.length);
        
        // Set total skills from pagination metadata
        setTotalSkills(skillsData.pagination?.totalCount || skills.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute top-8 right-40 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center px-8">
              <p className="text-3xl font-bold text-primary-foreground">
                {isLoading ? "..." : totalSMEs}
              </p>
              <p className="text-sm text-primary-foreground/80">Active SMEs</p>
            </div>
            <div className="text-center px-8 border-x border-primary-foreground/30">
              <p className="text-3xl font-bold text-primary-foreground">
                {isLoading ? "..." : totalSkills}
              </p>
              <p className="text-sm text-primary-foreground/80">Skill Areas</p>
            </div>
            <div className="text-center px-8">
              <p className="text-3xl font-bold text-primary-foreground">12</p>
              <p className="text-sm text-primary-foreground/80">Departments</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary-foreground mb-3">
              Find Your Subject Matter Expert
            </h2>
            <p className="text-lg text-primary-foreground/80">
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
                <h3 className="text-2xl font-bold text-foreground">Browse Skills</h3>
                <p className="text-muted-foreground">Discover experts by skill area and connect with top talent</p>
              </div>
              <Link href="/skills" className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                <RiGridLine className="w-4 h-4" />
                <span className="text-sm font-medium">View All</span>
              </Link>
            </div>

            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <div className="bg-card border border-border rounded-[14px] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <RiStarFill className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-foreground">Featured Experts</h4>
              </div>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  featuredExperts.map((expert) => (
                    <ExpertCard key={expert.name} expert={expert} />
                  ))
                )}
              </div>
              <Link href="/experts" className="block w-full mt-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-center">
                View All Experts
              </Link>
            </div>

            {/* Platform Insights */}
            <div className="bg-muted border border-border rounded-[14px] p-6">
              <h4 className="font-bold text-foreground mb-4">Platform Insights</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New SMEs This Month</span>
                  <span className="font-bold text-primary">+12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Courses</span>
                  <span className="font-bold text-primary">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Endorsements</span>
                  <span className="font-bold text-primary">2.4K</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
