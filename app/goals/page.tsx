'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars2";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { LucideX, Search, ChevronDown, Quote } from "lucide-react";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { globeConfig, sampleArcs } from "@/lib/globe_data";
import dynamic from 'next/dynamic';

const World = dynamic(() => import('@/components/ui/globe'), {
  ssr: false, // Disable server-side rendering
});

interface SearchUser {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  goalCategory: string;
  goalName: string;
  goalTitle: string;
  metric: string;
  weightage: number;
  year: number;
}

interface UserGoal {
  id: string;
  userId: string;
  goalId: string;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  goal: Goal;
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [employeeRating, setEmployeeRating] = useState<number>(0);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const fulltext = "<Skill Share/>";

  useEffect(() => {
    // Delay loading of heavy background effects
    const timer = setTimeout(() => {
      setShowBackgroundEffects(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAvailableYears();
      fetchGoals(new Date().getFullYear()); // Initial fetch with current year
    }
  }, [status, router]);

  useEffect(() => {
    if (expandedGoal) {
      const goal = userGoals.find(ug => ug.id === expandedGoal);
      if (goal) {
        setEmployeeRating(goal.employeeRating);
      }
    }
  }, [expandedGoal, userGoals]);

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

  const fetchGoals = async (year: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/goals?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setUserGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    fetchGoals(newYear); // Fetch goals for the selected year
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
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
              className="w-full p-2 pl-10 border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
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
                  <DropdownItem key="competnecy" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/competency')
                  }}>Competencies</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="upload-excel" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/upload-excel')
                    }}>Upload Excel</DropdownItem>
                  ) : null}
                  <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/edit-profile')
                  }}>Edit Profile</DropdownItem>
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
            GOALS
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

      {/* Goals Section */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full bg-neutral-950 overflow-hidden relative h-auto rounded-2xl p-8"
        >
          {/* Section Header */}
          <div className="flex flex-col mb-6">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              Performance Goals
            </span>
            <h2 className="text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-mono font-bold">
              Annual Objectives
            </h2>
          </div>

          {/* Background Grid Pattern */}
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

          {/* Goal Cards */}
          <div className="w-full flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="carousel-container h-full relative"
            >
              {userGoals.length > 0 ? (
                <Carousel
                  items={userGoals.map((ug, idx) => (
                    <Card 
                      key={ug.id}
                      card={{
                        title: ug.goal.goalName,
                        category: `Weightage: ${ug.goal.weightage}%`,
                        src: "",
                        content: (
                          <motion.div
                            whileHover={{ scale: 1.03, y: -5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={() => setExpandedGoal(ug.id)}
                          >
                            <GlowingStarsBackgroundCard
                              className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                            >
                              <div className="flex justify-start">
                                <GlowingStarsTitle>{ug.goal.goalName}</GlowingStarsTitle>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                  <span className="text-xs text-green-300 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                    Weightage: {ug.goal.weightage}%
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No Goals Available</h3>
                  <p className="text-gray-400 max-w-md">
                    There are no goals set for the selected year. Please select a different year or contact your administrator.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Quote and Globe Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Left section - Quote */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            {/* Left Quote - Normal */}
            <Quote className="text-blue-400 absolute -left-12 -top-8 scale-x-[-1]" size={48} />
            
            <h2 className="text-xl md:text-3xl font-bold text-white mb-4 px-4">
            Our goals can only be reached through a vehicle of a plan, in which we must fervently believe, and upon which we must vigorously act. There is no other route to success.
            </h2>

            {/* Right Quote - Mirrored Horizontally & Rotated */}
            <Quote className="text-blue-400 absolute -right-5 -bottom-4" size={48} />
          </div>
          <p className="text-lg md:text-xl text-blue-300 italic mt-4">— Stephen A. Brennan</p>
        </div>

        {/* Right section - Globe */}
        <div className="h-[400px] md:h-[500px] relative rounded-2xl overflow-hidden">
          {showBackgroundEffects && (
            <World 
              globeConfig={globeConfig} 
              data={sampleArcs} 
            />
          )}
        </div>
      </div>

      {/* Expanded Goal Modal */}
      {expandedGoal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]"
          >
            {/* Header with gradient background */}
            <div className="relative bg-neutral-950 p-4">
              <div 
                className="absolute top-0 left-0 w-full h-full opacity-40"
                style={{
                  backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "10px 10px"
                }}
              />
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <div className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-1">Goal</div>
                  <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-green-400">
                    {userGoals.find(ug => ug.id === expandedGoal)?.goal.goalName}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedGoal(null)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                >
                  <LucideX size={18} />
                </motion.button>
              </div>
            </div>
            
            {/* Content area */}
            <div className="p-5 overflow-y-auto">
              {/* Weightage Badge */}
              <div className="flex items-center gap-2 mb-3">
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-green-300 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                >
                  Weightage: {userGoals.find(ug => ug.id === expandedGoal)?.goal.weightage}%
                </motion.span>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-blue-300 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                >
                  {userGoals.find(ug => ug.id === expandedGoal)?.goal.goalCategory}
                </motion.span>
              </div>

              {/* Goal Title */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <label className="block text-sm font-medium text-gray-300 mb-1">Goal Title</label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                    <p className="text-gray-200">
                      {userGoals.find(ug => ug.id === expandedGoal)?.goal.goalTitle || "No title provided"}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Metric */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                <label className="block text-sm font-medium text-gray-300 mb-1">Success Metric</label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <p className="text-gray-200 whitespace-pre-wrap">
                      {userGoals.find(ug => ug.id === expandedGoal)?.goal.metric || "No metric defined"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-green-200 mb-3">Current Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-blue-700/30">
                    <p className="text-gray-400 text-sm mb-1">Employee Rating</p>
                    <p className="text-3xl font-bold text-blue-400">{userGoals.find(ug => ug.id === expandedGoal)?.employeeRating}<span className="text-lg text-blue-500/70">/4</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-green-700/30">
                    <p className="text-gray-400 text-sm mb-1">Manager Rating</p>
                    <p className="text-3xl font-bold text-green-400">{userGoals.find(ug => ug.id === expandedGoal)?.managerRating}<span className="text-lg text-green-500/70">/4</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-purple-700/30">
                    <p className="text-gray-400 text-sm mb-1">Admin Rating</p>
                    <p className="text-3xl font-bold text-purple-400">{userGoals.find(ug => ug.id === expandedGoal)?.adminRating}<span className="text-lg text-purple-500/70">/4</span></p>
                  </div>
                </div>
              </motion.div>

              {/* Rating Selector */}
                <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-3"
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
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-green-500/20"
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
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-green-500/30" 
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
                      if (!expandedGoal) return;
                      
                      try {
                        const response = await fetch('/api/goals', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            userGoalId: expandedGoal,
                            rating: employeeRating,
                          }),
                        });
                        
                        if (response.ok) {
                          // Update the local state to reflect the change
                          setUserGoals(prevGoals => 
                            prevGoals.map(goal => 
                              goal.id === expandedGoal 
                                ? { ...goal, employeeRating } 
                                : goal
                            )
                          );
                          
                          // Show success message or toast notification
                        } else {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to save rating');
                        }
                      } catch (error) {
                        console.error('Error saving rating:', error);
                        alert('Failed to save rating. Please try again.');
                      }
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
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