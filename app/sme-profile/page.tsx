"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  FileText,
  Phone,
  Clock,
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Calendar,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description?: string;
  category: string;
}

interface SelectedSkill {
  skillId: string;
  skillName: string;
  proficiency: string;
  yearsExp: number;
}

interface DayAvailability {
  enabled: boolean;
  timeFrom: string;
  timeTo: string;
}

interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

interface NominationStatus {
  status: "NONE" | "NOMINATED" | "SME";
  nominationId?: string;
  nominatedAt?: string;
  nominatedBy?: {
    name: string;
    position?: string;
  };
  smeId?: string;
  profileStatus?: string;
  hasCompletedProfile?: boolean;
}

export default function SmeProfilePage() {
  const router = useRouter();
  const [nominationStatus, setNominationStatus] = useState<NominationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bio, setBio] = useState("");
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({
    monday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    tuesday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    wednesday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    thursday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    friday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    saturday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
    sunday: { enabled: false, timeFrom: "09:00", timeTo: "17:00" },
  });
  const [contactPhone, setContactPhone] = useState("");
  const [contactPref, setContactPref] = useState("email");
  const [teamsLink, setTeamsLink] = useState("");

  // Skills
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");

  // Check nomination status
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/my-nomination");
        if (response.ok) {
          const data = await response.json();
          setNominationStatus(data);

          // If already an SME with profile, fetch existing data
          if (data.status === "SME" && data.hasCompletedProfile) {
            const profileResponse = await fetch("/api/sme-profile");
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setBio(profileData.bio || "");
              
              // Parse availability JSON if it exists
              if (profileData.availability) {
                try {
                  const parsedAvailability = JSON.parse(profileData.availability);
                  setWeeklyAvailability(parsedAvailability);
                } catch (e) {
                  console.error("Error parsing availability:", e);
                }
              }
              
              setContactPhone(profileData.contactPhone || "");
              setContactPref(profileData.contactPref || "email");
              setTeamsLink(profileData.teamsLink || "");
              setSelectedSkills(
                profileData.skills?.map((s: { skillId: string; skillName: string; proficiency: string; yearsExp: string }) => ({
                  skillId: s.skillId,
                  skillName: s.skillName,
                  proficiency: s.proficiency,
                  yearsExp: parseFloat(s.yearsExp) || 0,
                })) || []
              );
            }
          }
        } else {
          setNominationStatus({ status: "NONE" });
        }
      } catch (err) {
        console.error("Error checking nomination status:", err);
        setNominationStatus({ status: "NONE" });
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, []);

  // Fetch available skills
  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch("/api/skills/list");
        if (response.ok) {
          const data = await response.json();
          setAvailableSkills(data.skills || []);
        }
      } catch (err) {
        console.error("Error fetching skills:", err);
      }
    }
    fetchSkills();
  }, []);

  const filteredSkills = availableSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.some((s) => s.skillId === skill.id)
  );

  const addSkill = (skill: Skill) => {
    setSelectedSkills([
      ...selectedSkills,
      {
        skillId: skill.id,
        skillName: skill.name,
        proficiency: "Intermediate",
        yearsExp: 1,
      },
    ]);
    setSkillSearch("");
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const updateSkill = (skillId: string, field: "proficiency" | "yearsExp", value: string | number) => {
    setSelectedSkills(
      selectedSkills.map((s) =>
        s.skillId === skillId ? { ...s, [field]: value } : s
      )
    );
  };

  const toggleDay = (day: keyof WeeklyAvailability) => {
    setWeeklyAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateDayTime = (day: keyof WeeklyAvailability, field: "timeFrom" | "timeTo", value: string) => {
    setWeeklyAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const days: { key: keyof WeeklyAvailability; label: string }[] = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const isUpdate = nominationStatus?.status === "SME";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch("/api/sme-profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          availability: JSON.stringify(weeklyAvailability),
          contactPhone,
          contactPref,
          teamsLink,
          skills: selectedSkills.map((s) => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
            yearsExp: s.yearsExp,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      // Redirect to experts page
      router.push(`/experts/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not nominated
  if (nominationStatus?.status === "NONE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="max-w-2xl mx-auto px-8 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Nominated Yet</h1>
            <p className="text-gray-600 mb-6">
              You need to be nominated by a Team Leader before you can create your SME profile.
              Contact your Team Leader if you&apos;d like to become a Subject Matter Expert.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEditing = nominationStatus?.status === "SME";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Edit Your SME Profile" : "Create Your SME Profile"}
          </h1>
          {!isEditing && nominationStatus?.nominatedBy && (
            <p className="text-gray-600">
              You were nominated by{" "}
              <span className="font-semibold">{nominationStatus.nominatedBy.name}</span>
              {nominationStatus.nominatedBy.position && (
                <span> ({nominationStatus.nominatedBy.position})</span>
              )}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= s ? "text-gray-900" : "text-gray-400"}`}>
                {s === 1 ? "Basic Info" : s === 2 ? "Contact" : "Skills"}
              </span>
              {s < 3 && (
                <div className={`w-20 h-1 mx-4 rounded ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / About You
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about your expertise, experience, and what you can help with..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Weekly Availability
                </label>
                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {days.map((day) => (
                    <div
                      key={day.key}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        weeklyAvailability[day.key].enabled
                          ? "bg-white border border-blue-200"
                          : "bg-gray-100"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                        <input
                          type="checkbox"
                          checked={weeklyAvailability[day.key].enabled}
                          onChange={() => toggleDay(day.key)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`font-medium ${weeklyAvailability[day.key].enabled ? "text-gray-900" : "text-gray-500"}`}>
                          {day.label}
                        </span>
                      </label>

                      {weeklyAvailability[day.key].enabled && (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={weeklyAvailability[day.key].timeFrom}
                            onChange={(e) => updateDayTime(day.key, "timeFrom", e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={weeklyAvailability[day.key].timeTo}
                            onChange={(e) => updateDayTime(day.key, "timeTo", e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the days and times when you&apos;re available to help others
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Contact Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Phone className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Contact Preferences</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teams Meeting Link (optional)
                </label>
                <input
                  type="url"
                  value={teamsLink}
                  onChange={(e) => setTeamsLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Contact Method
                </label>
                <div className="flex gap-4">
                  {["email", "phone", "teams"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactPref(method)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium capitalize transition-colors ${
                        contactPref === method
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Skills</h2>
              </div>

              {/* Skill Search */}
              <div className="relative">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search and add skills..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {skillSearch && filteredSkills.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredSkills.slice(0, 10).map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-gray-400">({skill.category})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Skills */}
              {selectedSkills.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
                  <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No skills added yet. Search above to add your skills.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">{skill.skillName}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.skillId)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Proficiency</label>
                          <select
                            value={skill.proficiency}
                            onChange={(e) => updateSkill(skill.skillId, "proficiency", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Years of Experience</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={skill.yearsExp}
                            onChange={(e) => updateSkill(skill.skillId, "yearsExp", parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedSkills.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isEditing ? "Update Profile" : "Create Profile"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
