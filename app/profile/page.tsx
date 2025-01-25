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
import { LucidePlus, LucideX } from 'lucide-react';


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
}

export default function ProfilePage() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const [userSkills, setUserSkills] = useState<UserSKill[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [showAddSkillForm, setShowAddSkillForm] = useState(false);
    const [newSkill, setNewSkill] = useState({ name: '', categoryId: '' });
    const [newWishlistItem, setNewWishlistItem] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const categories = [
        {id: '1', name: 'Professional'},
        {id: '2', name: 'Creative'},
        { id: '3', name: 'Life' },
        { id: '4', name: 'Recreational & Physical' },
        { id: '5', name: 'Social & Interpersonal' },
    ]
    
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
            body: JSON.stringify({ skillName: newWishlistItem }),
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

      if(status === 'loading' || isLoading){
        return(
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
      }

      return(
        <div className="min-h-screen bg-[#A1D6E2] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session?.user?.name || 'User'}</h1>
            <p className="text-gray-600">{session?.user?.email}</p>
          </div>
          <div className = "flex flex-col space-y-3">
          <Button
            onClick={() => {
                signOut({ callbackUrl:"/" })
            }}
            className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892]"
          >
            {/* <LucidePlus className="mr-2 h-4 w-4" /> */}
            Sign Out
          </Button>
          <Button
            onClick={() => setShowAddSkillForm(!showAddSkillForm)}
            className="mt-4 md:mt-0 bg-[#1995AD] hover:bg-[#157892]"
          >
            <LucidePlus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
          </div>
        </div>

        {/* Add Skill Form */}
        {showAddSkillForm && (
          <Card className="p-6 bg-white">
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="flex-1 border-2 border-gray-300 text-gray-600"
                  required
                />
                <Select
                  value={newSkill.categoryId}
                  onValueChange={(value) => setNewSkill({ ...newSkill, categoryId: value })}
                >
                  <SelectTrigger className="w-full md:w-[200px] border-2 border-gray-300 text-gray-600">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="text-gray-600 bg-white">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-gray-600 hover:bg-gray-200">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-[#1995AD] hover:bg-[#157892]">
                  Add Skill
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {categories.map((category) => {
              const categorySkills = userSkills.filter(
                (us) => us.categoryId === category.id
              );
              if (categorySkills.length === 0) return null;

              return (
                <Card key={category.id} className="p-6 bg-white">
                  <h2 className="text-xl font-semibold mb-4 text-gray-600">{category.name}</h2>
                  <div className="space-y-2">
                    {categorySkills.map((userSkill) => (
                      <div
                        key={userSkill.id}
                        className="flex items-center justify-between bg-gray-200 p-3 rounded-xl text-gray-600"
                      >
                        <span>{userSkill.skill.name}</span>
                        {userSkill.validatedByManager && (
                          <span className="text-green-600 text-sm">Validated</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Wishlist */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4 text-gray-600">Skill Wishlist</h2>
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
            <div className="space-y-2">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-200 p-2 rounded-xl text-gray-600"
                >
                  <span>{item.skillName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteWishlist(item.id)}
                  >
                    <LucideX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>

      )





      
}