"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideUser, LucideMail, Download, BrainCircuit } from 'lucide-react';
import './RoadmapFlowchart.css'; // Custom styles for the flowchart

interface SearchUser {
  id: string;
  name: string;
}

export default function RoadmapForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skillName, setSkillName] = useState<string | null>();
  const [level, setLevel] = useState<string>("beginner");
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])

  const fulltext = "<Skill Share/>";

  useEffect(() => setSkillName(searchParams.get('skillName')), [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setRoadmap(null);

    if (skillName) {
      getRoadmap();
    }
  }, [skillName, level]);

  const getRoadmap = async () => {
    try {
      const response = await fetch("/api/get-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, level }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setRoadmap(data.roadmap || []);
    } catch (err) {
      console.error("Error getting roadmap:", err);
    }
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRoadmap(null);

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
      const parsedRoadmap = JSON.parse(data.roadmapText);
      setRoadmap(parsedRoadmap);
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      setError("Failed to fetch the roadmap. Please try again.");
    }
  };

  const saveRoadmap = async () => {
    if (!roadmap || !roadmap.roadmap?.steps || roadmap.roadmap.steps.length === 0) {
      setError("No roadmap to save. Please generate a roadmap first.");
      return;
    }

    try {
      const response = await fetch("/api/save-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, level, roadmap }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save the roadmap.");
        return;
      }

      await response.json();
    } catch (err) {
      console.error("Error saving roadmap:", err);
      setError("Failed to save the roadmap. Please try again.");
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        
    const inputValue = e.target.value;
    setQuery(inputValue);
    if(inputValue!== ''){
    try{
      const res = await fetch('/api/search',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue }),
      })

      if(res.ok){
          const users = await res.json()
          setSearchUsers(users);
      }
  }
  catch(error){
      console.error('Error while fetching user data:', error);
  }
}
  };

  const handleNodeClick = (index: number) => {
    setSelectedNode(selectedNode === index ? null : index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#222222] via-[#333333] to-[#444444] text-white">
      <nav className="h-16 bg-[#3b3b3b] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 text-white"
          >
            {isSidebarOpen ? (
              <X className="text-white hover:bg-gray-200 rounded-full" size={24} />
            ) : (
              <Menu className="text-white" size={24} />
            )}
          </Button>

          <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-[#636363] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
              {fulltext}
            </h1>
          </div>

        {/* Search Bar */}
        <div className="flex-grow flex items-center justify-center">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={handleInputChange}
            className="w-full max-w-md p-2 bg-[#636363] border-gray-300 border-2 rounded-md shadow-sm focus:outline-none text-white"
          />

        {searchUsers.length > 0 && query && (
              <div className="absolute top-12 w-full max-w-md bg-[#636363] border-gray-300 border-2 rounded-md shadow-lg z-30">
                {searchUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                    onClick={() => {
                      router.push(`/publicProfile?userid=${user.id}&username=${user.name}`)
                    }}
                  >
                    {user.name}
                  </div>
                ))}
              </div>
            )}
            </div>

        <Button
          onClick={() => {
            router.push('/profile')
          }}
          className="bg-[#636363] hover:bg-[#222222] text-sm ml-2 sm:text-md px-3 py-1 sm:px-4 sm:py-2 rounded-lg shadow-md mr-2"
        >
          Return to Profile
        </Button>
        <Button
          onClick={() => {
            signOut({ callbackUrl: "/" });
          }}
          className="hidden md:block mt-4 md:mt-0 bg-[#636363] hover:bg-[#222222]"
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
                        className="fixed top-16 left-0 w-80 bg-[#3b3b3b] shadow-lg flex flex-col h-[calc(100vh-4rem)] z-10"
                    >
                        <div className="p-6 flex-1">
                          <div className="mb-5">
                            <div className="flex items-center space-x-2">
                              <LucideUser className="text-gray-400 h-5 w-5" />
                              <h1 className="text-2xl font-bold text-white">{session?.user?.name || 'User'}</h1>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <LucideMail className="text-gray-400 h-5 w-5" />
                              <p className="text-sm text-white">{session?.user?.email}</p>
                            </div>
                          </div>
                        </div>
      
                        <div className="p-6 border-t">
                            <Button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full bg-[#636363] hover:bg-[#222222]"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

      <div className='mt-12 relative p-6 w-full max-w-4xl flex flex-col overflow-auto'>
      <div className="flex justify-center">
        <h1 className="text-2xl font-bold font-mono text-white mb-4 text-center">
          Generate a Skill Roadmap
        </h1>
      </div>
      <hr className="text-gray-600 mb-3"/>
        <form onSubmit={generateRoadmap} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter a skill"
            value={skillName || ""}
            onChange={(e) => setSkillName(e.target.value)}
            className="w-full border-2 border-gray-600 bg-[#1E1E1E] text-white p-2 rounded-md"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg bg-[#1E1E1E] border p-2 w-full text-white border-gray-600 border-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <div className='flex justify-between w-full'>
            <button type="submit" className="bg-[#636363] hover:bg-[#222222] text-white p-2 rounded flex items-center">
            <BrainCircuit className="w-5 h-5 mr-2" />
              Generate Roadmap
            </button>
            <button
              type="button"
              onClick={saveRoadmap}
              className="bg-[#636363] hover:bg-[#222222] text-white p-2 rounded flex items-center"
            >
              <Download className="w-5 h-5 mr-2" /> {/* Add the icon */}
              Save Roadmap
            </button>
          </div>
        </form>
        <hr className="text-gray-600 mt-3"/>
        <div className="mt-4 text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] p-4 rounded-xl">
          {error && <p className="text-red-500">{error}</p>}
          {roadmap && roadmap.roadmap?.steps && (
            <div className="flowchart">
              {roadmap.roadmap.steps.map((step, index) => (
                <div
                  key={index}
                  className={`flowchart-node ${selectedNode === index ? 'expanded' : ''}`}
                  onClick={() => handleNodeClick(index)}
                >
                  <div className="node-label">{step.label}</div>
                  {selectedNode === index && (
                    <div className="node-details">
                      <p>{step.description}</p>
                      <ul>
                        <li><strong><u>Timeline:</u></strong> {step.timeline}</li>
                        <li>
                          <strong><u>Resources:</u></strong>
                          <ul>
                            {step.resources.map((resource, idx) => (
                              <li key={idx}>{resource}</li>
                            ))}
                          </ul>
                        </li>
                        <li>
                          <strong><u>Challenges:</u></strong>
                          <ul>
                            {step.challenges.map((challenge, idx) => (
                              <li key={idx}>{challenge}</li>
                            ))}
                          </ul>
                        </li>
                        <li><strong>Outcome:</strong> {step.outcome}</li>
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

  );
}