'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LucideUser, LucideMail, LucideLock, LucideIdCard } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { SparklesCore } from "@/components/ui/sparkles";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeNo: '', // Add employee number field
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data:session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/profile');
    }
  }, [session, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to sign in after registration');
      } else {
        router.push('/profile');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative">
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
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white">Join SkillShare today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative text-white">
              <Input
                type="text"
                placeholder="Username"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10 border border-white"
                required
              />
              <LucideUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 text-white"
                required
              />
              <LucideMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Employee Number"
                value={formData.employeeNo}
                onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                className="pl-10 text-white"
                required
              />
              <LucideIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 text-white"
                required
              />
              <LucideLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#636363] hover:bg-[#222222]"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#636363] px-2 text-white">Or continue with</span>
          </div>
        </div>

        <div className="grid gap-4">
                  <Button
                    variant="outline"
                    onClick={() => signIn('google', { callbackUrl: '/profile' })}
                    className="w-full flex items-center justify-center text-white hover:bg-[#222222]"
                  >
                    <FcGoogle className="mr-2 h-5 w-5" /> {/* Google Icon */}
                    Sign-Up with Google
                  </Button>
                </div>

        <p className="text-center text-sm text-white">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1995AD] hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}