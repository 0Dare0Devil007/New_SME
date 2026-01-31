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
  X
} from "lucide-react";

// Figma asset URLs (valid for 7 days)
const icons = {
  endorsement: "https://www.figma.com/api/mcp/asset/d0136145-e36e-4202-90c4-8c37d0b2e921",
  students: "https://www.figma.com/api/mcp/asset/cbb6184d-7fa9-460f-97dd-ef65b5bc16bf",
  rating: "https://www.figma.com/api/mcp/asset/4b7093ae-9487-40d9-8158-2bca9b2ba0dd",
  experience: "https://www.figma.com/api/mcp/asset/b9abdf3f-f9a0-4fa4-b739-4e54ea030308",
  department: "https://www.figma.com/api/mcp/asset/45f9cb96-ae3c-4f26-8b8c-6ee839ae0f8f",
  location: "https://www.figma.com/api/mcp/asset/a2a7abb2-b4b0-4f08-b4b4-ad8003e0094c",
  responseTime: "https://www.figma.com/api/mcp/asset/e01a4570-fbda-4b57-bf46-28167ed7d70e",
  call: "https://www.figma.com/api/mcp/asset/a96ccfb3-726d-45b9-b338-9beca3524df9",
  teams: "https://www.figma.com/api/mcp/asset/b16073d1-4b24-46e1-a22d-8c3eba564bba",
  message: "https://www.figma.com/api/mcp/asset/d801b4ce-7f3c-4394-a7b1-b6a56e5b985f",
  contact: "https://www.figma.com/api/mcp/asset/be8e132a-c3fe-4ba7-8fd4-f5fc68710029",
  availability: "https://www.figma.com/api/mcp/asset/d21dcde5-51bc-4be9-9f30-de6b1a20bb78",
  impact: "https://www.figma.com/api/mcp/asset/981770e7-9ac3-49c4-8209-f3347d879799",
  skill: "https://www.figma.com/api/mcp/asset/a4a3008b-9189-4f62-81fe-be9ea1f0a2ee",
  certification: "https://www.figma.com/api/mcp/asset/b0a754a0-1ddd-49af-9d3f-8afb51e027f3",
  course: "https://www.figma.com/api/mcp/asset/aeb23b7d-65c2-4a7d-970e-70e00db9cd7a",
};

interface ExpertDetail {
  id: string;
  name: string;
  position: string;
  department: string;
  siteName: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  employeeId: string;
  responseTime: string;
  bio: string;
  availability: string;
  contactPref: string;
  teamsLink?: string;
  languages: string;
  totalEndorsements: number;
  studentCount: number;
  averageRating: number;
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
    rating: number;
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

  // Check if viewing own profile (cannot endorse self)
  const isOwnProfile = currentUserSmeId !== null && expert?.id === currentUserSmeId;

