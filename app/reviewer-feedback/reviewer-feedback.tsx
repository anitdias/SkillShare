'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import { Search, ChevronDown,  Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";

interface SearchUser {
  id: string;
  name: string;
}

// Add these interfaces for feedback management
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

interface FeedbackReviewer {
  id: string;
  userFeedbackId: string;
  reviewerId: string;
  reviewerName: string;
  status: string;
  userFeedback: UserFeedback;
}

interface FeedbackResponse {
  id?: string;
  feedbackReviewerId: string;
  responseText: string;
  responseValue?: number | null;
}

export default function ReviewerFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchedUserId, setSearchedUserId] = useState<string | null>(null);
  const [searchedUsername, setSearchedUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [feedbackAssignments, setFeedbackAssignments] = useState<FeedbackReviewer[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<Record<string, FeedbackResponse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isNotAssigned, setIsNotAssigned] = useState(false);
  const fulltext = "<Skillsikt/>";

  // Check if user is authorized and fetch data
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    const userId = searchParams.get('userid');
    const username = searchParams.get('username');
    
    if (userId && username) {
      setSearchedUserId(userId);
      setSearchedUsername(username);
      checkAuthorization(userId);
    } else {
      // If no user specified, show the reviewer's assigned feedback
      fetchReviewerAssignments();
    }

    fetchAvailableYears();
  }, [status, session, searchParams, router]);

  // Check if the current user is authorized to review the searched user
  const checkAuthorization = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch reviewer assignments for the current user
      const response = await fetch(`/api/feedback-reviewers?reviewerId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviewer assignments');
      }
      
      const assignments = await response.json();
      
      // Check if the current user is assigned to review the target user
      const isAssigned = assignments.some((assignment: FeedbackReviewer) => 
        assignment.userFeedback.targetUserId === targetUserId
      );
      
      if (!isAssigned) {
        // Instead of redirecting, set states to show "not assigned" message
        setIsNotAssigned(true);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      
      const filteredAssignments = assignments.filter((assignment: FeedbackReviewer) => 
        assignment.userFeedback.targetUserId === targetUserId
      );
      
      setFeedbackAssignments(filteredAssignments);
      
      // Fetch all responses for these assignments using the batch API
      // Use filteredAssignments directly instead of feedbackAssignments which hasn't been updated yet
      const reviewerIds = filteredAssignments.map((assignment: FeedbackReviewer) => assignment.id);
      
      if (reviewerIds.length > 0) {
        // Build query string with multiple IDs
        const queryString = reviewerIds.map((id: string) => `feedbackReviewerId=${id}`).join('&');
        
        const res = await fetch(`/api/feedback-response-batch?${queryString}`);
        if (!res.ok) {
          throw new Error('Failed to fetch feedback responses');
        }
        
        const responseData = await res.json();
        
        // Convert array of responses to record by feedbackReviewerId
        const responsesRecord: Record<string, FeedbackResponse> = {};
        responseData.forEach((response: FeedbackResponse) => {
          if (response && response.feedbackReviewerId) {
            responsesRecord[response.feedbackReviewerId] = response;
          }
        });
        
        setFeedbackResponses(responsesRecord);
      }
      
      setIsAuthorized(true);
    } catch (error) {
      console.error('Error checking authorization:', error);
      router.push(`/publicProfile?userid=${targetUserId}&username=${searchedUsername}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all feedback assignments for the current reviewer
  const fetchReviewerAssignments = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/feedback-reviewers?reviewerId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviewer assignments');
      }
      
      const assignments = await response.json();
      setFeedbackAssignments(assignments);
      
      // Fetch all responses for these assignments
      await fetchAllFeedbackResponses();
      
      setIsAuthorized(true);
    } catch (error) {
      console.error('Error fetching reviewer assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchAllFeedbackResponses = async () => {
    try {
      if (!feedbackAssignments || feedbackAssignments.length === 0) return;
      
      // Get all reviewer IDs
      const reviewerIds = feedbackAssignments.map(assignment => assignment.id);
      
      if (reviewerIds.length === 0) return;
      
      // Build query string with multiple IDs
      const queryString = reviewerIds.map(id => `feedbackReviewerId=${id}`).join('&');
      
      // Make a single API call to the new batch endpoint
      const res = await fetch(`/api/feedback-response-batch?${queryString}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch feedback responses');
      }
      
      const responseData = await res.json();
      
      // Convert array of responses to record by feedbackReviewerId
      const responsesRecord: Record<string, FeedbackResponse> = {};
      responseData.forEach((response: FeedbackResponse) => {
        if (response && response.feedbackReviewerId) {
          responsesRecord[response.feedbackReviewerId] = response;
        }
      });
      
      console.log('Fetched responses:', responsesRecord);
      setFeedbackResponses(responsesRecord);
    } catch (error) {
      console.error('Error fetching all feedback responses:', error);
    }
  };

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    
    // Refresh data based on current view
    if (searchedUserId) {
      checkAuthorization(searchedUserId);
    } else {
      fetchReviewerAssignments();
    }
  };

  // Handle input change for search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    
    // Search users if query is not empty
    if (e.target.value.trim()) {
      searchForUsers(e.target.value);
    } else {
      setSearchUsers([]);
    }
  };

  // Search for users
  const searchForUsers = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      setSearchUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Handle response change
  const handleResponseChange = (feedbackReviewerId: string, responseText: string) => {
    setFeedbackResponses(prev => ({
      ...prev,
      [feedbackReviewerId]: {
        ...prev[feedbackReviewerId],
        feedbackReviewerId,
        responseText
      }
    }));
  };

  const handleCheckboxToggle = (feedbackReviewerId: string, choice: string) => {
    setFeedbackResponses(prev => {
      const currentResponse = prev[feedbackReviewerId]?.responseText || '';
      const choices = currentResponse ? currentResponse.split('|').filter(c => c) : [];
      
      // Toggle the choice
      if (choices.includes(choice)) {
        // Remove the choice
        const updatedChoices = choices.filter(c => c !== choice);
        return {
          ...prev,
          [feedbackReviewerId]: {
            ...prev[feedbackReviewerId],
            feedbackReviewerId,
            responseText: updatedChoices.join('|')
          }
        };
      } else {
        // Add the choice
        choices.push(choice);
        return {
          ...prev,
          [feedbackReviewerId]: {
            ...prev[feedbackReviewerId],
            feedbackReviewerId,
            responseText: choices.join('|')
          }
        };
      }
    });
  };

  // Check if all questions have been answered
  const areAllQuestionsAnswered = () => {
    if (feedbackAssignments.length === 0) return false;
    
    // Check if there are any pending assignments
    const pendingAssignments = feedbackAssignments.filter(
      assignment => assignment.status !== 'COMPLETED'
    );
    
    // If all assignments are completed, no need to submit
    if (pendingAssignments.length === 0) return false;
    
    return pendingAssignments.every(assignment => {
      const response = feedbackResponses[assignment.id];
      if (!response || !response.responseText) return false;
      
      // For checkbox type, ensure at least one option is selected
      if (assignment.userFeedback.feedbackQuestion.questionType === 'Check Boxes') {
        return response.responseText.split('|').some(choice => choice.trim() !== '');
      }
      
      return true;
    });
  };

  // Submit all responses at once
  const submitAllResponses = async () => {
    try {
      setIsSubmitting(true);
      setSubmitSuccess(false);
      setSubmitError('');
      
      // Filter out completed assignments
      const pendingAssignments = feedbackAssignments.filter(
        assignment => assignment.status !== 'COMPLETED'
      );
      
      // Prepare responses for batch submission with status updates
      const responsesToSubmit = pendingAssignments
        .map(assignment => {
          const response = feedbackResponses[assignment.id];
          if (!response || !response.responseText) return null;
          
          return {
            feedbackReviewerId: assignment.id,
            responseText: response.responseText,
            status: 'COMPLETED' // Include status update in the same request
          };
        })
        .filter(Boolean); // Remove null entries
      
      // Submit all responses in a single request
      await fetch('/api/feedback-response-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: responsesToSubmit
        }),
      });
      
      setSubmitSuccess(true);
      
      // Update local state to reflect completed status
      setFeedbackAssignments(prev => 
        prev.map(assignment => {
          if (pendingAssignments.some(pa => pa.id === assignment.id)) {
            return { ...assignment, status: 'COMPLETED' };
          }
          return assignment;
        })
      );
      
      // Refresh the responses
      if (searchedUserId) {
        await checkAuthorization(searchedUserId);
      } else {
        await fetchAllFeedbackResponses();
      }
    } catch (error) {
      console.error('Error submitting feedback responses:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
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

  if (isNotAssigned) {
    return (
      <div className="min-h-screen bg-neutral-950 overflow-hidden px-4 py-12">
        <nav className="h-16 bg-[#000000] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
            {/* Left Section - Title */}
            <div className="flex items-center gap-3">
            <h1 
                className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap cursor-pointer"
                onClick={() => router.push('/profile')}
              >
                {fulltext}
              </h1>
            </div>
    
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                onClick={() => router.push(`/publicProfile?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Profile
              </Button>
              {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
              <Button 
                onClick={() => router.push(`/search-competency?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Org Goals
              </Button>
            )}
            </div>

        {/* Right Section - Search Bar & Profile */}
        <div className="flex items-center gap-4">

          {/* Search Bar */}
          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleInputChange}
              className="w-full p-2 pl-10 border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
            />
            
            {searchUsers.length > 0 && query && (
              <div className="absolute bg-[#000000] top-11 w-72 left-4 border-gray-300 border-2 rounded-md shadow-lg z-30">
                {searchUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                    onClick={() => {
                      router.push(`/reviewer-feedback?userid=${user.id}&username=${user.name}`);
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
                  <DropdownItem key="goals" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/goals')
                  }}>My Goals</DropdownItem>
                  <DropdownItem key="competnecy" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/competency')
                  }}>My Competencies</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="upload-excel" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/upload-excel')
                    }}>Upload Excel</DropdownItem>
                  ) : null}
                  <DropdownItem key="org-chart" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/org-chart')
                  }}>Org-Chart</DropdownItem>
                  <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/edit-profile')
                  }}>Edit Profile</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="verify-empno" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/verify-employee')
                    }}>Verify EmployeeNo</DropdownItem>
                  ) : null}
                  <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                    Log Out
                  </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        </nav>
        
        <div className="max-w-7xl mx-auto mt-32 text-center">
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800/50">
            <h2 className="text-2xl font-bold text-white mb-4">No Feedback Assignment</h2>
            <p className="text-gray-400 mb-6">
              You are not assigned to review this user. Please select a different user.
            </p>
            <Button 
              onClick={() => router.push(`/publicProfile?userid=${searchedUserId}&username=${searchedUsername}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition duration-300"
            >
              Go to User Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will be redirected by useEffect
  }

  

  return (
    <div className="min-h-screen bg-neutral-950 overflow-hidden px-4 py-12">
      <nav className="h-16 bg-[#000000] shadow-md fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6">
            {/* Left Section - Title */}
            <div className="flex items-center gap-3">
            <h1 
                className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap cursor-pointer"
                onClick={() => router.push('/profile')}
              >
                {fulltext}
              </h1>
            </div>
    
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                onClick={() => router.push(`/publicProfile?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                User Profile
              </Button>
              {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
              <Button 
                onClick={() => router.push(`/search-competency?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Org Goals
              </Button>
            )}
            </div>

        {/* Right Section - Search Bar & Profile */}
        <div className="flex items-center gap-4">

          {/* Search Bar */}
          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleInputChange}
              className="w-full p-2 pl-10 border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
            />
            
            {searchUsers.length > 0 && query && (
              <div className="absolute bg-[#000000] top-11 w-72 left-4 border-gray-300 border-2 rounded-md shadow-lg z-30">
                {searchUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                    onClick={() => {
                      router.push(`/reviewer-feedback?userid=${user.id}&username=${user.name}`);
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
                  <DropdownItem key="goals" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/goals')
                  }}>My Goals</DropdownItem>
                  <DropdownItem key="competnecy" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/competency')
                  }}>My Competencies</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="upload-excel" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/upload-excel')
                    }}>Upload Excel</DropdownItem>
                  ) : null}
                  <DropdownItem key="org-chart" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/org-chart')
                  }}>Org-Chart</DropdownItem>
                  <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                    router.push('/edit-profile')
                  }}>Edit Profile</DropdownItem>
                  {session?.user?.role === "admin" ? (
                    <DropdownItem key="verify-empno" className="hover:bg-gray-600 transition p-3 rounded-md" onPress={() => {
                      router.push('/verify-employee')
                    }}>Verify EmployeeNo</DropdownItem>
                  ) : null}
                  <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                    Log Out
                  </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </nav>

      {/* Header with Sparkles */}
      <div className="relative h-52 w-full">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
          <h1 className="text-4xl md:text-6xl font-bold font-mono text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            360° FEEDBACK
          </h1>
          
          {/* Gradient Effects */}
          <div className="relative w-full h-20 mt-2">
            {/* Primary gradient line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-[600px] blur-sm" />
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-[600px]" />
            
            {/* Secondary gradient line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-2 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-[300px] blur-sm" />
            <div className="absolute left-1/2 transform -translate-x-1/2 top-2 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-[300px]" />
          </div>
        </div>       
      </div>

      <div className="max-w-7xl mx-auto mt-8">
      <div className="flex items-start justify-between">
          <div className="relative w-48 mb-4">
            <label className="block text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">
              Select Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="w-full bg-neutral-800/100 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          </div>
        {/* If a specific user is being viewed */}
        {searchedUserId && searchedUsername ? (
          <div className="bg-neutral-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{searchedUsername}</h2>
                  <p className="text-blue-400">360° Feedback for {selectedYear}</p>
                </div>
              </div>
              
              {feedbackAssignments.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Feedback Questions</h3>
                  <div className="space-y-4">
                    {feedbackAssignments.map((assignment, index) => (
                      <div key={assignment.id} className="bg-neutral-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <h4 className="text-white font-medium">{assignment.userFeedback.feedbackQuestion.questionText}</h4>
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-medium" 
                               style={{
                                 backgroundColor: assignment.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                 color: assignment.status === 'COMPLETED' ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)'
                               }}>
                            {assignment.status}
                          </div>
                        </div>
                        
                        {/* Question Type and Choices */}
                        <div className="mt-3 pl-11">
                          <p className="text-gray-400 text-sm mb-2">Type: {assignment.userFeedback.feedbackQuestion.questionType}</p>
                          
                          {/* Multiple Choice Input */}
                          {assignment.userFeedback.feedbackQuestion.questionType === 'Multiple Choice' && (
                            <div className="space-y-2 mt-3">
                              <p className="text-sm font-medium text-gray-300 mb-1">Select one option:</p>
                              <div className="space-y-2">
                                {assignment.userFeedback.feedbackQuestion.choice1 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice1
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleResponseChange(assignment.id, assignment.userFeedback.feedbackQuestion.choice1 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border ${
                                        feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice1
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice1 && (
                                          <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice1}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice2 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice2
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleResponseChange(assignment.id, assignment.userFeedback.feedbackQuestion.choice2 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border ${
                                        feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice2
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice2 && (
                                          <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice2}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice3 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice3
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleResponseChange(assignment.id, assignment.userFeedback.feedbackQuestion.choice3 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border ${
                                        feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice3
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice3 && (
                                          <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice3}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice4 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice4
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleResponseChange(assignment.id, assignment.userFeedback.feedbackQuestion.choice4 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border ${
                                        feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice4
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText === assignment.userFeedback.feedbackQuestion.choice4 && (
                                          <div className="w-2 h-2 bg-white rounded-full m-auto mt-[3px]"></div>
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice4}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Check Boxes Input */}
                          {assignment.userFeedback.feedbackQuestion.questionType === 'Check Boxes' && (
                            <div className="space-y-2 mt-3">
                              <p className="text-sm font-medium text-gray-300 mb-1">Select all that apply:</p>
                              <div className="space-y-2">
                                {assignment.userFeedback.feedbackQuestion.choice1 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice1 || '')
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleCheckboxToggle(assignment.id, assignment.userFeedback.feedbackQuestion.choice1 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-sm border ${
                                        feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice1 || '')
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice1 || '') && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice1}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice2 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice2 || '')
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleCheckboxToggle(assignment.id, assignment.userFeedback.feedbackQuestion.choice2 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-sm border ${
                                        feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice2 || '')
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice2 || '') && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice2}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice3 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice3 || '')
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleCheckboxToggle(assignment.id, assignment.userFeedback.feedbackQuestion.choice3 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-sm border ${
                                        feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice3 || '')
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice3 || '') && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice3}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.userFeedback.feedbackQuestion.choice4 && (
                                  <div 
                                    className={`p-3 rounded-md cursor-pointer transition-all ${
                                      feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice4 || '')
                                        ? 'bg-blue-600/30 border border-blue-500'
                                        : 'bg-neutral-700/30 border border-gray-600 hover:border-blue-400'
                                    }`}
                                    onClick={() => {
                                      if (assignment.status !== 'COMPLETED') {
                                        handleCheckboxToggle(assignment.id, assignment.userFeedback.feedbackQuestion.choice4 || '')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-sm border ${
                                        feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice4 || '')
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {feedbackResponses[assignment.id]?.responseText?.includes(assignment.userFeedback.feedbackQuestion.choice4 || '') && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-200">{assignment.userFeedback.feedbackQuestion.choice4}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Text Input for other question types */}
                          {assignment.userFeedback.feedbackQuestion.questionType !== 'Multiple Choice' && 
                           assignment.userFeedback.feedbackQuestion.questionType !== 'Check Boxes' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-300 mb-1">Your Response:</label>
                              <textarea
                                value={feedbackResponses[assignment.id]?.responseText || ''}
                                onChange={(e) => handleResponseChange(assignment.id, e.target.value)}
                                className="w-full bg-neutral-700/30 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                                placeholder="Enter your feedback here..."
                                disabled={assignment.status === 'COMPLETED'}
                              ></textarea>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Single Submit Button for all responses */}
                  <div className="mt-6 flex justify-end">
                    {feedbackAssignments.every(assignment => assignment.status === 'COMPLETED') ? (
                      <div className="bg-green-600/20 text-green-400 px-6 py-3 rounded-md flex items-center gap-2 text-lg">
                        All feedback submitted successfully
                        <Check className="h-5 w-5" />
                      </div>
                    ) : (
                      <Button
                        onClick={submitAllResponses}
                        disabled={isSubmitting || !areAllQuestionsAnswered()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center gap-2 text-lg"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit All Feedback'}
                        <Check className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Feedback Assignments</h3>
                  <p className="text-gray-400 max-w-md">You dont have any feedback assignments for this user in the selected year.</p>
                </div>
              )}
              
              {/* Success/Error Messages */}
              {submitSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-md text-green-400">
                  Feedback submitted successfully!
                </div>
              )}
              
              {submitError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-400">
                  {submitError}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Show all assignments if no specific user is selected
          <div className="bg-neutral-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Your Feedback Assignments</h2>
              
              {feedbackAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedbackAssignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="bg-neutral-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/reviewer-feedback?userid=${assignment.userFeedback.targetUserId}&username=${assignment.userFeedback.targetUserName || 'User'}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-medium text-white">{assignment.userFeedback.targetUserName || 'User'}</h3>
                        <div className="px-3 py-1 rounded-full text-xs font-medium" 
                             style={{
                               backgroundColor: assignment.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                               color: assignment.status === 'COMPLETED' ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)'
                             }}>
                          {assignment.status}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">Form: {assignment.userFeedback.formName}</p>
                      <p className="text-gray-400 text-sm">Year: {assignment.userFeedback.year}</p>
                      <div className="mt-3 flex justify-end">
                        <Button
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-md text-sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Feedback Assignments</h3>
                  <p className="text-gray-400 max-w-md">You dont have any feedback assignments for the selected year.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}