'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { signOut } from "next-auth/react";
import { Search, LucideX } from 'lucide-react';
import { motion } from "framer-motion";
import RadialGraph from "@/components/ui/radialGraph";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Tabs } from "@/components/ui/tabs";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Button,
} from "@heroui/react";

interface Skill {
    id: string;
    name: string;
    categoryId: string;
}

interface SearchedUserSKill {
    id: string;
    skillId: string;
    categoryId: string;
    skill: Skill;
    validatedByManager: boolean;
    level?: string;
    description?: string;
}

interface SearchUser {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const categories = [
    {id: '1', name: 'Professional & Technical'},
    {id: '2', name: 'Creative'},
    { id: '3', name: 'Life & Physical' },
    { id: '4', name: 'Social & Interpersonal' },
  ];
 
  const {data: session, status} = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchedUserId, setSearchedUserId] = useState<string | null>();
  const [searchedUsername, setSearchedUsername] = useState<string | null>();
  const [searchedUserSkills, setSearchedUserSkills] = useState<SearchedUserSKill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [searchedUserInfo, setSearchedUserInfo] = useState({ email: '', image: null });
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

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
    if (status == 'unauthenticated') {
      router.push('/login');
    } else if (status == 'authenticated') {
    }
  }, [status, router]);

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

  const fetchUserData = useCallback(async () => {
    try {
      const skillRes = await fetch('/api/search-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchedUserId }),
      });
  
      if (skillRes.ok) {
        const { email, image, skills } = await skillRes.json();
  
        setSearchedUserSkills(skills);
        setSearchedUserInfo({ email, image });
      }
    } catch (error) {
      console.error('Error while fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchedUserId]);

  useEffect(() => {
    // Reset searchedUserSkills when searchedUserId changes
    setSearchedUserSkills([]);
    setIsLoading(true); // Set loading state when changing users

    if (searchedUserId) {
      fetchUserData();
    }
  }, [searchedUserId, fetchUserData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
  };

  // Create optimized tabs similar to profile.tsx
  const optimizedTabs = categories.map(category => ({
    title: category.name,
    value: category.id,
    content: (
      <div className="w-full h-full p-4 bg-neutral-950 rounded-xl">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Category Expertise</span>
            <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">Skills</h1>
          </div>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
        
        <div className="w-full flex flex-col mb-8">
          <div className="flex-1 overflow-hidden">
          {(() => {
              const filteredSkills = searchedUserSkills.filter(skill => skill.categoryId === category.id);
              if (filteredSkills.length > 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="carousel-container h-full py-3"
                  >
                    <Carousel
                      items={filteredSkills.map((skill, idx) => (
                        <Card 
                          key={skill.id}
                          card={{
                            title: skill.skill.name,
                            category: skill.level || "Level 1",
                            src: "", 
                            content: (
                              <motion.div
                                whileHover={{ scale: 1.03, y: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                onClick={() => setExpandedSkill(skill.id)}
                              >
                                <GlowingStarsBackgroundCard
                                  className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                                >
                                  <div className="flex justify-start">
                                    <GlowingStarsTitle>{skill.skill.name}</GlowingStarsTitle>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                    <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                        {skill.level === "Level 1" ? "Beginner" : 
                                         skill.level === "Level 2" ? "Intermediate" : 
                                         skill.level === "Level 3" ? "Advanced" : 
                                         skill.level || "Beginner"}
                                      </span>
                                      {skill.validatedByManager && (
                                        <span className="text-xs text-emerald-400 mt-1 flex items-center">
                                          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                                          Validated
                                        </span>
                                      )}
                                    </div>
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
                      <p className="text-gray-400 text-lg mb-3">No skills added yet in this category</p>
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

  return(
    <div className="min-h-screen bg-neutral-950 p-4 md:p-8">
      {/* navBar */}
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

            <div className="hidden md:flex items-center space-x-4">
            {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
                <Button 
                  onClick={() => router.push(`/search-competency?userid=${searchedUserId}&username=${searchedUsername}`)}
                  className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
                >
                  Org Goals
                </Button>
              )}
              <Button 
                onClick={() => {
                  if (session?.user?.role === 'admin') {
                    router.push(`/admin-feedback?userid=${searchedUserId}&username=${searchedUsername}`);
                  } else {
                    router.push(`/reviewer-feedback?userid=${searchedUserId}&username=${searchedUsername}`);
                  }
                }}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                360° Feedback
              </Button>
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

      {expandedSkill && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-hidden"
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
                  <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Skill</div>
                  <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">
                    {searchedUserSkills.find(skill => skill.id === expandedSkill)?.skill.name}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedSkill(null)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                >
                  <LucideX size={18} />
                </motion.button>
              </div>
            </div>
            
            {/* Content area */}
            <div className="p-6">
              {/* Skill Level Badge */}
              <div className="flex items-center gap-2 mb-6">
              <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-purple-300 px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                >
                  {searchedUserSkills.find(skill => skill.id === expandedSkill)?.level === "Level 1" ? "Beginner" :
                   searchedUserSkills.find(skill => skill.id === expandedSkill)?.level === "Level 2" ? "Intermediate" :
                   searchedUserSkills.find(skill => skill.id === expandedSkill)?.level === "Level 3" ? "Advanced" :
                   searchedUserSkills.find(skill => skill.id === expandedSkill)?.level || "Beginner"}
                </motion.span>
                
                {searchedUserSkills.find(skill => skill.id === expandedSkill)?.validatedByManager && (
                  <motion.span 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-emerald-400 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 flex items-center"
                  >
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                    Validated
                  </motion.span>
                )}
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
                  <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4 min-h-[100px]">
                    <p className="text-gray-200 whitespace-pre-wrap">
                      {searchedUserSkills.find(skill => skill.id === expandedSkill)?.description || 
                       "No description provided for this skill."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
  
      <div className="grid grid-cols-1 md:grid-cols-2 ml-4 md:ml-12 mt-20 md:mt-2">
        <AnimatedTestimonials
          testimonials={[{
            quote: "Passionate about building scalable web applications and mentoring developers.",
            name: searchedUsername || "User",
            designation: "Software Developer",
            src: searchedUserInfo.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }]}
        />
        <div className="ml-12">
          <RadialGraph userSkills={searchedUserSkills} />
        </div>
      </div>
  
      <div className="h-[70rem] [perspective:1000px] flex flex-col max-w-7xl mx-auto w-full items-start justify-start my-10" id="skills-section">
        <Tabs tabs={optimizedTabs} />
      </div>
    </div>
  )};