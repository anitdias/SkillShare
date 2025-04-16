"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LucideIdCard, AlertCircle } from 'lucide-react';
import { SparklesCore } from '@/components/ui/sparkles';
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { signOut } from "next-auth/react";

export default function EmployeeVerification() {
  const { data: session, status, update } = useSession();;
  const [employeeNo, setEmployeeNo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fulltext = "<SkillShare/>";

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.employeeNo) {
      router.push('/profile');
    }
  }, [status, router, session?.user?.employeeNo]);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const response = await fetch('/api/auth/verify-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeNo }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.redirect) {
                router.push(data.redirect);
                return;
            }
            throw new Error(data.error || data.details || 'Verification failed');
        }

        // Update the session with new data
        await update({
            ...session,
            user: {
                ...session?.user,
                employeeNo: employeeNo,
                role: data.role
            }
        });

        // Redirect to profile after successful verification
        router.push('/profile');

    } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to verify employee number');
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative">
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

        {/* Right Section - Search Bar & Sign Out */}
        <div className="flex items-center gap-4">
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
              <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </nav>
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
      
      <Card className="w-full max-w-md p-8 space-y-6 bg-[#000000]/90 border-[#3b3b3b] shadow-xl rounded-xl relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">One Last Step</h1>
          <p className="text-white">Please enter your employee number to complete registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Employee Number"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                className="pl-10 text-white"
                required
              />
              <LucideIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 p-4 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#636363] hover:bg-[#222222]"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Complete Registration'}
          </Button>
        </form>
      </Card>
    </div>
  );
}