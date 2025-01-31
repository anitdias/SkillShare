'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { LucidePlus, LucideX, LucideUser, LucideMail } from 'lucide-react';
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


interface Skill {
    id: string;
    name: string;
    categoryId: string;
}

interface User {
    id: string;
    name: string;
}

interface SearchedUserSKill {
    id: string;
    skillId: string;
    categoryId: string;
    skill: Skill;
    validatedByManager: boolean;
}


export default function ProfilePage() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchedUserId, setSearchedUserId] = useState<string | null>();
    const [searchedUsername, setSearchedUsername] = useState<string | null>();
    const [searchedUserSkills, setSearchedUserSkills] = useState<SearchedUserSKill[]>([]);
    const [showViewMore, setShowViewMore] = useState({set:false, categoryId: ''});
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setSearchedUserId('')
        setSearchedUserId(searchParams.get('userid'))
        setSearchedUsername(searchParams.get('username'))
    
    },[searchParams])

    const categories = [
        {id: '1', name: 'Professional & Technical'},
        {id: '2', name: 'Creative'},
        { id: '3', name: 'Life & Physical' },
        { id: '4', name: 'Social & Interpersonal' },
    ]

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
            const skills = await skillRes.json();
            setSearchedUserSkills(skills);
          }
        } catch (error) {
          console.error('Error while fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }, [searchedUserId]);

    

      if(status === 'loading' || isLoading){
        return(
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
      }

      

      return(
        <div className="min-h-screen bg-gray-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
      {/* navBar */}
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

        {/* Sidebar */}
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

        <div>
          <Card className="bg-white text-gray-600 p-3 mt-12 font-bold text-lg shadow-lg border-white">
            {searchedUsername}
          </Card>
        </div>

        {/* Skills Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const categorySkills = searchedUserSkills.filter(
              (us) => us.categoryId === category.id
            );
            // if (categorySkills.length === 0) return null;

            return (
              <Card
                key={category.id}
                className="p-5 bg-white h-[300px] md:h-[290px] flex flex-col justify-between shadow-lg rounded-xl hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex item-center justify-start space-x-2">
                <h2 className="text-2xl font-bold font-mono mb-3 text-gray-600 text-center shadow-md rounded-lg p-1 w-[525px]">
                  {category.name}
                </h2>
                </div>
                <div className="space-y-2 flex-1 overflow-auto">
                  {categorySkills.slice(0,3).map((userSkill) => (
                    <div
                      key={userSkill.id}
                      className="flex items-center justify-between bg-gray-200 p-2 rounded-xl text-gray-600 hover:bg-gray-300"
                    >
                      <span className="text-md">&nbsp;{userSkill.skill.name}</span>
                      {userSkill.validatedByManager && (
                        <span className="text-green-600 text-base">Validated</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                <Button
                  onClick={() => setShowViewMore({set: true, categoryId: category.id})}
                  className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892] w-[200px]"
                >
                  View More
                </Button>
                </div>
              </Card>
            );
          })}
        </div>


          {/* view more skill */}
          {showViewMore.set && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-30">
            <Card className="relative p-4 bg-white w-[650px] h-[650px] flex flex-col justify-baseline rounded-lg shadow-lg">
              <Button
                variant="ghost"
                className="absolute top-2 right-1 text-gray-600 hover:text-gray-800"
                onClick={() => setShowViewMore({set: false, categoryId: ''})} // Close the form
              >
                <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
              </Button>
              <h2 className="text-xl font-semibold font-mono mb-4 text-gray-600">Skills</h2>
              <div className="space-y-2 overflow-auto">
                {searchedUserSkills
                .filter((item) =>  item.categoryId === showViewMore.categoryId)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-200 p-2 rounded-xl text-gray-600 text-md hover:bg-gray-300"
                  >
                    <span>&nbsp;{item.skill.name}</span>
                  </div>
                ))}
              </div>
            </Card>
            </div>
            )}

          

    </div>

    </div>

        ) 





      
}