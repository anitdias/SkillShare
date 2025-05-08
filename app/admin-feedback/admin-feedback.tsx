'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from "next-auth/react";
import { useEffect, useState } from 'react';
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import { Search, ChevronDown, X, Edit, Trash, Plus, Check, Users } from "lucide-react";
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
  feedbackReviewers: FeedbackReviewer[];
}

interface FeedbackReviewer {
  id: string;
  userFeedbackId: string;
  reviewerId: string;
  reviewerName: string; // Add this property
  status: string;
}

interface SearchUser {
  id: string;
  name: string;
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchedUserId, setSearchedUserId] = useState<string | null>();
  const [searchedUsername, setSearchedUsername] = useState<string | null>();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestion[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentEditQuestion, setCurrentEditQuestion] = useState<FeedbackQuestion | null>(null);
  
  // Reviewer selection state
  const [showReviewerForm, setShowReviewerForm] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<{id: string, name: string}[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<SearchUser[]>([]);
  const [reviewerQuery, setReviewerQuery] = useState('');
  const [debouncedReviewerQuery, setDebouncedReviewerQuery] = useState('');
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<FeedbackQuestion>>({
    formName: '360 Feedback',
    questionText: '',
    questionType: 'Multiple Choice',
    choice1: '',
    choice2: '',
    choice3: '',
    choice4: '',
    year: new Date().getFullYear(),
    original: true,
  });
  const [feedbackResponses, setFeedbackResponses] = useState<Record<string, string>>({});
  
  

  const fulltext = "<Skillsikt/>";

  useEffect(() => {
    setSearchedUserId('');
    setSearchedUsername(searchParams.get('username'));
    // Set the ID after clearing it to ensure the effect triggers properly
    setTimeout(() => {
      setSearchedUserId(searchParams.get('userid'));
    }, 0);
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if user is admin or manager
      if (session?.user?.role === 'admin') {
        setIsAuthorized(true);
        fetchAvailableYears();
      } else if (session?.user?.role === 'manager') {
        // For managers, check if they have access to this subordinate
        checkManagerAccess();
      } else {
        router.push('/unauthorized');
      }
      setIsLoading(false);
    }
  }, [status, router, session, searchedUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay
  
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (debouncedQuery === '') {
        setSearchUsers([]);
        return;
      }
      
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedQuery }),
        });
  
        if (res.ok) {
          const users = await res.json();
          setSearchUsers(users);
        }
      } catch (error) {
        console.error('Error while fetching user data:', error);
      }
    };
  
    fetchUsers();
  }, [debouncedQuery]);

  useEffect(() => {
    if (searchedUserId) {
      fetchUserFeedback();
    }
  }, [searchedUserId, selectedYear]);

  // Add this useEffect for reviewer search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReviewerQuery(reviewerQuery);
    }, 300); // 300ms delay
  
    return () => clearTimeout(timer);
  }, [reviewerQuery]);

  // Add this useEffect to fetch available reviewers
  useEffect(() => {
    const fetchReviewers = async () => {
      if (debouncedReviewerQuery === '') {
        setAvailableReviewers([]);
        return;
      }
      
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedReviewerQuery }),
        });
  
        if (res.ok) {
          const users = await res.json();
          // Filter out the target user
          const filteredUsers = users.filter((user: SearchUser) => user.id !== searchedUserId);
          setAvailableReviewers(filteredUsers);
        }
      } catch (error) {
        console.error('Error while fetching reviewer data:', error);
      }
    };
  
    fetchReviewers();
  }, [debouncedReviewerQuery, searchedUserId]);

  useEffect(() => {
    if (searchedUserId && selectedYear) {
      fetchFeedbackResponses();
    }
  }, [searchedUserId, selectedYear, userFeedback]);

  const fetchAvailableYears = async () => {
    try {
      // Update to use the new feedback-years endpoint
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

  const checkManagerAccess = async () => {
    if (!searchedUserId || !session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/check-manager-access?managerId=${session.user.id}&subordinateId=${searchedUserId}`);
      
      if (response.ok) {
        const { hasAccess } = await response.json();
        
        if (hasAccess) {
          setIsAuthorized(true);
          fetchAvailableYears();
        } else {
          router.push('/unauthorized');
        }
      } else {
        router.push('/unauthorized');
      }
    } catch (error) {
      console.error('Error checking manager access:', error);
      router.push('/unauthorized');
    }
  };

  const fetchFeedbackResponses = async () => {
    try {
      if (!searchedUserId) return;
      
      console.log("Fetching all feedback responses for user:", searchedUserId);
      
      // Make a single API call to get all responses for this user
      const res = await fetch(`/api/feedback-response?userId=${searchedUserId}&year=${selectedYear}`);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('All feedback responses:', responseData);
        
        // Convert the response objects to just strings (responseText)
        const formattedResponses: Record<string, string> = {};
        
        // Iterate through the response map and extract just the responseText
        Object.keys(responseData).forEach(reviewerId => {
          if (responseData[reviewerId] && typeof responseData[reviewerId] === 'object') {
            formattedResponses[reviewerId] = responseData[reviewerId].responseText || '';
          } else {
            formattedResponses[reviewerId] = '';
          }
        });
        
        setFeedbackResponses(formattedResponses);
      } else {
        console.error('Failed to fetch feedback responses:', await res.text());
      }
    } catch (error) {
      console.error('Error fetching feedback responses:', error);
    }
  };

  const fetchUserFeedback = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/user-feedback?userId=${searchedUserId}&year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user feedback');
      }
      
      const data = await response.json();
      setUserFeedback(data);
      
      // Fetch feedback responses after loading feedback
      await fetchFeedbackResponses();
    } catch (error) {
      console.error('Error fetching user feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleYearChange function
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    if (searchedUserId) {
      fetchUserFeedback();
    }
  };

  const handleReviewerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReviewerQuery(e.target.value);
  };

  // Update the handleCreateFeedback function
  const handleCreateFeedback = async () => {
    if (!searchedUserId) {
      alert("No user selected for feedback");
      return;
    }
    
    setIsSubmitting(true);
    
    try {

      const clearResult = await deleteExistingFeedbackData(searchedUserId, selectedYear);
    
      if (!clearResult) {
        throw new Error('Failed to clear existing feedback data');
      }

      // Step 1: Fetch all feedback questions
      const response = await fetch(`/api/feedback-questions?year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback questions');
      }
      
      const questions = await response.json();
      
      // Filter only the "original" questions
      const originalQuestions = questions.filter((q: FeedbackQuestion) => q.original === true);
      
      if (originalQuestions.length === 0) {
        alert("No active feedback questions found");
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: Map questions to user
      const mappingResponse = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: searchedUserId,
          year: selectedYear,
          questions: originalQuestions.map((q: FeedbackQuestion) => q.id)
        }),
      });
      
      if (!mappingResponse.ok) {
        throw new Error('Failed to map questions to user');
      }
      
      // Refresh the user feedback data
      fetchUserFeedback();
      
      // Show the feedback form
      setFeedbackQuestions(originalQuestions);
      setCurrentQuestionIndex(0);
      setShowFeedbackForm(true);
      
    } catch (error) {
      console.error('Error creating feedback:', error);
      alert('Failed to create feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to remove this question from the user's feedback?")) {
      return;
    }
    
    try {
      const response = await fetch('/api/user-feedback', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: feedbackId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete feedback question');
      }
      
      // Refresh the user feedback data
      fetchUserFeedback();
      
    } catch (error) {
      console.error('Error deleting feedback question:', error);
      alert('Failed to delete feedback question. Please try again.');
    }
  };

  const handleEditQuestion = (question: FeedbackQuestion) => {
    setCurrentEditQuestion(question);
    setShowEditForm(true);
  };

  const handleUpdateQuestion = async (updatedQuestion: FeedbackQuestion, feedbackId: string) => {
    try {
      // Step 1: Create a new question based on the original but with updates
      const createResponse = await fetch('/api/feedback-questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedQuestion,
          original: false // Mark as non-original (customized)
        }),
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create updated question');
      }
      
      const newQuestion = await createResponse.json();
      
      // Step 2: Update the user feedback mapping to point to the new question
      const updateResponse = await fetch('/api/user-feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: feedbackId,
          feedbackQuestionId: newQuestion.id
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update feedback mapping');
      }
      
      // Refresh the user feedback data
      fetchUserFeedback();
      
      // Close the edit form
      setShowEditForm(false);
      setCurrentEditQuestion(null);
      
    } catch (error) {
      console.error('Error updating feedback question:', error);
      alert('Failed to update feedback question. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < feedbackQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // If we're at the last question, show the reviewer selection form
      setShowFeedbackForm(false);
      setShowReviewerForm(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSelectReviewer = (reviewer: SearchUser) => {
    setSelectedReviewers(prev => {
      // Check if this reviewer is already selected
      const isSelected = prev.some(r => r.id === reviewer.id);
      
      if (isSelected) {
        // Remove the reviewer if already selected
        return prev.filter(r => r.id === reviewer.id);
      } else {
        // Add the reviewer with their name if not already selected
        if (prev.length < 3) {
          return [...prev, { id: reviewer.id, name: reviewer.name }];
        }
        return prev;
      }
    });
  };

  const handleAssignReviewers = async () => {
    if (selectedReviewers.length === 0) {
      alert("Please select at least one reviewer");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a map of reviewer IDs to names for easy lookup
      const reviewerNames: Record<string, string> = {};
      selectedReviewers.forEach(reviewer => {
        // Use reviewer.id as the key instead of the entire reviewer object
        reviewerNames[reviewer.id] = reviewer.name;
      });
      
      const response = await fetch('/api/feedback-reviewers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: searchedUserId,
          // Extract just the IDs for the API call
          reviewerIds: selectedReviewers.map(r => r.id),
          reviewerNames: reviewerNames, // Pass the names map
          year: selectedYear,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign reviewers');
      }
      
      // Create notifications for reviewers
      for (const reviewer of selectedReviewers) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: reviewer.id,
            title: 'Feedback Request',
            message: `You have been requested to provide feedback for ${searchedUsername}`,
            type: 'FEEDBACK_REQUEST',
            relatedId: searchedUserId,
          }),
        });
      }
      
      // Refresh the user feedback data
      if (searchedUserId) {
        await fetchUserFeedback();
      }
      
      // Close the reviewer form
      setShowReviewerForm(false);
      setSelectedReviewers([]);
      setReviewerQuery('');
      
      
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      alert('Failed to assign reviewers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveReviewer = async (reviewerId: string) => {
    if (!confirm("Are you sure you want to remove this reviewer?")) {
      return;
    }
    
    try {
      const response = await fetch('/api/feedback-reviewers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reviewerId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove reviewer');
      }
      
      // Refresh the user feedback data
      await fetchUserFeedback();
      
    } catch (error) {
      console.error('Error removing reviewer:', error);
      alert('Failed to remove reviewer. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleAddQuestion = () => {
    setNewQuestion({
      formName: '360 Feedback',
      questionText: '',
      questionType: 'Multiple Choice',
      choice1: '',
      choice2: '',
      choice3: '',
      choice4: '',
      year: selectedYear,
      original: false,
    });
    setShowAddQuestionForm(true);
  };
  
  // Function to handle saving a new question
  const handleSaveNewQuestion = async () => {
    if (!newQuestion.questionText || !newQuestion.questionType) {
      alert("Question text and type are required");
      return;
    }
    
    if (newQuestion.questionType === 'Multiple Choice' || newQuestion.questionType === 'Check Boxes') {
      if (!newQuestion.choice1) {
        alert("At least one choice is required");
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the new question
      const response = await fetch('/api/feedback-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newQuestion,
          questionNumber: feedbackQuestions.length + 1,
          year: selectedYear,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create question');
      }
      
      const createdQuestion = await response.json();
      
      // Map the question to the user
      if (searchedUserId) {
        const mappingResponse = await fetch('/api/user-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: searchedUserId,
            year: selectedYear,
            questions: [createdQuestion.id]
          }),
        });
        
        if (!mappingResponse.ok) {
          throw new Error('Failed to map question to user');
        }
      }
      
      // Add the new question to the list
      setFeedbackQuestions([...feedbackQuestions, createdQuestion]);
      
      // Close the form
      setShowAddQuestionForm(false);
      
      // Move to the new question
      setCurrentQuestionIndex(feedbackQuestions.length);
      
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle deleting a question during feedback creation
  const handleDeleteCurrentQuestion = async () => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }
    
    const questionToDelete = feedbackQuestions[currentQuestionIndex];
    
    try {
      // Find the user feedback entry for this question
      const userFeedbackEntry = userFeedback.find(
        uf => uf.feedbackQuestionId === questionToDelete.id
      );
      
      if (userFeedbackEntry) {
        // Delete the user feedback mapping
        const response = await fetch('/api/user-feedback', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userFeedbackEntry.id
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete feedback question');
        }
      }
      
      // Remove the question from the local state
      const updatedQuestions = feedbackQuestions.filter((_, index) => index !== currentQuestionIndex);
      setFeedbackQuestions(updatedQuestions);
      
      // Adjust the current index if needed
      if (currentQuestionIndex >= updatedQuestions.length) {
        setCurrentQuestionIndex(Math.max(0, updatedQuestions.length - 1));
      }
      
      // If no questions left, close the form
      if (updatedQuestions.length === 0) {
        setShowFeedbackForm(false);
      }
      
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };
  
  // Function to handle editing the current question
  const handleEditCurrentQuestion = () => {
    const questionToEdit = feedbackQuestions[currentQuestionIndex];
    setCurrentEditQuestion(questionToEdit);
    setShowEditForm(true);
  };
  
  // Function to handle updating the current question
  const handleUpdateCurrentQuestion = async (updatedQuestion: FeedbackQuestion) => {
    try {
      // Find the user feedback entry for this question
      const userFeedbackEntry = userFeedback.find(
        uf => uf.feedbackQuestionId === updatedQuestion.id
      );
      
      if (userFeedbackEntry) {
        // Create a new question based on the original but with updates
        const createResponse = await fetch('/api/feedback-questions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedQuestion,
            original: false // Mark as non-original (customized)
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create updated question');
        }
        
        const newQuestion = await createResponse.json();
        
        // Update the user feedback mapping to point to the new question
        const updateResponse = await fetch('/api/user-feedback', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userFeedbackEntry.id,
            feedbackQuestionId: newQuestion.id
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update feedback mapping');
        }
        
        // Update the question in the local state
        const updatedQuestions = [...feedbackQuestions];
        updatedQuestions[currentQuestionIndex] = newQuestion;
        setFeedbackQuestions(updatedQuestions);
      }
      
      // Close the edit form
      setShowEditForm(false);
      setCurrentEditQuestion(null);
      
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const deleteExistingFeedbackData = async (userId: string, year: number) => {
  try {
    const response = await fetch(`/api/user-feedback/clear?userId=${userId}&year=${year}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear existing feedback data');
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing feedback data:', error);
    return false;
  }
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
                Profile
              </Button>
              <Button 
                onClick={() => router.push(`/search-competency?userid=${searchedUserId}&username=${searchedUsername}`)}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                Org Goals
              </Button>
            </div>

        {/* Right Section - Search Bar & Sign Out */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64 sm:w-80">
            {/* Lucide Search Icon */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            
            {/* Input Field */}
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleInputChange}
              className="w-full p-2 pl-10 border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
            />
            
            {/* Dropdown for Search Results */}
            {searchUsers.length > 0 && query && (
              <div className="absolute bg-[#000000] top-11 w-72 left-4 border-gray-300 border-2 rounded-md shadow-lg z-30">
                {searchUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 hover:bg-gray-400 cursor-pointer text-white"
                    onClick={() => {
                      router.push(`/publicProfile?userid=${user.id}&username=${user.name}`);
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
                isBordered
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

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between">
          <div className="relative w-48">
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
          
          {session?.user?.role === 'admin' && (
            <Button
              onClick={handleCreateFeedback}
              disabled={!searchedUserId || isSubmitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white mt-8 px-6 py-2.5 rounded-md flex items-center gap-2 transition-colors ${
                !searchedUserId || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create 360° Feedback
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Add user feedback display */}
      {searchedUserId && searchedUsername && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-neutral-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{searchedUsername}</h2>
                  <p className="text-blue-400">360° Feedback for {selectedYear}</p>
                </div>
              </div>
              
              {userFeedback.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Feedback Questions</h3>
                  <div className="space-y-4">
                    {userFeedback.map((feedback, index) => (
                      <div key={feedback.id} className="bg-neutral-800/50 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <h4 className="text-white font-medium">{feedback.feedbackQuestion.questionText}</h4>
                          </div>
                          {session?.user?.role === 'admin' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditQuestion(feedback.feedbackQuestion)}
                                className="p-2 bg-amber-600/20 text-amber-400 rounded-md hover:bg-amber-600/40 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteQuestion(feedback.id)}
                                className="p-2 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 transition-colors"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Question Type and Choices */}
                        <div className="mt-3 pl-11">
                          <p className="text-gray-400 text-sm mb-2">Type: {feedback.feedbackQuestion.questionType}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {feedback.feedbackQuestion.choice1 && (
                              <div className="bg-neutral-700/30 rounded-md p-2 text-sm text-gray-300">
                                {feedback.feedbackQuestion.choice1}
                              </div>
                            )}
                            {feedback.feedbackQuestion.choice2 && (
                              <div className="bg-neutral-700/30 rounded-md p-2 text-sm text-gray-300">
                                {feedback.feedbackQuestion.choice2}
                              </div>
                            )}
                            {feedback.feedbackQuestion.choice3 && (
                              <div className="bg-neutral-700/30 rounded-md p-2 text-sm text-gray-300">
                                {feedback.feedbackQuestion.choice3}
                              </div>
                            )}
                            {feedback.feedbackQuestion.choice4 && (
                              <div className="bg-neutral-700/30 rounded-md p-2 text-sm text-gray-300">
                                {feedback.feedbackQuestion.choice4}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Reviewers Section */}
                        <div className="mt-4 pl-11 border-t border-gray-700 pt-3">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-blue-400 text-sm font-medium">Assigned Reviewers</h5>
                            <div className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-1">
                              {feedback.feedbackReviewers.length} / 3
                            </div>
                          </div>
                          
                          {feedback.feedbackReviewers.length > 0 ? (
                            <div className="space-y-2">
                              {[...feedback.feedbackReviewers]
                                .sort((a, b) => (a.reviewerName || "").localeCompare(b.reviewerName || ""))
                                .map(reviewer => (
                                  <div key={reviewer.id} className="bg-neutral-800 rounded-md p-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                          <Users className="h-3 w-3 text-purple-400" />
                                        </div>
                                        <span className="text-sm text-gray-300 mr-2">
                                          {reviewer.reviewerName || "Unknown Reviewer"}
                                        </span>
                                        
                                        {/* Show feedback response inline if completed */}
                                        {reviewer.status === 'COMPLETED' && feedbackResponses[reviewer.id] && (
                                          <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-1 mx-2">
                                            <p className="text-sm text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
                                              {feedbackResponses[reviewer.id]}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {reviewer.status !== 'COMPLETED' ? (
                                          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                                            PENDING
                                          </span>
                                        ) : (
                                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                            COMPLETED
                                          </span>
                                        )}
                                        {session?.user?.role === 'admin' && (
                                          <button 
                                            onClick={() => handleRemoveReviewer(reviewer.id)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">No reviewers assigned yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center p-8 border border-dashed border-gray-700 rounded-lg">
                  <p className="text-gray-400">No feedback questions assigned yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Click Create 360° Feedback to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add feedback form modal */}
      {showFeedbackForm && feedbackQuestions.length > 0 && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-neutral-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">360° Feedback</div>
              <h2 className="text-2xl text-white font-bold">
                Question {currentQuestionIndex + 1} of {feedbackQuestions.length}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Skip to last question button */}
              {feedbackQuestions.length > 1 && currentQuestionIndex < feedbackQuestions.length - 1 && (
                <button 
                  onClick={() => setCurrentQuestionIndex(feedbackQuestions.length - 1)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-full p-2 transition-all duration-200"
                  title="Skip to Last Question"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                  </svg>
                </button>
              )}
              {/* Add edit and delete buttons */}
              <button 
                onClick={handleEditCurrentQuestion}
                className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded-full p-2 transition-all duration-200"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button 
                onClick={handleDeleteCurrentQuestion}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-full p-2 transition-all duration-200"
              >
                <Trash className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setShowFeedbackForm(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Current Question */}
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Question</label>
              <div className="bg-neutral-800/50 rounded-lg border border-gray-700 p-4">
                <p className="text-gray-200 text-lg font-medium">
                  {feedbackQuestions[currentQuestionIndex]?.questionText || "No question available"}
                </p>
              </div>
            </div>

            {/* Question Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Question Type</label>
              <div className="bg-neutral-800/30 rounded-lg border border-gray-700/50 p-3">
                <p className="text-gray-300 text-sm">
                  {feedbackQuestions[currentQuestionIndex]?.questionType || "Not specified"}
                </p>
              </div>
            </div>

            {/* Answer Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Answer Options</label>
              
              {/* Render choices */}
              <div className="space-y-3">
                {feedbackQuestions[currentQuestionIndex]?.choice1 && (
                  <div className="p-3 rounded-lg border bg-neutral-800/50 border-gray-700">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 ${
                        feedbackQuestions[currentQuestionIndex]?.questionType === "Multiple Choice" 
                          ? "rounded-full" 
                          : "rounded-sm"
                      } border-2 border-gray-500 flex items-center justify-center mr-3`}></div>
                      <span className="text-white">{feedbackQuestions[currentQuestionIndex].choice1}</span>
                    </div>
                  </div>
                )}
                  {feedbackQuestions[currentQuestionIndex]?.choice2 && (
                    <div className="p-3 rounded-lg border bg-neutral-800/50 border-gray-700">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 ${
                          feedbackQuestions[currentQuestionIndex]?.questionType === "Multiple Choice" 
                            ? "rounded-full" 
                            : "rounded-sm"
                        } border-2 border-gray-500 flex items-center justify-center mr-3`}></div>
                        <span className="text-white">{feedbackQuestions[currentQuestionIndex].choice2}</span>
                      </div>
                    </div>
                  )}
                  {feedbackQuestions[currentQuestionIndex]?.choice3 && (
                    <div className="p-3 rounded-lg border bg-neutral-800/50 border-gray-700">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 ${
                          feedbackQuestions[currentQuestionIndex]?.questionType === "Multiple Choice" 
                            ? "rounded-full" 
                            : "rounded-sm"
                        } border-2 border-gray-500 flex items-center justify-center mr-3`}></div>
                        <span className="text-white">{feedbackQuestions[currentQuestionIndex].choice3}</span>
                      </div>
                    </div>
                  )}
                  {feedbackQuestions[currentQuestionIndex]?.choice4 && (
                    <div className="p-3 rounded-lg border bg-neutral-800/50 border-gray-700">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 ${
                          feedbackQuestions[currentQuestionIndex]?.questionType === "Multiple Choice" 
                            ? "rounded-full" 
                            : "rounded-sm"
                        } border-2 border-gray-500 flex items-center justify-center mr-3`}></div>
                        <span className="text-white">{feedbackQuestions[currentQuestionIndex].choice4}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </Button>
              
              {/* Only show Add Question button on the last question */}
              {currentQuestionIndex === feedbackQuestions.length - 1 && (
                <Button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-5 w-5" />
                  Add Question
                </Button>
              )}
              
              <Button
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {currentQuestionIndex < feedbackQuestions.length - 1 ? (
                  <>
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </>
                ) : (
                  <>
                    Assign Reviewers
                    <Users className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddQuestionForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">360° Feedback</div>
                <h2 className="text-2xl text-white font-bold">
                  Add New Question
                </h2>
              </div>
              <button 
                onClick={() => setShowAddQuestionForm(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Question Form */}
            <div className="space-y-6">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
                <textarea
                  value={newQuestion.questionText || ''}
                  onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                  placeholder="Enter your question here..."
                />
              </div>
              
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Question Type</label>
                <div className="relative">
                  <select
                    value={newQuestion.questionType || 'Multiple Choice'}
                    onChange={(e) => setNewQuestion({...newQuestion, questionType: e.target.value})}
                    className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Check Boxes">Check Boxes</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Choices */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Answer Choices</label>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newQuestion.choice1 || ''}
                      onChange={(e) => setNewQuestion({...newQuestion, choice1: e.target.value})}
                      className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Choice 1"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newQuestion.choice2 || ''}
                      onChange={(e) => setNewQuestion({...newQuestion, choice2: e.target.value})}
                      className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Choice 2"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newQuestion.choice3 || ''}
                      onChange={(e) => setNewQuestion({...newQuestion, choice3: e.target.value})}
                      className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Choice 3"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newQuestion.choice4 || ''}
                      onChange={(e) => setNewQuestion({...newQuestion, choice4: e.target.value})}
                      className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Choice 4"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end mt-8">
              <Button
                onClick={() => setShowAddQuestionForm(false)}
                className="px-4 py-2 rounded-lg mr-3 bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNewQuestion}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Save Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add reviewer selection modal */}
      {showReviewerForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">360° Feedback</div>
                <h2 className="text-2xl text-white font-bold">
                  Assign Reviewers
                </h2>
              </div>
              <button 
                onClick={() => setShowReviewerForm(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Select up to 3 reviewers who will provide feedback for {searchedUsername}.
              </p>

                          {/* Search input */}
                          <div className="relative mb-6">
                <div className="flex items-center border border-gray-700 rounded-lg bg-neutral-800/50 px-3 py-2">
                  <Search className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search for reviewers..."
                    value={reviewerQuery}
                    onChange={handleReviewerInputChange}
                    className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
                  />
                </div>
                
                {/* Search results */}
                {availableReviewers.length > 0 && (
                  <div className="mt-2 bg-neutral-800 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                    {availableReviewers.map(reviewer => (
                      <div 
                        key={reviewer.id}
                        onClick={() => handleSelectReviewer(reviewer)}
                        className={`flex items-center justify-between p-3 hover:bg-neutral-700/50 cursor-pointer transition-colors ${
                          selectedReviewers.some(r => r.id === reviewer.id) ? 'bg-blue-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {reviewer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white">{reviewer.name}</span>
                        </div>
                        
                        {selectedReviewers.some(r => r.id === reviewer.id) && (
                          <div className="bg-blue-500 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {reviewerQuery && availableReviewers.length === 0 && (
                  <div className="mt-2 p-3 text-center text-gray-400 bg-neutral-800/50 border border-gray-700 rounded-lg">
                    No matching reviewers found
                  </div>
                )}
              </div>
              
              {/* Selected reviewers */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Reviewers ({selectedReviewers.length}/3)</h3>
                
                {selectedReviewers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedReviewers.map((reviewer, index) => (
                      <div key={reviewer.id} className="flex items-center justify-between bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                          <span className="text-white">{reviewer.name}</span>
                        </div>
                        <button
                          onClick={() => handleSelectReviewer(reviewer)}
                          className="p-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-700 rounded-lg text-center">
                    <p className="text-gray-500">No reviewers selected yet</p>
                    <p className="text-gray-400 text-sm mt-1">Search and select up to 3 reviewers</p>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <Button
                  onClick={() => {
                    setShowReviewerForm(false);
                    setShowFeedbackForm(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                >
                  Back to Questions
                </Button>
                
                <Button
                  onClick={handleAssignReviewers}
                  disabled={selectedReviewers.length === 0 || isSubmitting}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white ${
                    selectedReviewers.length === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      Assign Reviewers
                      <Check className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit question modal */}
      {showEditForm && currentEditQuestion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Edit Question</div>
                <h2 className="text-2xl text-white font-bold">
                  Customize Feedback Question
                </h2>
              </div>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  setCurrentEditQuestion(null);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Text</label>
                <textarea
                  value={currentEditQuestion.questionText}
                  onChange={(e) => setCurrentEditQuestion({
                    ...currentEditQuestion,
                    questionText: e.target.value
                  })}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white resize-none min-h-[100px]"
                  placeholder="Enter question text..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Type</label>
                <select
                  value={currentEditQuestion.questionType}
                  onChange={(e) => setCurrentEditQuestion({
                    ...currentEditQuestion,
                    questionType: e.target.value
                  })}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg p-3 text-white"
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TEXT">Text</option>
                  <option value="RATING">Rating</option>
                </select>
              </div>
              
              {currentEditQuestion.questionType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Answer Options</label>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={currentEditQuestion.choice1 || ''}
                      onChange={(e) => setCurrentEditQuestion({
                        ...currentEditQuestion,
                        choice1: e.target.value
                      })}
                      className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg p-2 text-white"
                      placeholder="Option 1"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={currentEditQuestion.choice2 || ''}
                      onChange={(e) => setCurrentEditQuestion({
                        ...currentEditQuestion,
                        choice2: e.target.value
                      })}
                      className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg p-2 text-white"
                      placeholder="Option 2"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={currentEditQuestion.choice3 || ''}
                      onChange={(e) => setCurrentEditQuestion({
                        ...currentEditQuestion,
                        choice3: e.target.value
                      })}
                      className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg p-2 text-white"
                      placeholder="Option 3"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={currentEditQuestion.choice4 || ''}
                      onChange={(e) => setCurrentEditQuestion({
                        ...currentEditQuestion,
                        choice4: e.target.value
                      })}
                      className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg p-2 text-white"
                      placeholder="Option 4"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => {
                  setShowEditForm(false);
                  setCurrentEditQuestion(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => {
                  // Use handleUpdateCurrentQuestion if editing from the feedback form
                  if (showFeedbackForm) {
                    handleUpdateCurrentQuestion(currentEditQuestion);
                  } else {
                    // Find the user feedback entry for this question
                    const userFeedbackEntry = userFeedback.find(
                      uf => uf.feedbackQuestionId === currentEditQuestion.id
                    );
                    
                    if (userFeedbackEntry) {
                      handleUpdateQuestion(currentEditQuestion, userFeedbackEntry.id);
                    }
                  }
                }}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}