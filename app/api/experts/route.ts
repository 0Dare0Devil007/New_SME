import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Skill color mapping for consistent UI
const skillColors: Record<string, string> = {
  "Cloud Architecture": "bg-purple-50 border-purple-300 text-purple-800",
  "Project Management": "bg-green-50 border-green-300 text-green-800",
  "Leadership": "bg-amber-50 border-amber-300 text-amber-800",
  "Communication": "bg-rose-50 border-rose-300 text-rose-800",
  "Data Analytics": "bg-blue-50 border-blue-200 text-blue-800",
  "Machine Learning": "bg-indigo-50 border-indigo-200 text-indigo-800",
  "UX/UI Design": "bg-pink-50 border-pink-200 text-pink-800",
  "UX Design": "bg-pink-50 border-pink-200 text-pink-800",
  "Cybersecurity": "bg-red-50 border-red-200 text-red-800",
  "Financial Modeling": "bg-slate-50 border-slate-200 text-slate-800",
  "Supply Chain Management": "bg-teal-50 border-teal-200 text-teal-800",
};

const certificationColors: Record<string, string> = {
  "Professional Certification": "bg-blue-50 border-blue-200 text-blue-700",
  "Advanced Training": "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Industry Expert": "bg-cyan-50 border-cyan-200 text-cyan-700",
};

function getSkillColor(skillName: string): string {
  return skillColors[skillName] || "bg-gray-50 border-gray-200 text-gray-800";
}

function getCertificationColor(certTitle: string): string {
  // Try to match partial certification names
  for (const [key, color] of Object.entries(certificationColors)) {
    if (certTitle.includes(key) || key.includes(certTitle)) {
      return color;
    }
  }
  return "bg-blue-50 border-blue-200 text-blue-700";
}

export async function GET() {
  try {
    // Fetch all SME profiles with related data
    const smeProfiles = await prisma.smeProfile.findMany({
      where: {
        status: "APPROVED", // Only show approved SMEs
      },
      include: {
        employee: true,
        skills: {
          where: {
            isActive: true,
          },
          include: {
            skill: true,
            endorsements: true,
          },
        },
        certifications: true,
      },
    });

    // Transform data for the frontend
    const experts = smeProfiles.map((sme) => {
      // Calculate total endorsements across all skills
      const totalEndorsements = sme.skills.reduce(
        (sum, smeSkill) => sum + smeSkill.endorsements.length,
        0
      );

      // Get unique skills with colors
      const skills = sme.skills.map((smeSkill) => ({
        name: smeSkill.skill.skillName,
        color: getSkillColor(smeSkill.skill.skillName),
      }));

      // Get certifications with colors
      const certifications = sme.certifications.map((cert) => ({
        title: cert.title,
        color: getCertificationColor(cert.title),
      }));

      return {
        id: sme.smeId.toString(),
        name: sme.employee.fullName,
        position: sme.employee.position || "Subject Matter Expert",
        department: sme.employee.departmentName || "General",
        siteName: sme.employee.siteName || "Main Office",
        avatarUrl: sme.employee.avatarUrl || undefined,
        bio: sme.bio || undefined,
        skills,
        certifications,
        endorsementCount: totalEndorsements,
      };
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error("Error fetching experts:", error);
    return NextResponse.json(
      { error: "Failed to fetch experts" },
      { status: 500 }
    );
  }
}
