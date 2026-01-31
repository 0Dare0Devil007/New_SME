"use client";

import { useState } from "react";

export interface SkillCardProps {
  skill: {
    name: string;
    experts: number;
    description: string;
    gradient: string;
    icon: string;
    topExperts?: string[];
  };
}

export function SkillCard({ skill }: SkillCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-[14px] p-6 cursor-pointer transition-all duration-300 ease-in-out ${
        isHovered ? "shadow-xl border-gray-300" : "hover:shadow-lg"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-5">
        <div
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${skill.gradient} flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 ${
            isHovered ? "scale-110" : ""
          }`}
        >
          {skill.icon && <img src={skill.icon} alt={skill.name} className="w-10 h-10" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{skill.name}</h3>
            <span className="bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-1 rounded-lg">
              {skill.experts} experts
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {skill.description}
          </p>
        </div>
      </div>

      {/* Hover state - Expert avatars (only show if topExperts is provided) */}
      {skill.topExperts && skill.topExperts.length > 0 && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isHovered ? "max-h-32 opacity-100 mt-5" : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Top Endorsed Experts</p>
            <div className="flex gap-4">
              {skill.topExperts.map((expert, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${skill.gradient} opacity-80 flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
                  >
                    {expert.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 text-center w-16 truncate">
                    {expert.split(" ")[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
