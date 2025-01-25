'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LucideCode, LucideGraduationCap } from 'lucide-react';

export default function Home() {
  const [text, setText] = useState('');
  const fullText = 'SkillShare';
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/profile');
    }
  }, [session, router]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section */}
      <div className="w-full md:w-1/2 bg-[#1995AD] flex flex-col items-center justify-center p-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <LucideCode size={40} />
            <LucideGraduationCap size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 h-[70px] font-mono">
            {text}
            <span className="animate-pulse">|</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-md mx-auto opacity-90">
            Track, showcase, and grow your skills in one place
          </p>
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 bg-[#A1D6E2] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Get Started Today
            </h2>
            {/* <p className="text-gray-600">
              Join thousands of professionals tracking their skills
            </p> */}
          </div>

          <div className="space-y-4">
            <Link href="/signup" className="w-full block">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-[#1995AD] hover:bg-[#157892] text-lg h-12"
              >
                Sign Up
              </Button>
            </Link>
            <Link href="/login" className="w-full block">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-[#1995AD] text-[#1995AD] hover:bg-[#1995AD] hover:text-white text-lg h-12"
              >
                Login
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600 mt-8">
            <p>
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#1995AD] hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#1995AD] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
