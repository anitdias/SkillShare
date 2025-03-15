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
import { GlowingStarsBackgroundCard, GlowingStarsTitle, GlowingStarsDescription } from "@/components/ui/glowing-stars";
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
  
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedWishlist, setExpandedWishlist] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<{ level: string; description: string }>({ level: '', description: '' });
  const [editingWishlistDescription, setEditingWishlistDescription] = useState('');

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
      if(e) {
        e.preventDefault();
      }
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
              <div className="w-full bg-neutral-950 shadow-xl overflow-hidden relative h-auto rounded-2xl p-10 ">
                {/* Skills Section with Add Button */}
                <div className="flex justify-between items-center">
                  <h1 className="relative z-10 text-md md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono">Skills</h1>
                  <Button 
                    onClick={() => {
                      console.log('Opening add skill form for category:', category.id);
                      setShowAddSkillForm({set: true, categoryId: category.id});
                    }}
                    className="border border-blue-500 hover:bg-gray-800 text-white rounded-full p-2 mt-10 transition duration-300 ease-in-out"
                  >
                    <LucidePlus size={20} />
                  </Button>
                </div>
                <hr className="text-gray-600 mt-2"/>
                <div className="w-full flex flex-col mb-5">
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const filteredSkills = userSkills.filter(skill => skill.categoryId === category.id);
                      if (filteredSkills.length > 0) {
                        return (
                          <div className="carousel-container h-full">
                            <Carousel
                            items={filteredSkills.map((skill, idx) => (
                              <Card 
                                key={skill.id}
                                card={{
                                  title: skill.skill.name,
                                  category: skill.level || "Level 1",
                                  src: "", 
                                  content: (
                                    <GlowingStarsBackgroundCard
                                      className="cursor-pointer hover:scale-105 transition-transform"
                                    >
                                      <div className="flex justify-start">
                                        <GlowingStarsTitle>{skill.skill.name}</GlowingStarsTitle>
                                      </div>
                                      <div className="flex justify-between items-end">
                                        <GlowingStarsDescription>{skill.level || "Level 1"}</GlowingStarsDescription>
                                        <div onClick={() => {
                                        setExpandedSkill(skill.id);
                                        setEditingSkill({ 
                                          level: skill.level || "Level 1", 
                                          description: skill.description || "" 
                                        });
                                      }} className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.1)] flex items-center justify-center">
                                          <Icon />
                                        </div>
                                      </div>                          
                                    </GlowingStarsBackgroundCard>
                                  )
                                }}
                                index={idx}
                                layout={false}
                              />
                            ))}
                            initialScroll={0}
                          />
                          </div>
                        );
                      } else {
                        return (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-white text-lg">No skills added yet in this category</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                {/* Future Skills Section - Same layout as Skills section */}
                <div className="flex justify-between items-center">
                  <h1 className="relative z-10 text-md md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mt-10">Future Skills</h1>
                  <Button 
                    onClick={() => {
                      console.log('Opening wishlist form for category:', category.id);
                      setShowWishlistForm({set: true, categoryId: category.id});
                    }}
                    className="border border-blue-500 hover:bg-gray-800 text-white rounded-full p-2 mt-10 transition duration-300 ease-in-out"
                  >
                    <LucidePlus size={20} />
                  </Button>
                </div>
                <hr className="text-gray-600 mt-2"/>
                <div className="w-full flex h-[100%] flex-col">
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const filteredWishlist = wishlist.filter(item => item.categoryId === category.id);
                      if (filteredWishlist.length > 0) {
                        return (
                          <div className="carousel-container h-full relative z-10">
                            <Carousel
                              items={filteredWishlist.map((item, idx) => (
                                <Card 
                                  key={item.id}
                                  card={{
                                    title: item.skillName,
                                    category: "Wishlist",
                                    src: "",
                                    content: (
                                      <GlowingStarsBackgroundCard
                                        className="cursor-pointer hover:scale-105 transition-transform"
                                      >
                                        <div className="flex justify-start">
                                          <GlowingStarsTitle>{item.skillName}</GlowingStarsTitle>
                                        </div>
                                        <div className="flex justify-between items-end">
                                          <GlowingStarsDescription>Future Skill</GlowingStarsDescription>
                                          <div onClick={() => {
                                          setExpandedWishlist(item.id);
                                          setEditingWishlistDescription(item.description || "");
                                        }} className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.1)] flex items-center justify-center">
                                            <Icon />
                                          </div>
                                        </div>                          
                                      </GlowingStarsBackgroundCard>
                                    )
                                  }}
                                  index={idx}
                                  layout={false}
                                />
                              ))}
                              initialScroll={0}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="h-full flex items-center justify-center bg-neutral-950 relative z-10 mb-72">
                            <p className="text-white text-lg">No future skills added yet in this category </p>
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
      }, [categories, userSkills, wishlist]);
      
    
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
            <div className="ml-12 mt-5">
            <RadialGraph userSkills={userSkills} />
            </div>
          </div>
    
          <div className="h-[70rem] [perspective:1000px] flex flex-col max-w-7xl mx-auto w-full  items-start justify-start my-10">
            <Tabs tabs={optimizedTabs} />
          </div>

          {showAddSkillForm.set && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl text-white font-semibold">Add Skill</h2>
                  <Button 
                    onClick={() => setShowAddSkillForm({set: false, categoryId: ''})}
                    className="bg-transparent hover:bg-gray-700 text-white rounded-full p-1"
                  >
                    <LucideX size={16} />
                  </Button>
                </div>
                <form onSubmit={handleAddSkill} className="space-y-4">
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Skill Name</label>
                      <Input
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({...newSkill, name: e.target.value, categoryId: showAddSkillForm.categoryId})}
                        placeholder="Enter skill name"
                        className="w-full bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                      <select
                        value={newSkill.level}
                        onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                        required
                      >
                        <option value="Level 1">Level 1</option>
                        <option value="Level 2">Level 2</option>
                        <option value="Level 3">Level 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        value={newSkill.description}
                        onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                        placeholder="Enter skill description"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                        rows={3}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      Add Skill
                    </Button>
                </form>
              </div>
            </div>
          )}

          {showWishlistForm.set && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl text-white font-semibold">Add Future Skill</h2>
                  <Button 
                    onClick={() => setShowWishlistForm({set: false, categoryId: ''})}
                    className="bg-transparent hover:bg-gray-700 text-white rounded-full p-1"
                  >
                    <LucideX size={16} />
                  </Button>
                </div>
                <form onSubmit={handleAddWishlistItem} className="space-y-4">
                <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Skill Name</label>
                      <Input
                        value={newWishlistItem}
                        onChange={(e) => setNewWishlistItem(e.target.value)}
                        placeholder="Enter future skill name"
                        className="w-full bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        value={newWishlistDescription}
                        onChange={(e) => setNewWishlistDescription(e.target.value)}
                        placeholder="Enter skill description"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                        rows={3}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      Add Future Skill
                    </Button>
                </form>
              </div>
            </div>
          )}


        {expandedWishlist && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-[#2c3e50] to-[#0a66c2] backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-white font-semibold">
                  {wishlist.find(w => w.id === expandedWishlist)?.skillName}
                </h2>
                <Button 
                  onClick={() => setExpandedWishlist(null)}
                  className="bg-transparent hover:bg-gray-700 text-white rounded-full p-1"
                >
                  <LucideX size={16} />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingWishlistDescription}
                    onChange={(e) => setEditingWishlistDescription(e.target.value)}
                    placeholder="Enter skill description"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col space-y-2 pt-2">
                <Button 
                  onClick={() => handleUpdateWishlist(expandedWishlist!, editingWishlistDescription)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Save Changes
                </Button>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        const wishlistItem = wishlist.find(w => w.id === expandedWishlist);
                        if (wishlistItem) {
                          router.push(`/roadmap?skillName=${wishlistItem.skillName}`);
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      Roadmap
                    </Button>
                    <Button 
                      onClick={() => {
                        const wishlistItem = wishlist.find(w => w.id === expandedWishlist);
                        if (wishlistItem) {
                          handleAddSkillfromWishlist({
                            name: wishlistItem.skillName, 
                            categoryId: wishlistItem.categoryId,
                            description: editingWishlistDescription // Pass the current edited description
                          });
                          handleDeleteWishlist(expandedWishlist);
                          setExpandedWishlist(null);
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                    >
                      Add to Skills
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      handleDeleteWishlist(expandedWishlist);
                      setExpandedWishlist(null);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
          
          {expandedSkill && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-neutral-950 backdrop-blur-sm rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl text-white font-semibold">
                    {userSkills.find(s => s.id === expandedSkill)?.skill.name}
                  </h2>
                  <Button 
                    onClick={() => setExpandedSkill(null)}
                    className="bg-transparent hover:bg-gray-700 text-white rounded-full p-1"
                  >
                    <LucideX size={16} />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                    <select
                      value={editingSkill.level}
                      onChange={(e) => setEditingSkill({...editingSkill, level: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    >
                      <option value="Level 1">Level 1</option>
                      <option value="Level 2">Level 2</option>
                      <option value="Level 3">Level 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={editingSkill.description}
                      onChange={(e) => setEditingSkill({...editingSkill, description: e.target.value})}
                      placeholder="Enter skill description/ Your Skill Journey"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                  <Button 
                    onClick={() => handleUpdateSkill(expandedSkill!, editingSkill.level, editingSkill.description)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Save Changes
                  </Button>
                    <Button 
                      onClick={() => {
                        handleDeleteSkill(expandedSkill);
                        setExpandedSkill(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
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

          <div className="max-w-7xl mx-auto mt-16 mb-12">
            <div className="flex flex-col items-center">
              <h2 className="relative z-10 text-md md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mt-10">
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