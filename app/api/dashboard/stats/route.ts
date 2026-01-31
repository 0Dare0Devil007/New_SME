import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Dashboard statistics for managers
export async function GET() {
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

    // Get statistics
    const [
      totalSmes,
      approvedSmes,
      suspendedSmes,
      pendingNominations,
      totalEndorsements,
      totalSkills,
      smesByDepartment,
      recentNominations,
      topEndorsedSmes,
    ] = await Promise.all([
      // Total SMEs
      prisma.smeProfile.count(),
      
      // Approved SMEs
      prisma.smeProfile.count({ where: { status: "APPROVED" } }),
      
      // Suspended SMEs
      prisma.smeProfile.count({ where: { status: "SUSPENDED" } }),
      
      // Pending nominations
      prisma.smeNomination.count({ where: { status: "SUBMITTED" } }),
      
      // Total endorsements
      prisma.endorsement.count(),
      
      // Active skills
      prisma.skill.count({ where: { isActive: true } }),
      
      // SMEs by department
      prisma.smeProfile.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Recent nominations (last 10)
      prisma.smeNomination.findMany({
        take: 10,
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
        where: { status: "APPROVED" },
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

    // Get department breakdown
    const departmentStats = await prisma.smeProfile.groupBy({
      by: [],
      _count: true,
    });

    // Get SMEs grouped by department
    const smesByDept = await prisma.employee.groupBy({
      by: ["departmentName"],
      where: {
        smeProfile: {
          status: "APPROVED",
        },
      },
      _count: true,
    });

    return NextResponse.json({
      overview: {
        totalSmes,
        approvedSmes,
        suspendedSmes,
        pendingNominations,
        totalEndorsements,
        totalSkills,
      },
      smesByStatus: smesByDepartment.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      smesByDepartment: smesByDept.map((item) => ({
        department: item.departmentName || "Unassigned",
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
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
