import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ user: null, roles: [] });
    }

    // Find the employee record linked to this user's email
    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        smeProfile: {
          select: {
            smeId: true,
            status: true,
          },
        },
        nominationsAsNominee: {
          where: {
            status: "SUBMITTED",
          },
          take: 1,
        },
      },
    });

    const roles = employee?.roles.map((er) => er.role.roleCode) ?? [];

    // Check nomination status
    const hasNomination = (employee?.nominationsAsNominee?.length ?? 0) > 0;
    const hasSmeProfile = !!employee?.smeProfile;
    const needsProfileSetup = hasNomination && !hasSmeProfile;

    return NextResponse.json({
      user: session.user,
      roles,
      isManager: roles.includes("MANAGEMENT"),
      isTeamLeader: roles.includes("TEAM_LEADER"),
      isCoordinator: roles.includes("COORDINATOR"),
      isSme: hasSmeProfile,
      smeId: employee?.smeProfile?.smeId?.toString() || null,
      needsProfileSetup,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json({ user: null, roles: [] });
  }
}
