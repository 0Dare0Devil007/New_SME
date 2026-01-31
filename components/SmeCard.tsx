"use client";

import Image from "next/image";
import Link from "next/link";

// Figma asset URLs (valid for 7 days)
const icons = {
  itIcon: "https://www.figma.com/api/mcp/asset/0b396d3f-74e2-4000-a58f-ff309e93149a",
  endorsementIcon: "https://www.figma.com/api/mcp/asset/d11d4b84-5a12-417f-bbab-2fe68dfce82e",
  skillsIcon: "https://www.figma.com/api/mcp/asset/d0055498-696b-4e14-ae44-025fd98589da",
  certificationsIcon: "https://www.figma.com/api/mcp/asset/28af2b90-eecd-415c-aa6d-2544a330d9d4",
};

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
    avatarUrl?: string;
    bio?: string;
    skills: Skill[];
    certifications: Certification[];
    endorsementCount: number;
  };
}

export function SmeCard({ expert }: SmeCardProps) {
  return (
    <Link href={`/experts/${expert.id}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex gap-6">
          {/* Avatar Section */}
          <div className="shrink-0 w-[88px]">
            <div className="flex flex-col items-center gap-2">
              {/* Avatar with Badge */}
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-[0px_0px_0px_2px_#f3f4f6,0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                  {expert.avatarUrl ? (
                    <img 
                      src={expert.avatarUrl} 
                      alt={expert.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {expert.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Department Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <img src={icons.itIcon} alt="Department" className="w-3.5 h-3.5" />
                </div>
              </div>
              
              {/* Name and Position */}
              <div className="text-center">
                <p className="font-semibold text-sm text-gray-900 leading-tight">
                  {expert.name}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {expert.position}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 space-y-4">
            {/* Department and Endorsements Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4h3v3H2V4zm0 4h3v3H2V8zm4-4h3v3H6V4zm0 4h3v3H6V8zm4-4h3v3h-3V4zm0 4h3v3h-3V8z" fill="currentColor"/>
                </svg>
                <span className="text-xs">{expert.department}</span>
              </div>
              
              {/* Endorsement Badge */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                <img src={icons.endorsementIcon} alt="Endorsements" className="w-3 h-3" />
                <span className="text-white text-xs font-semibold">{expert.endorsementCount}</span>
              </div>
            </div>

            {/* Bio */}
            {expert.bio && (
              <p className="text-sm text-gray-700 leading-[1.625] line-clamp-2">
                {expert.bio}
              </p>
            )}

            {/* Skills & Expertise */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <img src={icons.skillsIcon} alt="Skills" className="w-3.5 h-3.5" />
                <span className="text-xs font-medium text-gray-700 uppercase tracking-[0.025em]">
                  Skills & Expertise
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {expert.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${skill.color}`}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {expert.certifications.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <img src={icons.certificationsIcon} alt="Certifications" className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-[0.025em]">
                    Certifications
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expert.certifications.slice(0, 3).map((cert, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${cert.color}`}
                    >
                      {cert.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
