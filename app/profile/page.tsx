'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { LucidePlus, LucideX, LucideUser, LucideMail } from 'lucide-react';
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RadialGraph from "@/components/ui/radialGraph";
import Image from "next/image";


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
}

interface WishlistItem {
    id: string;
    skillName: string;
    categoryId: string;
}

interface SearchUser {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const categories = [
    {id: '1', name: 'Professional & Technical'},
    {id: '2', name: 'Creative'},
    {id: '3', name: 'Life & Physical' },
    {id: '4', name: 'Social & Interpersonal' },
]
    const {data: session, status} = useSession();
    const router = useRouter();
    const [userSkills, setUserSkills] = useState<UserSKill[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [showAddSkillForm, setShowAddSkillForm] = useState({set:false, categoryId: ''});
    const [showWishlistForm, setShowWishlistForm] = useState({set:false, categoryId: ''});
    const [newSkill, setNewSkill] = useState({ name: '', categoryId: '' });
    const [newWishlistItem, setNewWishlistItem] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchUsers, setSearchUsers] = useState<SearchUser[]>([])
    const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
    const [recommendation, setRecommendation] = useState<{ skills: string[]; summary: string }>({
      skills: [],
      summary: "",
    });
    

    const categorySkills = userSkills.filter(
      (us) => us.categoryId === selectedCategory
    );
    

    const fulltext = "<Skill Share/>";
    
