'use client';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@heroui/react";
import { ArrowLeft, Save } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      setFormData({
        name: session.user.name || '',
        designation: session.user.designation || '',
        description: session.user.description || '',
        image: session.user.image || ''
      });
      setIsLoading(false);
    }
  }, [status, router, session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {      
      // Update user profile in database
      const response = await fetch('/api/edit-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          designation: formData.designation,
          description: formData.description,          
        })
      });
      
      if (response.ok) {
        await response.json();
        
        // Update session with new user data
        await update({
          user: {
            ...session?.user,
            name: formData.name,
            designation: formData.designation,
            description: formData.description,
          }
        });
        
        // Wait a moment for the session to update
        setTimeout(() => {
          // Force a complete page reload to ensure session changes are reflected
          window.location.href = '/profile';
        }, 500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" />
          <p className="mt-4 text-lg font-semibold text-white/90 tracking-wide">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <BackgroundBeams />
      </div>
      
      <div className="relative z-10 pt-20 px-4 md:px-8 max-w-4xl mx-auto">
        <Button 
          onClick={() => router.push('/profile')}
          className="mb-6 bg-transparent hover:bg-gray-800 text-white flex items-center gap-2 rounded-md px-4 py-2 transition duration-300"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </Button>
        
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800/50">
          <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-6">Edit Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center md:flex-row md:items-start gap-6 mb-8">
              <div className="relative group">
                <Avatar
                  className="w-32 h-32 border-4 border-gray-700/50"
                  src={ formData.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                  size="lg"
                />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="w-full bg-gray-800/70 backdrop-blur-sm border-gray-700 text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-300 mb-1">
                    Designation
                  </label>
                  <Input
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="Your job title or role"
                    className="w-full bg-gray-800/70 backdrop-blur-sm border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Description Section */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                About Me
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about yourself, your skills, and your interests"
                rows={5}
                className="w-full p-3 rounded-md bg-gray-800/70 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}