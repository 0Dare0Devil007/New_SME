import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get all active skills (for dropdowns/selection)
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            categoryName: true,
          },
        },
      },
      orderBy: {
        skillName: "asc",
      },
    });

    return NextResponse.json({
      skills: skills.map((skill) => ({
        id: skill.skillId.toString(),
        name: skill.skillName,
        description: skill.description,
        category: skill.category?.categoryName || "Uncategorized",
      })),
    });
  } catch (error) {
    console.error("Error fetching skills list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
