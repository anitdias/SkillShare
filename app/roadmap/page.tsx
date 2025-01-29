"use client";

import { useRouter,useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideUser, LucideMail } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';


// interface RoadmapStep {
//   step: number;
//   description: string;
// }

export default function RoadmapForm() {
  const {data: session, status} = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skillName, setSkillName] = useState<string | null>();
  const [level, setLevel] = useState<string>("beginner");
  const [roadmap, setRoadmap] = useState([]);
  const [visibleRoadmap, setVisibleRoadmap] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fulltext = "<Skill Share/>";

  useEffect(() => setSkillName(searchParams.get('skillName')),[searchParams])

  useEffect(() => {
          if (status=='unauthenticated'){
              router.push('/login');
          }else if(status == 'authenticated'){
              
          }
      }, [status,router])


  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRoadmap([]);
    setVisibleRoadmap([]);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, level }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Something went wrong.");
        return;
      }

      const data = await response.json();
      setRoadmap(data.roadmap || []);
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      setError("Failed to fetch the roadmap. Please try again.");
    }
  };

  useEffect(() => {
    if (roadmap.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < roadmap.length) {
          setVisibleRoadmap((prev) => [...prev, roadmap[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 50); // Adjust delay between steps here (500ms)
      return () => clearInterval(interval);
    }
  }, [roadmap]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <nav className="h-16 bg-white shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center">
          {/* Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 text-blue"
          >
            {isSidebarOpen ? (
              <X className="text-gray-600 hover:bg-gray-200 rounded-full" size={24} />
            ) : (
              <Menu className="text-gray-600" size={24} />
            )}
          </Button>

          {/* Title */}
          <h1 className="text-xl font-bold font-mono text-white bg-[#1995AD] shadow-md rounded-lg p-1">
            {fulltext}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex-grow flex items-center justify-center">
          <input
            type="text"
            placeholder="Search..."
            className="w-full max-w-md p-2 bg-white border-gray-300 border-2 rounded-md shadow-sm focus:outline-none text-gray-600"
          />
        </div>
        
        <Button
          onClick={() => {
            router.push('/profile')
          }}
          className="mr-2 mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892]"
        >
          Return to Profile
        </Button>
        {/* Sign Out Button */}
        <Button
          onClick={() => {
            signOut({ callbackUrl: "/" });
          }}
          className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892]"
        >
          Sign Out
        </Button>

      </nav>

      <AnimatePresence>
          {isSidebarOpen && (
              <motion.div
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed top-16 left-0 w-80 bg-white shadow-lg flex flex-col h-[calc(100vh-4rem)] z-10"
              >
                  <div className="p-6 flex-1">
                    <div className="mb-8">
                      <div className="flex items-center space-x-2">
                        <LucideUser className="text-gray-400 h-5 w-5" />
                        <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name || 'User'}</h1>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <LucideMail className="text-gray-400 h-5 w-5" />
                        <p className="text-sm text-gray-600">{session?.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t">
                      <Button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full bg-[#1995AD] hover:bg-[#157892]"
                      >
                          Sign Out
                      </Button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    <Card className='relative p-3 bg-white w-[1400px] h-[550px] flex flex-col  rounded-lg shadow-lg overflow-auto'>
        <h1 className="text-2xl font-bold font-mono text-gray-600 p-2">Generate a Skill Roadmap</h1>
        <form onSubmit={generateRoadmap} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter a skill"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="flex-1 border-2 border-gray-300 text-gray-600"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg bg-white border p-2 w-full text-gray-600 border-gray-300 border-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Generate Roadmap
          </button>
        </form>
        <div className="mt-4 text-gray-600 bg-gray-200 p-4 rounded-xl">
          {error && <p className="text-red-500">{error}</p>}
          <div className="mt-4 text-gray-600">
            {error && <p className="text-red-500">{error}</p>}
            {visibleRoadmap.map((item, index) => (
              <p key={index} className="text-gray-700">
                {item}
              </p>
            ))}
            </div>
        </div>
      </Card>
    </div>
    
  );
}
