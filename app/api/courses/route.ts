import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define the return type for our course query
interface CourseWithSme {
  courseId: bigint;
  smeId: bigint;
  title: string;
  description: string | null;
  targetAudience: string | null;
  durationMinutes: number | null;
  deliveryMode: string;
  materialsUrl: string | null;
  scheduledDate: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  sme: {
    smeId: bigint;
    employee: {
      employeeId: bigint;
      fullName: string;
      position: string | null;
      departmentName: string | null;
      imageUrl: string | null;
    };
  };
}

// GET - Fetch all courses with instructor info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "upcoming", "past", or null for all
    const deliveryMode = searchParams.get("deliveryMode");
    const search = searchParams.get("search");

    // Build where clause using Prisma.sql for type safety
    const conditions: Prisma.Sql[] = [Prisma.sql`c.is_published = true`];

    // Filter by delivery mode
    if (deliveryMode && deliveryMode !== "all") {
      conditions.push(Prisma.sql`c.delivery_mode = ${deliveryMode}`);
    }

    // Filter by scheduled date status
    const now = new Date();
    if (status === "upcoming") {
      conditions.push(Prisma.sql`(c.scheduled_date IS NULL OR c.scheduled_date >= ${now})`);
    } else if (status === "past") {
      conditions.push(Prisma.sql`c.scheduled_date < ${now}`);
    }

    // Search filter
    if (search && search.trim()) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(Prisma.sql`(
        LOWER(c.title) LIKE ${searchPattern} OR 
        LOWER(c.description) LIKE ${searchPattern} OR 
        LOWER(c.target_audience) LIKE ${searchPattern} OR
        LOWER(e.full_name) LIKE ${searchPattern}
      )`);
    }

    const whereClause = conditions.length > 0 
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // Use raw SQL query to get courses with all related data
    const courses = await prisma.$queryRaw<Array<{
      course_id: bigint;
      sme_id: bigint;
      title: string;
      description: string | null;
      target_audience: string | null;
      duration_minutes: number | null;
      delivery_mode: string;
      materials_url: string | null;
      scheduled_date: Date | null;
      max_capacity: number | null;
      location: string | null;
      is_published: boolean;
      created_at: Date;
      employee_id: bigint;
      full_name: string;
      position: string | null;
      department_name: string | null;
      image_url: string | null;
      enrolled_count: bigint;
    }>>`
      SELECT 
        c.course_id,
        c.sme_id,
        c.title,
        c.description,
        c.target_audience,
        c.duration_minutes,
        c.delivery_mode,
        c.materials_url,
        c.scheduled_date,
        c.max_capacity,
        c.location,
        c.is_published,
        c.created_at,
        e.employee_id,
        e.full_name,
        e.position,
        e.department_name,
        e.image_url,
        COALESCE((SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.course_id AND ce.status = 'ENROLLED'), 0) as enrolled_count
      FROM courses c
      INNER JOIN sme_profiles sp ON c.sme_id = sp.sme_id
      INNER JOIN employees e ON sp.employee_id = e.employee_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.scheduled_date IS NULL THEN 1 ELSE 0 END,
        c.scheduled_date ASC,
        c.created_at DESC
    `;

    // Transform the data for the frontend
    const transformedCourses = courses.map((course) => ({
      id: course.course_id.toString(),
      title: course.title,
      description: course.description,
      targetAudience: course.target_audience,
      durationMinutes: course.duration_minutes,
      deliveryMode: course.delivery_mode === "TEAMS" ? "Virtual" : course.delivery_mode,
      scheduledDate: course.scheduled_date?.toISOString() || null,
      maxCapacity: course.max_capacity,
      location: course.location,
      enrolledCount: Number(course.enrolled_count),
      isPublished: course.is_published,
      createdAt: course.created_at.toISOString(),
      instructor: {
        id: course.sme_id.toString(),
        name: course.full_name,
        position: course.position,
        department: course.department_name,
        imageUrl: course.image_url,
      },
    }));

    return NextResponse.json({
      courses: transformedCourses,
      total: transformedCourses.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
