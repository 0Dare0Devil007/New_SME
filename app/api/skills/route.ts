import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// API route to fetch skills with their top SMEs (with pagination support)
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '5'))); // Max 100 per page
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause with search filter
    const whereClause: any = {
      isActive: true,
      ...(search ? {
        OR: [
          { skillName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    // Fetch skills with pagination, total count, and expert counts in parallel
    const [skills, totalCount, expertCounts] = await Promise.all([
      // Main query: Get skills with top 6 experts (for display)
      prisma.skill.findMany({
        where: whereClause,
        include: {
          category: true,
          smeSkills: {
            where: {
              isActive: true,
              sme: {
                status: "APPROVED",
              },
            },
            include: {
              sme: {
                include: {
                  employee: true,
                },
              },
              endorsements: true,
            },
            orderBy: {
              endorsements: {
                _count: "desc",
              },
            },
            take: 6, // Get top 6 experts per skill (for display only)
          },
        },
        orderBy: {
          skillName: "asc",
        },
        skip: skip,
        take: limit,
      }),
      // Count total skills for pagination
      prisma.skill.count({ where: whereClause }),
      // Count total experts per skill (no limit) - optimized with groupBy
      prisma.smeSkill.groupBy({
        by: ['skillId'],
        where: {
          isActive: true,
          sme: {
            status: "APPROVED",
          },
          skill: whereClause,
        },
        _count: {
          smeSkillId: true,
        },
      }),
    ]);

    // Create a map of skillId -> expert count for O(1) lookup
    const expertCountMap = new Map(
      expertCounts.map((ec) => [ec.skillId, ec._count.smeSkillId])
    );

    // Transform the data to match the frontend structure
    const transformedSkills = skills.map((skill) => {
      const topExperts = skill.smeSkills.map((smeSkill) => ({
        name: smeSkill.sme.employee.fullName,
        endorsementCount: smeSkill.endorsements.length,
        imageUrl: smeSkill.sme.employee.imageUrl,
      }));

      // Define gradient colors based on skill name
      const gradients: Record<string, string> = {
        "Data Analytics": "from-[#2b7fff] to-[#1447e6]",
        "Project Management": "from-[#ad46ff] to-[#8200db]",
        "Cloud Architecture": "from-[#00b8db] to-[#007595]",
        "Machine Learning": "from-[#8e51ff] to-[#7008e7]",
        "UX/UI Design": "from-[#f6339a] to-[#c6005c]",
        "Cybersecurity": "from-[#fb2c36] to-[#c10007]",
        "Financial Modeling": "from-[#00c950] to-[#008236]",
        "Supply Chain Management": "from-[#ff6900] to-[#ca3500]",
      };

      return {
        name: skill.skillName,
        experts: expertCountMap.get(skill.skillId) || 0, // Get actual total count from optimized query
        description: skill.description,
        gradient: gradients[skill.skillName] || "from-blue-500 to-blue-700",
        imageUrl: skill.imageUrl || "",
        topExperts: topExperts.map((e) => e.name),
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      skills: transformedSkills,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
