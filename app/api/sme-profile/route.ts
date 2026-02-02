import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Get current user's SME profile
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
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            certifications: true,
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

    if (!employee.smeProfile) {
      return NextResponse.json(
        { error: "No SME profile found" },
        { status: 404 }
      );
    }

    const profile = employee.smeProfile;

    return NextResponse.json({
      id: profile.smeId.toString(),
      bio: profile.bio || "",
      availability: profile.availability || "",
      status: profile.status,
      skills: profile.skills.map((s) => ({
        id: s.smeSkillId.toString(),
        skillId: s.skillId.toString(),
        skillName: s.skill.skillName,
        proficiency: s.proficiency || "Intermediate",
        yearsExp: s.yearsExp?.toString() || "0",
      })),
      certifications: profile.certifications.map((c) => ({
        id: c.certificationId.toString(),
        title: c.title,
        issuer: c.issuer || "",
        credentialId: c.credentialId || "",
        credentialUrl: c.credentialUrl || "",
        issuedDate: c.issuedDate ? c.issuedDate.toISOString().split("T")[0] : "",
        expiryDate: c.expiryDate ? c.expiryDate.toISOString().split("T")[0] : "",
      })),
    });
  } catch (error) {
    console.error("Error fetching SME profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create SME profile (requires pending nomination)
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
        smeProfile: true,
        nominationsAsNominee: {
          where: {
            status: "SUBMITTED",
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

    // Check if already has a profile
    if (employee.smeProfile) {
      return NextResponse.json(
        { error: "SME profile already exists" },
        { status: 400 }
      );
    }

    // Check for pending nomination
    if (employee.nominationsAsNominee.length === 0) {
      return NextResponse.json(
        { error: "You must be nominated before creating an SME profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bio, availability, skills, certifications } = body;

    // Create the SME profile with APPROVED status
    const smeProfile = await prisma.smeProfile.create({
      data: {
        employeeId: employee.employeeId,
        bio: bio || null,
        availability: availability || null,
        status: "APPROVED", // Immediately approved
      },
    });

    // Add skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      await prisma.smeSkill.createMany({
        data: skills.map((skill: { skillId: string; proficiency?: string; yearsExp?: number }) => ({
          smeId: smeProfile.smeId,
          skillId: BigInt(skill.skillId),
          proficiency: skill.proficiency || "Intermediate",
          yearsExp: skill.yearsExp || null,
        })),
      });
    }

    // Add certifications if provided
    if (certifications && Array.isArray(certifications) && certifications.length > 0) {
      await prisma.smeCertification.createMany({
        data: certifications.map((cert: { 
          title: string; 
          issuer?: string; 
          credentialId?: string; 
          credentialUrl?: string; 
          issuedDate?: string | null; 
          expiryDate?: string | null;
        }) => ({
          smeId: smeProfile.smeId,
          title: cert.title,
          issuer: cert.issuer || null,
          credentialId: cert.credentialId || null,
          credentialUrl: cert.credentialUrl || null,
          issuedDate: cert.issuedDate ? new Date(cert.issuedDate) : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
        })),
      });
    }

    // Update the nomination status to APPROVED
    await prisma.smeNomination.updateMany({
      where: {
        nomineeEmployeeId: employee.employeeId,
        status: "SUBMITTED",
      },
      data: {
        status: "APPROVED",
        decisionAt: new Date(),
      },
    });

    return NextResponse.json({
      id: smeProfile.smeId.toString(),
      status: smeProfile.status,
      message: "SME profile created successfully",
    });
  } catch (error) {
    console.error("Error creating SME profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update SME profile
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
      include: {
        smeProfile: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    if (!employee.smeProfile) {
      return NextResponse.json(
        { error: "No SME profile found to update" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { bio, availability, skills, certifications } = body;

    // Update the profile
    const updatedProfile = await prisma.smeProfile.update({
      where: { smeId: employee.smeProfile.smeId },
      data: {
        bio: bio !== undefined ? bio : undefined,
        availability: availability !== undefined ? availability : undefined,
      },
    });

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      // Remove existing skills
      await prisma.smeSkill.deleteMany({
        where: { smeId: employee.smeProfile.smeId },
      });

      // Add new skills
      if (skills.length > 0) {
        await prisma.smeSkill.createMany({
          data: skills.map((skill: { skillId: string; proficiency?: string; yearsExp?: number }) => ({
            smeId: employee.smeProfile!.smeId,
            skillId: BigInt(skill.skillId),
            proficiency: skill.proficiency || "Intermediate",
            yearsExp: skill.yearsExp || null,
          })),
        });
      }
    }

    // Update certifications if provided
    if (certifications && Array.isArray(certifications)) {
      // Remove existing certifications
      await prisma.smeCertification.deleteMany({
        where: { smeId: employee.smeProfile.smeId },
      });

      // Add new certifications
      if (certifications.length > 0) {
        await prisma.smeCertification.createMany({
          data: certifications.map((cert: { 
            title: string; 
            issuer?: string; 
            credentialId?: string; 
            credentialUrl?: string; 
            issuedDate?: string | null; 
            expiryDate?: string | null;
          }) => ({
            smeId: employee.smeProfile!.smeId,
            title: cert.title,
            issuer: cert.issuer || null,
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
            issuedDate: cert.issuedDate ? new Date(cert.issuedDate) : null,
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
          })),
        });
      }
    }

    return NextResponse.json({
      id: updatedProfile.smeId.toString(),
      message: "SME profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating SME profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle SME profile status (activate/deactivate)
export async function PATCH() {
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
        smeProfile: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 404 }
      );
    }

    if (!employee.smeProfile) {
      return NextResponse.json(
        { error: "No SME profile found" },
        { status: 404 }
      );
    }

    // Toggle status between APPROVED (active) and INACTIVE
    const currentStatus = employee.smeProfile.status;
    const newStatus = currentStatus === "APPROVED" ? "INACTIVE" : "APPROVED";

    const updatedProfile = await prisma.smeProfile.update({
      where: { smeId: employee.smeProfile.smeId },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({
      id: updatedProfile.smeId.toString(),
      status: updatedProfile.status,
      message: `SME profile ${newStatus === "APPROVED" ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling SME profile status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
