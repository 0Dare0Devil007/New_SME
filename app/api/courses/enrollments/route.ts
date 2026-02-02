import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// Helper function to get current user's employee ID
async function getCurrentEmployeeId(): Promise<bigint | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.user?.email) return null;
    
    const employee = await prisma.employee.findUnique({
      where: { email: data.user.email },
      select: { employeeId: true },
    });
    
    return employee?.employeeId || null;
  } catch {
    return null;
  }
}

// GET - Fetch user's enrolled courses
export async function GET(request: NextRequest) {
  try {
    const employeeId = await getCurrentEmployeeId();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // ENROLLED, COMPLETED, CANCELLED, WAITLISTED
    
    // Build status filter
    let statusCondition = "";
    if (status && status !== "all") {
      statusCondition = `AND ce.status = '${status}'`;
    }
    
    // Fetch enrolled courses with course details
    const enrollments = await prisma.$queryRaw<Array<{
      enrollment_id: bigint;
      course_id: bigint;
      status: string;
      enrolled_at: Date;
      completed_at: Date | null;
      cancelled_at: Date | null;
      feedback: string | null;
      rating: number | null;
      title: string;
      description: string | null;
      duration_minutes: number | null;
      delivery_mode: string;
      scheduled_date: Date | null;
      max_capacity: number | null;
      location: string | null;
      sme_id: bigint;
      instructor_name: string;
      instructor_position: string | null;
      instructor_department: string | null;
      instructor_avatar: string | null;
      enrolled_count: bigint;
    }>>`
      SELECT 
        ce.enrollment_id,
        ce.course_id,
        ce.status,
        ce.enrolled_at,
        ce.completed_at,
        ce.cancelled_at,
        ce.feedback,
        ce.rating,
        c.title,
        c.description,
        c.duration_minutes,
        c.delivery_mode,
        c.scheduled_date,
        c.max_capacity,
        c.location,
        c.sme_id,
        e.full_name as instructor_name,
        e.position as instructor_position,
        e.department_name as instructor_department,
        e.avatar_url as instructor_avatar,
        (SELECT COUNT(*) FROM course_enrollments ce2 WHERE ce2.course_id = c.course_id AND ce2.status = 'ENROLLED') as enrolled_count
      FROM course_enrollments ce
      INNER JOIN courses c ON ce.course_id = c.course_id
      INNER JOIN sme_profiles sp ON c.sme_id = sp.sme_id
      INNER JOIN employees e ON sp.employee_id = e.employee_id
      WHERE ce.employee_id = ${employeeId}
      ${status && status !== "all" ? prisma.$queryRawUnsafe(`AND ce.status = '${status}'`) : prisma.sql``}
      ORDER BY 
        CASE ce.status
          WHEN 'ENROLLED' THEN 1
          WHEN 'WAITLISTED' THEN 2
          WHEN 'COMPLETED' THEN 3
          WHEN 'CANCELLED' THEN 4
        END,
        c.scheduled_date ASC NULLS LAST
    `;
    
    // Transform data
    const transformedEnrollments = enrollments.map((e) => ({
      enrollmentId: e.enrollment_id.toString(),
      status: e.status,
      enrolledAt: e.enrolled_at.toISOString(),
      completedAt: e.completed_at?.toISOString() || null,
      cancelledAt: e.cancelled_at?.toISOString() || null,
      feedback: e.feedback,
      rating: e.rating,
      course: {
        id: e.course_id.toString(),
        title: e.title,
        description: e.description,
        durationMinutes: e.duration_minutes,
        deliveryMode: e.delivery_mode === "TEAMS" ? "Virtual" : e.delivery_mode,
        scheduledDate: e.scheduled_date?.toISOString() || null,
        maxCapacity: e.max_capacity,
        location: e.location,
        enrolledCount: Number(e.enrolled_count),
        instructor: {
          id: e.sme_id.toString(),
          name: e.instructor_name,
          position: e.instructor_position,
          department: e.instructor_department,
          imageUrl: e.instructor_avatar,
        },
      },
    }));
    
    // Group by status for summary
    const summary = {
      enrolled: transformedEnrollments.filter((e) => e.status === "ENROLLED").length,
      waitlisted: transformedEnrollments.filter((e) => e.status === "WAITLISTED").length,
      completed: transformedEnrollments.filter((e) => e.status === "COMPLETED").length,
      cancelled: transformedEnrollments.filter((e) => e.status === "CANCELLED").length,
    };
    
    return NextResponse.json({
      enrollments: transformedEnrollments,
      summary,
      total: transformedEnrollments.length,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
