import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// POST - Create a new course
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

    // Get user email - handle both possible locations
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: userEmail },
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

    const body = await request.json();
    const { title, description, targetAudience, durationMinutes, deliveryMode, scheduledDate } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Course title is required" },
        { status: 400 }
      );
    }

    if (!deliveryMode) {
      return NextResponse.json(
        { error: "Delivery mode is required" },
        { status: 400 }
      );
    }

    // Validate scheduled date is not in the past
    if (scheduledDate) {
      const scheduledDateTime = new Date(scheduledDate);
      const now = new Date();
      if (scheduledDateTime < now) {
        return NextResponse.json(
          { error: "Scheduled date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    // Parse durationMinutes safely
    let parsedDuration: number | null = null;
    if (durationMinutes !== null && durationMinutes !== undefined && durationMinutes !== "") {
      const parsed = typeof durationMinutes === "number" ? durationMinutes : parseInt(String(durationMinutes));
      if (!isNaN(parsed)) {
        parsedDuration = parsed;
      }
    }

    // Create the course
    const course = await prisma.course.create({
      data: {
        smeId: employee.smeProfile.smeId,
        title: title.trim(),
        description: description?.trim() || null,
        targetAudience: targetAudience?.trim() || null,
        durationMinutes: parsedDuration,
        deliveryMode: deliveryMode,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        isPublished: true, // Auto-publish
      },
    });

    return NextResponse.json({
      course: {
        id: course.courseId.toString(),
        title: course.title,
        description: course.description,
        targetAudience: course.targetAudience,
        durationMinutes: course.durationMinutes,
        deliveryMode: course.deliveryMode,
        scheduledDate: course.scheduledDate?.toISOString(),
      },
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