  // Fetch current user's smeId to check for self-view
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUserSmeId(data.smeId || null);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    }
    fetchCurrentUser();
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Expert not found"}</p>
          <Link href="/experts" className="text-blue-600 hover:underline">
            Back to All Experts
          </Link>
        </div>
      </div>
    );
  }

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency.toLowerCase()) {
      case "expert":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "advanced":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "intermediate":
        return "bg-green-50 border-green-200 text-green-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Link 
          href="/experts" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to All Experts</span>
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Purple Gradient Banner */}
          <div 
            className="h-48 relative"
            style={{
              backgroundImage: "linear-gradient(170deg, rgb(21, 93, 252) 0%, rgb(79, 57, 246) 50%, rgb(130, 0, 219) 100%)",
            }}
          />
          
          {/* Profile Content */}
          <div className="px-8 pb-8 -mt-20">
            <div className="flex gap-6 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-40 h-40 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {expert.avatarUrl ? (
                    <img 
                      src={expert.avatarUrl} 
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

              {/* Name and Info */}
              <div className="flex-1 pt-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{expert.name}</h1>
                <p className="text-xl text-gray-600 mb-4">{expert.position}</p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <ThumbsUp className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-semibold">{expert.totalEndorsements} Endorsements</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span className="text-gray-900 text-xs font-medium">{expert.studentCount}+ Students</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-900 text-xs font-medium">{expert.averageRating} Rating</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Award className="w-3 h-3" />
                    <span className="text-gray-900 text-xs font-medium">{expert.yearsExperience}+ Years Experience</span>
                  </div>
                </div>

                {/* Quick Info Icons */}
                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-semibold text-gray-900">{expert.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{expert.siteName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Response Time</p>
                      <p className="text-sm font-semibold text-gray-900">{expert.responseTime}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-green-200 transition-all">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">Call Now</span>
                  </button>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200 transition-all">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Start Teams Meeting</span>
                  </button>
                  <button className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Send Message</span>
                  </button>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <a href={`mailto:${expert.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {expert.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{expert.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                  <p className="text-sm font-medium text-gray-900">{expert.employeeId}</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Availability</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Work Hours</p>
                    <p className="text-sm font-medium text-gray-900">{expert.availability}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Consultation Hours</p>
                    <p className="text-sm font-medium text-gray-900">Available on Tuesdays and Thursdays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Summary */}
            <div 
              className="rounded-2xl shadow-lg p-6"
              style={{
                backgroundImage: "linear-gradient(148.73deg, rgb(21, 93, 252) 0%, rgb(67, 45, 215) 100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Impact Summary</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-white">{expert.totalEndorsements}</p>
                  <p className="text-sm text-blue-100">Total Endorsements</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{expert.studentCount}</p>
                  <p className="text-sm text-blue-100">Students Trained</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{expert.averageRating}</p>
                  <p className="text-sm text-blue-100">Average Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">About {expert.name.split(" ")[0]}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {expert.bio || `${expert.name} is a ${expert.position} with extensive experience in ${expert.department}. They are passionate about sharing knowledge and helping others grow in their careers.`}
              </p>
            </div>

            {/* Recent Endorsements */}
            {expert.recentEndorsements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Recent Endorsements</h2>
                </div>
                <div className="space-y-4">
                  {expert.recentEndorsements.map((endorsement) => (
                    <div key={endorsement.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {endorsement.endorserName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{endorsement.endorserName}</p>
                              <p className="text-xs text-gray-500">{endorsement.endorserPosition}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-semibold text-gray-900">{endorsement.rating}</span>
                            </div>
                          </div>
                          <div className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded mb-2">
                            {endorsement.skillName}
                          </div>
                          {endorsement.comment && (
                            <p className="text-sm text-gray-600">{endorsement.comment}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(endorsement.endorsedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills & Expertise */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Skills & Expertise</h2>
              </div>
              <div className="space-y-3">
                {expert.skills.map((skill) => (
                  <div 
                    key={skill.id}
                    className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-5 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-bold text-gray-900">{skill.name}</h4>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${getProficiencyColor(skill.proficiency)}`}>
                          {skill.proficiency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{skill.endorsementCount} endorsements</span>
                      </div>
                    </div>
                    {isOwnProfile ? (
                      <span className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium">
                        Your skill
                      </span>
                    ) : endorsedSkillIds.includes(skill.id) ? (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Endorsed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEndorseClick(skill.id, skill.name)}
                        disabled={endorsingSkillId === skill.id}
                        className="bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
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
            </div>

            {/* Professional Certifications */}
            {expert.certifications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <GraduationCap className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Professional Certifications</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expert.certifications.map((cert) => (
                    <div 
                      key={cert.id}
                      className="border border-purple-100 rounded-2xl p-4"
                      style={{
                        backgroundImage: "linear-gradient(160deg, rgb(238, 242, 255) 0%, rgb(250, 245, 255) 100%)",
                      }}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-900 mb-1">{cert.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{cert.issuer}</p>
                          <div className="flex gap-2">
                            {cert.issuedDate && (
                              <span className="text-xs border border-gray-300 rounded-lg px-2 py-1">
                                Issued {new Date(cert.issuedDate).getFullYear()}
                              </span>
                            )}
                            {cert.expiryDate && (
                              <span className="text-xs border border-gray-300 rounded-lg px-2 py-1">
                                Expires {new Date(cert.expiryDate).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training & Courses */}
            {expert.courses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-900">Training & Courses</h2>
                  </div>
                  <p className="text-sm text-gray-600">
                    Learning opportunities designed and delivered by {expert.name.split(" ")[0]}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-900">Upcoming Sessions</p>
                </div>

                <div className="space-y-4">
                  {expert.courses.map((course) => (
                    <div 
                      key={course.id}
                      className="border-2 border-gray-200 rounded-2xl p-6"
                      style={{
                        backgroundImage: "linear-gradient(154deg, rgb(255, 255, 255) 0%, rgba(236, 253, 245, 0.3) 100%)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h4>
                          {course.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                          )}
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-lg">
                          Open
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4 mb-4">
                        {course.durationMinutes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Duration</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Delivery Mode</p>
                          <p className="text-sm font-semibold text-gray-900">{course.deliveryMode}</p>
                        </div>
                        {course.targetAudience && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Target Audience</p>
                            <p className="text-sm font-semibold text-gray-900">{course.targetAudience}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>24/30 enrolled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-900">4.8</span>
                            <span className="text-gray-400">(156)</span>
                          </div>
                        </div>
                        <button className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-green-200 text-sm font-medium transition-all flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Enroll Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Endorsement Modal */}
      {endorseModalOpen && selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Endorse Skill</h3>
              <button
                onClick={() => setEndorseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              You are endorsing <span className="font-semibold text-gray-900">{expert?.name}</span> for{" "}
              <span className="font-semibold text-blue-600">{selectedSkill.name}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={endorseComment}
                onChange={(e) => setEndorseComment(e.target.value)}
                placeholder="Share your experience working with this person on this skill..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {endorseError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {endorseError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEndorseModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEndorsement}
                disabled={endorseLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
