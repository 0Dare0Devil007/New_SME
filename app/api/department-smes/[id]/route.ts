import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// Helper function to check coordinator access
async function checkCoordinatorAccess(smeId: bigint, userEmail: string) {
  const employee = await prisma.employee.findUnique({
    where: { email: userEmail },
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
    return { error: "Employee record not found", status: 404 };
  }

  const roles = employee.roles.map((er) => er.role.roleCode);
  if (!roles.includes("COORDINATOR")) {
    return { error: "Only Coordinators can manage SMEs", status: 403 };
  }

  // Get the SME profile
  const smeProfile = await prisma.smeProfile.findUnique({
    where: { smeId },
    include: {
      employee: {
        select: {
          departmentName: true,
        },
      },
    },
  });

  if (!smeProfile) {
    return { error: "SME profile not found", status: 404 };
  }

  // Check if coordinator has access to this SME's department
  const departments = employee.departmentCoordinators.map((dc) => dc.departmentName);
  if (!smeProfile.employee.departmentName || !departments.includes(smeProfile.employee.departmentName)) {
    return { error: "You don't have access to this SME's department", status: 403 };
  }

  return { employee, smeProfile };
}

// GET - Get single SME details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const result = await checkCoordinatorAccess(BigInt(id), session.user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const smeProfile = await prisma.smeProfile.findUnique({
      where: { smeId: BigInt(id) },
      include: {
        employee: true,
        skills: {
          include: {
            skill: true,
            endorsements: {
              include: {
                endorsedBy: {
                  select: {
                    fullName: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        certifications: true,
      },
    });

    if (!smeProfile) {
      return NextResponse.json(
        { error: "SME profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: smeProfile.smeId.toString(),
      status: smeProfile.status,
      statusReason: smeProfile.statusReason,
      bio: smeProfile.bio,
      languages: smeProfile.languages,
      availability: smeProfile.availability,
      createdAt: smeProfile.createdAt.toISOString(),
      employee: {
        id: smeProfile.employee.employeeId.toString(),
        empNumber: smeProfile.employee.empNumber,
        name: smeProfile.employee.fullName,
        email: smeProfile.employee.email,
        position: smeProfile.employee.position,
        department: smeProfile.employee.departmentName,
        siteName: smeProfile.employee.siteName,
        imageUrl: smeProfile.employee.imageUrl,
      },
      skills: smeProfile.skills.map((s) => ({
        id: s.smeSkillId.toString(),
        name: s.skill.skillName,
        proficiency: s.proficiency,
        yearsExp: s.yearsExp?.toString(),
        endorsements: s.endorsements.map((e) => ({
          id: e.endorsementId.toString(),
          endorserName: e.endorsedBy.fullName,
          endorserPosition: e.endorsedBy.position,
          comment: e.comment,
          endorsedAt: e.endorsedAt.toISOString(),
        })),
      })),
      certifications: smeProfile.certifications.map((c) => ({
        id: c.certificationId.toString(),
        title: c.title,
        issuer: c.issuer,
      })),
    });
  } catch (error) {
    console.error("Error fetching SME details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update SME status (activate/deactivate)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const result = await checkCoordinatorAccess(BigInt(id), session.user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { status, statusReason } = body;

    // Validate status
    const validStatuses = ["APPROVED", "SUSPENDED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or SUSPENDED" },
        { status: 400 }
      );
    }

    // Update the SME profile
    const updatedProfile = await prisma.smeProfile.update({
      where: { smeId: BigInt(id) },
      data: {
        status,
        statusReason: statusReason || null,
      },
      include: {
        employee: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedProfile.smeId.toString(),
      status: updatedProfile.status,
      statusReason: updatedProfile.statusReason,
      message: `SME ${updatedProfile.employee.fullName} has been ${status === "APPROVED" ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    console.error("Error updating SME status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove SME profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const result = await checkCoordinatorAccess(BigInt(id), session.user.email);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Get the employee ID before deleting for updating nominations
    const smeProfile = await prisma.smeProfile.findUnique({
      where: { smeId: BigInt(id) },
      select: {
        employeeId: true,
        employee: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!smeProfile) {
      return NextResponse.json(
        { error: "SME profile not found" },
        { status: 404 }
      );
    }

    // Delete the SME profile (cascades to skills, endorsements, certifications, courses)
    await prisma.smeProfile.delete({
      where: { smeId: BigInt(id) },
    });

    // Update any related nominations to REJECTED
    await prisma.smeNomination.updateMany({
      where: {
        nomineeEmployeeId: smeProfile.employeeId,
        status: "APPROVED",
      },
      data: {
        status: "REJECTED",
        decisionNote: "SME profile was removed by coordinator",
        decisionAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `SME profile for ${smeProfile.employee.fullName} has been deleted`,
    });
  } catch (error) {
    console.error("Error deleting SME profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
