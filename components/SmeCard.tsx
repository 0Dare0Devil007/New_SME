"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RiThumbUpLine,
  RiLightbulbLine,
  RiMedalLine,
} from "@remixicon/react";

// Skill badge color classes (rotating through 4 colors)
const skillBadgeClasses = [
  "badge-skill-purple",
  "badge-skill-green", 
  "badge-skill-amber",
  "badge-skill-rose",
];

// Certification badge color classes (rotating through 3 colors)
const certBadgeClasses = [
  "badge-cert-blue",
  "badge-cert-indigo",
  "badge-cert-cyan",
];

// Get skill badge class based on index
function getSkillBadgeClass(index: number): string {
  return skillBadgeClasses[index % skillBadgeClasses.length];
}

// Get certification badge class based on index
function getCertBadgeClass(index: number): string {
  return certBadgeClasses[index % certBadgeClasses.length];
}

interface Skill {
  name: string;
  color: string;
}

interface Certification {
  title: string;
  color: string;
}

interface SmeCardProps {
  expert: {
    id: string;
    name: string;
    position: string;
    department: string;
    siteName: string;
    imageUrl?: string;
    bio?: string;
    skills: Skill[];
    certifications: Certification[];
    endorsementCount: number;
  };
}

export function SmeCard({ expert }: SmeCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/experts/${expert.id}`} className="block">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex gap-6">
          {/* Avatar Section */}
          <div className="shrink-0 w-[88px]">
            <div className="flex flex-col items-center gap-2">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-card shadow-[0px_0px_0px_2px_hsl(var(--border)),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                {expert.imageUrl && !imageError ? (
                  <Image
                    src={expert.imageUrl}
                    alt={expert.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xl font-bold">
                      {expert.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name and Position */}
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground leading-tight">
                  {expert.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expert.position}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 space-y-4">
            {/* Department and Endorsements Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4h3v3H2V4zm0 4h3v3H2V8zm4-4h3v3H6V4zm0 4h3v3H6V8zm4-4h3v3h-3V4zm0 4h3v3h-3V8z" fill="currentColor"/>
                </svg>
                <span className="text-xs">{expert.department}</span>
              </div>
              
              {/* Endorsement Badge */}
              <div className="bg-primary rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                <RiThumbUpLine className="w-3 h-3 text-primary-foreground" />
                <span className="text-primary-foreground text-xs font-semibold">{expert.endorsementCount}</span>
              </div>
            </div>

            {/* Bio */}
            {expert.bio && (
              <p className="text-sm text-muted-foreground leading-[1.625] line-clamp-2">
                {expert.bio}
              </p>
            )}

            {/* Skills & Expertise */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <RiLightbulbLine className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.025em]">
                  Skills & Expertise
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {expert.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-medium ${getSkillBadgeClass(index)}`}
                  >
                    {skill.name}
                  </span>
                ))}
                {expert.skills.length > 4 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    +{expert.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Certifications */}
            {expert.certifications.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <RiMedalLine className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.025em]">
                    Certifications
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {expert.certifications.slice(0, 3).map((cert, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-[10px] text-xs font-medium ${getCertBadgeClass(index)}`}
                    >
                      {cert.title}
                    </span>
                  ))}
                  {expert.certifications.length > 3 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      +{expert.certifications.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
