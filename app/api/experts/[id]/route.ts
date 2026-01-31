import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;
    
    console.log("Expert detail API called with id:", id);
    
    // Validate ID
    if (!id || id === 'undefined') {
      console.error("Invalid ID received:", id);
      return NextResponse.json(
        { error: "Invalid expert ID" },
        { status: 400 }
      );
    }

    // Fetch the expert with all related data using smeId
    const smeProfile = await prisma.smeProfile.findUnique({
      where: {
        smeId: BigInt(id),
      },
      include: {
        employee: true,
        skills: {
          where: {
            isActive: true,
          },
          include: {
            skill: true,
            endorsements: {
              include: {
                endorsedBy: {
                  select: {
                    fullName: true,
                    position: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        certifications: {
          orderBy: {
            issuedDate: "desc",
          },
        },
        courses: {
          where: {
            isPublished: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!smeProfile) {
      return NextResponse.json(
        { error: "Expert not found" },
        { status: 404 }
      );
    }

    const expert = smeProfile.employee;

    // Get total endorsement count
    const totalEndorsements = smeProfile.skills.reduce(
      (sum, skill) => sum + skill.endorsements.length,
      0
    );

    // Get student count (sum of all course enrollments - simplified)
    const studentCount = smeProfile.courses.length * 30; // Placeholder calculation

    // Get recent endorsements (last 5)
    const allEndorsements = smeProfile.skills.flatMap((skill) =>
      skill.endorsements.map((endorsement) => ({
        ...endorsement,
        skillName: skill.skill.skillName,
        smeSkillId: skill.smeSkillId.toString(),
      }))
    );

    const recentEndorsements = allEndorsements
      .sort(
        (a, b) =>
          new Date(b.endorsedAt).getTime() - new Date(a.endorsedAt).getTime()
      )
      .slice(0, 5)
      .map((e) => ({
        id: e.endorsementId.toString(),
        endorserName: e.endorsedBy.fullName,
        endorserPosition: e.endorsedBy.position || "Team Member",
        endorserAvatar: e.endorsedBy.avatarUrl,
        skillName: e.skillName,
        comment: e.comment,
        endorsedAt: e.endorsedAt.toISOString(),
      }));

    // Transform the data
    const expertData = {
      id: smeProfile.smeId.toString(),
      name: expert.fullName,
      position: expert.position || "Not specified",
      department: expert.departmentName || "Not specified",
      siteName: expert.siteName || "Not specified",
      avatarUrl: expert.avatarUrl,
      email: expert.email,
      phone: smeProfile.contactPhone || "Not provided",
      employeeId: expert.empNumber,
      responseTime: "< 2 hours",
      bio: smeProfile.bio || "",
      availability: smeProfile.availability || "Mon-Fri, 9:00 AM - 5:00 PM EST",
      contactPref: smeProfile.contactPref || "email",
      teamsLink: smeProfile.teamsLink,
      languages: smeProfile.languages || "English",
      
      // Metrics
      totalEndorsements,
      studentCount,
      yearsExperience: 13, // Calculate from profile data or add to schema
      
      // Skills with endorsements
      skills: smeProfile.skills.map((smeSkill) => ({
        id: smeSkill.smeSkillId.toString(),
        name: smeSkill.skill.skillName,
        proficiency: smeSkill.proficiency || "Intermediate",
        yearsExp: smeSkill.yearsExp?.toString() || "0",
        endorsementCount: smeSkill.endorsements.length,
        endorsements: smeSkill.endorsements.map((e) => ({
          id: e.endorsementId.toString(),
          endorserName: e.endorsedBy.fullName,
          endorserPosition: e.endorsedBy.position || "Team Member",
          comment: e.comment,
          endorsedAt: e.endorsedAt.toISOString(),
        })),
      })),

      // Recent endorsements
      recentEndorsements,

      // Certifications
      certifications: smeProfile.certifications.map((cert) => ({
        id: cert.certificationId.toString(),
        title: cert.title,
        issuer: cert.issuer || "Not specified",
        credentialId: cert.credentialId,
        credentialUrl: cert.credentialUrl,
        issuedDate: cert.issuedDate?.toISOString().split("T")[0],
        expiryDate: cert.expiryDate?.toISOString().split("T")[0],
        fileUrl: cert.fileUrl,
      })),

      // Courses
      courses: smeProfile.courses.map((course) => ({
        id: course.courseId.toString(),
        title: course.title,
        description: course.description,
        targetAudience: course.targetAudience,
        durationMinutes: course.durationMinutes,
        deliveryMode: course.deliveryMode,
        materialsUrl: course.materialsUrl,
        isPublished: course.isPublished,
        createdAt: course.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(expertData);
  } catch (error) {
    console.error("Error fetching expert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
