"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Video,
  MapPin,
  GraduationCap,
  UserPlus,
  UserMinus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description?: string;
  targetAudience?: string;
  durationMinutes?: number;
  deliveryMode: string;
  scheduledDate?: string;
  maxCapacity?: number;
  enrolledCount?: number;
  location?: string;
  isPublished: boolean;
  instructor: {
    id: string;
    name: string;
    position?: string;
    department?: string;
    imageUrl?: string;
  };
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  status?: string;
  enrolledCount: number;
  maxCapacity: number | null;
}

type FilterDeliveryMode = "all" | "Virtual" | "In-Person" | "Hybrid";
type FilterStatus = "upcoming" | "past";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<FilterDeliveryMode>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("upcoming");
  const [currentPage, setCurrentPage] = useState(1);
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<Record<string, EnrollmentStatus>>({});
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const coursesPerPage = 5;

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch enrollment status for all courses
  useEffect(() => {
    async function fetchEnrollmentStatuses() {
      const statuses: Record<string, EnrollmentStatus> = {};
      for (const course of courses) {
        try {
          const response = await fetch(`/api/courses/${course.id}/enroll`);
          if (response.ok) {
            const data = await response.json();
            statuses[course.id] = {
              isEnrolled: data.isEnrolled,
              status: data.enrollment?.status,
              enrolledCount: data.enrolledCount,
              maxCapacity: data.maxCapacity,
            };
          }
        } catch {
          // Silently fail for unauthenticated users
        }
      }
      setEnrollmentStatuses(statuses);
    }
    
    if (courses.length > 0) {
      fetchEnrollmentStatuses();
    }
  }, [courses]);

  // Handle enrollment
  const handleEnroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Successfully enrolled!");
        // Update enrollment status
        setEnrollmentStatuses((prev) => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            isEnrolled: data.status === "ENROLLED",
            status: data.status,
            enrolledCount: (prev[courseId]?.enrolledCount || 0) + 1,
          },
        }));
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to enroll");
      }
    } catch {
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Handle unenrollment
  const handleUnenroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Enrollment cancelled");
        // Update enrollment status
        setEnrollmentStatuses((prev) => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            isEnrolled: false,
            status: "CANCELLED",
            enrolledCount: Math.max((prev[courseId]?.enrolledCount || 1) - 1, 0),
          },
        }));
        fetchCourses();
      } else {
        toast.error(data.error || "Failed to cancel enrollment");
      }
    } catch {
      toast.error("Failed to cancel enrollment. Please try again.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDeliveryMode =
      deliveryModeFilter === "all" || course.deliveryMode === deliveryModeFilter;

    const now = new Date();
    const isUpcoming = !course.scheduledDate || new Date(course.scheduledDate) >= now;
    const matchesStatus =
      (statusFilter === "upcoming" && isUpcoming) ||
      (statusFilter === "past" && !isUpcoming);

    return matchesSearch && matchesDeliveryMode && matchesStatus;
  });

  // Separate upcoming and past courses
  const now = new Date();
  const upcomingCourses = filteredCourses.filter(
    (c) => !c.scheduledDate || new Date(c.scheduledDate) >= now
  );
  const pastCourses = filteredCourses.filter(
    (c) => c.scheduledDate && new Date(c.scheduledDate) < now
  );

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Training & Courses</h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Discover learning opportunities designed and delivered by our subject matter experts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses, topics, or instructors..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            {/* Delivery Mode Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={deliveryModeFilter}
                onChange={(e) => {
                  setDeliveryModeFilter(e.target.value as FilterDeliveryMode);
                  setCurrentPage(1);
                }}
                className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Formats</option>
                <option value="Virtual">Virtual</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FilterStatus);
                setCurrentPage(1);
              }}
              className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{upcomingCourses.length} Upcoming</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{pastCourses.length} Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>{courses.length} Total Courses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Results count */}
        {filteredCourses.length > 0 && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredCourses.length > 0
                  ? `${(currentPage - 1) * coursesPerPage + 1}-${Math.min(currentPage * coursesPerPage, filteredCourses.length)}`
                  : "0"}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filteredCourses.length}</span> courses
            </p>
          </div>
        )}

        {filteredCourses.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery || deliveryModeFilter !== "all"
                ? "Try adjusting your filters or search query to find more courses."
                : "There are no training courses available yet. Check back later!"}
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Sessions */}
            {statusFilter === "upcoming" && upcomingCourses.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                    Upcoming Sessions
                  </h2>
                </div>

                <div className="space-y-4">
                  {paginatedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isUpcoming={true}
                      formatDuration={formatDuration}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      enrollmentStatus={enrollmentStatuses[course.id]}
                      onEnroll={() => handleEnroll(course.id)}
                      onUnenroll={() => handleUnenroll(course.id)}
                      isEnrolling={enrollingCourseId === course.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Sessions - Only show when specifically filtered */}
            {statusFilter === "past" && pastCourses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wide">
                    Past Courses
                  </h2>
                </div>

                <div className="space-y-4">
                  {paginatedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isUpcoming={false}
                      formatDuration={formatDuration}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      enrollmentStatus={enrollmentStatuses[course.id]}
                      onEnroll={() => handleEnroll(course.id)}
                      onUnenroll={() => handleUnenroll(course.id)}
                      isEnrolling={enrollingCourseId === course.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Course Card Component
function CourseCard({
  course,
  isUpcoming,
  formatDuration,
  formatDate,
  formatTime,
  enrollmentStatus,
  onEnroll,
  onUnenroll,
  isEnrolling,
}: {
  course: Course;
  isUpcoming: boolean;
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  enrollmentStatus?: EnrollmentStatus;
  onEnroll: () => void;
  onUnenroll: () => void;
  isEnrolling: boolean;
}) {
  const getDeliveryModeIcon = (mode: string) => {
    switch (mode) {
      case "Virtual":
        return <Video className="w-4 h-4" />;
      case "In-Person":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`bg-card rounded-2xl shadow-sm border-2 ${
        isUpcoming ? "border-border" : "border-border/50 opacity-75"
      } p-6 transition-all hover:shadow-md`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-lg ml-4 ${
                isUpcoming
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isUpcoming ? "Open" : "Completed"}
            </span>
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {course.durationMinutes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDuration(course.durationMinutes)}
                </p>
              </div>
            )}

            {course.scheduledDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isUpcoming ? "Next Session" : "Was Scheduled"}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(course.scheduledDate)}
                </p>
              </div>
            )}

            {course.targetAudience && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
                <p className="text-sm font-semibold text-foreground">{course.targetAudience}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Format</p>
              <div className="flex items-center gap-1.5">
                {getDeliveryModeIcon(course.deliveryMode)}
                <p className="text-sm font-semibold text-foreground">{course.deliveryMode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor & Actions */}
        <div className="lg:w-64 flex flex-col gap-4">
          {/* Instructor */}
          <Link
            href={`/experts/${course.instructor.id}`}
            className="flex items-center gap-3 p-3 bg-muted rounded-xl hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm overflow-hidden">
              {course.instructor.imageUrl ? (
                <img
                  src={course.instructor.imageUrl}
                  alt={course.instructor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                course.instructor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {course.instructor.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {course.instructor.position || course.instructor.department || "Instructor"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Enroll Button (only for upcoming) */}
          {isUpcoming && (
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
