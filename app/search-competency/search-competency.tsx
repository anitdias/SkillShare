'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { signOut } from "next-auth/react";
import { Search, LucideX } from 'lucide-react';
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Tabs } from "@/components/ui/tabs";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars2";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Button,
} from "@heroui/react";

interface UserInfo {
  id: string;
  email: string;
  image: string | null;
  name: string | null;
  designation: string | null;
  description: string | null;
}

interface Competency {
  id: string;
  competencyType: string;
  competencyName: string;
  weightage: number;
  description: string | null;
  year: number;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  userCompetencyId: string | null;
}

interface Goal {
  id: string;
  goalCategory: string;
  goalName: string;
  goalTitle: string;
  metric: string;
  weightage: number;
  year: number;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  userGoalId: string | null;
}

interface GroupedCompetency {
  type: string;
  competencies: Competency[];
}

type Goals = Goal[];

interface SearchUser {
  id: string;
  name: string;
}

export default function SearchCompetencyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchedUserId, setSearchedUserId] = useState<string | null>();
  const [searchedUsername, setSearchedUsername] = useState<string | null>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [groupedCompetencies, setGroupedCompetencies] = useState<GroupedCompetency[]>([]);
  const [groupedGoals, setGroupedGoals] = useState<Goals>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState({
    goalTitle: "",
    goalName: "",
    metric: "",
    weightage: "",
    goalCategory: ""
  });

  useEffect(() => {
    // Delay loading of heavy background effects
    const timer = setTimeout(() => {
      setShowBackgroundEffects(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSearchedUserId('');
    setSearchedUsername(searchParams.get('username'));
    // Set the ID after clearing it to ensure the effect triggers properly
    setTimeout(() => {
      setSearchedUserId(searchParams.get('userid'));
    }, 0);
  }, [searchParams]);

  const fulltext = "<Skill Share/>";
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if user has admin or manager role
      if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
        router.push('/profile');
      } else {
        fetchAvailableYears();
      }
    }
  }, [status, router, session?.user?.role]);

  useEffect(() => {
    if (expandedGoal) {
      const goal = groupedGoals.find(g => g.id === expandedGoal);
      if (goal) {
        setEditedGoal({
          goalTitle: goal.goalTitle,
          goalName: goal.goalName,
          metric: goal.metric,
          weightage: goal.weightage.toString(),
          goalCategory: goal.goalCategory
        });
      }
    }
  }, [expandedGoal, groupedGoals]);

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

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/competency-year');
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data.length > 0 ? data : [new Date().getFullYear()]);
        setSelectedYear(data.length > 0 ? data[0] : new Date().getFullYear());
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/search-competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchedUserId,
          year: selectedYear
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        setGroupedCompetencies(data.competencies);
        setGroupedGoals(data.goals); // Now this is a flat array of goals, not grouped by category
      }
    } catch (error) {
      console.error('Error while fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchedUserId, selectedYear]);

  useEffect(() => {
    // Reset data when searchedUserId changes
    setUserInfo(null);
    setGroupedCompetencies([]);
    setGroupedGoals([]);
    setIsLoading(true); // Set loading state when changing users

    if (searchedUserId && (session?.user?.role === 'admin' || session?.user?.role === 'manager')) {
      fetchUserData();
    }
  }, [searchedUserId, fetchUserData, session?.user?.role, selectedYear]);
  
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuery(inputValue);
    if (inputValue !== '') {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputValue }),
        });

        if (res.ok) {
          const users = await res.json();
          setSearchUsers(users);
        }
      } catch (error) {
        console.error('Error while fetching user data:', error);
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
  };

  const handleCompetencyRatingSubmit = async () => {
    if (!expandedCompetency || !searchedUserId || ratingValue < 1 || ratingValue > 4) return;
    
    setIsSubmitting(true);
    
    try {
      // Find the competency to update
      const competencyType = groupedCompetencies.find(group => 
        group.competencies.some(comp => comp.id === expandedCompetency)
      );
      
      if (!competencyType) return;
      
      const competency = competencyType.competencies.find(comp => comp.id === expandedCompetency);
      if (!competency) return;
      
      const response = await fetch('/api/update-competency-rating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchedUserId,
          competencyId: competency.id,
          rating: ratingValue,
          userCompetencyId: competency.userCompetencyId,
          year: selectedYear
        }),
      });
      
      if (response.ok) {
        // Refresh data after successful update
        fetchUserData();
      } else {
        console.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating competency rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalRatingSubmit = async () => {
    if (!expandedGoal || !searchedUserId || ratingValue < 1 || ratingValue > 4) return;
    
    setIsSubmitting(true);
    
    try {
      const goal = groupedGoals.find(g => g.id === expandedGoal);
      if (!goal) return;
      
      // Store the current expanded goal ID
      const currentExpandedGoal = expandedGoal;
      
      const response = await fetch('/api/update-goal-rating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchedUserId,
          goalId: goal.id,
          rating: ratingValue,
          userGoalId: goal.userGoalId,
          year: selectedYear
        }),
      });
      
      if (response.ok) {
        // Refresh data and restore expanded state
        await fetchUserData();
        setExpandedGoal(currentExpandedGoal);
      } else {
        console.error('Failed to update goal rating');
      }
    } catch (error) {
      console.error('Error updating goal rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalUpdate = async () => {
    if (!expandedGoal) return;
    
    const goal = groupedGoals.find(g => g.id === expandedGoal);
    if (!goal || !goal.userGoalId) {
      console.error("Goal or userGoalId not found");
      alert("Cannot update goal: missing required information");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("Sending update with data:", {
        userGoalId: goal.userGoalId,
        ...editedGoal,
        weightage: parseInt(editedGoal.weightage),
        userId: searchedUserId
      });
      
      const response = await fetch('/api/search-competency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userGoalId: goal.userGoalId,
          ...editedGoal,
          weightage: parseInt(editedGoal.weightage), // Convert to number
          userId: searchedUserId
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Update successful:", result);
        
        // Update the local state to reflect the change
        setGroupedGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === expandedGoal 
              ? { 
                  ...g, 
                  goalTitle: editedGoal.goalTitle,
                  goalName: editedGoal.goalName,
                  metric: editedGoal.metric,
                  weightage: parseInt(editedGoal.weightage),
                  goalCategory: editedGoal.goalCategory
                } 
              : g
          )
        );
        
        setIsEditing(false);
        
      } else {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create tabs for competencies
  const competencyTabs = groupedCompetencies.map(group => ({
    title: group.type,
    value: group.type,
    content: (
      <div className="w-full h-full p-4 bg-neutral-950 rounded-xl">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Competency Type</span>
            <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">{group.type}</h1>
          </div>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
        
        <div className="w-full flex flex-col mb-8">
          <div className="flex-1 overflow-hidden">
          {(() => {
              if (group.competencies.length > 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="carousel-container h-full py-3"
                  >
                    <Carousel
                      items={group.competencies.map((competency, idx) => (
                        <Card 
                          key={competency.id}
                          card={{
                            title: competency.competencyName,
                            category: `Weightage: ${competency.weightage}%`,
                            src: "", 
                            content: (
                              <motion.div
                                whileHover={{ scale: 1.03, y: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                onClick={() => {
                                    setExpandedCompetency(competency.id);
                                    setRatingValue(
                                      session?.user?.role === 'admin' 
                                        ? competency.adminRating 
                                        : competency.managerRating
                                    );
                                  }}
                              >
                                <GlowingStarsBackgroundCard
                                  className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                                >
                                  <div className="flex justify-start">
                                    <GlowingStarsTitle>{competency.competencyName}</GlowingStarsTitle>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                        Weightage: {competency.weightage}%
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
                );
              } else {
                return (
                  <div className="h-32 flex items-center justify-center my-4">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg text-center">
                      <p className="text-gray-400 text-lg mb-3">No competencies found in this category</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    ),
  }));

  

  if (status === 'loading' || isLoading) {
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
        <div className="min-h-screen bg-neutral-950 p-4 md:p-8">
          {/* navBar */}
          <nav className="h-16 bg-[#000000] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
            {/* Left Section - Title */}
            <div className="flex items-center gap-3">
              <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
                {fulltext}
              </h1>
            </div>
    
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                onClick={() => router.push(`/publicProfile?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Profile
              </Button>
              <Button 
                onClick={() => router.push('/competency')}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                My Competencies
              </Button>
              <Button 
                onClick={() => router.push('/goals')}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                My Goals
              </Button>
            </div>
    
            {/* Right Section - Search Bar & Profile */}
            <div className="flex items-center gap-4">
              {/* Year Selector */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
    
              {/* Search Bar */}
              <div className="relative w-64 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-10 border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
                />
                
                {searchUsers.length > 0 && query && (
                  <div className="absolute bg-[#000000] top-11 w-72 left-4 border-gray-300 border-2 rounded-md shadow-lg z-30">
                    {searchUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                        onClick={() => {
                          router.push(`/search-competency?userid=${user.id}&username=${user.name}`);
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
                    as="button"
                    className="transition-transform hover:scale-105"
                    color="secondary"
                    size="md"
                    src={session?.user?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                    data-loaded="true"
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat" className="bg-[#3b3b3b] text-white border border-gray-700 shadow-lg rounded-lg w-56">
                  <DropdownItem key="profile" className="h-16 gap-2 hover:bg-gray-600 transition rounded-md">
                    <p className="font-semibold text-sm text-gray-300">Signed in as</p>
                    <p className="font-semibold text-sm text-white">{session?.user?.email}</p>
                  </DropdownItem>
                  <DropdownItem key="profileroute" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/profile')
                    }}>
                    My Profile
                  </DropdownItem>
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
          
          {showBackgroundEffects && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <BackgroundBeams />
            </div>
          )}
    
          {/* User Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 ml-4 md:ml-12 mt-20 md:mt-2">
            <AnimatedTestimonials
              testimonials={[{
                quote: userInfo?.description || "No description available",
                name: searchedUsername || "User",
                designation: userInfo?.designation || "Employee",
                src: userInfo?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              }]}
            />
          </div>
    
          {/* Competencies Section */}
          <div className="h-[38rem] [perspective:1000px] flex flex-col max-w-7xl mx-auto w-full items-start justify-start">
            <Tabs tabs={competencyTabs} />
          </div>
          
          
    
          {/* Goals Section */}
          <div className="max-w-7xl mx-auto w-full mb-20">
            <div className="w-full p-4 bg-neutral-950 rounded-xl">
            <div className="flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Performance</span>
                <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">Goals</h1>
                </div>
            </div>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
            
            <div className="w-full flex flex-col mb-8">
                <div className="flex-1 overflow-hidden">
                {(() => {
                    // Check if goals array exists and has items
                    if (groupedGoals && groupedGoals.length > 0) {
                    return (
                        <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="carousel-container h-full py-3"
                        >
                        <Carousel
                            items={groupedGoals.map((goal, idx) => (
                            <Card 
                                key={goal.id}
                                card={{
                                title: goal.goalName,
                                category: `Weightage: ${goal.weightage}%`,
                                src: "", 
                                content: (
                                    <motion.div
                                    whileHover={{ scale: 1.03, y: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    onClick={() => {
                                        setExpandedGoal(goal.id);
                                        setRatingValue(
                                          session?.user?.role === 'admin' 
                                            ? goal.adminRating 
                                            : goal.managerRating
                                        );
                                      }}
                                    >
                                    <GlowingStarsBackgroundCard
                                        className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                                    >
                                        <div className="flex justify-start">
                                        <GlowingStarsTitle>{goal.goalName}</GlowingStarsTitle>
                                        </div>
                                        <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                            Weightage: {goal.weightage}%
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
                    );
                    }
                    return (
                    <div className="h-32 flex items-center justify-center my-4">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg text-center">
                        <p className="text-gray-400 text-lg mb-3">No goals found for this user</p>
                        </div>
                    </div>
                    );
                })()}
                </div>
            </div>
            </div>
            </div>

            {expandedCompetency && (() => {
            const competencyType = groupedCompetencies.find(group => 
              group.competencies.some(comp => comp.id === expandedCompetency)
            );
            
            if (!competencyType) return null;
            
            const competency = competencyType.competencies.find(comp => comp.id === expandedCompetency);
            if (!competency) return null;
            
            return (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-auto max-h-[98vh]"
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
                          {competency.competencyName}
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
                        Weightage: {competency.weightage}%
                      </motion.span>
                      <motion.span 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-purple-300 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                      >
                        Type: {competencyType.type}
                      </motion.span>
                      <motion.span 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-green-300 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                      >
                        Year: {competency.year}
                      </motion.span>
                    </div>
                    
                    {/* Description */}
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
                            {competency.description?.split('\n').map((line, i, arr) => {
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
                    
                    {/* Ratings */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mb-8"
                    >
                      <h3 className="text-sm font-medium text-blue-200 mb-3">Current Ratings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-blue-700/30">
                          <p className="text-gray-400 text-sm mb-1">Employee Rating</p>
                          <p className="text-3xl font-bold text-blue-400">{competency.employeeRating}<span className="text-lg text-blue-500/70">/4</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-green-700/30">
                          <p className="text-gray-400 text-sm mb-1">Manager Rating</p>
                          <p className="text-3xl font-bold text-green-400">{competency.managerRating}<span className="text-lg text-green-500/70">/4</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-purple-700/30">
                          <p className="text-gray-400 text-sm mb-1">Supervisor Rating</p>
                          <p className="text-3xl font-bold text-purple-400">{competency.adminRating}<span className="text-lg text-purple-500/70">/4</span></p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Rating Selection */}
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">Your Rating</label>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          Rating {ratingValue}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="h-2 bg-gray-700 rounded-full w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${ratingValue * 25}%`
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
                              onClick={() => setRatingValue(level)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                ratingValue === level 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30" 
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              {level}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Action Buttons */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex justify-end gap-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setExpandedCompetency(null)}
                        className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCompetencyRatingSubmit}
                        disabled={isSubmitting || ratingValue < 1}
                        className={`px-5 py-2.5 rounded-lg transition-colors ${
                          isSubmitting || ratingValue < 1
                            ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20'
                        }`}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Rating'}
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })()}

        {/* Expanded Goal Modal */}
        {expandedGoal && (() => {
          const goal = groupedGoals.find(g => g.id === expandedGoal);
          if (!goal) return null;
          
          return (
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
                      <div className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-1">
                        {isEditing ? "Edit Goal" : "Goal"}
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedGoal.goalName}
                          onChange={(e) => setEditedGoal({...editedGoal, goalName: e.target.value})}
                          className="text-2xl text-white font-bold bg-transparent border-b border-green-400 focus:outline-none w-full"
                          placeholder="Goal Name"
                        />
                      ) : (
                        <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-green-400">
                          {goal.goalName}
                        </h2>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(session?.user?.role === "admin" || session?.user?.role === "manager") && !isEditing && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEditing(true)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full p-2 transition-all duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </motion.button>
                      )}
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setExpandedGoal(null);
                          setIsEditing(false);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                      >
                        <LucideX size={18} />
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Content area */}
                <div className="p-5 overflow-y-auto">
                  {/* Weightage Badge */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {isEditing ? (
                      <>
                        <div className="w-full mb-3">
                          <label className="text-xs text-gray-400 mb-1 block">Weightage (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={editedGoal.weightage}
                            onChange={(e) => setEditedGoal({...editedGoal, weightage: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          />
                        </div>
                        <div className="w-full mb-3">
                          <label className="text-xs text-gray-400 mb-1 block">Category</label>
                          <input
                            type="text"
                            value={editedGoal.goalCategory}
                            onChange={(e) => setEditedGoal({...editedGoal, goalCategory: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-sm text-green-300 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                        >
                          Weightage: {goal.weightage}%
                        </motion.span>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-blue-300 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                        >
                          Category: {goal.goalCategory}
                        </motion.span>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-sm text-purple-300 px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                        >
                          Year: {goal.year}
                        </motion.span>
                      </>
                    )}
                  </div>
                  
                  {/* Goal Details */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <div className="relative group mb-4">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <h3 className="text-sm font-medium text-green-200 mb-2">Goal Title</h3>
                        {isEditing ? (
                          <textarea
                            value={editedGoal.goalTitle}
                            onChange={(e) => setEditedGoal({...editedGoal, goalTitle: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[80px]"
                            placeholder="Enter goal title"
                          />
                        ) : (
                          <p className="text-gray-300">{goal.goalTitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <h3 className="text-sm font-medium text-green-200 mb-2">Metric</h3>
                        {isEditing ? (
                          <textarea
                            value={editedGoal.metric}
                            onChange={(e) => setEditedGoal({...editedGoal, metric: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[120px]"
                            placeholder="Enter success metric"
                          />
                        ) : (
                          <p className="text-gray-300">{goal.metric}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Ratings */}
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
                        <p className="text-3xl font-bold text-blue-400">{goal.employeeRating}<span className="text-lg text-blue-500/70">/4</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-green-700/30">
                        <p className="text-gray-400 text-sm mb-1">Manager Rating</p>
                        <p className="text-3xl font-bold text-green-400">{goal.managerRating}<span className="text-lg text-green-500/70">/4</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-purple-700/30">
                        <p className="text-gray-400 text-sm mb-1">Supervisor Rating</p>
                        <p className="text-3xl font-bold text-purple-400">{goal.adminRating}<span className="text-lg text-purple-500/70">/4</span></p>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Rating Selection - Only show if not editing */}
                  {!isEditing && (
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">Your Rating</label>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          Rating {ratingValue}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="h-2 bg-gray-700 rounded-full w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${ratingValue * 25}%`
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20"
                          />
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          {[0, 1, 2, 3, 4].map((level) => (
                            <motion.button
                              key={level}
                              whileHover={{ y: -3, scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setRatingValue(level)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                ratingValue === level 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30" 
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              {level}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Action Buttons */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-end gap-3"
                  >
                    {isEditing ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setIsEditing(false)}
                          className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleGoalUpdate}
                          disabled={isSubmitting || !editedGoal.goalName || !editedGoal.goalTitle || !editedGoal.metric || !editedGoal.weightage}
                          className={`px-5 py-2.5 rounded-lg transition-colors ${
                            isSubmitting || !editedGoal.goalName || !editedGoal.goalTitle || !editedGoal.metric || !editedGoal.weightage
                              ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setExpandedGoal(null)}
                          className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleGoalRatingSubmit}
                          disabled={isSubmitting || ratingValue < 1}
                          className={`px-5 py-2.5 rounded-lg transition-colors ${
                            isSubmitting || ratingValue < 1
                              ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Rating'}
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          );
      })()}
        
        </div>
        
      );
    }