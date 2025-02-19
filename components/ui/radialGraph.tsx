'use client';

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';

interface Skill {
  id: string;
  name: string;
  categoryId: string;
}

interface UserSkill {
  id: string;
  skillId: string;
  categoryId: string;
  skill: Skill;
  validatedByManager: boolean;
}

const categories = [
  { id: '1', name: 'Professional & Technical' },
  { id: '2', name: 'Creative' },
  { id: '3', name: 'Life & Physical' },
  { id: '4', name: 'Social' },
];

export default function RadialGraph({ userSkills }: { userSkills: UserSkill[] }) {
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    // Calculate the number of skills per category
    const data = categories.map((category) => ({
      category: category.name,
      value: userSkills.filter((skill) => skill.categoryId === category.id).length,
    }));
    setCategoryData(data);
  }, [userSkills]);

  return (
    <div className="flex justify-center items-center">
      <RadarChart
        cx={150}
        cy={150}
        outerRadius={100}
        width={300}
        height={300}
        data={categoryData}
      >
        <PolarGrid />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'white', fontSize: 10 }}
        />
        {/* <PolarRadiusAxis
          angle={30}
          domain={[0, Math.max(...categoryData.map((d) => d.value)) || 1]}
          style={{ fontSize: '10px' }}
        /> */}
        <Tooltip />
        <Radar
          name="Skills"
          dataKey="value"
          stroke="#1F51FF"
          fill="#1F51FF"
          fillOpacity={0.6}
        />
      </RadarChart>
    </div>
  );
}
