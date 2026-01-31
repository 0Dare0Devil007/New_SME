import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Check if current user has a pending nomination or is an SME
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
        smeProfile: {
          select: {
            smeId: true,
            status: true,
            bio: true,
          },
        },
        nominationsAsNominee: {
          where: {
            status: "SUBMITTED",
          },
          orderBy: {
            requestedAt: "desc",
          },
          take: 1,
          include: {
            nominatedBy: {
              select: {
                fullName: true,
                position: true,
              },
            },
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

    // Check if already an SME
    if (employee.smeProfile) {
      return NextResponse.json({
        status: "SME",
        smeId: employee.smeProfile.smeId.toString(),
        profileStatus: employee.smeProfile.status,
        hasCompletedProfile: !!employee.smeProfile.bio,
      });
    }

    // Check for pending nomination
    const pendingNomination = employee.nominationsAsNominee[0];
    if (pendingNomination) {
      return NextResponse.json({
        status: "NOMINATED",
        nominationId: pendingNomination.nominationId.toString(),
        nominatedAt: pendingNomination.requestedAt.toISOString(),
        nominatedBy: {
          name: pendingNomination.nominatedBy.fullName,
          position: pendingNomination.nominatedBy.position,
        },
      });
    }

    // No nomination
    return NextResponse.json({
      status: "NONE",
    });
  } catch (error) {
    console.error("Error checking nomination status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
