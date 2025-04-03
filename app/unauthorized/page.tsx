"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 relative flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <BackgroundBeams />
      </div>
      
      <div className="relative z-10 max-w-md w-full px-4">
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800/50 text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-red-500" />
          
          <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-red-200 to-red-600 font-bold font-mono mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-300 mb-8">
            You dont have permission to access this page. This feature is restricted to administrators only.
          </p>
          
          <Button 
            onClick={() => router.push("/profile")}
            className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white px-6 py-3 rounded-md flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            Return to Profile
          </Button>
        </div>
      </div>
    </div>
  );
}