    useEffect(() => {
        if (status=='unauthenticated'){
            router.push('/login');
        }else if(status == 'authenticated'){
            fetchUserData();
        }
    }, [status,router])

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
                                : { skills: [], summary: "" };
          setRecommendation(recommendation); // Set recommendation
          setWishlist(wishlist);
        }
      } catch (error) {
        console.error("Error while fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    

    const handleAddSkill = async (e?:React.FormEvent) => {
      if(e){
        e.preventDefault();}
        try{
            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSkill),
              });
        
              if (response.ok) {
                const skill = await response.json();
                setUserSkills([...userSkills, skill]);
                setNewSkill({ name: '', categoryId: '' });
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
            body: JSON.stringify({ skillName: newWishlistItem, categoryId: showWishlistForm.categoryId }),
          });
    
          if (response.ok) {
            const item = await response.json();
            setWishlist([...wishlist, item]);
            setNewWishlistItem('');
          }
        } catch (error) {
          console.error('Error adding wishlist item:', error);
        }
      };

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

      const handleAddSkillfromWishlist = async ({ name, categoryId }: { name: string; categoryId: string }) => {
          try{
              const response = await fetch('/api/skills', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: name, categoryId: categoryId }),
                });
          
                if (response.ok) {
                  const skill = await response.json();
                  setUserSkills([...userSkills, skill]);
                  setNewSkill({ name: '', categoryId: '' });
                }
              } catch (error) {
                console.error('Error adding skill:', error);
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
          const recommendation = data.recommendation
                                ? JSON.parse(data.recommendation)
                                : { skills: [], summary: "" };
          setRecommendation(recommendation);
        } catch (err) {
          console.error("Error fetching recommendation:", err);
        }
      };
      
    
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
        <div className="min-h-screen bg-gradient-to-br from-[#222222] via-[#333333] to-[#444444] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
      {/* navBar */}
      <nav className="h-16 bg-[#3b3b3b] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
          {/* Left Section - Sidebar & Title */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white"
            >
              {isSidebarOpen ? (
                <X className="text-white hover:bg-gray-200 rounded-full" size={24} />
              ) : (
                <Menu className="text-white" size={24} />
              )}
            </Button>

            {/* Title */}
            <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-[#636363] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
              {fulltext}
            </h1>
          </div>

          {/* Center Section - Search Bar */}
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


          {/* Right Section - Sign Out Button */}
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-[#636363] hover:bg-[#222222] text-sm sm:text-md px-3 py-1 sm:px-4 sm:py-2 rounded-lg shadow-md"
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
                  <RadialGraph userSkills={userSkills} />

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
          {/* Profile Card*/}
          <Card className="w-full bg-[#3b3b3b] rounded-2xl shadow-lg overflow-hidden border border-[#3b3b3b]">
            {/* Cover Photo */}
            <div className="relative h-32 bg-gray-300">
              <img
                src="https://plus.unsplash.com/premium_photo-1661872817492-fd0c30404d74?q=80&w=1487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Picture*/}
            <div className="relative">
              <div className="absolute -top-10 left-6">
                <Image
                  src={session?.user?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                  alt="Profile"
                  width={140}
                  height={140}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full shadow-md"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="text-center px-4 pb-4 mt-10">
              <h2 className="font-bold font-mono text-2xl text-white">{session?.user?.name}</h2>
              <p className="text-sm text-white">{session?.user?.email}</p>
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


        {/* Add Skill Form */}
        {showAddSkillForm.set && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-30">
            <Card className="relative p-3 bg-[#3b3b3b] border-[#3b3b3b] w-[400px] h-[200px] flex flex-col justify-center items-center rounded-lg shadow-lg">
              {/* Close Button */}
              <Button
                variant="ghost"
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowAddSkillForm({set: false, categoryId: ''})} // Close the form
              >
                <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
              </Button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSkill();
                  setShowAddSkillForm({ set: false, categoryId: "" }); // Close the form after submission
                }}
                className="space-y-4 w-full"
              >
                <div className="flex flex-col gap-4 w-full">
                <h2 className="font-bold font-mono text-2xl text-white ml-2">Add your Skill</h2>
                  <Input
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({name: e.target.value, categoryId: showAddSkillForm.categoryId })}
                    className="flex-1 border-2 border-gray-300 text-white"
                    required
                  />
                  <Button type="submit" className="bg-[#636363] hover:bg-[#222222] w-full">
                    Add Skill
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

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
                <Button
                  onClick={() => setShowAddSkillForm({ set: true, categoryId: selectedCategory })}
                  className="bg-[#2d2d2d] hover:bg-gray-700 w-[50px] h-[38px]"
                >
                  <LucidePlus className="h-4 w-4" />
                </Button>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-500 ml-2"
                          onClick={() => handleDeleteSkill(userSkill.id)}
                        >
                          <LucideX className="h-4 w-4" />
                        </Button>
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
              <RadialGraph userSkills={userSkills} />
            </Card>
          </div>
        </div>




        {/* Future Skills Section */}
        <div className="mt-6 space-y-3 px-2">
        <div className="mt-4 flex flex-col md:flex-row gap-6 px-2">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="font-bold font-mono text-2xl text-white">Future Skills</h3>
              <Button
                onClick={() => setShowWishlistForm({ set: true, categoryId: selectedCategory })}
                className="bg-[#2d2d2d] hover:bg-gray-700 w-[50px] h-[38px]"
              >
                <LucidePlus className="h-4 w-4" />
              </Button>
            </div>
            <hr className="text-gray-600"/>

            {wishlist.length > 0 ? (
              wishlist
              .filter((item) =>  item.categoryId === selectedCategory)
              .map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between bg-[#2d2d2d] p-3 rounded-xl shadow-md transition-all hover:bg-[#1a1a1a]"
                >
                  <span className="text-white text-md mr-1">{skill.skillName}</span>
                  <div className="flex justify-between space-x-2">
                    <Button className="bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white" onClick={() => {
                        router.push(`/roadmap?skillName=${skill.skillName}`)
                      }}>
                      Roadmap
                    </Button>
                    <Button className="text-white bg-[#2d2d2d] hover:bg-[#1a1a1a]" onClick={() =>{
                      handleAddSkillfromWishlist({name: skill.skillName, categoryId: selectedCategory});
                      handleDeleteWishlist(skill.id);
                    }}>
                    Add to Skills
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteWishlist(skill.id)}
                    >
                      <LucideX className="h-4 w-4 text-gray-400 hover:text-red-500 rounded-full" />
                    </Button>
                    </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No future skills added yet.</p>
            )}
          </div>
          <Card className="w-full md:w-1/2 p-4 bg-[#3b3b3b] rounded-2xl shadow-lg border border-[#3b3b3b] flex flex-col items-center relative">
            {/* Title */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between">
              <h3 className="text-white text-xl font-bold font-mono text-center sm:w-full ml-0">
                Recommendations
              </h3>

              {/* Generate Button */}
              <Button
                onClick={fetchRecommendation}
                className="border-2 border-[#2d2d2d] hover:bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-md mt-2 sm:sm:absolute sm:top-0 sm:right-0 m-2"
              >
                {recommendation.skills.length > 0 ? "Re-Generate" : "Generate"}
              </Button>
            </div>

            
            {/* Recommendations List */}
            <div className="mt-4 w-full px-4">
              {recommendation.skills.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-[#2d2d2d] px-4 py-2 rounded-lg shadow-md text-white text-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <hr className="mt-4 border-gray-600" />
                  <p className="text-white mt-4 text-sm leading-relaxed">{recommendation.summary}</p>
                </div>
              ) : (
                <div className="text-center bg-[#2d2d2d] p-4 rounded-xl shadow-md border border-[#3b3b3b]">
                  <p className="text-gray-400 text-md">No recommendations yet. Click Generate to get started.</p>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>




          {/* Wishlist */}
          {showWishlistForm.set && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-30">
          <Card className="relative p-4 bg-[#3b3b3b] border-[#3b3b3b] w-[650px] h-[500px] flex flex-col justify-baseline rounded-lg shadow-lg">
            <Button
              variant="ghost"
              className="absolute top-2 right-1 text-gray-600 hover:bg-gray-200 rounded-full"
              onClick={() => setShowWishlistForm({set: false, categoryId: ''})} // Close the form
            >
              <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
            </Button>
            <h2 className="text-xl font-semibold font-mono mb-4 text-white">Future Skills</h2>
            <form onSubmit={handleAddWishlistItem} className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill you want to learn"
                  value={newWishlistItem}
                  onChange={(e) => setNewWishlistItem(e.target.value)}
                  className="flex-1 border-2 border-gray-300 text-white"
                />
                <Button type="submit" className="bg-[#636363] hover:bg-[#222222]">
                  Add
                </Button>
              </div>
            </form>
            <div className="space-y-2 overflow-auto">
              {wishlist
              .filter((item) =>  item.categoryId === showWishlistForm.categoryId)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-[#2d2d2d] hover:bg-[#1a1a1a] p-1 rounded-xl text-white text-sm"
                >
                  <span>&nbsp;{item.skillName}</span>
                  <div className="flex justify-between space-x-2">
                  <Button className="bg-[#222222] hover:bg-[#636363] text-white" onClick={() => {
                      router.push(`/roadmap?skillName=${item.skillName}`)
                    }}>
                    Roadmap
                  </Button>
                  <Button className="text-white bg-[#222222] hover:bg-[#636363]" onClick={() =>{
                    handleAddSkillfromWishlist({name: item.skillName, categoryId: showWishlistForm.categoryId});
                    handleDeleteWishlist(item.id);
                  }}>
                  Add to Skills
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteWishlist(item.id)}
                  >
                    <LucideX className="h-4 w-4 hover:bg-gray-200 rounded-full" />
                  </Button>
                  </div>
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