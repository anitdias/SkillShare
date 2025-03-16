'use client';

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

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
  level?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      category: string;
      value: number;
    };
  }>;
}

const categories = [
  { id: '1', name: 'Professional & Technical' },
  { id: '2', name: 'Creative' },
  { id: '3', name: 'Life & Physical' },
  { id: '4', name: 'Social' },
];

// Custom color palette
const colors = {
  primary: '#4F46E5', // Indigo
  secondary: '#8B5CF6', // Purple
  highlight: '#3B82F6', // Blue
  background: 'rgba(15, 23, 42, 0.6)', // Slate background with transparency
  grid: 'rgba(148, 163, 184, 0.2)', // Subtle grid lines
  text: '#E2E8F0', // Light text
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="text-sm font-medium text-gray-200">{`${payload[0].payload.category}`}</p>
        <p className="text-sm font-bold text-blue-400">{`Skills: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function RadialGraph({ userSkills }: { userSkills: UserSkill[] }) {
  const [categoryData, setCategoryData] = useState<{ category: string; value: number; fullMark: number }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Calculate the number of skills per category
    const data = categories.map((category) => {
      const skillsInCategory = userSkills.filter((skill) => skill.categoryId === category.id);
      return {
        category: category.name,
        value: skillsInCategory.length,
        // Calculate fullMark based on the maximum number of skills across all categories + buffer
        fullMark: Math.max(10, Math.max(...categories.map(c => 
          userSkills.filter(s => s.categoryId === c.id).length
        )) + 3)
      };
    });
    setCategoryData(data);
    
    // Add animation delay
    setTimeout(() => setIsLoaded(true), 300);
  }, [userSkills]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="flex flex-col md:flex-row items-center justify-center w-full gap-4 mt-6">
        <div className="relative w-full md:w-2/3 h-[300px] max-w-md">
          {/* Decorative background elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[280px] h-[280px] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 blur-xl" />
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
              <PolarGrid stroke={colors.grid} strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ 
                  fill: colors.text, 
                  fontSize: 12,
                  fontWeight: 500,
                }}
                stroke={colors.grid}
                tickLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Radar
                dataKey="value"
                stroke={colors.highlight}
                fill={colors.primary}
                fillOpacity={0.6}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
          
          {/* Skill count indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-full w-8 h-8 flex flex-col items-center justify-center border border-gray-700/50">
              <span className="text-lg font-bold text-blue-400">
                {userSkills.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Category legend - now on the right side on larger screens */}
        <div className="md:w-1/3 flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
            {categories.map((category) => {
              const count = userSkills.filter(skill => skill.categoryId === category.id).length;
              return (
                <div key={category.id} className="flex items-center space-x-2 p-3 rounded-md bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div className="flex-1 text-sm">
                    <div className="text-gray-300">{category.name}</div>
                    <div className="text-blue-400 font-medium">{count} skills</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}