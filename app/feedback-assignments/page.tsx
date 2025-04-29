"use client";

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import {  Check, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackReviewer {
  id: string;
  userFeedbackId: string;
  reviewerId: string;
  reviewerName: string;
  status: string;
  userFeedback: UserFeedback;
}

interface FeedbackQuestion {
  id: string;
  formName: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  choice1: string | null;
  choice2: string | null;
  choice3: string | null;
  choice4: string | null;
  year: number;
  original: boolean;
}

interface UserFeedback {
  id: string;
  targetUserId: string;
  feedbackQuestionId: string;
  formName: string;
  year: number;
  status: string;
  feedbackQuestion: FeedbackQuestion;
  targetUserName?: string;
}

export default function FeedbackAssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [groupedAssignments, setGroupedAssignments] = useState<Record<string, FeedbackReviewer[]>>({});
  

  // Check if user is authenticated and fetch data
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchAvailableYears();
    fetchReviewerAssignments();
  }, [status, session, router, selectedYear]);

  // Fetch available years for feedback
  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/feedback-years');
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data);
        // If no years available, use current year
        if (data.length === 0) {
          setAvailableYears([new Date().getFullYear()]);
        }
      }
    } catch (error) {
      console.error('Error fetching available feedback years:', error);
      // Fallback to current year if error
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  // Fetch all feedback assignments for the current reviewer
  const fetchReviewerAssignments = async () => {
    try {
      setIsLoading(true);
      
      // Use the new API route that includes target user names
      const response = await fetch(`/api/feedback-assignments?reviewerId=${session?.user?.id}&year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviewer assignments');
      }
      
      const assignments = await response.json();
      
      // Remove this line since we removed the state variable
      // setFeedbackAssignments(assignments);
      
      // Group assignments by target user
      const grouped: Record<string, FeedbackReviewer[]> = {};
      assignments.forEach((assignment: FeedbackReviewer) => {
        const targetUserId = assignment.userFeedback.targetUserId;
        if (!grouped[targetUserId]) {
          grouped[targetUserId] = [];
        }
        grouped[targetUserId].push(assignment);
      });
      
      setGroupedAssignments(grouped);
    } catch (error) {
      console.error('Error fetching reviewer assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
  };

  // Get user name from the first assignment for a user
  const getUserName = (assignments: FeedbackReviewer[]) => {
    if (assignments && assignments.length > 0) {
      // Use the target user name from our enhanced API response
      if (assignments[0].userFeedback.targetUserName) {
        return assignments[0].userFeedback.targetUserName;
      }
      
      // Fallback to user ID if name is not available
      return `User ${assignments[0].userFeedback.targetUserId.substring(0, 6)}...`;
    }
    return "Unknown User";
  };

  // Calculate completion status for a user's feedback
  const getCompletionStatus = (assignments: FeedbackReviewer[]) => {
    if (!assignments || assignments.length === 0) return { completed: 0, total: 0 };
    
    const completed = assignments.filter(a => a.status === 'COMPLETED').length;
    return {
      completed,
      total: assignments.length,
      isComplete: completed === assignments.length
    };
  };

  // Navigate to reviewer feedback page for a specific user
  const handleUserClick = (userId: string, userName: string) => {
    router.push(`/reviewer-feedback?userid=${userId}&username=${userName}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-950">
        <motion.div
          className="w-12 h-12 border-4 border-t-transparent border-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    // ... existing code ...
    <div className="min-h-screen bg-neutral-950 relative">
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
      
      <div className="relative z-10 pt-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => router.push('/profile')}
            className="bg-transparent hover:bg-gray-800 text-white flex items-center gap-2 rounded-md px-4 py-2 transition duration-300"
          >
            <ArrowLeft size={18} />
            Back to Profile
          </Button>
          
          <div className="flex items-center gap-4">
            <label htmlFor="yearSelect" className="text-white">Year:</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={handleYearChange}
              className="bg-gray-800 text-white rounded-md px-3 py-2 border border-gray-700"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800/50">
          <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-6">
            360 Feedback Assignments
          </h1>
          
          {Object.keys(groupedAssignments).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">You dont have any feedback assignments for {selectedYear}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedAssignments).map(([userId, assignments]) => {
                const userName = getUserName(assignments);
                const status = getCompletionStatus(assignments);
                
                return (
                  <div 
                    key={userId}
                    onClick={() => handleUserClick(userId, userName)}
                    className="bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center mr-3">
                          <span className="text-white font-medium">{userName.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{userName}</h3>
                          <p className="text-gray-400 text-sm">
                            {status.completed} of {status.total} questions completed
                          </p>
                        </div>
                      </div>
                      
                      {status.isComplete ? (
                        <div className="bg-green-900/30 text-green-400 rounded-full p-2">
                          <Check size={18} />
                        </div>
                      ) : (
                        <div className="bg-amber-900/30 text-amber-400 rounded-full p-2">
                          <Clock size={18} />
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full bg-gray-700/30 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(status.completed / status.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}