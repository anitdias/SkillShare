'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { signOut } from "next-auth/react";
import { LucideUser, LucideMail } from 'lucide-react';
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import RadialGraph from "@/components/ui/radialGraph";


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
    ]  
 
    const {data: session, status} = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchedUserId, setSearchedUserId] = useState<string | null>();
    const [searchedUsername, setSearchedUsername] = useState<string | null>();
    const [searchedUserSkills, setSearchedUserSkills] = useState<SearchedUserSKill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
    const [searchedUserInfo, setSearchedUserInfo] = useState({ email: '', image: null });
    const [selectedCategory, setSelectedCategory] = useState(categories[0].id);


    useEffect(() => {
        setSearchedUserId('')
        setSearchedUserId(searchParams.get('userid'))
        setSearchedUsername(searchParams.get('username'))
    
    },[searchParams])

    

    const fulltext = "<Skill Share/>";
    
    useEffect(() => {
        if (status=='unauthenticated'){
            router.push('/login');
        }else if(status == 'authenticated'){
        }
    }, [status,router])

    useEffect(() => {
        // Reset searchedUserSkills when searchedUserId changes
        setSearchedUserSkills([]);
    
        if (searchedUserId) {
          fetchUserData();
        }
      }, [searchedUserId]); 


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
            setSearchedUserInfo({ email, image }); // Assuming you have state for this
          }
        } catch (error) {
          console.error('Error while fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }, [searchedUserId]);
      

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

    const categorySkills = searchedUserSkills.filter(
      (us) => us.categoryId === selectedCategory
    );

    

    if(status === 'loading' || isLoading){
        return(
          <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#222222] via-[#333333] to-[#444444]">
          {/* Animated Background Overlay */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: "radial-gradient(circle at center, #3b3b3b 0%, transparent 80%)",
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
        <div className="min-h-screen bg-gradient-to-b from-[#222222] via-[#333333] to-[#444444] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
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
        <div className="text-sm mr-2 sm:flex flex-grow text-md items-center justify-center relative">
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleInputChange}
              className="w-full max-w-md p-2 bg-[#636363] border-gray-300 border-2 rounded-md shadow-sm focus:outline-none text-white"
            />
            
            {searchUsers.length > 0 && query && (
              <div className="absolute top-10 w-full max-w-md bg-[#636363] border-gray-300 border-2 rounded-md shadow-lg z-30">
                {searchUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                    onClick={() => {
                      router.push(`/publicProfile?userid=${user.id}&username=${user.name}`);
                      setQuery(""); // Clear the search input
                      setSearchUsers([]); // Clear the search results
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

        {/* Sidebar */}
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

        <div className="mt-14 sm:flex flex-col md:flex-row gap-6 mt-12">
                  {/* Profile Card - Takes 2/3rd of the width */}
                  <Card className="w-full bg-[#3b3b3b] rounded-2xl shadow-lg overflow-hidden border border-[#3b3b3b]">
                    {/* Cover Photo */}
                    <div className="relative h-32 bg-gray-300">
                      <img
                        src="https://plus.unsplash.com/premium_photo-1661872817492-fd0c30404d74?q=80&w=1487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                    </div>
        
                    {/* Profile Picture - Moved to the left and overlapping background */}
                    <div className="relative">
                      <div className="absolute -top-10 left-6">
                        <Image
                          src={searchedUserInfo.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                          alt="Profile"
                          width={140}
                          height={140}
                          className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full shadow-md"
                        />
                      </div>
                    </div>
        
                    {/* User Info */}
                    <div className="text-center px-4 pb-4 mt-10">
                      <h2 className="font-bold font-mono text-2xl text-white">{searchedUsername}</h2>
                      <p className="text-sm text-white">{searchedUserInfo.email}</p>
                      <p className="text-sm text-white mt-2">
                        Passionate about building scalable web applications and mentoring
                        developers.
                      </p>
        
                      {/* Buttons */}
                      <div className="mt-4 flex justify-center gap-2">
                        <button className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                          Connect
                        </button>
                        <button className="border border-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                          Message
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>

        {/* Skills Grid */}
        <div className="mt-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-600">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-1 text-center text-white py-2 font-medium transition-all text-sm sm:text-base ${
                  selectedCategory === category.id
                    ? "border-b-4 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Skills List & Overview */}
            <div className="mt-4 flex flex-col md:flex-row gap-6 px-2">
              {/* Skills List */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between space-x-2">
                  <h3 className="font-bold font-mono text-2xl text-white">Skills</h3>

                </div>
                <hr className="text-gray-600" />
                {categorySkills.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {categorySkills.map((userSkill) => (
                      <div
                        key={userSkill.id}
                        className="flex items-center bg-[#2d2d2d] px-3 py-2 rounded-xl shadow-md transition-all hover:bg-[#1a1a1a]"
                      >
                        <span className="text-white text-md whitespace-nowrap">{userSkill.skill.name}</span>
                        <div className="flex items-center ml-2">
                          {userSkill.validatedByManager && (
                            <span className="text-green-500 text-xs font-medium">✔</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center">No skills added yet.</p>
                )}
              </div>
  
              {/* Skill Overview Card */}
              <Card className="w-full md:w-1/2 p-4 bg-[#3b3b3b] rounded-2xl shadow-lg border border-[#3b3b3b] flex flex-col items-center">
                <h3 className="text-white text-lg font-bold font-mono mb-4">Skills Overview</h3>
                <RadialGraph userSkills={searchedUserSkills} />
              </Card>
            </div>
          </div>
      </div>
    </div>
  ) 
}