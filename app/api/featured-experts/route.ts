import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch top SMEs based on total endorsements across all their skills
    const smeProfiles = await prisma.smeProfile.findMany({
      where: {
        status: "APPROVED",
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
      },
      take: 50, // Get more than we need to sort and filter
    });

    // Calculate total endorsements for each SME
    const smesWithEndorsements = smeProfiles
      .map((sme) => {
        const totalEndorsements = sme.skills.reduce(
          (sum, skill) => sum + skill.endorsements.length,
          0
        );
        
        // Get primary skill (the one with most endorsements)
        const primarySkill = sme.skills.sort(
          (a, b) => b.endorsements.length - a.endorsements.length
        )[0];

        return {
          id: sme.smeId.toString(),
          name: sme.employee.fullName,
          role: sme.employee.position || "SME",
          skills: primarySkill?.skill.skillName || "Multiple Skills",
          endorsements: totalEndorsements,
          verified: totalEndorsements >= 50, // Mark as verified if 50+ endorsements
          imageUrl: sme.employee.imageUrl,
        };
      })
      .sort((a, b) => b.endorsements - a.endorsements)
      .slice(0, 4); // Get top 4

    return NextResponse.json(smesWithEndorsements);
  } catch (error) {
    console.error("Error fetching featured experts:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured experts" },
      { status: 500 }
    );
  }
}
