"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import {
    DropdownItem,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    Avatar,
  } from "@heroui/react";
  import { signOut } from "next-auth/react";
  import { Search } from "lucide-react";
  import { useRouter } from "next/navigation";

interface OrgNode {
  id: string;
  employeeNo: string;
  name: string;
  position?: string;
  children: OrgNode[];
}

interface SearchUser {
  id: string;
  name: string;
}

const TreeNode = ({ node, level = 0 }: { node: OrgNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const bgOpacity = Math.max(0.2, 1 - level * 0.15); // Gradually reduce opacity for deeper levels

  return (
    <div className="mb-3">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: level * 0.1 }}
      >
        <Card 
          className={`p-4 border border-[#3b3b3b] bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300`}
        >
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ 
                background: `linear-gradient(135deg, rgba(100,100,100,${bgOpacity}) 0%, rgba(30,30,30,${bgOpacity}) 100%)` 
              }}
            >
              <span className="text-white font-medium">{node.name.charAt(0)}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-medium">{node.name}</h3>
              <div className="flex items-center">
                <span className="text-gray-400 text-xs mr-2">{node.employeeNo}</span>
                {node.position && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                    {node.position}
                  </span>
                )}
              </div>
            </div>
            
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </button>
            )}
          </div>
        </Card>
      </motion.div>

      {hasChildren && isExpanded && (
        <div className="ml-6 pl-6 border-l border-[#3b3b3b] mt-2">
          <AnimatePresence>
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default function OrganizationPage() {
  const { data: session, status } = useSession();
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);

  const fulltext = "<SkillShare/>";

  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        const response = await fetch("/api/org-chart");
        if (!response.ok) throw new Error("Failed to fetch org chart");
        const data = await response.json();
        setOrgData(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchOrgChart();
    }
  }, [status]);

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

  return (
    <div className="min-h-screen bg-neutral-950 relative">
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
                        <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                          Log Out
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </nav>
      {/* Background effects */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleColor="#FFFFFF"
          particleDensity={100}
          speed={1}
          className="w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto py-12 px-4 mt-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Organization Structure</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore our companys hierarchical structure and team organization
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : orgData ? (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-[#3b3b3b]">
              <TreeNode node={orgData} />
            </div>
          ) : (
            <div className="text-center py-12 bg-black/30 backdrop-blur-sm rounded-xl border border-[#3b3b3b]">
              <Users size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Organization Data</h3>
              <p className="text-gray-400">
                The organization chart hasnt been uploaded yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}