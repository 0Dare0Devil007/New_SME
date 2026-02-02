"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Clock, 
  Award, 
  BookOpen, 
  Calendar,
  Users,
  Star,
  ThumbsUp,
  GraduationCap,
  CheckCircle2,
  Loader2,
  X,
  Edit,
  Power,
  PowerOff,
  Plus,
  Trash2
} from "lucide-react";

interface ExpertDetail {
  id: string;
  name: string;
  position: string;
  department: string;
  siteName: string;
  imageUrl?: string;
  email: string;
  phone: string;
  employeeId: string;
  responseTime: string;
  bio: string;
  availability: string;
  contactPref: string;
  teamsLink?: string;
  totalEndorsements: number;
  studentCount: number;
  yearsExperience: number;
  skills: Array<{
    id: string;
    name: string;
    proficiency: string;
    yearsExp: string;
    endorsementCount: number;
  }>;
  recentEndorsements: Array<{
    id: string;
    endorserName: string;
    endorserPosition: string;
    endorserAvatar?: string;
    skillName: string;
    comment?: string;
    endorsedAt: string;
  }>;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    issuedDate?: string;
    expiryDate?: string;
  }>;
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    targetAudience?: string;
    durationMinutes?: number;
    deliveryMode: string;
    scheduledDate?: string;
  }>;
}

