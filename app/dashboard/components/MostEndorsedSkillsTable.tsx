"use client";

import { RiThumbUpLine, RiLineChartLine } from "@remixicon/react";

interface SkillsTableProps {
  skills: Array<{
    rank: number;
    skillId: string;
    skillName: string;
    totalEndorsements: number;
    smeCount: number;
    avgPerSme: number;
    trend: number;
  }>;
}

export default function MostEndorsedSkillsTable({ skills }: SkillsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Skill</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
              Total Endorsements
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">SME Count</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Avg per SME</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Trend</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skillId} className="border-b border-border hover:bg-muted">
              <td className="py-3 px-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {skill.rank}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-foreground">{skill.skillName}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <RiThumbUpLine className="w-4 h-4 text-chart-2" />
                  <span className="font-semibold text-foreground">{skill.totalEndorsements}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-muted-foreground">{skill.smeCount}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-muted-foreground">{skill.avgPerSme.toFixed(1)}</span>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success bg-status-success/10 px-2 py-1 rounded-full">
                  <RiLineChartLine className="w-3 h-3" />
                  +{skill.trend}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
