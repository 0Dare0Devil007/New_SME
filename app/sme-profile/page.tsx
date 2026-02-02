"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Calendar,
  ShieldCheck,
  Link as LinkIcon,
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

interface Certification {
  id?: string;
  title: string;
  issuer: string;
  credentialId?: string;
  credentialUrl?: string;
  issuedDate?: string;
  expiryDate?: string;
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

  // Skills
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState<Certification>({
    title: "",
    issuer: "",
    credentialId: "",
    credentialUrl: "",
    issuedDate: "",
    expiryDate: "",
  });

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
              
              setSelectedSkills(
                profileData.skills?.map((s: { skillId: string; skillName: string; proficiency: string; yearsExp: string }) => ({
                  skillId: s.skillId,
                  skillName: s.skillName,
                  proficiency: s.proficiency,
                  yearsExp: parseFloat(s.yearsExp) || 0,
                })) || []
              );

              // Load existing certifications
              setCertifications(
                profileData.certifications?.map((c: Certification) => ({
                  id: c.id,
                  title: c.title,
                  issuer: c.issuer || "",
                  credentialId: c.credentialId || "",
                  credentialUrl: c.credentialUrl || "",
                  issuedDate: c.issuedDate || "",
                  expiryDate: c.expiryDate || "",
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

  // Certification functions
  const addCertification = () => {
    if (!newCert.title.trim()) return;
    
    setCertifications([...certifications, { ...newCert }]);
    setNewCert({
      title: "",
      issuer: "",
      credentialId: "",
      credentialUrl: "",
      issuedDate: "",
      expiryDate: "",
    });
    setShowCertForm(false);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

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
          skills: selectedSkills.map((s) => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
            yearsExp: s.yearsExp,
          })),
          certifications: certifications.map((c) => ({
            title: c.title,
            issuer: c.issuer,
            credentialId: c.credentialId,
            credentialUrl: c.credentialUrl,
            issuedDate: c.issuedDate || null,
            expiryDate: c.expiryDate || null,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not nominated
  if (nominationStatus?.status === "NONE") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-8 py-16">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
            <div className="w-16 h-16 bg-status-pending/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-status-pending" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Not Nominated Yet</h1>
            <p className="text-muted-foreground mb-6">
              You need to be nominated by a Team Leader before you can create your SME profile.
              Contact your Team Leader if you&apos;d like to become a Subject Matter Expert.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
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
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isEditing ? "Edit Your SME Profile" : "Create Your SME Profile"}
          </h1>
          {!isEditing && nominationStatus?.nominatedBy && (
            <p className="text-muted-foreground">
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
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`ml-2 text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Basic Info" : s === 2 ? "Skills" : "Certifications"}
              </span>
              {s < 3 && (
                <div className={`w-20 h-1 mx-4 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bio / About You
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about your expertise, experience, and what you can help with..."
                  className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-ring focus:border-ring resize-none placeholder:text-muted-foreground"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Weekly Availability
                </label>
                <div className="space-y-3 bg-muted rounded-xl p-4 border border-border">
                  {days.map((day) => (
                    <div
                      key={day.key}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        weeklyAvailability[day.key].enabled
                          ? "bg-card border border-primary/30"
                          : "bg-muted"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                        <input
                          type="checkbox"
                          checked={weeklyAvailability[day.key].enabled}
                          onChange={() => toggleDay(day.key)}
                          className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
                        />
                        <span className={`font-medium ${weeklyAvailability[day.key].enabled ? "text-foreground" : "text-muted-foreground"}`}>
                          {day.label}
                        </span>
                      </label>

                      {weeklyAvailability[day.key].enabled && (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={weeklyAvailability[day.key].timeFrom}
                            onChange={(e) => updateDayTime(day.key, "timeFrom", e.target.value)}
                            className="border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={weeklyAvailability[day.key].timeTo}
                            onChange={(e) => updateDayTime(day.key, "timeTo", e.target.value)}
                            className="border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select the days and times when you&apos;re available to help others
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Your Skills</h2>
              </div>

              {/* Skill Search */}
              <div className="relative">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search and add skills..."
                  className="w-full border border-input bg-background text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                />
                {skillSearch && filteredSkills.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredSkills.slice(0, 10).map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">({skill.category})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Skills */}
              {selectedSkills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                  <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No skills added yet. Search above to add your skills.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="bg-muted rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">{skill.skillName}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.skillId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Proficiency</label>
                          <select
                            value={skill.proficiency}
                            onChange={(e) => updateSkill(skill.skillId, "proficiency", e.target.value)}
                            className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Years of Experience</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={skill.yearsExp}
                            onChange={(e) => updateSkill(skill.skillId, "yearsExp", parseFloat(e.target.value) || 0)}
                            className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Certifications */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Certifications</h2>
                <span className="text-sm text-muted-foreground">(Optional)</span>
              </div>

              {/* Add Certification Button */}
              {!showCertForm && (
                <button
                  type="button"
                  onClick={() => setShowCertForm(true)}
                  className="w-full py-3 px-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Certification
                </button>
              )}

              {/* New Certification Form */}
              {showCertForm && (
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">New Certification</h3>
                    <button
                      type="button"
                      onClick={() => setShowCertForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Certification Title *</label>
                      <input
                        type="text"
                        value={newCert.title}
                        onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                        placeholder="e.g., AWS Solutions Architect"
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Issuing Organization</label>
                      <input
                        type="text"
                        value={newCert.issuer}
                        onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                        placeholder="e.g., Amazon Web Services"
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Credential ID</label>
                      <input
                        type="text"
                        value={newCert.credentialId}
                        onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })}
                        placeholder="e.g., ABC123XYZ"
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Credential URL</label>
                      <input
                        type="url"
                        value={newCert.credentialUrl}
                        onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={newCert.issuedDate}
                        onChange={(e) => setNewCert({ ...newCert, issuedDate: e.target.value })}
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newCert.expiryDate}
                        onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                        className="w-full border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addCertification}
                    disabled={!newCert.title.trim()}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Certification
                  </button>
                </div>
              )}

              {/* Certifications List */}
              {certifications.length === 0 && !showCertForm ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No certifications added yet.</p>
                  <p className="text-sm">Add your professional certifications to showcase your expertise.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="bg-muted rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{cert.title}</h4>
                          {cert.issuer && (
                            <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {cert.credentialId && (
                              <span>ID: {cert.credentialId}</span>
                            )}
                            {cert.issuedDate && (
                              <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                            )}
                            {cert.expiryDate && (
                              <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
                            >
                              <LinkIcon className="w-3 h-3" />
                              View Credential
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="text-muted-foreground hover:text-destructive ml-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-border rounded-xl text-foreground font-medium hover:bg-muted flex items-center gap-2"
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
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedSkills.length === 0}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
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
