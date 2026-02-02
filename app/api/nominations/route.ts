import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - List nominations
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
    
    // Team Leaders see their own nominations
    if (!roles.includes("TEAM_LEADER")) {
      return NextResponse.json(
        { error: "Only Team Leaders can view nominations" },
        { status: 403 }
      );
    }

    const nominations = await prisma.smeNomination.findMany({
      where: {
        nominatedByTlId: employee.employeeId,
      },
      include: {
        nominee: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
            position: true,
            departmentName: true,
            siteName: true,
            imageUrl: true,
            smeProfile: {
              select: {
                smeId: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({
      nominations: nominations.map((nom) => ({
        id: nom.nominationId.toString(),
        status: nom.status,
        requestedAt: nom.requestedAt.toISOString(),
        decisionAt: nom.decisionAt?.toISOString() || null,
        decisionNote: nom.decisionNote,
        nominee: {
          id: nom.nominee.employeeId.toString(),
          name: nom.nominee.fullName,
          email: nom.nominee.email,
          position: nom.nominee.position || "Not specified",
          department: nom.nominee.departmentName || "Not specified",
          siteName: nom.nominee.siteName || "Not specified",
          imageUrl: nom.nominee.imageUrl,
          hasProfile: !!nom.nominee.smeProfile,
          profileStatus: nom.nominee.smeProfile?.status || null,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching nominations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new nomination
export async function POST(request: NextRequest) {
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
    if (!roles.includes("TEAM_LEADER")) {
      return NextResponse.json(
        { error: "Only Team Leaders can nominate employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nomineeEmployeeId } = body;

    if (!nomineeEmployeeId) {
      return NextResponse.json(
        { error: "nomineeEmployeeId is required" },
        { status: 400 }
      );
    }

    // Check if nominee exists
    const nominee = await prisma.employee.findUnique({
      where: { employeeId: BigInt(nomineeEmployeeId) },
      include: {
        smeProfile: true,
        nominationsAsNominee: {
          where: {
            status: "SUBMITTED",
          },
        },
      },
    });

    if (!nominee) {
      return NextResponse.json(
        { error: "Nominee not found" },
        { status: 404 }
      );
    }

    if (!nominee.isActive) {
      return NextResponse.json(
        { error: "Cannot nominate inactive employee" },
        { status: 400 }
      );
    }

    // Check if nominee already has an SME profile
    if (nominee.smeProfile) {
      return NextResponse.json(
        { error: "This employee is already an SME" },
        { status: 400 }
      );
    }

    // Check if there's already a pending nomination
    if (nominee.nominationsAsNominee.length > 0) {
      return NextResponse.json(
        { error: "This employee already has a pending nomination" },
        { status: 400 }
      );
    }

    // Prevent self-nomination
    if (nominee.employeeId === employee.employeeId) {
      return NextResponse.json(
        { error: "You cannot nominate yourself" },
        { status: 400 }
      );
    }

    // Create the nomination
    const nomination = await prisma.smeNomination.create({
      data: {
        nomineeEmployeeId: BigInt(nomineeEmployeeId),
        nominatedByTlId: employee.employeeId,
        departmentName: nominee.departmentName,
        status: "SUBMITTED",
      },
      include: {
        nominee: {
          select: {
            fullName: true,
            email: true,
            position: true,
            departmentName: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: nomination.nominationId.toString(),
      status: nomination.status,
      requestedAt: nomination.requestedAt.toISOString(),
      nominee: {
        name: nomination.nominee.fullName,
        email: nomination.nominee.email,
        position: nomination.nominee.position,
        department: nomination.nominee.departmentName,
      },
    });
  } catch (error) {
    console.error("Error creating nomination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
