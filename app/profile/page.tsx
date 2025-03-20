'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { LucidePlus, LucideX, Search, Quote } from 'lucide-react';
import { motion } from "framer-motion";
import RadialGraph from "@/components/ui/radialGraph";
import {DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Tabs } from "@/components/ui/tabs";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import {InfiniteMovingCards} from "@/components/ui/infinite-moving-cards";
import { globeConfig, sampleArcs } from "@/lib/globe_data";
import dynamic from 'next/dynamic'
const World = dynamic(() => import('@/components/ui/globe'), {
  ssr: false, // Disable server-side rendering
});
interface Skill {
    id: string;
    name: string;
    categoryId: string;
}

interface UserSKill {
  id: string;
  skillId: string;
  categoryId: string;
  skill: Skill;
  validatedByManager: boolean;
  level?: string;       // Added this property
  description?: string; // Added this property
}

interface WishlistItem {
  id: string;
  skillName: string;
  categoryId: string;
  description?: string; // Added this property
}

interface SearchUser {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const categories = useMemo((): { id: string; name: string }[] => [
    { id: '1', name: 'Professional & Technical' },
    { id: '2', name: 'Creative' },
    { id: '3', name: 'Life & Physical' },
    { id: '4', name: 'Social & Interpersonal' },
], []);
  
