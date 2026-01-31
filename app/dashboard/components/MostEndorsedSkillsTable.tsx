"use client";

import { ThumbsUp, TrendingUp } from "lucide-react";

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
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skill</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Total Endorsements
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SME Count</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Avg per SME</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.skillId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  {skill.rank}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-gray-900">{skill.skillName}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">{skill.totalEndorsements}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-700">{skill.smeCount}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-700">{skill.avgPerSme.toFixed(1)}</span>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
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
