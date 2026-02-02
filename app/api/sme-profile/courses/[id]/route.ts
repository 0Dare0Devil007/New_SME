import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// DELETE - Delete a course
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

    const { id } = await params;
    const courseId = BigInt(id);

    // Check if course exists and belongs to the user
    const course = await prisma.course.findUnique({
      where: { courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.smeId !== employee.smeProfile.smeId) {
      return NextResponse.json(
        { error: "You can only delete your own courses" },
        { status: 403 }
      );
    }

    // Delete the course
    await prisma.course.delete({
      where: { courseId },
    });

    return NextResponse.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
