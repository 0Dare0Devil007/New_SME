import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - List all SMEs in coordinator's department(s)
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
        departmentCoordinators: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    const roles = employee.roles.map((er) => er.role.roleCode);
    if (!roles.includes("COORDINATOR")) {
      return NextResponse.json(
        { error: "Only Coordinators can access this resource" },
        { status: 403 }
      );
    }

    // Get departments this coordinator manages
    const departments = employee.departmentCoordinators.map((dc) => dc.departmentName);

    if (departments.length === 0) {
      return NextResponse.json({
        smes: [],
        departments: [],
        message: "No departments assigned to this coordinator",
      });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const searchTerm = searchParams.get("search") || "";

    // Build the where clause
    const whereClause: {
      employee: {
        departmentName: { in: string[] };
        OR?: Array<{ fullName?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
      };
      status?: string;
    } = {
      employee: {
        departmentName: {
          in: departments,
        },
      },
    };

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (searchTerm) {
      whereClause.employee.OR = [
        { fullName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const smeProfiles = await prisma.smeProfile.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            employeeId: true,
            empNumber: true,
            fullName: true,
            email: true,
            position: true,
            departmentName: true,
            siteName: true,
            avatarUrl: true,
          },
        },
        skills: {
          where: { isActive: true },
          include: {
            skill: true,
            endorsements: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      smes: smeProfiles.map((profile) => ({
        id: profile.smeId.toString(),
        status: profile.status,
        statusReason: profile.statusReason,
        createdAt: profile.createdAt.toISOString(),
        employee: {
          id: profile.employee.employeeId.toString(),
          empNumber: profile.employee.empNumber,
          name: profile.employee.fullName,
          email: profile.employee.email,
          position: profile.employee.position || "Not specified",
          department: profile.employee.departmentName || "Not specified",
          siteName: profile.employee.siteName || "Not specified",
          avatarUrl: profile.employee.avatarUrl,
        },
        skills: profile.skills.map((s) => ({
          id: s.smeSkillId.toString(),
          name: s.skill.skillName,
          endorsementCount: s.endorsements.length,
        })),
        totalEndorsements: profile.skills.reduce(
          (sum, s) => sum + s.endorsements.length,
          0
        ),
      })),
      departments,
    });
  } catch (error) {
    console.error("Error fetching department SMEs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
