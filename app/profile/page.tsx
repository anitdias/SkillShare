'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function ProfilePage() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const [userSkills, setUserSkills] = useState<UserSKill[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [showAddSkillForm, setShowAddSkillForm] = useState({set:false, categoryId: ''});
    const [showWishlistForm, setShowWishlistForm] = useState({set:false, categoryId: ''});
    const [showViewMore, setShowViewMore] = useState({set:false, categoryId: ''});
    const [newSkill, setNewSkill] = useState({ name: '', categoryId: '' });
    const [newWishlistItem, setNewWishlistItem] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const categories = [
        {id: '1', name: 'Professional'},
        {id: '2', name: 'Creative'},
        { id: '3', name: 'Life & Physical' },
        { id: '4', name: 'Social & Interpersonal' },
    ]

    const fulltext = "<Skill Share/>";
    
    useEffect(() => {
        if (status=='unauthenticated'){
            router.push('/login');
        }else if(status == 'authenticated'){
            fetchUserData();
        }
    }, [status,router])

    const fetchUserData = async () => {
        try{
        const [skillRes, wishlistRes] = await Promise.all([
            fetch('/api/skills'),
            fetch('/api/wishlist')
        ])

        if(skillRes.ok && wishlistRes.ok){
            const [skills, wishlist] = await Promise.all([
                skillRes.json(),
                wishlistRes.json()
            ])
            setUserSkills(skills);
            setWishlist(wishlist);
        }
    }
    catch(error){
        console.error('Error while fetching user data:', error);
    }finally{
        setIsLoading(false);
    }
    }

    const handleAddSkill = async (e:React.FormEvent) => {
        e.preventDefault();
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
                setShowAddSkillForm(false);
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

      const handleDeleteWishlist = async (id) =>{
        try {
            const response = await fetch('/api/wishlist', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id }),
            });
      
            if (response.ok) {
              const item = await response.json();
              setWishlist(wishlist => wishlist.filter(object => object.id!== id ));
              
            }
          } catch (error) {
            console.error('Error deleting wishlist item:', error);
          }


      }
    
      const handleDeleteSkill = async (id) => {
        try{
            const response = await fetch('/api/skills', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
              });

            if(response.ok){
                const res = await response.json();
                setUserSkills(userSkills => userSkills.filter(object=> object.id!== id))
            }
        }
        catch (error) {
            console.error('Error deleting wishlist item:', error);
          }
      }

      if(status === 'loading' || isLoading){
        return(
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
      }

      return(
        <div className="min-h-screen bg-[#A1D6E2] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
      {/* navBar */}
      <nav className="h-16 bg-white shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4">
                <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="mr-4 text-blue"
                >
                    {isSidebarOpen ? <X className="text-gray-600 hover:bg-gray-200 rounded-full" size={24} /> : <Menu className="text-gray-600" size={24} />}
                </Button>
                <h1 className="text-xl font-bold font-mono text-white bg-[#1995AD] shadow-md rounded-lg p-1">
                  {fulltext}
                </h1>
                </div>
                <Button
                  onClick={() => {
                      signOut({ callbackUrl:"/" })
                  }}
                  className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892]"
                >
                  {/* <LucidePlus className="mr-2 h-4 w-4" /> */}
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


        {/* Add Skill Form */}
        {showAddSkillForm.set && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-30">
            <Card className="relative p-3 bg-white w-[400px] h-[200px] flex flex-col justify-center items-center rounded-lg shadow-lg">
              {/* Close Button */}
              <Button
                variant="ghost"
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowAddSkillForm({set: false, categoryId: ''})} // Close the form
              >
                <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
              </Button>

              <form onSubmit={handleAddSkill} className="space-y-4 w-full">
                <div className="flex flex-col gap-4 w-full">
                  <Input
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({name: e.target.value, categoryId: showAddSkillForm.categoryId })}
                    className="flex-1 border-2 border-gray-300 text-gray-600"
                    required
                  />
                  <Button type="submit" className="bg-[#1995AD] hover:bg-[#157892] w-full">
                    Add Skill
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}



        {/* Skills Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const categorySkills = userSkills.filter(
              (us) => us.categoryId === category.id
            );
            // if (categorySkills.length === 0) return null;

            return (
              <Card
                key={category.id}
                className="p-5 bg-white h-[300px] md:h-[290px] flex flex-col justify-between shadow-lg rounded-xl hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex item-center justify-start space-x-2">
                <h2 className="text-2xl font-bold font-mono mb-3 text-gray-600 text-center shadow-md rounded-lg p-1 w-[470px]">
                  {category.name}
                </h2>
                <Button
                  onClick={() => setShowAddSkillForm({set: true, categoryId: category.id})}
                  className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892] w-[50px]"
                > 
                  <LucidePlus className="h-4 w-4" />
                </Button>
                </div>
                <div className="space-y-2 flex-1 overflow-auto">
                  {categorySkills.slice(0,3).map((userSkill) => (
                    <div
                      key={userSkill.id}
                      className="flex items-center justify-between bg-gray-200 p-1 rounded-xl text-gray-600 hover:bg-gray-300"
                    >
                      <span className="text-sm">&nbsp;{userSkill.skill.name}</span>
                      {userSkill.validatedByManager && (
                        <span className="text-green-600 text-base">Validated</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteSkill(userSkill.id)}
                      >
                        <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between space-x-2">
                <Button
                  onClick={() => setShowWishlistForm({set: true, categoryId: category.id})}
                  className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892] w-[200px]"
                >
                  Future Skills
                </Button>
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



          {/* Wishlist */}
          {showWishlistForm.set && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-30">
          <Card className="relative p-4 bg-white w-[650px] h-[500px] flex flex-col justify-baseline rounded-lg shadow-lg">
            <Button
              variant="ghost"
              className="absolute top-2 right-1 text-gray-600 hover:bg-gray-200 rounded-full"
              onClick={() => setShowWishlistForm({set: false, categoryId: ''})} // Close the form
            >
              <LucideX className="h-5 w-5 hover:bg-gray-200 rounded-full" />
            </Button>
            <h2 className="text-xl font-semibold font-mono mb-4 text-gray-600">Future Skills</h2>
            <form onSubmit={handleAddWishlistItem} className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill you want to learn"
                  value={newWishlistItem}
                  onChange={(e) => setNewWishlistItem(e.target.value)}
                  className="flex-1 border-2 border-gray-300 text-gray-600"
                />
                <Button type="submit" className="bg-[#1995AD] hover:bg-[#157892]">
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
                  className="flex items-center justify-between bg-gray-200 p-1 rounded-xl text-gray-600 text-sm hover:bg-gray-300"
                >
                  <span>&nbsp;{item.skillName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteWishlist(item.id)}
                  >
                    <LucideX className="h-4 w-4 hover:bg-gray-200 rounded-full" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          </div>
          )}


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
              <form onSubmit={handleAddSkill} className="mb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill you want to learn"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({name: e.target.value, categoryId: showViewMore.categoryId })}
                    className="flex-1 border-2 border-gray-300 text-gray-600"
                  />
                  <Button type="submit" className="bg-[#1995AD] hover:bg-[#157892]">
                    Add
                  </Button>
                </div>
              </form>
              <div className="space-y-2 overflow-auto">
                {userSkills
                .filter((item) =>  item.categoryId === showViewMore.categoryId)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-200 p-1 rounded-xl text-gray-600 text-sm hover:bg-gray-300"
                  >
                    <span>&nbsp;{item.skill.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteSkill(item.id)}
                    >
                      <LucideX className="h-4 w-4 hover:bg-gray-200 rounded-full" />
                    </Button>
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