  const {data: session, status} = useSession();
  const router = useRouter();
  const [userSkills, setUserSkills] = useState<UserSKill[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [showAddSkillForm, setShowAddSkillForm] = useState<{set: boolean; categoryId: string}>({set: false, categoryId: ''});
  const [showWishlistForm, setShowWishlistForm] = useState<{set: boolean; categoryId: string}>({set: false, categoryId: ''});
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', categoryId: '', level: 'Level 1', description: '' });
  const [newWishlistItem, setNewWishlistItem] = useState('');
  const [newWishlistDescription, setNewWishlistDescription] = useState('');
  const [recommendation, setRecommendation] = useState<{ skills: Record<string, string> }>({
    skills: {},
  });
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationKey, setRecommendationKey] = useState(0);
  const [addSkillStep, setAddSkillStep] = useState(1);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedWishlist, setExpandedWishlist] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<{ level: string; description: string }>({ level: '', description: '' });
  const [editingWishlistDescription, setEditingWishlistDescription] = useState('');
  const [skillsUpdateCounter, setSkillsUpdateCounter] = useState(0);
  const [wishlistUpdateCounter, setWishlistUpdateCounter] = useState(0);

  useEffect(() => {
    // Delay loading of heavy background effects
    const timer = setTimeout(() => {
      setShowBackgroundEffects(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fulltext = "<SkillShare/>";
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status, router]);

    const testimonials = useMemo(() => [
      {
        quote:
          "Passionate about building scalable web applications and mentoring developers.",
        name: session?.user?.name,
        designation: "Intern at Framsikt",
        src: session?.user?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      }
    ], [session]);

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

  
  

    const fetchUserData = async () => {
      try {
        const [skillRes, wishlistRes] = await Promise.all([
          fetch("/api/skills"),
          fetch("/api/wishlist"),
        ]);
    
        if (skillRes.ok && wishlistRes.ok) {
          const [skillData, wishlist] = await Promise.all([
            skillRes.json(),
            wishlistRes.json(),
          ]);
    
          setUserSkills(skillData.skills); // Extract skills from API response
          const recommendation = skillData.recommendation
            ? JSON.parse(skillData.recommendation)
            : { skills: {} };

          setRecommendation(recommendation);
          setWishlist(wishlist);
        }
      } catch (error) {
        console.error("Error while fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    

    const handleAddSkill = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      try {
        const response = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSkill),
        });
  
        if (response.ok) {
          const skill = await response.json();
          setUserSkills([...userSkills, skill]);
          setNewSkill({ name: '', categoryId: '', level: 'Level 1', description: '' });
          setShowAddSkillForm({set: false, categoryId: ''});
          setAddSkillStep(1);
          setSkillsUpdateCounter(prev => prev + 1); // Reset to first step for next time
        }
      } catch (error) {
        console.error('Error adding skill:', error);
      }   
    }
    const handleAddWishlistItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newWishlistItem.trim()) return;
    
      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            skillName: newWishlistItem, 
            categoryId: showWishlistForm.categoryId,
            description: newWishlistDescription 
          }),
        });
    
        if (response.ok) {
          const item = await response.json();
          setWishlist([...wishlist, item]);
          setNewWishlistItem('');
          setNewWishlistDescription('');
          setShowWishlistForm({set: false, categoryId: ''});
          setWishlistUpdateCounter(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error adding wishlist item:', error);
      }
    }

      const handleDeleteWishlist = async (id: string) =>{
        try {
            const response = await fetch('/api/wishlist', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id }),
            });
      
            if (response.ok) {
              await response.json();
              setWishlist(wishlist => wishlist.filter(object => object.id!== id ));
              setWishlistUpdateCounter(prev => prev + 1);
              
            }
          } catch (error) {
            console.error('Error deleting wishlist item:', error);
          }


      }
    
      const handleDeleteSkill = async (id: string) => {
        try{
            const response = await fetch('/api/skills', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
              });

            if(response.ok){
                await response.json();
                setUserSkills(userSkills => userSkills.filter(object=> object.id!== id))
                setSkillsUpdateCounter(prev => prev + 1);
            }
        }
        catch (error) {
            console.error('Error deleting wishlist item:', error);
          }
      }

      const handleAddSkillfromWishlist = async ({ name, categoryId, description }: { name: string; categoryId: string; description?: string }) => {
        try {
          const response = await fetch('/api/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: name, 
              categoryId: categoryId,
              level: 'Level 1', // Default to Level 1 for new skills
              description: description || '' // Use the description from wishlist if available
            }),
          });
      
          if (response.ok) {
            const skill = await response.json();
            setUserSkills([...userSkills, skill]);
            setNewSkill({ name: '', categoryId: '', level: 'Level 1', description: '' });
          }
        } catch (error) {
          console.error('Error adding skill:', error);
        }   
      }

      const handleUpdateSkill = async (id: string, level: string, description: string) => {
        try {
          const response = await fetch('/api/skills', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, level, description }),
          });
      
          if (response.ok) {
            const updatedSkill = await response.json();
            setUserSkills(userSkills.map(skill => 
              skill.id === id ? updatedSkill : skill
            ));
            setExpandedSkill(null);
            setSkillsUpdateCounter(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error updating skill:', error);
        }
      }

      const handleUpdateWishlist = async (id: string, description: string) => {
        try {
          const response = await fetch('/api/wishlist', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, description }),
          });
      
          if (response.ok) {
            const updatedItem = await response.json();
            setWishlist(wishlist.map(item => 
              item.id === id ? updatedItem : item
            ));
            setExpandedWishlist(null);
            setWishlistUpdateCounter(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error updating wishlist item:', error);
        }
      }

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
    
      const fetchRecommendation = async () => {
        try {
          setIsLoadingRecommendations(true);
          // Extract skill names from userSkills and wishlist
          const skills = userSkills.map((skill) => skill.skill.name);
          const wishlistSkills = wishlist.map((item) => item.skillName);
      
          const response = await fetch("/api/generate-recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills, wishlistSkills }),
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching recommendation:", errorData);
            return;
          }
      
          const data = await response.json();
          try {
            const parsedRecommendation = typeof data.recommendation === 'string' 
              ? JSON.parse(data.recommendation) 
              : data.recommendation;
            
            setRecommendation(parsedRecommendation);
            // Increment the key to force a re-render of the InfiniteMovingCards component
            setRecommendationKey(prev => prev + 1);
          } catch (err) {
            console.error("Error parsing recommendation:", err);
          }
        } catch (err) {
          console.error("Error fetching recommendation:", err);
        } finally {
          setIsLoadingRecommendations(false);
        }
      };
      

      const optimizedTabs = useMemo(() => {
        // Process tabs in chunks to avoid blocking the main thread
        const processTabsInChunks = (
          categories: { id: string; name: string }[], 
          userSkills: UserSKill[], 
          wishlist: WishlistItem[]
          ) => {
          return categories.map(category => ({
            title: category.name,
            value: category.name,
            content: (
              <div className="w-full bg-neutral-950 overflow-hidden relative h-auto rounded-2xl p-8">
                
                {/* Skills Section with Add Button */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Category Expertise</span>
                    <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">Skills</h1>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        console.log('Opening add skill form for category:', category.id);
                        setShowAddSkillForm({set: true, categoryId: category.id});
                      }}
                      className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 hover:border-blue-400 text-white rounded-full p-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
                    >
                      <LucidePlus size={20} />
                    </Button>
                  </motion.div>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
                
                <div className="w-full flex flex-col mb-8">
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const filteredSkills = userSkills.filter(skill => skill.categoryId === category.id);
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
                                        onClick={() => {
                                          setExpandedSkill(skill.id);
                                          setEditingSkill({ 
                                            level: skill.level || "Level 1", 
                                            description: skill.description || "" 
                                          });
                                        }}
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
                                                {skill.level || "Level 1"}</span>
                                              {skill.validatedByManager && (
                                                <span className="text-xs text-emerald-400 mt-1 flex items-center">
                                                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                                                  Validated
                                                </span>
                                              )}
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
                              <p className="text-gray-400 text-lg mb-3">No skills added yet in this category</p>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowAddSkillForm({set: true, categoryId: category.id})}
                                className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                              >
                                Add your first skill
                              </motion.button>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                {/* Future Skills Section - Same layout as Skills section */}
                <div className="flex justify-between items-center relative z-10 mt-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Growth Opportunities</span>
                    <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">Future Skills</h1>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        console.log('Opening wishlist form for category:', category.id);
                        setShowWishlistForm({set: true, categoryId: category.id});
                      }}
                      className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 hover:border-purple-400 text-white rounded-full p-2 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
                    >
                      <LucidePlus size={20} />
                    </Button>
                  </motion.div>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
                
                <div className="w-full flex h-[100%] flex-col">
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const filteredWishlist = wishlist.filter(item => item.categoryId === category.id);
                      if (filteredWishlist.length > 0) {
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="carousel-container h-full relative z-10 py-3"
                          >
                            <Carousel
                              items={filteredWishlist.map((item, idx) => (
                                <Card 
                                  key={item.id}
                                  card={{
                                    title: item.skillName,
                                    category: "Wishlist",
                                    src: "",
                                    content: (
                                      <motion.div
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        onClick={() => {
                                          setExpandedWishlist(item.id);
                                          setEditingWishlistDescription(item.description || "");
                                        }} 
                                      >
                                        <GlowingStarsBackgroundCard
                                          className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-purple-500/20"
                                        >
                                          <div className="flex justify-start">
                                            <GlowingStarsTitle>{item.skillName}</GlowingStarsTitle>
                                          </div>
                                          <div className="flex justify-between items-end">
                                            <div className="flex items-center">
                                              <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                                Future Skill
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
                          <div className="h-32 flex items-center justify-center my-4 bg-neutral-950 relative z-10 mb-72">
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg text-center">
                              <p className="text-gray-400 text-lg mb-3">No future skills added yet in this category</p>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowWishlistForm({set: true, categoryId: category.id})}
                                className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
                              >
                                Add your first future skill
                              </motion.button>
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
        };
        
        return processTabsInChunks(categories, userSkills, wishlist);
  }, [categories, userSkills, wishlist, skillsUpdateCounter, wishlistUpdateCounter]);
      
    
      if(status === 'loading' || isLoading){
        return(
          <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950">
          {/* Animated Background Overlay */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: "radial-gradient(circle at center,rgb(0, 0, 0) 0%, transparent 80%)",
              backgroundSize: "200% 200%",
            }}
          />
    
          {/* Glassmorphic Loading Container */}
          <div className="relative p-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col items-center">
            {/* Spinner Animation */}
            <motion.div
              className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
    
            {/* Loading Text (Fixed easing function) */}
            <motion.p
              className="mt-4 text-lg font-semibold text-white/90 tracking-wide"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} // Fixed this!
            >
              Loading, please wait...
            </motion.p>
          </div>
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
              <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
                {fulltext}
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button 
                onClick={() => document.getElementById('skills-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Skills
              </Button>
              <Button 
                onClick={() => document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Recommendations
              </Button>
              <Button
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                ORG Goals
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
                  <DropdownItem key="profile" className="h-16 gap-2 hover:bg-gray-600 transition rounded-md">
                    <p className="font-semibold text-sm text-gray-300">Signed in as</p>
                    <p className="font-semibold text-sm text-white">{session?.user?.email}</p>
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
          
          {showBackgroundEffects && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <BackgroundBeams />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 ml-4 md:ml-12 mt-20 md:mt-2">
          <AnimatedTestimonials
            testimonials={testimonials.map((t) => ({
              ...t,
              name: t.name ?? "Anonymous", // Provide a default value
            }))}
          />
            <div className="ml-12">
            <RadialGraph userSkills={userSkills} />
            </div>
          </div>
    
          <div className="h-[70rem] [perspective:1000px] flex flex-col max-w-7xl mx-auto w-full items-start justify-start my-10" id="skills-section">
            <Tabs key={`tabs-${skillsUpdateCounter}-${wishlistUpdateCounter}`} tabs={optimizedTabs} />
          </div>

          {showAddSkillForm.set && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-md w-full shadow-2xl overflow-hidden"
              >
                {/* Header with gradient background */}
                <div className="relative bg-neutral-950 p-6">
                  <div 
                    className="absolute top-0 left-0 w-full h-full opacity-40"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "10px 10px"
                    }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">New Skill</div>
                      <h2 className="text-2xl text-white font-bold">
                        {addSkillStep === 1 ? "Skill Details" : "Skill Journey"}
                      </h2>
                    </div>
                    <Button 
                      onClick={() => {
                        setShowAddSkillForm({set: false, categoryId: ''});
                        setAddSkillStep(1); // Reset to first step when closing
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1 transition-all duration-200"
                    >
                      <LucideX size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Content area */}
                <div className="p-6">
                  <div className="relative overflow-hidden" style={{ height: "280px" }}>
                    {/* Step 1: Skill Name and Level */}
                    <motion.div 
                      className="absolute w-full"
                      initial={{ x: addSkillStep === 1 ? 0 : "-100%" }}
                      animate={{ x: addSkillStep === 1 ? 0 : "-100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Skill Name</label>
                          <Input
                            value={newSkill.name}
                            onChange={(e) => setNewSkill({...newSkill, name: e.target.value, categoryId: showAddSkillForm.categoryId})}
                            placeholder="Enter skill name"
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-300">Proficiency Level</label>
                            <span className="text-sm text-blue-400 font-medium">{newSkill.level}</span>
                          </div>
                          
                          <div className="relative">
                            <div className="h-2 bg-gray-700 rounded-full w-full">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: newSkill.level === "Level 1" ? "33%" : 
                                        newSkill.level === "Level 2" ? "66%" : "100%" 
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                              />
                            </div>
                            
                            <div className="flex justify-between mt-2">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setNewSkill({...newSkill, level: "Level 1"})}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  newSkill.level === "Level 1" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                              >
                                1
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setNewSkill({...newSkill, level: "Level 2"})}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  newSkill.level === "Level 2" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                              >
                                2
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setNewSkill({...newSkill, level: "Level 3"})}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  newSkill.level === "Level 3" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                              >
                                3
                              </motion.button>
                            </div>
                          </div>
                        </div>
                        
                        <motion.div className="pt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            onClick={() => {
                              if (newSkill.name.trim()) {
                                setAddSkillStep(2);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                            disabled={!newSkill.name.trim()}
                          >
                            Next
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Step 2: Skill Description */}
                    <motion.div 
                      className="absolute w-full"
                      initial={{ x: addSkillStep === 2 ? 0 : "100%" }}
                      animate={{ x: addSkillStep === 2 ? 0 : "100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Your Skill Journey</label>
                          <div className="relative">
                            <textarea
                              value={newSkill.description}
                              onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                              placeholder="Share your experience and growth with this skill..."
                              className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              rows={6}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                              {newSkill.description?.length || 0}/500
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-2">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              onClick={() => setAddSkillStep(1)}
                              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                            >
                              Back
                            </Button>
                          </motion.div>
                          
                          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              onClick={handleAddSkill}
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                            >
                              Add Skill
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Progress Indicator */}
                <div className="bg-gray-900/50 p-4 border-t border-gray-800">
                  <div className="flex justify-center space-x-2">
                    <div 
                      className={`h-2 w-12 rounded-full ${addSkillStep === 1 ? 'bg-blue-500' : 'bg-gray-600'} transition-colors duration-300`}
                    ></div>
                    <div 
                      className={`h-2 w-12 rounded-full ${addSkillStep === 2 ? 'bg-blue-500' : 'bg-gray-600'} transition-colors duration-300`}
                    ></div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {showWishlistForm.set && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-md w-full shadow-2xl overflow-hidden"
              >
                {/* Header with gradient background */}
                <div className="relative bg-neutral-950 p-6">
                  <div 
                    className="absolute top-0 left-0 w-full h-full opacity-40"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "10px 10px"
                    }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Wishlist</div>
                      <h2 className="text-2xl text-white font-bold">Add Future Skill</h2>
                    </div>
                    <Button 
                      onClick={() => setShowWishlistForm({set: false, categoryId: ''})}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1 transition-all duration-200"
                    >
                      <LucideX size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Content area */}
                <div className="p-6">
                  <form onSubmit={handleAddWishlistItem} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Skill Name</label>
                      <Input
                        value={newWishlistItem}
                        onChange={(e) => setNewWishlistItem(e.target.value)}
                        placeholder="Enter future skill name"
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <div className="relative">
                        <textarea
                          value={newWishlistDescription}
                          onChange={(e) => setNewWishlistDescription(e.target.value)}
                          placeholder="Describe what you want to learn about this skill..."
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          rows={4}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {newWishlistDescription?.length || 0}/500
                        </div>
                      </div>
                    </div>
                    <motion.div className="pt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                        disabled={!newWishlistItem.trim()}
                      >
                        Add Future Skill
                      </Button>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}


        {expandedWishlist && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header with gradient background */}
              <div className="relative bg-neutral-950 p-6">
                <div 
                  className="absolute top-0 left-0 w-full h-full opacity-40"
                  style={{
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "10px 10px"
                  }}
                />
                
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Future Skill</div>
                    <h2 className="text-2xl text-white font-bold">
                      {wishlist.find(w => w.id === expandedWishlist)?.skillName}
                    </h2>
                  </div>
                  <Button 
                    onClick={() => setExpandedWishlist(null)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1 transition-all duration-200"
                  >
                    <LucideX size={16} />
                  </Button>
                </div>
              </div>
              
              {/* Content area */}
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skill Description</label>
                  <div className="relative">
                    <textarea
                      value={editingWishlistDescription}
                      onChange={(e) => setEditingWishlistDescription(e.target.value)}
                      placeholder="Describe what you want to learn about this skill..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={4}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {editingWishlistDescription?.length || 0}/500
                    </div>
                  </div>
                </div>
                
                {/* Action buttons with animations */}
                <div className="flex space-x-3 pt-2">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => handleUpdateWishlist(expandedWishlist!, editingWishlistDescription)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                    >
                      Save Changes
                    </Button>
                  </motion.div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => {
                        const wishlistItem = wishlist.find(w => w.id === expandedWishlist);
                        if (wishlistItem) {
                          router.push(`/roadmap?skillName=${wishlistItem.skillName}`);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                    >
                      View Roadmap
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => {
                        const wishlistItem = wishlist.find(w => w.id === expandedWishlist);
                        if (wishlistItem) {
                          handleAddSkillfromWishlist({
                            name: wishlistItem.skillName, 
                            categoryId: wishlistItem.categoryId,
                            description: editingWishlistDescription
                          });
                          handleDeleteWishlist(expandedWishlist);
                          setExpandedWishlist(null);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                    >
                      Add to Skills
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              {/* Footer with remove button */}
              <div className="bg-gray-900/50 p-4 border-t border-gray-800">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => {
                      handleDeleteWishlist(expandedWishlist);
                      setExpandedWishlist(null);
                    }}
                    className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-medium py-2 rounded-lg transition-all duration-200"
                  >
                    Remove from Wishlist
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
          
          {expandedSkill && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-md w-full shadow-2xl overflow-hidden"
              >
                {/* Header with gradient background */}
                <div className="relative bg-neutral-950 p-6">
                  <div 
                    className="absolute top-0 left-0 w-full h-full opacity-40"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "10px 10px"
                    }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Professional Skill</div>
                      <h2 className="text-2xl text-white font-bold">
                        {userSkills.find(s => s.id === expandedSkill)?.skill.name}
                      </h2>
                    </div>
                    <Button 
                      onClick={() => setExpandedSkill(null)}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1 transition-all duration-200"
                    >
                      <LucideX size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Content area */}
                <div className="p-6">
                  {/* Skill level with visual indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">Proficiency Level</label>
                      <span className="text-sm text-blue-400 font-medium">{editingSkill.level}</span>
                    </div>
                    
                    <div className="relative">
                      <div className="h-2 bg-gray-700 rounded-full w-full">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: editingSkill.level === "Level 1" ? "33%" : 
                                  editingSkill.level === "Level 2" ? "66%" : "100%" 
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        />
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingSkill({...editingSkill, level: "Level 1"})}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            editingSkill.level === "Level 1" 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          1
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingSkill({...editingSkill, level: "Level 2"})}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            editingSkill.level === "Level 2" 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          2
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingSkill({...editingSkill, level: "Level 3"})}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            editingSkill.level === "Level 3" 
                              ? "bg-blue-500 text-white" 
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          3
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skill journey */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Skill Journey</label>
                    <div className="relative">
                      <textarea
                        value={editingSkill.description}
                        onChange={(e) => setEditingSkill({...editingSkill, description: e.target.value})}
                        placeholder="Share your experience and growth with this skill..."
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-3 text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        rows={4}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {editingSkill.description?.length || 0}/500
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons with animations */}
                  <div className="flex space-x-3 pt-2">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={() => handleUpdateSkill(expandedSkill!, editingSkill.level, editingSkill.description)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-200"
                      >
                        Save Changes
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={() => {
                          handleDeleteSkill(expandedSkill);
                          setExpandedSkill(null);
                        }}
                        className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        Remove
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Footer with achievement badge */}
                <div className="bg-gray-900/50 p-4 border-t border-gray-800">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 15l-2 5l9-9l-9-9l2 5l-9 9l9-9"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Skill Validation</p>
                      <p className="text-sm text-white font-medium">
                        {userSkills.find(s => s.id === expandedSkill)?.validatedByManager 
                          ? "Validated by management" 
                          : "Pending validation"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left section - Quote */}
            <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {/* Left Quote - Normal */}
              <Quote className="text-blue-400 absolute -left-12 -top-8 scale-x-[-1]" size={48} />
              
              <h2 className="text-xl md:text-3xl font-bold text-white mb-4 px-4">
                Success is the sum of small efforts, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;repeated day-in and day-out.
              </h2>

              {/* Right Quote - Mirrored Horizontally & Rotated */}
              <Quote className="text-blue-400 absolute -right-1 -bottom-4" size={48} />
            </div>
            <p className="text-lg md:text-xl text-blue-300 italic mt-4">— Robert Collier</p>
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

          <div className="max-w-7xl mx-auto mt-16 mb-12" id="recommendations-section">
            <div className="flex flex-col items-center">
              <h2 className="relative z-10 text-md md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono">
                Recommended Skills
              </h2>
              
              <div className="w-full flex justify-end mb-4">
                <Button
                  onClick={fetchRecommendation}
                  className="border border-blue-500 text-white px-4 py-2 rounded-lg"
                  disabled={isLoadingRecommendations}
                >
                  {isLoadingRecommendations ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    Object.keys(recommendation.skills).length > 0 ? "Refresh Recommendations" : "Generate Recommendations"
                  )}
                </Button>
              </div>
              
              {Object.keys(recommendation.skills).length > 0 ? (
                <div className="w-full">
                  <InfiniteMovingCards
                    key={recommendationKey} // Add a key to force re-render
                    items={Object.entries(recommendation.skills).map(([skill, summary]) => ({
                      quote: summary,
                      name: skill,
                      title: "Recommended Skill"
                    }))}
                    direction="left"
                    speed="slow"
                    pauseOnHover={true}
                    className="py-4"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#2c3e50] to-[#0a66c2] backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-w-2xl w-full shadow-xl">
                  <p className="text-white text-center text-lg">
                    No recommendations yet. Click Generate Recommendations to discover skills that complement your profile.
                  </p>
                </div>
              )}
            </div>
          </div>
    
        </div>
      ) 
    }