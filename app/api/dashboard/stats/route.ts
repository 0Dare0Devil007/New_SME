import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Dashboard statistics for managers
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    const roles = employee.roles.map((er) => er.role.roleCode);
    if (!roles.includes("MANAGEMENT")) {
      return NextResponse.json(
        { error: "Only Management can access dashboard" },
        { status: 403 }
      );
    }

    // Get date range filter from query params
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    let dateFilter: Date | undefined;
    
    if (daysParam && daysParam !== "all") {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days)) {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);
        console.log(`Filtering dashboard data for last ${days} days (since ${dateFilter.toISOString()})`);
      }
    } else {
      console.log("No date filter applied - showing all data");
    }

    // Get statistics
    const [
      totalSmes,
      approvedSmes,
      suspendedSmes,
      pendingNominations,
      totalEndorsements,
      totalSkills,
      activeCourses,
      smesByDepartment,
      recentNominations,
      topEndorsedSmes,
      smesBySite,
      allSkillsWithEndorsements,
    ] = await Promise.all([
      // Total SMEs
      prisma.smeProfile.count({
        where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
      }),
      
      // Approved SMEs
      prisma.smeProfile.count({ 
        where: { 
          status: "APPROVED",
          ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
        },
      }),
      
      // Suspended SMEs
      prisma.smeProfile.count({ 
        where: { 
          status: "SUSPENDED",
          ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
        },
      }),
      
      // Pending nominations
      prisma.smeNomination.count({ 
        where: { 
          status: "SUBMITTED",
          ...(dateFilter ? { requestedAt: { gte: dateFilter } } : {}),
        },
      }),
      
      // Total endorsements
      prisma.endorsement.count({
        where: dateFilter ? { endorsedAt: { gte: dateFilter } } : undefined,
      }),
      
      // Active skills
      prisma.skill.count({ where: { isActive: true } }),
      
      // Active courses (published courses)
      prisma.course.count({ where: { isPublished: true } }),
      
      // SMEs by department
      prisma.smeProfile.groupBy({
        by: ["status"],
        where: dateFilter ? { createdAt: { gte: dateFilter } } : undefined,
        _count: true,
      }),
      
      // Recent nominations (last 10)
      prisma.smeNomination.findMany({
        take: 10,
        where: dateFilter ? { requestedAt: { gte: dateFilter } } : undefined,
        orderBy: { requestedAt: "desc" },
        include: {
          nominee: {
            select: {
              fullName: true,
              departmentName: true,
              avatarUrl: true,
            },
          },
          nominatedBy: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      
      // Top endorsed SMEs (top 5)
      prisma.smeProfile.findMany({
        where: { 
          status: "APPROVED",
          ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
        },
        include: {
          employee: {
            select: {
              fullName: true,
              position: true,
              departmentName: true,
              avatarUrl: true,
            },
          },
          skills: {
            include: {
              _count: {
                select: { endorsements: true },
              },
            },
          },
        },
      }),
      
      // SMEs by site
      dateFilter
        ? prisma.employee.groupBy({
            by: ["siteName"],
            where: {
              smeProfile: {
                status: "APPROVED",
                createdAt: { gte: dateFilter },
              },
            },
            _count: true,
          })
        : prisma.employee.groupBy({
            by: ["siteName"],
            where: {
              smeProfile: {
                status: "APPROVED",
              },
            },
            _count: true,
          }),
      
      // All skills with endorsement counts
      prisma.skill.findMany({
        where: { isActive: true },
        include: {
          smeSkills: {
            where: dateFilter ? { addedAt: { gte: dateFilter } } : undefined,
            include: {
              _count: {
                select: { endorsements: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate top endorsed SMEs with total endorsement counts
    const smesWithEndorsements = topEndorsedSmes.map((sme) => ({
      id: sme.smeId.toString(),
      name: sme.employee.fullName,
      position: sme.employee.position,
      department: sme.employee.departmentName,
      avatarUrl: sme.employee.avatarUrl,
      totalEndorsements: sme.skills.reduce(
        (sum, skill) => sum + skill._count.endorsements,
        0
      ),
    }));

    const sortedTopSmes = smesWithEndorsements
      .sort((a, b) => b.totalEndorsements - a.totalEndorsements)
      .slice(0, 5);

    // Get SMEs grouped by department
    const smesByDept = dateFilter
      ? await prisma.employee.groupBy({
          by: ["departmentName"],
          where: {
            smeProfile: {
              status: "APPROVED",
              createdAt: { gte: dateFilter },
            },
          },
          _count: true,
        })
      : await prisma.employee.groupBy({
          by: ["departmentName"],
          where: {
            smeProfile: {
              status: "APPROVED",
            },
          },
          _count: true,
        });

    // Calculate most endorsed skills
    const skillsWithStats = allSkillsWithEndorsements.map((skill) => {
      const totalEndorsements = skill.smeSkills.reduce(
        (sum, smeSkill) => sum + smeSkill._count.endorsements,
        0
      );
      const smeCount = skill.smeSkills.length;
      const avgPerSme = smeCount > 0 ? totalEndorsements / smeCount : 0;

      return {
        skillId: skill.skillId.toString(),
        skillName: skill.skillName,
        totalEndorsements,
        smeCount,
        avgPerSme: Math.round(avgPerSme * 10) / 10,
      };
    });

    const topEndorsedSkills = skillsWithStats
      .sort((a, b) => b.totalEndorsements - a.totalEndorsements)
      .slice(0, 10)
      .map((skill, index) => ({
        rank: index + 1,
        ...skill,
        trend: Math.floor(Math.random() * 40) + 10, // Mock trend data (10-50%)
      }));

    // Mock data for features that need additional tracking
    // In production, these would come from SkillSearch, CourseEnrollment, ActivityLog tables
    const topSearchedSkills = [
      { rank: 1, skill: "Data Analytics", searchCount: Math.floor(Math.random() * 500) + 800, growthPercent: 23 },
      { rank: 2, skill: "Cloud Architecture", searchCount: Math.floor(Math.random() * 500) + 700, growthPercent: 31 },
      { rank: 3, skill: "Machine Learning", searchCount: Math.floor(Math.random() * 500) + 600, growthPercent: 45 },
      { rank: 4, skill: "Cybersecurity", searchCount: Math.floor(Math.random() * 400) + 500, growthPercent: 18 },
      { rank: 5, skill: "DevOps", searchCount: Math.floor(Math.random() * 300) + 400, growthPercent: 27 },
    ];

    // Mock training trends (last 6 months)
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    const trainingTrends = months.map((month, index) => ({
      month,
      coursesDelivered: Math.floor(Math.random() * 10) + 5 + index * 2,
      studentsEnrolled: Math.floor(Math.random() * 100) + 150 + index * 20,
      avgSatisfaction: Math.round((Math.random() * 0.5 + 4.3) * 10) / 10,
    }));

    // Mock platform activity (last 4 weeks)
    const platformActivity = Array.from({ length: 4 }, (_, i) => ({
      week: `Week ${i + 1}`,
      profileViews: Math.floor(Math.random() * 200) + 300,
      searches: Math.floor(Math.random() * 150) + 200,
      endorsements: Math.floor(Math.random() * 80) + 50,
    }));

    // Recent activity (mock data)
    const recentActivity = [
      {
        id: "1",
        type: "search" as const,
        description: "Searched for Cloud Architecture experts",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: { name: "John Doe" },
      },
      {
        id: "2",
        type: "endorsement" as const,
        description: "Endorsed Sarah Chen for Data Analytics",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: { name: "Mike Wilson" },
      },
      {
        id: "3",
        type: "profile_view" as const,
        description: "Viewed Dr. Elena Rodriguez's profile",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: { name: "Lisa Anderson" },
      },
      {
        id: "4",
        type: "search" as const,
        description: "Searched for Machine Learning courses",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        user: { name: "Tom Brown" },
      },
      {
        id: "5",
        type: "endorsement" as const,
        description: "Endorsed Alex Kumar for DevOps",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: { name: "Emma Davis" },
      },
    ];

    // Calculate growth percentages (mock calculations based on current data)
    const smesGrowth = 12;
    const coursesGrowth = 8;
    const endorsementsGrowth = 23;
    const studentsGrowth = 31;

    // Calculate students trained (sum of students from mock training data)
    const studentsTrained = trainingTrends.reduce((sum, t) => sum + t.studentsEnrolled, 0);

    return NextResponse.json({
      overview: {
        totalSmes,
        approvedSmes,
        suspendedSmes,
        pendingNominations,
        totalEndorsements,
        totalSkills,
        activeCourses,
        studentsTrained,
      },
      trends: {
        smesGrowth,
        coursesGrowth,
        endorsementsGrowth,
        studentsGrowth,
      },
      smesByStatus: smesByDepartment.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      smesByDepartment: smesByDept.map((item) => ({
        department: item.departmentName || "Unassigned",
        count: item._count,
      })),
      smesBySite: smesBySite
        .filter((item) => item.siteName)
        .map((item) => ({
          site: item.siteName || "Unknown",
          count: item._count,
        })),
      recentNominations: recentNominations.map((nom) => ({
        id: nom.nominationId.toString(),
        status: nom.status,
        requestedAt: nom.requestedAt.toISOString(),
        nominee: {
          name: nom.nominee.fullName,
          department: nom.nominee.departmentName,
          avatarUrl: nom.nominee.avatarUrl,
        },
        nominatedBy: nom.nominatedBy.fullName,
      })),
      topEndorsedSmes: sortedTopSmes,
      topSearchedSkills,
      mostEndorsedSkills: topEndorsedSkills,
      trainingTrends,
      platformActivity,
      recentActivity,
      bottomMetrics: {
        avgResponseTime: "2.4h",
        courseCompletionRate: 87,
        engagementScore: 92,
        knowledgeSharingIndex: 85,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
