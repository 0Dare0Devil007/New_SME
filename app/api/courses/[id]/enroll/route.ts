import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// Helper function to get current user's employee ID
async function getCurrentEmployeeId(): Promise<bigint | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";
    
    // Call the /api/auth/me endpoint to get current user
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.user?.email) return null;
    
    // Find employee by email
    const employee = await prisma.employee.findUnique({
      where: { email: data.user.email },
      select: { employeeId: true },
    });
    
    return employee?.employeeId || null;
  } catch {
    return null;
  }
}

// GET - Check if user is enrolled in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = BigInt(id);
    const employeeId = await getCurrentEmployeeId();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check enrollment status
    const enrollment = await prisma.$queryRaw<Array<{
      enrollment_id: bigint;
      status: string;
      enrolled_at: Date;
      completed_at: Date | null;
    }>>`
      SELECT enrollment_id, status, enrolled_at, completed_at
      FROM course_enrollments
      WHERE course_id = ${courseId} AND employee_id = ${employeeId}
    `;
    
    // Get course enrollment stats
    const stats = await prisma.$queryRaw<Array<{
      enrolled_count: bigint;
      max_capacity: number | null;
    }>>`
      SELECT 
        COUNT(ce.enrollment_id) as enrolled_count,
        c.max_capacity
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.status = 'ENROLLED'
      WHERE c.course_id = ${courseId}
      GROUP BY c.course_id, c.max_capacity
    `;
    
    return NextResponse.json({
      isEnrolled: enrollment.length > 0 && enrollment[0].status === "ENROLLED",
      enrollment: enrollment.length > 0 ? {
        id: enrollment[0].enrollment_id.toString(),
        status: enrollment[0].status,
        enrolledAt: enrollment[0].enrolled_at.toISOString(),
        completedAt: enrollment[0].completed_at?.toISOString() || null,
      } : null,
      enrolledCount: Number(stats[0]?.enrolled_count || 0),
      maxCapacity: stats[0]?.max_capacity || null,
    });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return NextResponse.json(
      { error: "Failed to check enrollment status" },
      { status: 500 }
    );
  }
}

// POST - Enroll in a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = BigInt(id);
    const employeeId = await getCurrentEmployeeId();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check if course exists and is published
    const course = await prisma.$queryRaw<Array<{
      course_id: bigint;
      title: string;
      max_capacity: number | null;
      scheduled_date: Date | null;
      is_published: boolean;
    }>>`
      SELECT course_id, title, max_capacity, scheduled_date, is_published
      FROM courses
      WHERE course_id = ${courseId}
    `;
    
    if (course.length === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    if (!course[0].is_published) {
      return NextResponse.json(
        { error: "Course is not available for enrollment" },
        { status: 400 }
      );
    }
    
    // Check if already enrolled
    const existingEnrollment = await prisma.$queryRaw<Array<{
      enrollment_id: bigint;
      status: string;
    }>>`
      SELECT enrollment_id, status
      FROM course_enrollments
      WHERE course_id = ${courseId} AND employee_id = ${employeeId}
    `;
    
    if (existingEnrollment.length > 0) {
      if (existingEnrollment[0].status === "ENROLLED") {
        return NextResponse.json(
          { error: "Already enrolled in this course" },
          { status: 400 }
        );
      }
      
      // Re-enroll if previously cancelled
      if (existingEnrollment[0].status === "CANCELLED") {
        await prisma.$executeRaw`
          UPDATE course_enrollments
          SET status = 'ENROLLED', enrolled_at = NOW(), cancelled_at = NULL, updated_at = NOW()
          WHERE enrollment_id = ${existingEnrollment[0].enrollment_id}
        `;
        
        return NextResponse.json({
          success: true,
          message: "Successfully re-enrolled in course",
          courseTitle: course[0].title,
        });
      }
    }
    
    // Check capacity
    if (course[0].max_capacity) {
      const enrolledCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM course_enrollments
        WHERE course_id = ${courseId} AND status = 'ENROLLED'
      `;
      
      if (Number(enrolledCount[0].count) >= course[0].max_capacity) {
        // Add to waitlist
        await prisma.$executeRaw`
          INSERT INTO course_enrollments (course_id, employee_id, status, enrolled_at, created_at, updated_at)
          VALUES (${courseId}, ${employeeId}, 'WAITLISTED', NOW(), NOW(), NOW())
        `;
        
        return NextResponse.json({
          success: true,
          message: "Course is full. You have been added to the waitlist.",
          status: "WAITLISTED",
          courseTitle: course[0].title,
        });
      }
    }
    
    // Create enrollment
    await prisma.$executeRaw`
      INSERT INTO course_enrollments (course_id, employee_id, status, enrolled_at, created_at, updated_at)
      VALUES (${courseId}, ${employeeId}, 'ENROLLED', NOW(), NOW(), NOW())
    `;
    
    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      status: "ENROLLED",
      courseTitle: course[0].title,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = BigInt(id);
    const employeeId = await getCurrentEmployeeId();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check if enrolled
    const enrollment = await prisma.$queryRaw<Array<{
      enrollment_id: bigint;
      status: string;
    }>>`
      SELECT enrollment_id, status
      FROM course_enrollments
      WHERE course_id = ${courseId} AND employee_id = ${employeeId}
    `;
    
    if (enrollment.length === 0) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 400 }
      );
    }
    
    if (enrollment[0].status === "CANCELLED") {
      return NextResponse.json(
        { error: "Enrollment already cancelled" },
        { status: 400 }
      );
    }
    
    if (enrollment[0].status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed course" },
        { status: 400 }
      );
    }
    
    // Cancel enrollment
    await prisma.$executeRaw`
      UPDATE course_enrollments
      SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW()
      WHERE enrollment_id = ${enrollment[0].enrollment_id}
    `;
    
    // Check waitlist and promote first person if there's capacity
    const course = await prisma.$queryRaw<Array<{
      course_id: bigint;
      max_capacity: number | null;
    }>>`
      SELECT course_id, max_capacity
      FROM courses
      WHERE course_id = ${courseId}
    `;
    
    if (course[0]?.max_capacity) {
      // Get current enrolled count
      const enrolledCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM course_enrollments
        WHERE course_id = ${courseId} AND status = 'ENROLLED'
      `;
      
      // If there's room, promote first waitlisted person
      if (Number(enrolledCount[0].count) < course[0].max_capacity) {
        const waitlisted = await prisma.$queryRaw<Array<{
          enrollment_id: bigint;
          employee_id: bigint;
        }>>`
          SELECT enrollment_id, employee_id
          FROM course_enrollments
          WHERE course_id = ${courseId} AND status = 'WAITLISTED'
          ORDER BY enrolled_at ASC
          LIMIT 1
        `;
        
        if (waitlisted.length > 0) {
          await prisma.$executeRaw`
            UPDATE course_enrollments
            SET status = 'ENROLLED', updated_at = NOW()
            WHERE enrollment_id = ${waitlisted[0].enrollment_id}
          `;
          
          // TODO: Send notification to promoted user
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Enrollment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling enrollment:", error);
    return NextResponse.json(
      { error: "Failed to cancel enrollment" },
      { status: 500 }
    );
  }
}
