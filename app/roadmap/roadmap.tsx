"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {  Search, Download, BrainCircuit} from "lucide-react";
import { motion } from "framer-motion";
import { Timeline } from "@/components/ui/timeline";
import { BackgroundBeams } from "@/components/ui/background-beams";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";

interface SearchUser {
  id: string;
  name: string;
}

type RoadmapStep = {
  label: string;
  description: string;
  timeline: string;
  resources: string[];
  challenges: string[];
  outcome: string;
};

type RoadmapType = {
  roadmap: {
    steps: RoadmapStep[];
  };
};

export default function RoadmapForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skillName, setSkillName] = useState<string | null>();
  const [level, setLevel] = useState<string>("beginner");
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const fulltext = "<SkillSikt/>";

  useEffect(() => {
    // Delay loading of heavy background effects
    const timer = setTimeout(() => {
      setShowBackgroundEffects(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay
  
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (debouncedQuery === '') {
        setSearchUsers([]);
        return;
      }
      
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedQuery }),
        });
  
        if (res.ok) {
          const users = await res.json();
          setSearchUsers(users);
        }
      } catch (error) {
        console.error('Error while fetching user data:', error);
      }
    };
  
    fetchUsers();
  }, [debouncedQuery]);

  const getRoadmap = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/get-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, level }),
      });

      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setRoadmap(data.roadmap || []);
    } catch (err) {
      console.error("Error getting roadmap:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRoadmap(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, level }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Something went wrong.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const parsedRoadmap = JSON.parse(data.roadmapText);
      setRoadmap(parsedRoadmap);
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      setError("Failed to fetch the roadmap. Please try again.");
    } finally {
      setIsLoading(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
  };

  // Transform roadmap steps to timeline format
  const timelineData = roadmap?.roadmap?.steps.map(step => ({
    title: step.label,
    content: (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg mb-6">
        <p className="text-gray-300 mb-4">{step.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-blue-400 font-semibold mb-2">Timeline</h4>
            <p className="text-gray-300">{step.timeline}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-emerald-400 font-semibold mb-2">Outcome</h4>
            <p className="text-gray-300">{step.outcome}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-purple-400 font-semibold mb-2">Resources</h4>
          <ul className="list-disc pl-5 text-gray-300 space-y-1">
            {step.resources.map((resource, idx) => (
              <li key={idx}>{resource}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-4">
          <h4 className="text-amber-400 font-semibold mb-2">Challenges</h4>
          <ul className="list-disc pl-5 text-gray-300 space-y-1">
            {step.challenges.map((challenge, idx) => (
              <li key={idx}>{challenge}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  })) || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {showBackgroundEffects && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <BackgroundBeams />
        </div>
      )}

      {/* NavBar */}
      <nav className="h-16 bg-[#000000] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
            {/* Left Section - Sidebar & Title */}
            <div className="flex items-center gap-3">
              {/* Title */}
              <h1 
                className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap cursor-pointer"
                onClick={() => router.push('/profile')}
              >
                {fulltext}
              </h1>
            </div>
    
            {/* Right Section - Search Bar & Sign Out */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-64 sm:w-80">
                {/* Lucide Search Icon */}
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                
                {/* Input Field */}
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-10  border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
                />
                
                {/* Dropdown for Search Results */}
                {searchUsers.length > 0 && query && (
                  <div className="absolute bg-[#000000] top-11 w-72 left-4 border-gray-300 border-2 rounded-md shadow-lg z-30">
                    {searchUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                        onClick={() => {
                          // Route differently based on user role
                          if (session?.user?.role === "admin" || session?.user?.role === "manager") {
                            router.push(`/search-competency?userid=${user.id}&username=${user.name}`);
                          } else {
                            router.push(`/publicProfile?userid=${user.id}&username=${user.name}`);
                          }
                          setQuery(""); // Clear search input
                          setSearchUsers([]); // Clear results
                        }}
                      >
                        {user.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
    
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform hover:scale-105"
                    color="secondary"
                    size="md"
                    src={session?.user?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat" className="bg-[#3b3b3b] text-white border border-gray-700 shadow-lg rounded-lg w-56">
                <DropdownItem key="profile" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/profile')
                    }}>
                    My Profile
                  </DropdownItem>
                  <DropdownItem key="goals" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/goals')
                  }}>My Goals</DropdownItem>
                  <DropdownItem key="competnecy" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/competency')
                  }}>My Competencies</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="upload-excel" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/upload-excel')
                    }}>Upload Excel</DropdownItem>
                  ) : null}
                  <DropdownItem key="org-chart" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/org-chart')
                  }}>Org-Chart</DropdownItem>
                  <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/edit-profile')
                  }}>Edit Profile</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="verify-empno" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/verify-employee')
                    }}>Verify EmployeeNo</DropdownItem>
                  ) : null}
                  <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 border border-gray-800/30">
          <h1 className="text-2xl md:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-4">Generate a Skill Roadmap</h1>
          <p className="text-gray-300 mb-6">Create a personalized learning path for any skill at your desired level</p>
          
          <form onSubmit={generateRoadmap} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="skillName" className="block text-sm font-medium text-gray-300 mb-1">
                  Skill Name
                </label>
                <Input
                  id="skillName"
                  value={skillName || ""}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Enter a skill name"
                  className="w-full bg-gray-800/40 backdrop-blur-sm border-gray-700/50 text-white"
                  required
                />
              </div>
              
              <div className="w-full md:w-1/3">
                <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-1">
                  Skill Level
                </label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-2 rounded-md bg-gray-700/40 backdrop-blur-sm border border-gray-700/50 text-white focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-2">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                disabled={isLoading}
              >
                <BrainCircuit size={18} />
                {isLoading ? "Generating..." : "Generate Roadmap"}
              </Button>
            </div>
          </form>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="relative p-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col items-center">
              <motion.div
                className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className="mt-4 text-lg font-semibold text-white/90 tracking-wide"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Creating your roadmap...
              </motion.p>
            </div>
          </div>
        )}
        
        {roadmap && roadmap.roadmap && roadmap.roadmap.steps && roadmap.roadmap.steps.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono">Your Learning Roadmap</h2>
              <Button
                onClick={saveRoadmap}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <Download size={18} />
                Save Roadmap
              </Button>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 shadow-lg">
              <Timeline data={timelineData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}