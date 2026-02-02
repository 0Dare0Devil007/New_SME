import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Search employees for nomination
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

    // Verify user has TEAM_LEADER role
    const currentEmployee = await prisma.employee.findUnique({
      where: { email: session.user.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!currentEmployee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    const roles = currentEmployee.roles.map((er) => er.role.roleCode);
    if (!roles.includes("TEAM_LEADER")) {
      return NextResponse.json(
        { error: "Only Team Leaders can search employees for nomination" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    // Find employees who:
    // 1. Match the search term (name or email)
    // 2. Are active
    // 3. Don't already have an SME profile
    // 4. Don't have a pending nomination
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { empNumber: { contains: search, mode: "insensitive" } },
        ],
        // Exclude employees who already have an SME profile
        smeProfile: null,
        // Exclude employees with pending nominations
        nominationsAsNominee: {
          none: {
            status: "SUBMITTED",
          },
        },
      },
      select: {
        employeeId: true,
        empNumber: true,
        fullName: true,
        email: true,
        position: true,
        departmentName: true,
        siteName: true,
        imageUrl: true,
      },
      take: limit,
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({
      employees: employees.map((emp) => ({
        id: emp.employeeId.toString(),
        empNumber: emp.empNumber,
        name: emp.fullName,
        email: emp.email,
        position: emp.position || "Not specified",
        department: emp.departmentName || "Not specified",
        siteName: emp.siteName || "Not specified",
        imageUrl: emp.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
