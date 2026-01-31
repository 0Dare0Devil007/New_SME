import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { createEndorsementNotification } from "@/lib/notifications";

// POST - Create a new endorsement
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

    // Find the employee record for the current user
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
    const { smeSkillId, comment } = body;

    if (!smeSkillId) {
      return NextResponse.json(
        { error: "smeSkillId is required" },
        { status: 400 }
      );
    }

    // Check if the smeSkill exists
    const smeSkill = await prisma.smeSkill.findUnique({
      where: { smeSkillId: BigInt(smeSkillId) },
      include: {
        sme: {
          include: {
            employee: true,
          },
        },
        skill: true,
      },
    });

    if (!smeSkill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    // Prevent self-endorsement
    if (smeSkill.sme.employeeId === employee.employeeId) {
      return NextResponse.json(
        { error: "You cannot endorse your own skills" },
        { status: 400 }
      );
    }

    // Check if user has already endorsed this skill
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        smeSkillId_endorsedByEmployeeId: {
          smeSkillId: BigInt(smeSkillId),
          endorsedByEmployeeId: employee.employeeId,
        },
      },
    });

    if (existingEndorsement) {
      return NextResponse.json(
        { error: "You have already endorsed this skill" },
        { status: 400 }
      );
    }

    // Create the endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        smeSkillId: BigInt(smeSkillId),
        endorsedByEmployeeId: employee.employeeId,
        comment: comment || null,
      },
      include: {
        endorsedBy: {
          select: {
            fullName: true,
            position: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Trigger notification
    await createEndorsementNotification({
      smeEmployeeId: smeSkill.sme.employeeId,
      endorserName: employee.fullName,
      endorserPosition: employee.position,
      skillName: smeSkill.skill.skillName,
      endorsementId: endorsement.endorsementId,
      comment: endorsement.comment,
    });

    return NextResponse.json({
      id: endorsement.endorsementId.toString(),
      smeSkillId: endorsement.smeSkillId.toString(),
      endorserName: endorsement.endorsedBy.fullName,
      endorserPosition: endorsement.endorsedBy.position,
      comment: endorsement.comment,
      endorsedAt: endorsement.endorsedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating endorsement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if current user has endorsed specific skills
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ endorsedSkillIds: [] });
    }

    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email },
    });

    if (!employee) {
      return NextResponse.json({ endorsedSkillIds: [] });
    }

    const { searchParams } = new URL(request.url);
    const smeId = searchParams.get("smeId");

    if (!smeId) {
      return NextResponse.json(
        { error: "smeId query parameter is required" },
        { status: 400 }
      );
    }

    // Get all endorsements by this user for the specified SME
    const endorsements = await prisma.endorsement.findMany({
      where: {
        endorsedByEmployeeId: employee.employeeId,
        smeSkill: {
          smeId: BigInt(smeId),
        },
      },
      select: {
        smeSkillId: true,
      },
    });

    return NextResponse.json({
      endorsedSkillIds: endorsements.map((e) => e.smeSkillId.toString()),
    });
  } catch (error) {
    console.error("Error fetching endorsements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
