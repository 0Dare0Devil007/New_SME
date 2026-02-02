"use client";

import { useState } from "react";
import Image from "next/image";
import { RiLightbulbLine } from "@remixicon/react";

export interface SkillCardProps {
  skill: {
    name: string;
    experts: number;
    description: string;
    gradient: string;
    imageUrl: string;
    topExperts?: string[];
  };
}

export function SkillCard({ skill }: SkillCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`bg-card border border-border rounded-[14px] p-6 cursor-pointer transition-all duration-300 ease-in-out ${
        isHovered ? "shadow-xl border-muted-foreground/30" : "hover:shadow-lg"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-5">
        <div
          className={`w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 overflow-hidden ${
            isHovered ? "scale-110" : ""
          }`}
        >
          {skill.imageUrl && !imageError ? (
            <Image
              src={skill.imageUrl}
              alt={skill.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <RiLightbulbLine className="w-10 h-10 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-foreground">{skill.name}</h3>
            <span className="bg-muted text-foreground text-xs font-medium px-2.5 py-1 rounded-lg">
              {skill.experts} experts
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
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
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">Top Endorsed Experts</p>
            <div className="flex gap-4">
              {skill.topExperts.map((expert, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full bg-primary opacity-80 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm"
                  >
                    {expert.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center w-16 truncate">
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
