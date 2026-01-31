import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET /api/notifications/preferences - Get user notification preferences
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
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { employeeId: employee.employeeId },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          employeeId: employee.employeeId,
          emailEnabled: true,
          inAppEnabled: true,
          endorsements: true,
          nominations: true,
          profileChanges: true,
        },
      });
    }

    return NextResponse.json({
      employeeId: preferences.employeeId.toString(),
      emailEnabled: preferences.emailEnabled,
      inAppEnabled: preferences.inAppEnabled,
      endorsements: preferences.endorsements,
      nominations: preferences.nominations,
      profileChanges: preferences.profileChanges,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
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
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      emailEnabled,
      inAppEnabled,
      endorsements,
      nominations,
      profileChanges,
    } = body;

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { employeeId: employee.employeeId },
      update: {
        emailEnabled:
          emailEnabled !== undefined ? emailEnabled : undefined,
        inAppEnabled:
          inAppEnabled !== undefined ? inAppEnabled : undefined,
        endorsements: endorsements !== undefined ? endorsements : undefined,
        nominations: nominations !== undefined ? nominations : undefined,
        profileChanges:
          profileChanges !== undefined ? profileChanges : undefined,
      },
      create: {
        employeeId: employee.employeeId,
        emailEnabled: emailEnabled ?? true,
        inAppEnabled: inAppEnabled ?? true,
        endorsements: endorsements ?? true,
        nominations: nominations ?? true,
        profileChanges: profileChanges ?? true,
      },
    });

    return NextResponse.json({
      employeeId: preferences.employeeId.toString(),
      emailEnabled: preferences.emailEnabled,
      inAppEnabled: preferences.inAppEnabled,
      endorsements: preferences.endorsements,
      nominations: preferences.nominations,
      profileChanges: preferences.profileChanges,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
