'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars2";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { LucideX, Search, ChevronDown} from "lucide-react";
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

  interface Competency {
    id: string;
    competencyType: string;
    competencyName: string;
    weightage: number;
    description: string;
    year: number; // Add year to the interface
  }

interface UserCompetency {
  id: string;
  userId: string;
  competencyId: string;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  competency: Competency;
}

export default function CompetencyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userCompetencies, setUserCompetencies] = useState<UserCompetency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
  const [employeeRating, setEmployeeRating] = useState<number>(0);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const fulltext = "<Skill Share/>";

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAvailableYears();
      fetchCompetencies(new Date().getFullYear()); // Initial fetch with current year
    }
  }, [status, router]);

  useEffect(() => {
    if (expandedCompetency) {
      const competency = userCompetencies.find(uc => uc.id === expandedCompetency);
      if (competency) {
        setEmployeeRating(competency.employeeRating);
      }
    }
  }, [expandedCompetency, userCompetencies]);

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/competency-year');
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data);
        // If no years available, use current year
        if (data.length === 0) {
          setAvailableYears([new Date().getFullYear()]);
        }
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      // Fallback to current year if error
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchCompetencies = async (year: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/competency?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setUserCompetencies(data);
      }
    } catch (error) {
      console.error('Error fetching competencies:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    fetchCompetencies(newYear); // Fetch competencies for the selected year
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

  const Icon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-4 w-4 text-white stroke-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
        />
      </svg>
    );
  };

  const competencyTypes = Array.from(new Set(userCompetencies.map(uc => uc.competency.competencyType)));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950">
        <motion.div
          className="w-12 h-12 border-4 border-t-transparent border-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 overflow-hidden px-4 py-12">
    <nav className="h-16 bg-[#000000] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
            {/* Left Section - Sidebar & Title */}
            <div className="flex items-center gap-3">
              {/* Title */}
              <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
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
                          router.push(`/publicProfile?userid=${user.id}&username=${user.name}`);
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
                  <DropdownItem key="settings" className="hover:bg-gray-600 transition p-3 rounded-md">My Settings</DropdownItem>
                  <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md">Help & Feedback</DropdownItem>
                  <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </nav>

    
      {/* Header with Sparkles */}
      <div className="relative h-52 w-full">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
          <h1 className="text-4xl md:text-6xl font-bold font-mono text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            VALUES & COMPETENCIES
          </h1>
          
          {/* Gradient Effects */}
          <div className="relative w-full h-20 mt-2">
            {/* Primary gradient line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-[600px] blur-sm" />
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-[600px]" />
            
            {/* Secondary gradient line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-2 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-[300px] blur-sm" />
            <div className="absolute left-1/2 transform -translate-x-1/2 top-2 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-[300px]" />
          </div>
        </div>       
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-start">
          <div className="relative w-48">
            <label className="block text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">
              Select Year
            </label>
            <div className="relative">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full bg-neutral-800/100 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Sections */}
      <div className="max-w-7xl mx-auto">
        {competencyTypes.map((type) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-neutral-950 overflow-hidden relative h-auto rounded-2xl p-8"
          >
            {/* Section Header */}
            <div className="flex flex-col mb-6">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                Competency Category
              </span>
              <h2 className="text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-mono font-bold">
                {type}
              </h2>
            </div>

            
            <div 
                  className="absolute inset-0 opacity-[0.5]"
                  style={{
                    background: `
                      linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0.1) 60%, transparent),
                      linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0.1) 60%, transparent),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
                      linear-gradient(0deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 25px 25px, 25px 25px',
                    maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)',
                  }}
                />
            {/* Competency Cards */}
            <div className="w-full flex flex-col">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="carousel-container h-full relative"
              >
                {/* Grid Background with Fade Effect */}
                
                <Carousel
                  items={userCompetencies
                    .filter(uc => uc.competency.competencyType === type)
                    .map((uc, idx) => (
                      <Card 
                        key={uc.id}
                        card={{
                          title: uc.competency.competencyName,
                          category: `Weightage: ${uc.competency.weightage}%`,
                          src: "",
                          content: (
                            <motion.div
                              whileHover={{ scale: 1.03, y: -5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              onClick={() => setExpandedCompetency(uc.id)}
                            >
                              <GlowingStarsBackgroundCard
                                className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                              >
                                <div className="flex justify-start">
                                  <GlowingStarsTitle>{uc.competency.competencyName}</GlowingStarsTitle>
                                </div>
                                <div className="flex justify-between items-end">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-blue-300 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                      Weightage: {uc.competency.weightage}%
                                    </span>                                  
                                  </div>
                                  <motion.div                                            
                                    className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.15)] flex items-center justify-center backdrop-blur-sm hover:bg-[hsla(0,0%,100%,.25)] transition-all duration-300"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Icon />
                                  </motion.div>
                                </div>
                              </GlowingStarsBackgroundCard>
                            </motion.div>
                          )
                        }}
                        index={idx}
                        layout={false}
                      />
                    ))}
                  initialScroll={0}
                />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      {expandedCompetency && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[98vh]"
          >
            {/* Header with gradient background */}
            <div className="relative bg-neutral-950 p-5">
              <div 
                className="absolute top-0 left-0 w-full h-full opacity-40"
                style={{
                  backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "10px 10px"
                }}
              />
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Competency</div>
                  <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">
                    {userCompetencies.find(uc => uc.id === expandedCompetency)?.competency.competencyName}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedCompetency(null)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                >
                  <LucideX size={18} />
                </motion.button>
              </div>
            </div>
            
            {/* Content area */}
            <div className="p-6">
              {/* Weightage Badge */}
              <div className="flex items-center gap-2 mb-4">
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-blue-300 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                >
                  Weightage: {userCompetencies.find(uc => uc.id === expandedCompetency)?.competency.weightage}%
                </motion.span>
              </div>

              {/* Description - Enhanced for better readability with increased height */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                    {/* Description content with enhanced styling and increased height */}
                    <div className="p-5 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {userCompetencies.find(uc => uc.id === expandedCompetency)?.competency.description.split('\n').map((line, i, arr) => {
                        // Check if line looks like a heading (ends with a colon)
                        const isHeading = line.trim().endsWith(':');
                        // Check if line looks like a bullet point
                        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
                        // Format numbers to be bold
                        const formattedLine = line.replace(/(\d+)/g, '<span class="font-bold text-blue-200">$1</span>')
                          // Replace number followed by arrow and colon pattern
                          .replace(/(\d+)\s*(-&gt;|->|→)\s*:/g, '<span class="font-bold text-blue-200">$1</span> <span class="mx-1 text-purple-400">→</span> <span class="text-yellow-400 font-medium">:</span>')
                          // Replace other arrows
                          .replace(/(-&gt;|->|→)/g, '<span class="mx-1 text-purple-400">→</span>')
                          // Replace colons in non-heading lines
                          .replace(/(:\s)/g, '<span class="text-yellow-400 font-medium">: </span>');
                        
                        return (
                          <div key={i} className={`${i < arr.length - 1 ? 'mb-2' : ''}`}>
                            {isHeading ? (
                              <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                                {line.replace(/:$/, '')}
                                <span className="ml-1 text-yellow-400 text-lg">:</span>
                              </h4>
                            ) : isBullet ? (
                              <div className="flex mb-1.5">
                                <span className="text-purple-400 mr-2 text-lg">•</span>
                                <p 
                                  className="text-gray-200"
                                  dangerouslySetInnerHTML={{ 
                                    __html: formattedLine.replace(/^[-•]\s*/, '') 
                                  }}
                                />
                              </div>
                            ) : line ? (
                              <p 
                                className="text-gray-200 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: formattedLine }}
                              />
                            ) : (
                              <div className="h-3"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Subtle gradient fade at bottom for scrollable content */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-neutral-800/90 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </motion.div>

              {/* Rating Selector */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-300">Your/Employee Rating</label>
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    Rating {employeeRating}
                  </span>
                </div>
                
                <div className="relative">
                  <div className="h-2 bg-gray-700 rounded-full w-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${employeeRating * 25}%`
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20"
                    />
                  </div>
                  
                  <div className="flex justify-between mt-3">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <motion.button
                        key={level}
                        whileHover={{ y: -3, scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEmployeeRating(level)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          employeeRating === level 
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30" 
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Save Rating Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <button
                    onClick={async () => {
                      if (!expandedCompetency) return;
                      
                      try {
                        const response = await fetch('/api/competency', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            userCompetencyId: expandedCompetency,
                            rating: employeeRating,
                          }),
                        });
                        
                        if (response.ok) {
                          // Update the local state to reflect the change
                          setUserCompetencies(prevCompetencies => 
                            prevCompetencies.map(comp => 
                              comp.id === expandedCompetency 
                                ? { ...comp, employeeRating } 
                                : comp
                            )
                          );
                          
                          // Show success message or toast notifica
                        } else {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to save rating');
                        }
                      } catch (error) {
                        console.error('Error saving rating:', error);
                        alert('Failed to save rating. Please try again.');
                      }
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Rating
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}