export default function ExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const { id } = use(params);
  
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endorsedSkillIds, setEndorsedSkillIds] = useState<string[]>([]);
  const [endorsingSkillId, setEndorsingSkillId] = useState<string | null>(null);
  const [endorseModalOpen, setEndorseModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ id: string; name: string } | null>(null);
  const [endorseComment, setEndorseComment] = useState("");
  const [endorseLoading, setEndorseLoading] = useState(false);
  const [endorseError, setEndorseError] = useState<string | null>(null);
  const [currentUserSmeId, setCurrentUserSmeId] = useState<string | null>(null);
  const [currentUserSmeStatus, setCurrentUserSmeStatus] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    targetAudience: "",
    durationMinutes: "",
    deliveryMode: "Virtual",
    scheduledDate: "",
  });
  const [courseFormLoading, setCourseFormLoading] = useState(false);
  const [courseFormError, setCourseFormError] = useState<string | null>(null);
  const [skillsPage, setSkillsPage] = useState(1);
  const skillsPerPage = 5;
  const [certsPage, setCertsPage] = useState(1);
  const certsPerPage = 6;
  const [upcomingCoursesPage, setUpcomingCoursesPage] = useState(1);
  const [pastCoursesPage, setPastCoursesPage] = useState(1);
  const coursesPerPage = 2;

  // Check if viewing own profile (cannot endorse self)
  const isOwnProfile = currentUserSmeId !== null && expert?.id === currentUserSmeId;

  // Helper to format weekly availability
  const formatWeeklyAvailability = (availabilityJson: string) => {
    try {
      const availability = JSON.parse(availabilityJson);
      const days = [
        { key: "monday", label: "Mon" },
        { key: "tuesday", label: "Tue" },
        { key: "wednesday", label: "Wed" },
        { key: "thursday", label: "Thu" },
        { key: "friday", label: "Fri" },
        { key: "saturday", label: "Sat" },
        { key: "sunday", label: "Sun" },
      ];

      const enabledDays = days.filter((day) => availability[day.key]?.enabled);
      
      if (enabledDays.length === 0) {
        return "Not specified";
      }

      return enabledDays.map((day) => {
        const dayData = availability[day.key];
        return `${day.label}: ${dayData.timeFrom} - ${dayData.timeTo}`;
      });
    } catch {
      return ["Not specified"];
    }
  };

  // Update page title with expert name
  useEffect(() => {
    if (expert) {
      document.title = `${expert.name} - SME Profile`;
    }
    return () => {
      document.title = "SME Directory";
    };
  }, [expert]);

  // Fetch current user's smeId and status to check for self-view
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserSmeId(data.smeId || null);
          setCurrentUserSmeStatus(data.smeStatus || null);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    }
    fetchCurrentUser();
  }, []);

  // Toggle SME profile status (activate/deactivate)
  const toggleSmeStatus = async () => {
    setTogglingStatus(true);
    try {
      const response = await fetch("/api/sme-profile", {
        method: "PATCH",
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUserSmeStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const fetchEndorsedSkills = useCallback(async (smeId: string) => {
    try {
      const response = await fetch(`/api/endorsements?smeId=${smeId}`);
      if (response.ok) {
        const data = await response.json();
        setEndorsedSkillIds(data.endorsedSkillIds || []);
      }
    } catch (err) {
      console.error("Failed to fetch endorsed skills:", err);
    }
  }, []);

  useEffect(() => {
    async function fetchExpert() {
      // Early return if no id
      if (!id) {
        setError("Invalid expert ID");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/experts/${id}`);
        if (!response.ok) {
          throw new Error("Expert not found");
        }
        const data = await response.json();
        setExpert(data);
        // Fetch which skills user has already endorsed
        fetchEndorsedSkills(data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load expert");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpert();
  }, [id, fetchEndorsedSkills]);

  const handleEndorseClick = (skillId: string, skillName: string) => {
    setSelectedSkill({ id: skillId, name: skillName });
    setEndorseComment("");
    setEndorseError(null);
    setEndorseModalOpen(true);
  };

  const submitEndorsement = async () => {
    if (!selectedSkill) return;

    setEndorseLoading(true);
    setEndorseError(null);

    try {
      const response = await fetch("/api/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smeSkillId: selectedSkill.id,
          comment: endorseComment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create endorsement");
      }

      // Update local state
      setEndorsedSkillIds((prev) => [...prev, selectedSkill.id]);
      
      // Update expert's endorsement count
      if (expert) {
        setExpert({
          ...expert,
          totalEndorsements: expert.totalEndorsements + 1,
          skills: expert.skills.map((skill) =>
            skill.id === selectedSkill.id
              ? { ...skill, endorsementCount: skill.endorsementCount + 1 }
              : skill
          ),
        });
      }

      setEndorseModalOpen(false);
    } catch (err) {
      setEndorseError(err instanceof Error ? err.message : "Failed to endorse");
    } finally {
      setEndorseLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setShowCourseForm(true);
    setNewCourse({
      title: "",
      description: "",
      targetAudience: "",
      durationMinutes: "",
      deliveryMode: "Virtual",
      scheduledDate: "",
    });
    setCourseFormError(null);
  };

  const submitCourse = async () => {
    if (!newCourse.title.trim()) return;

    // Validate that scheduled date is not in the past
    if (newCourse.scheduledDate) {
      const selectedDate = new Date(newCourse.scheduledDate);
      const now = new Date();
      if (selectedDate < now) {
        setCourseFormError("Scheduled date cannot be in the past");
        return;
      }
    }

    setCourseFormLoading(true);
    setCourseFormError(null);

    try {
      const response = await fetch("/api/sme-profile/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description || null,
          targetAudience: newCourse.targetAudience || null,
          durationMinutes: newCourse.durationMinutes ? parseInt(newCourse.durationMinutes) : null,
          deliveryMode: newCourse.deliveryMode,
          scheduledDate: newCourse.scheduledDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to create course");
      }

      // Update expert's courses
      if (expert) {
        setExpert({
          ...expert,
          courses: [...expert.courses, data.course],
        });
      }

      setShowCourseForm(false);
      setNewCourse({
        title: "",
        description: "",
        targetAudience: "",
        durationMinutes: "",
        deliveryMode: "Virtual",
        scheduledDate: "",
      });
    } catch (err) {
      setCourseFormError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setCourseFormLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this training session?")) {
      return;
    }

    try {
      const response = await fetch(`/api/sme-profile/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete course");
      }

      // Update expert's courses
      if (expert) {
        setExpert({
          ...expert,
          courses: expert.courses.filter((c) => c.id !== courseId),
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "Expert not found"}</p>
          <Link href="/experts" className="text-primary hover:underline">
            Back to All Experts
          </Link>
        </div>
      </div>
    );
  }

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency.toLowerCase()) {
      case "expert":
        return "badge-skill-purple";
      case "advanced":
        return "badge-cert-blue";
      case "intermediate":
        return "badge-skill-green";
      default:
        return "bg-secondary border-border text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Link 
          href="/experts" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to All Experts</span>
        </Link>

        {/* Profile Card */}
        <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
          {/* Purple Gradient Banner with Name & Position */}
          <div 
            className="h-48 relative px-8 pt-8 bg-primary"
          >
            {/* Own Profile Actions - Top Right */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4 flex items-center gap-3">
                <Link
                  href="/sme-profile"
                  className="bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-primary-foreground/30"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </Link>
                <button
                  onClick={toggleSmeStatus}
                  disabled={togglingStatus}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all border-2 disabled:opacity-50 font-medium shadow-lg ${
                    currentUserSmeStatus === "APPROVED"
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive/70 shadow-destructive/30"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary/70 shadow-primary/30"
                  }`}
                >
                  {togglingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : currentUserSmeStatus === "APPROVED" ? (
                    <PowerOff className="w-4 h-4" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {togglingStatus
                      ? "Updating..."
                      : currentUserSmeStatus === "APPROVED"
                      ? "Deactivate"
                      : "Activate"}
                  </span>
                </button>
              </div>
            )}
            
            {/* Name and Position on Banner */}
            <div className="ml-48 pl-6">
              <h1 className="text-4xl font-bold text-white mb-1">{expert.name}</h1>
              <p className="text-lg font-medium text-white/90">{expert.position}</p>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="px-8 pb-8 -mt-20">
            <div className="flex gap-6 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-40 h-40 rounded-full border-8 border-card shadow-2xl overflow-hidden bg-primary">
                  {expert.imageUrl ? (
                    <img 
                      src={expert.imageUrl} 
                      alt={expert.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                      {expert.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 pt-24">
                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-primary rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <ThumbsUp className="w-3 h-3 text-primary-foreground" />
                    <span className="text-primary-foreground text-xs font-semibold">{expert.totalEndorsements} Endorsements</span>
                  </div>
                  <div className="border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span className="text-foreground text-xs font-medium">{expert.studentCount}+ Students</span>
                  </div>
                  <div className="border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Award className="w-3 h-3" />
                    <span className="text-foreground text-xs font-medium">{expert.yearsExperience}+ Years Experience</span>
                  </div>
                </div>

                {/* Quick Info Icons */}
                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-semibold text-foreground">{expert.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold text-foreground">{expert.siteName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Response Time</p>
                      <p className="text-sm font-semibold text-foreground">{expert.responseTime}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">Call Now</span>
                  </button>
                  <button className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-chart-1/20 transition-all">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Start Teams Meeting</span>
                  </button>
                  <a 
                    href={expert.teamsLink || `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(expert.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border-2 border-border hover:border-muted-foreground text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Message on Teams</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-foreground" />
                <h3 className="text-lg font-bold text-foreground">Contact Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                  <a href={`mailto:${expert.email}`} className="text-sm font-medium text-primary hover:underline">
                    {expert.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-sm font-medium text-foreground">{expert.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Employee ID</p>
                  <p className="text-sm font-medium text-foreground">{expert.employeeId}</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-foreground" />
                <h3 className="text-lg font-bold text-foreground">Availability</h3>
              </div>
              <div className="space-y-2">
                {(() => {
                  const schedules = formatWeeklyAvailability(expert.availability);
                  return Array.isArray(schedules) ? schedules.map((schedule: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-chart-1/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-chart-1" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{schedule}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{schedules}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Impact Summary */}
            <div className="rounded-2xl shadow-lg p-6 bg-primary">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary-foreground" />
                <h3 className="text-lg font-bold text-primary-foreground">Impact Summary</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary-foreground">{expert.totalEndorsements}</p>
                  <p className="text-sm text-primary-foreground/80">Total Endorsements</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-foreground">{expert.studentCount}</p>
                  <p className="text-sm text-primary-foreground/80">Students Trained</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-foreground" />
                <h2 className="text-xl font-bold text-foreground">About {expert.name.split(" ")[0]}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {expert.bio || `${expert.name} is a ${expert.position} with extensive experience in ${expert.department}. They are passionate about sharing knowledge and helping others grow in their careers.`}
              </p>
            </div>

            {/* Skills & Expertise */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-foreground" />
                  <h2 className="text-xl font-bold text-foreground">Skills & Expertise</h2>
                </div>
                {expert.skills.length > skillsPerPage && (
                  <span className="text-sm text-muted-foreground">
                    {expert.skills.length} skills total
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {expert.skills
                  .slice((skillsPage - 1) * skillsPerPage, skillsPage * skillsPerPage)
                  .map((skill) => (
                  <div 
                    key={skill.id}
                    className="bg-secondary/50 border-2 border-border rounded-2xl p-5 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-bold text-foreground">{skill.name}</h4>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${getProficiencyColor(skill.proficiency)}`}>
                          {skill.proficiency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{skill.endorsementCount} endorsements</span>
                      </div>
                    </div>
                    {isOwnProfile ? (
                      <span className="bg-secondary border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium">
                        Your skill
                      </span>
                    ) : endorsedSkillIds.includes(skill.id) ? (
                      <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Endorsed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEndorseClick(skill.id, skill.name)}
                        disabled={endorsingSkillId === skill.id}
                        className="bg-card border border-border hover:border-primary hover:bg-primary/5 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {endorsingSkillId === skill.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-4 h-4" />
                        )}
                        Endorse
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {expert.skills.length > skillsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <button
                    onClick={() => setSkillsPage((prev) => Math.max(1, prev - 1))}
                    disabled={skillsPage === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(expert.skills.length / skillsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setSkillsPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          skillsPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSkillsPage((prev) => Math.min(Math.ceil(expert.skills.length / skillsPerPage), prev + 1))}
                    disabled={skillsPage === Math.ceil(expert.skills.length / skillsPerPage)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              )}
            </div>

            {/* Professional Certifications */}
            {expert.certifications.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-foreground" />
                    <h2 className="text-xl font-bold text-foreground">Professional Certifications</h2>
                  </div>
                  {expert.certifications.length > certsPerPage && (
                    <span className="text-sm text-muted-foreground">
                      {expert.certifications.length} certifications total
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expert.certifications
                    .slice((certsPage - 1) * certsPerPage, certsPage * certsPerPage)
                    .map((cert) => (
                    <div 
                      key={cert.id}
                      className="border border-border rounded-2xl p-4 bg-secondary/30"
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                          <GraduationCap className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-foreground mb-1">{cert.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{cert.issuer}</p>
                          <div className="flex gap-2">
                            {cert.issuedDate && (
                              <span className="text-xs border border-border rounded-lg px-2 py-1 text-muted-foreground">
                                Issued {new Date(cert.issuedDate).getFullYear()}
                              </span>
                            )}
                            {cert.expiryDate && (
                              <span className="text-xs border border-border rounded-lg px-2 py-1 text-muted-foreground">
                                Expires {new Date(cert.expiryDate).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certifications Pagination Controls */}
                {expert.certifications.length > certsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <button
                      onClick={() => setCertsPage((prev) => Math.max(1, prev - 1))}
                      disabled={certsPage === 1}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(expert.certifications.length / certsPerPage) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCertsPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            certsPage === page
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCertsPage((prev) => Math.min(Math.ceil(expert.certifications.length / certsPerPage), prev + 1))}
                      disabled={certsPage === Math.ceil(expert.certifications.length / certsPerPage)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Training & Courses */}
            {isOwnProfile && expert.courses.length === 0 && !showCourseForm ? (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-foreground" />
                      <h2 className="text-xl font-bold text-foreground">Training & Courses</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Schedule and manage your training sessions
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">No sessions scheduled yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
                    Create your first training session to share your expertise with colleagues. Sessions can be workshops, webinars, or group consultations.
                  </p>
                  <button
                    onClick={handleCreateCourse}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg font-bold">+</span>
                    Create Your First Session
                  </button>
                </div>
              </div>
            ) : (isOwnProfile || expert.courses.length > 0) && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-foreground" />
                      <h2 className="text-xl font-bold text-foreground">Training & Courses</h2>
                    </div>
                    {isOwnProfile && !showCourseForm && (
                      <button
                        onClick={handleCreateCourse}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Session
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Learning opportunities designed and delivered by {expert.name.split(" ")[0]}
                  </p>
                </div>

                {/* Add Course Form */}
                {isOwnProfile && showCourseForm && (
                  <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">New Training Session</h3>
                      <button
                        type="button"
                        onClick={() => setShowCourseForm(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-medium">
                          Course Title <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCourse.title}
                          onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                          placeholder="e.g., Advanced Project Management Workshop"
                          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-medium">Description</label>
                        <textarea
                          value={newCourse.description}
                          onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                          placeholder="Describe what participants will learn in this training session..."
                          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-medium">Target Audience</label>
                        <input
                          type="text"
                          value={newCourse.targetAudience}
                          onChange={(e) => setNewCourse({ ...newCourse, targetAudience: e.target.value })}
                          placeholder="e.g., Beginners to Intermediate, Team Leads, All Staff"
                          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-medium">
                          Scheduled Date & Time <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newCourse.scheduledDate}
                          onChange={(e) => setNewCourse({ ...newCourse, scheduledDate: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1 font-medium">Duration (minutes)</label>
                          <input
                            type="number"
                            value={newCourse.durationMinutes}
                            onChange={(e) => setNewCourse({ ...newCourse, durationMinutes: e.target.value })}
                            placeholder="e.g., 120"
                            className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-muted-foreground mb-1 font-medium">
                            Delivery Mode <span className="text-destructive">*</span>
                          </label>
                          <select
                            value={newCourse.deliveryMode}
                            onChange={(e) => setNewCourse({ ...newCourse, deliveryMode: e.target.value })}
                            className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="Virtual">Virtual</option>
                            <option value="In-Person">In-Person</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {courseFormError && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {courseFormError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={submitCourse}
                      disabled={courseFormLoading || !newCourse.title.trim() || !newCourse.scheduledDate}
                      className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {courseFormLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Add Training Session
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {expert.courses.length > 0 && (() => {
                  const now = new Date();
                  const upcomingCourses = expert.courses.filter((c) => 
                    !c.scheduledDate || new Date(c.scheduledDate) >= now
                  );
                  const pastCourses = expert.courses.filter((c) => 
                    c.scheduledDate && new Date(c.scheduledDate) < now
                  );

                  return (
                    <>
                      {upcomingCourses.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                                {isOwnProfile ? "Your Upcoming Sessions" : "Upcoming Sessions"}
                              </p>
                            </div>
                            {upcomingCourses.length > coursesPerPage && (
                              <span className="text-xs text-muted-foreground">
                                {upcomingCourses.length} sessions
                              </span>
                            )}
                          </div>

                          <div className="space-y-4 mb-6">
                            {upcomingCourses
                              .slice((upcomingCoursesPage - 1) * coursesPerPage, upcomingCoursesPage * coursesPerPage)
                              .map((course) => (
                              <div 
                                key={course.id}
                                className="border-2 border-border rounded-2xl p-6 bg-primary/5"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-foreground mb-2">{course.title}</h4>
                                    {course.description && (
                                      <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-lg">
                                      Open
                                    </span>
                                    {isOwnProfile && (
                                      <button
                                        onClick={() => deleteCourse(course.id)}
                                        className="text-destructive hover:text-destructive/80 p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                        title="Delete session"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 mb-4">
                                  {course.scheduledDate && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-muted-foreground mb-1">Scheduled For</p>
                                      <p className="text-sm font-semibold text-foreground">
                                        {new Date(course.scheduledDate).toLocaleString('en-US', {
                                          weekday: 'short',
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  )}
                                  {course.durationMinutes && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                      <p className="text-sm font-semibold text-foreground">
                                        {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Delivery Mode</p>
                                    <p className="text-sm font-semibold text-foreground">{course.deliveryMode}</p>
                                  </div>
                                  {course.targetAudience && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
                                      <p className="text-sm font-semibold text-foreground">{course.targetAudience}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4" />
                                      <span>24/30 enrolled</span>
                                    </div>
                                  </div>
                                  {!isOwnProfile && (
                                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg shadow-primary/20 text-sm font-medium transition-all flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Enroll Now
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Upcoming Courses Pagination */}
                          {upcomingCourses.length > coursesPerPage && (
                            <div className="flex items-center justify-between mb-6 pt-4 border-t border-border">
                              <button
                                onClick={() => setUpcomingCoursesPage((prev) => Math.max(1, prev - 1))}
                                disabled={upcomingCoursesPage === 1}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                Prev
                              </button>
                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(upcomingCourses.length / coursesPerPage) }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setUpcomingCoursesPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                      upcomingCoursesPage === page
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-secondary"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setUpcomingCoursesPage((prev) => Math.min(Math.ceil(upcomingCourses.length / coursesPerPage), prev + 1))}
                                disabled={upcomingCoursesPage === Math.ceil(upcomingCourses.length / coursesPerPage)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Next
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {pastCourses.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-4 mt-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                                Past Sessions
                              </p>
                            </div>
                            {pastCourses.length > coursesPerPage && (
                              <span className="text-xs text-muted-foreground">
                                {pastCourses.length} sessions
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            {pastCourses
                              .slice((pastCoursesPage - 1) * coursesPerPage, pastCoursesPage * coursesPerPage)
                              .map((course) => (
                              <div 
                                key={course.id}
                                className="border-2 border-border rounded-2xl p-6 opacity-60 bg-secondary/30"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-foreground mb-2">{course.title}</h4>
                                    {course.description && (
                                      <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-secondary text-muted-foreground text-xs font-medium px-3 py-1 rounded-lg">
                                      Completed
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {course.scheduledDate && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-muted-foreground mb-1">Was Scheduled For</p>
                                      <p className="text-sm font-semibold text-foreground">
                                        {new Date(course.scheduledDate).toLocaleString('en-US', {
                                          weekday: 'short',
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  )}
                                  {course.durationMinutes && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                      <p className="text-sm font-semibold text-foreground">
                                        {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Delivery Mode</p>
                                    <p className="text-sm font-semibold text-foreground">{course.deliveryMode}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Past Courses Pagination */}
                          {pastCourses.length > coursesPerPage && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                              <button
                                onClick={() => setPastCoursesPage((prev) => Math.max(1, prev - 1))}
                                disabled={pastCoursesPage === 1}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                Prev
                              </button>
                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(pastCourses.length / coursesPerPage) }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setPastCoursesPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                      pastCoursesPage === page
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-secondary"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setPastCoursesPage((prev) => Math.min(Math.ceil(pastCourses.length / coursesPerPage), prev + 1))}
                                disabled={pastCoursesPage === Math.ceil(pastCourses.length / coursesPerPage)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Next
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}

                {expert.courses.length === 0 && !showCourseForm && !isOwnProfile && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No training sessions available yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Endorsement Modal */}
      {endorseModalOpen && selectedSkill && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Endorse Skill</h3>
              <button
                onClick={() => setEndorseModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-muted-foreground mb-4">
              You are endorsing <span className="font-semibold text-foreground">{expert?.name}</span> for{" "}
              <span className="font-semibold text-primary">{selectedSkill.name}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Comment (optional)
              </label>
              <textarea
                value={endorseComment}
                onChange={(e) => setEndorseComment(e.target.value)}
                placeholder="Share your experience working with this person on this skill..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                rows={3}
              />
            </div>

            {endorseError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {endorseError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEndorseModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEndorsement}
                disabled={endorseLoading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {endorseLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Endorsing...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    Endorse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
