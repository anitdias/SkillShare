'use client';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { signOut } from "next-auth/react";
import { Search, LucideX, LucidePlus, AlertCircle} from 'lucide-react';
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Tabs } from "@/components/ui/tabs";
import { GlowingStarsBackgroundCard, GlowingStarsTitle } from "@/components/ui/glowing-stars2";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Button,
} from "@heroui/react";

interface UserInfo {
  id: string;
  email: string;
  image: string | null;
  name: string | null;
  designation: string | null;
  description: string | null;
}

interface Competency {
  id: string;
  competencyType: string;
  competencyName: string;
  weightage: number;
  description: string | null;
  year: number;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  userCompetencyId: string | null;
}

interface Goal {
  id: string;
  goalCategory: string;
  goalName: string;
  goalTitle: string;
  metric: string;
  weightage: number;
  year: number;
  employeeRating: number;
  managerRating: number;
  adminRating: number;
  userGoalId: string | null;
}

interface GroupedCompetency {
  type: string;
  competencies: Competency[];
}

type Goals = Goal[];

interface SearchUser {
  id: string;
  name: string;
}

const calculateCategoryScore = (items: Competency[] | Goal[], isGoal = false) => {
  if (!items || items.length === 0) return 0;
  
  let totalScore = 0;
  let totalWeightage = 0;
  
  items.forEach(item => {
    // Calculate average rating from employee, manager, and admin ratings
    const avgRating = isGoal 
      ? ((item as Goal).employeeRating + (item as Goal).managerRating + (item as Goal).adminRating) / 3
      : ((item as Competency).employeeRating + (item as Competency).managerRating + (item as Competency).adminRating) / 3;
    
    // Add weighted score
    totalScore += avgRating * item.weightage;
    totalWeightage += item.weightage;
  });
  
  // Return normalized score out of 4 with one decimal precision
  return totalWeightage > 0 ? parseFloat(((totalScore / totalWeightage)).toFixed(1)) : 0;
};

const calculateOverallScore = (
  goals: Goals,
  competenciesByType: Record<string, Competency[]>
) => {
  // Category weightages
  const weightages = {
    'Goals': 0.30,
    'Core Values': 0.20,
    'Job Specific Competencies': 0.25,
    'Behaviour Competencies': 0.15,
    'Leadership Competencies': 0.10
  };
  
  // Calculate scores for each category
  const scores = {
    'Goals': calculateCategoryScore(goals, true),
    'Core Values': calculateCategoryScore(competenciesByType['Core Values'] || []),
    'Job Specific Competencies': calculateCategoryScore(competenciesByType['Job Specific Competencies'] || []),
    'Behaviour Competencies': calculateCategoryScore(competenciesByType['Behaviour Competencies'] || []),
    'Leadership Competencies': calculateCategoryScore(competenciesByType['Leadership Competencies'] || [])
  };
  
  // For debugging - log the competency types and scores
  console.log('Available competency types:', Object.keys(competenciesByType));
  console.log('Calculated scores:', scores);
  
  // Calculate weighted overall score
  let overallScore = 0;
  let availableWeightage = 0;
  
  Object.entries(scores).forEach(([category, score]) => {
    if (score > 0) {
      overallScore += score * weightages[category as keyof typeof weightages];
      availableWeightage += weightages[category as keyof typeof weightages];
    }
  });
  
  // Normalize score if we have any valid categories and format to one decimal place
  return {
    categoryScores: scores,
    overallScore: availableWeightage > 0 ? parseFloat((overallScore / availableWeightage).toFixed(1)) : 0
  };
};

export default function SearchCompetencyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchedUserId, setSearchedUserId] = useState<string | null>();
  const [searchedUsername, setSearchedUsername] = useState<string | null>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [groupedCompetencies, setGroupedCompetencies] = useState<GroupedCompetency[]>([]);
  const [groupedGoals, setGroupedGoals] = useState<Goals>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState({
    goalTitle: "",
    goalName: "",
    metric: "",
    weightage: "",
    goalCategory: ""
  });
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalName: '',
    goalTitle: '',
    metric: '',
    weightage: '',
    goalCategory: '' // Default category
  });
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [scoreData, setScoreData] = useState<{
    categoryScores: Record<string, number>;
    overallScore: number;
  }>({
    categoryScores: {
      'Goals': 0,
      'Core Values': 0,
      'Job Specific Competencies': 0,
      'Behaviour Competencies': 0,
      'Leadership Competencies': 0
    },
    overallScore: 0
  });

  useEffect(() => {
    // Delay loading of heavy background effects
    const timer = setTimeout(() => {
      setShowBackgroundEffects(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSearchedUserId('');
    setSearchedUsername(searchParams.get('username'));
    // Set the ID after clearing it to ensure the effect triggers properly
    setTimeout(() => {
      setSearchedUserId(searchParams.get('userid'));
    }, 0);
  }, [searchParams]);

  const fulltext = "<Skillsikt/>";
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if user has admin or manager role
      if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
        router.push('/profile');
      } else {
        fetchAvailableYears();
      }
    }
  }, [status, router, session?.user?.role]);

  useEffect(() => {
    if (expandedGoal) {
      const goal = groupedGoals.find(g => g.id === expandedGoal);
      if (goal) {
        setEditedGoal({
          goalTitle: goal.goalTitle,
          goalName: goal.goalName,
          metric: goal.metric,
          weightage: goal.weightage.toString(),
          goalCategory: goal.goalCategory
        });
      }
    }
  }, [expandedGoal, groupedGoals]);

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
    if (groupedGoals.length > 0 || groupedCompetencies.length > 0) {
      // Create a map of competency types for easier access
      const competenciesByType: Record<string, Competency[]> = {};
      
      // Log the actual competency types for debugging
      console.log('Competency groups:', groupedCompetencies.map(g => g.type));
      
      groupedCompetencies.forEach(group => {
        // Normalize category names to match the expected format in weightages
        let normalizedType = group.type;
        
        // Map any variations of category names to the expected format
        if (group.type.toLowerCase().includes('core value')) {
          normalizedType = 'Core Values';
        } else if (group.type.toLowerCase().includes('behaviour')) {
          normalizedType = 'Behaviour Competencies';
        } else if (group.type.toLowerCase().includes('job specific')) {
          normalizedType = 'Job Specific Competencies';
        } else if (group.type.toLowerCase().includes('leadership')) {
          normalizedType = 'Leadership Competencies';
        }
        
        competenciesByType[normalizedType] = group.competencies;
      });
      
      // Calculate scores
      const newScoreData = calculateOverallScore(groupedGoals, competenciesByType);
      setScoreData(newScoreData);
    }
  }, [groupedGoals, groupedCompetencies]);

  const Icon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-4 w-4 text-white stroke-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
        />
      </svg>
    );
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/competency-year');
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data.length > 0 ? data : [new Date().getFullYear()]);
        setSelectedYear(data.length > 0 ? data[0] : new Date().getFullYear());
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/search-competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchedUserId,
          year: selectedYear
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        setGroupedCompetencies(data.competencies);
        setGroupedGoals(data.goals); // Now this is a flat array of goals, not grouped by category
      }
    } catch (error) {
      console.error('Error while fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchedUserId, selectedYear]);

  useEffect(() => {
    // Reset data when searchedUserId changes
    setUserInfo(null);
    setGroupedCompetencies([]);
    setGroupedGoals([]);
    setIsLoading(true); // Set loading state when changing users

    if (searchedUserId && (session?.user?.role === 'admin' || session?.user?.role === 'manager')) {
      fetchUserData();
    }
  }, [searchedUserId, fetchUserData, session?.user?.role, selectedYear]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
  };

  const handleCompetencyRatingSubmit = async () => {
    if (!expandedCompetency || !searchedUserId || ratingValue < 1 || ratingValue > 4) return;
    
    setIsSubmitting(true);
    setError(''); // Clear any previous errors
    
    try {
      const competencyType = groupedCompetencies.find(group => 
        group.competencies.some(comp => comp.id === expandedCompetency)
      );
      if (!competencyType) return;
      
      const competency = competencyType.competencies.find(comp => comp.id === expandedCompetency);
      if (!competency) return;
      
      // Store the current expanded competency ID
      const currentExpandedCompetency = expandedCompetency;
      
      const response = await fetch('/api/update-competency-rating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchedUserId,
          competencyId: competency.id,
          rating: ratingValue,
          userCompetencyId: competency.userCompetencyId,
          year: selectedYear
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh data and restore expanded state
        await fetchUserData();
        setExpandedCompetency(currentExpandedCompetency);
      } else {
        setError(result.message || 'Failed to update competency rating');
        console.error('Failed to update competency rating:', result.message);
      }
    } catch (error) {
      setError('Error updating competency rating. Please try again.');
      console.error('Error updating competency rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalRatingSubmit = async () => {
    if (!expandedGoal || !searchedUserId || ratingValue < 1 || ratingValue > 4) return;
    
    setIsSubmitting(true);
    setError(''); // Clear any previous errors
    
    try {
      const goal = groupedGoals.find(g => g.id === expandedGoal);
      if (!goal) return;
      
      // Store the current expanded goal ID
      const currentExpandedGoal = expandedGoal;
      
      const response = await fetch('/api/update-goal-rating', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchedUserId,
          goalId: goal.id,
          rating: ratingValue,
          userGoalId: goal.userGoalId,
          year: selectedYear
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh data and restore expanded state
        await fetchUserData();
        setExpandedGoal(currentExpandedGoal);
      } else {
        setError(result.message || 'Failed to update goal rating');
        console.error('Failed to update goal rating:', result.message);
      }
    } catch (error) {
      setError('Error updating goal rating. Please try again.');
      console.error('Error updating goal rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalUpdate = async () => {
    if (!expandedGoal) return;
    
    const goal = groupedGoals.find(g => g.id === expandedGoal);
    if (!goal || !goal.userGoalId) {
      console.error("Goal or userGoalId not found");
      alert("Cannot update goal: missing required information");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("Sending update with data:", {
        userGoalId: goal.userGoalId,
        ...editedGoal,
        weightage: parseInt(editedGoal.weightage),
        userId: searchedUserId
      });
      
      const response = await fetch('/api/search-competency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userGoalId: goal.userGoalId,
          ...editedGoal,
          weightage: parseInt(editedGoal.weightage), // Convert to number
          userId: searchedUserId
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Update successful:", result);
        
        // Update the local state to reflect the change
        setGroupedGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === expandedGoal 
              ? { 
                  ...g, 
                  goalTitle: editedGoal.goalTitle,
                  goalName: editedGoal.goalName,
                  metric: editedGoal.metric,
                  weightage: parseInt(editedGoal.weightage),
                  goalCategory: editedGoal.goalCategory
                } 
              : g
          )
        );
        
        setIsEditing(false);
        
      } else {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGoal = async () => {
    if (!searchedUserId || !newGoal.goalName || !newGoal.goalTitle || !newGoal.metric || !newGoal.weightage) return;
    
    setIsSubmitting(true);
    setError(''); // Clear any previous errors
    
    try {
      const response = await fetch('/api/add-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchedUserId,
          goalName: newGoal.goalName,
          goalTitle: newGoal.goalTitle,
          metric: newGoal.metric,
          weightage: parseInt(newGoal.weightage),
          goalCategory: newGoal.goalCategory,
          year: selectedYear
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Reset form and close modal
        setNewGoal({
          goalName: '',
          goalTitle: '',
          metric: '',
          weightage: '',
          goalCategory: ''
        });
        setShowAddGoalModal(false);
        
        // Refresh data
        await fetchUserData();
      } else {
        setError(result.message || 'Failed to add goal');
        console.error('Failed to add goal:', result.message);
      }
    } catch (error) {
      setError('Error adding goal. Please try again.');
      console.error('Error adding goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!expandedGoal) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/add-goal`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId: expandedGoal,
          userId: searchedUserId
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete goal');
      }
  
      // Remove the deleted goal from the state
      setGroupedGoals(prev => prev.filter(g => g.id !== expandedGoal));
      setExpandedGoal(null);
      setShowDeleteConfirm(false);
      
      // Show success message or toast here if needed
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create tabs for competencies
  const competencyTabs = [
    // Add Goals as the first tab
    {
      title: "Goals",
      value: "goals",
      content: (
        <div className="w-full h-full p-4 bg-neutral-950 rounded-xl">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Performance</span>
              <div className="flex items-center gap-3">
                <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">Goals</h1>
              </div>
            </div>
            {/* Add Goal Button - Only visible for admin/manager */}
            {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setShowAddGoalModal(true)}
                  className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 hover:border-blue-400 text-white rounded-full p-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
                >
                  <LucidePlus size={20} />
                </Button>
              </motion.div>
            )}
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
          
          <div className="w-full flex flex-col mb-8">
            <div className="flex-1 overflow-hidden">
              {(() => {
                // Check if goals array exists and has items
                if (groupedGoals && groupedGoals.length > 0) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="carousel-container h-full py-3"
                    >
                      <Carousel
                        items={groupedGoals.map((goal, idx) => (
                          <Card 
                            key={goal.id}
                            card={{
                              title: goal.goalName,
                              category: `Weightage: ${goal.weightage}%`,
                              src: "", 
                              content: (
                                <motion.div
                                  whileHover={{ scale: 1.03, y: -5 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                  onClick={() => {
                                    setExpandedGoal(goal.id);
                                    setRatingValue(
                                      session?.user?.role === 'admin' 
                                        ? goal.adminRating 
                                        : goal.managerRating
                                    );
                                  }}
                                >
                                  <GlowingStarsBackgroundCard
                                    className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                                  >
                                    <div className="flex justify-start">
                                      <GlowingStarsTitle>{goal.goalName}</GlowingStarsTitle>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <div className="flex flex-col">
                                        <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                          Weightage: {goal.weightage}%
                                        </span>
                                      </div>
                                      <motion.div                                            
                                        className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.15)] flex items-center justify-center backdrop-blur-sm hover:bg-[hsla(0,0%,100%,.25)] transition-all duration-300"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Icon />
                                      </motion.div>
                                    </div>                          
                                  </GlowingStarsBackgroundCard>
                                </motion.div>
                              )
                            }}
                            index={idx}
                            layout={false}
                          />
                        ))}
                        initialScroll={0}
                      />
                    </motion.div>
                  );
                }
                return (
                  <div className="h-32 flex items-center justify-center my-4">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg text-center">
                      <p className="text-gray-400 text-lg mb-3">No goals found for this user</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ),
    },
    // Add the existing competency tabs
    ...groupedCompetencies.map(group => ({
      title: group.type,
      value: group.type,
      content: (
        <div className="w-full h-full p-4 bg-neutral-950 rounded-xl">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Performance</span>
              <div className="flex items-center gap-3">
                <h1 className="relative text-md md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500 font-bold font-mono">{group.type}</h1>
              </div>
            </div>
          </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent my-4" />
        
        <div className="w-full flex flex-col mb-8">
          <div className="flex-1 overflow-hidden">
          {(() => {
              if (group.competencies.length > 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="carousel-container h-full py-3"
                  >
                    <Carousel
                      items={group.competencies.map((competency, idx) => (
                        <Card 
                          key={competency.id}
                          card={{
                            title: competency.competencyName,
                            category: `Weightage: ${competency.weightage}%`,
                            src: "", 
                            content: (
                              <motion.div
                                whileHover={{ scale: 1.03, y: -5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                onClick={() => {
                                    setExpandedCompetency(competency.id);
                                    setRatingValue(
                                      session?.user?.role === 'admin' 
                                        ? competency.adminRating 
                                        : competency.managerRating
                                    );
                                  }}
                              >
                                <GlowingStarsBackgroundCard
                                  className="cursor-pointer transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
                                >
                                  <div className="flex justify-start">
                                    <GlowingStarsTitle>{competency.competencyName}</GlowingStarsTitle>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-purple-300 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                        Weightage: {competency.weightage}%
                                      </span>
                                    </div>
                                    <motion.div                                            
                                    className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.15)] flex items-center justify-center backdrop-blur-sm hover:bg-[hsla(0,0%,100%,.25)] transition-all duration-300"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Icon />
                                  </motion.div>
                                  </div>                          
                                </GlowingStarsBackgroundCard>
                              </motion.div>
                            )
                          }}
                          index={idx}
                          layout={false}
                        />
                      ))}
                      initialScroll={0}
                    />
                  </motion.div>
                );
              } else {
                return (
                  <div className="h-32 flex items-center justify-center my-4">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/30 shadow-lg text-center">
                      <p className="text-gray-400 text-lg mb-3">No competencies found in this category</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    ),
  }))
];

  

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

    return (
        <div className="min-h-screen bg-neutral-950 p-4 md:p-8">
          {/* navBar */}
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
                onClick={() => {
                  if (session?.user?.role === 'admin') {
                    router.push(`/admin-feedback?userid=${searchedUserId}&username=${searchedUsername}`);
                  } else {
                    router.push(`/reviewer-feedback?userid=${searchedUserId}&username=${searchedUsername}`);
                  }
                }}
                className="bg-transparent text-md hover:bg-gray-800 text-white rounded-md px-6 py-2 transition duration-300"
              >
                360° Feedback
              </Button>
            </div>
    
            {/* Right Section - Search Bar & Profile */}
            <div className="flex items-center gap-4">
              {/* Year Selector */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-2 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
    
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
                          router.push(`/search-competency?userid=${user.id}&username=${user.name}`);
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
                    data-loaded="true"
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
          
          {showBackgroundEffects && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <BackgroundBeams />
            </div>
          )}
    
          {/* User Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 ml-4 md:ml-12 mt-20 md:mt-2">
            <AnimatedTestimonials
              testimonials={[{
                quote: userInfo?.description || "No description available",
                name: searchedUsername || "User",
                designation: userInfo?.designation || "Employee",
                src: userInfo?.image || "https://plus.unsplash.com/premium_photo-1711044006683-a9c3bbcf2f15?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              }]}
            />
            
            {/* Overall Score Card */}
            <div className="flex items-center justify-center mt-6 mb-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-2xl border border-blue-500/20 shadow-lg backdrop-blur-sm"
              >
                <h2 className="text-xl text-center font-bold text-white mb-4">Employee Score</h2>
                <div className="flex flex-row items-start justify-between gap-6">
                  {/* Circular progress indicator */}
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="#1e293b" 
                        strokeWidth="8"
                      />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 45 * scoreData.overallScore / 4} ${2 * Math.PI * 45 * (1 - scoreData.overallScore / 4)}`}
                        strokeDashoffset={2 * Math.PI * 45 * 0.25}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold text-white">{scoreData.overallScore.toFixed(1)}/4</span>
                      <span className="text-xs text-blue-300">Overall Performance</span>
                    </div>
                  </div>
                  
                  {/* Category breakdown - now positioned to the right */}
                  <div className="space-y-2 flex-1">
                    {Object.entries(scoreData.categoryScores).map(([category, score]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-300 mr-1">{category}</span>
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(score / 4) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-blue-300 ml-2">{score.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
    
          {/* Competencies Section */}
          <div className="h-[38rem] [perspective:1000px] flex flex-col max-w-7xl mx-auto w-full items-start justify-start">
            <Tabs tabs={competencyTabs} />
          </div>

            {expandedCompetency && (() => {
            const competencyType = groupedCompetencies.find(group => 
              group.competencies.some(comp => comp.id === expandedCompetency)
            );
            
            if (!competencyType) return null;
            
            const competency = competencyType.competencies.find(comp => comp.id === expandedCompetency);
            if (!competency) return null;
            
            return (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-auto max-h-[98vh]"
                >
                  {/* Header with gradient background */}
                  <div className="relative bg-neutral-950 p-5">
                    <div 
                      className="absolute top-0 left-0 w-full h-full opacity-40"
                      style={{
                        backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "10px 10px"
                      }}
                    />
                    
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Competency</div>
                        <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">
                          {competency.competencyName}
                        </h2>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setExpandedCompetency(null);
                          setError('');}}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                      >
                        <LucideX size={18} />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Content area */}
                  <div className="p-6">
                    {/* Weightage Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <motion.span 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-blue-300 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                      >
                        Weightage: {competency.weightage}%
                      </motion.span>
                      <motion.span 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-purple-300 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                      >
                        Type: {competencyType.type}
                      </motion.span>
                      <motion.span 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-green-300 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                      >
                        Year: {competency.year}
                      </motion.span>
                    </div>
                    
                    {/* Description */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                          {/* Description content with enhanced styling and increased height */}
                          <div className="p-5 max-h-[280px] overflow-y-auto custom-scrollbar">
                            {competency.description?.split('\n').map((line, i, arr) => {
                              // Check if line looks like a heading (ends with a colon)
                              const isHeading = line.trim().endsWith(':');
                              // Check if line looks like a bullet point
                              const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
                              // Format numbers to be bold
                              const formattedLine = line.replace(/(\d+)/g, '<span class="font-bold text-blue-200">$1</span>')
                                // Replace number followed by arrow and colon pattern
                                .replace(/(\d+)\s*(-&gt;|->|→)\s*:/g, '<span class="font-bold text-blue-200">$1</span> <span class="mx-1 text-purple-400">→</span> <span class="text-yellow-400 font-medium">:</span>')
                                // Replace other arrows
                                .replace(/(-&gt;|->|→)/g, '<span class="mx-1 text-purple-400">→</span>')
                                // Replace colons in non-heading lines
                                .replace(/(:\s)/g, '<span class="text-yellow-400 font-medium">: </span>');
                              
                              return (
                                <div key={i} className={`${i < arr.length - 1 ? 'mb-2' : ''}`}>
                                  {isHeading ? (
                                    <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                                      {line.replace(/:$/, '')}
                                      <span className="ml-1 text-yellow-400 text-lg">:</span>
                                    </h4>
                                  ) : isBullet ? (
                                    <div className="flex mb-1.5">
                                      <span className="text-purple-400 mr-2 text-lg">•</span>
                                      <p 
                                        className="text-gray-200"
                                        dangerouslySetInnerHTML={{ 
                                          __html: formattedLine.replace(/^[-•]\s*/, '') 
                                        }}
                                      />
                                    </div>
                                  ) : line ? (
                                    <p 
                                      className="text-gray-200 leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: formattedLine }}
                                    />
                                  ) : (
                                    <div className="h-3"></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Subtle gradient fade at bottom for scrollable content */}
                          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-neutral-800/90 to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Ratings */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mb-8"
                    >
                      <h3 className="text-sm font-medium text-blue-200 mb-3">Current Ratings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-blue-700/30">
                          <p className="text-gray-400 text-sm mb-1">Employee Rating</p>
                          <p className="text-3xl font-bold text-blue-400">{competency.employeeRating}<span className="text-lg text-blue-500/70">/4</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-green-700/30">
                          <p className="text-gray-400 text-sm mb-1">Manager Rating</p>
                          <p className="text-3xl font-bold text-green-400">{competency.managerRating}<span className="text-lg text-green-500/70">/4</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-purple-700/30">
                          <p className="text-gray-400 text-sm mb-1">Supervisor Rating</p>
                          <p className="text-3xl font-bold text-purple-400">{competency.adminRating}<span className="text-lg text-purple-500/70">/4</span></p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Rating Selection */}
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">Your Rating</label>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          Rating {ratingValue}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="h-2 bg-gray-700 rounded-full w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${ratingValue * 25}%`
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20"
                          />
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          {[0, 1, 2, 3, 4].map((level) => (
                            <motion.button
                              key={level}
                              whileHover={{ y: -3, scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setRatingValue(level)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                ratingValue === level 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30" 
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              {level}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-start"
                      >
                        <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <p>{error}</p>
                      </motion.div>
                    )}
                    
                    {/* Action Buttons */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex justify-end gap-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {setExpandedCompetency(null);
                          setError('');
                        }}
                        className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCompetencyRatingSubmit}
                        disabled={isSubmitting || ratingValue < 1}
                        className={`px-5 py-2.5 rounded-lg transition-colors ${
                          isSubmitting || ratingValue < 1
                            ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20'
                        }`}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Rating'}
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })()}

        {/* Expanded Goal Modal */}
        {expandedGoal && (() => {
          const goal = groupedGoals.find(g => g.id === expandedGoal);
          if (!goal) return null;
          
          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]"
              >
                {/* Header with gradient background */}
                <div className="relative bg-neutral-950 p-4">
                  <div 
                    className="absolute top-0 left-0 w-full h-full opacity-40"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "10px 10px"
                    }}
                  />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-1">
                        {isEditing ? "Edit Goal" : "Goal"}
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedGoal.goalName}
                          onChange={(e) => setEditedGoal({...editedGoal, goalName: e.target.value})}
                          className="text-2xl text-white font-bold bg-transparent border-b border-green-400 focus:outline-none w-full"
                          placeholder="Goal Name"
                        />
                      ) : (
                        <h2 className="text-2xl text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-green-400">
                          {goal.goalName}
                        </h2>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Delete button - only visible to admins and managers */}
                      {(session?.user?.role === "admin" || session?.user?.role === "manager") && !isEditing && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full p-2 transition-all duration-200"
                          title="Delete goal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </motion.button>
                      )}
                      {(session?.user?.role === "admin" || session?.user?.role === "manager") && !isEditing && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsEditing(true)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full p-2 transition-all duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </motion.button>
                      )}
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setExpandedGoal(null);
                          setIsEditing(false);
                          setError('');
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                      >
                        <LucideX size={18} />
                      </motion.button>
                    </div>
                  </div>
                  </div>
                
                {/* Content area */}
                <div className="p-5 overflow-y-auto">
                  {/* Weightage Badge */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {isEditing ? (
                      <>
                        <div className="w-full mb-3">
                          <label className="text-xs text-gray-400 mb-1 block">Weightage (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={editedGoal.weightage}
                            onChange={(e) => setEditedGoal({...editedGoal, weightage: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          />
                        </div>
                        <div className="w-full mb-3">
                          <label className="text-xs text-gray-400 mb-1 block">Category</label>
                          <input
                            type="text"
                            value={editedGoal.goalCategory}
                            onChange={(e) => setEditedGoal({...editedGoal, goalCategory: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-sm text-green-300 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                        >
                          Weightage: {goal.weightage}%
                        </motion.span>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-blue-300 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                        >
                          Category: {goal.goalCategory}
                        </motion.span>
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-sm text-purple-300 px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                        >
                          Year: {goal.year}
                        </motion.span>
                      </>
                    )}
                  </div>
                  
                  {/* Goal Details */}
                  {/* Goal Details */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <div className="relative group mb-4">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <h3 className="text-sm font-medium text-green-200 mb-2">Goal Title</h3>
                        {isEditing ? (
                          <textarea
                            value={editedGoal.goalTitle}
                            onChange={(e) => setEditedGoal({...editedGoal, goalTitle: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[80px]"
                            placeholder="Enter goal title"
                          />
                        ) : (
                          <p className="text-gray-300">{goal.goalTitle}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <h3 className="text-sm font-medium text-green-200 mb-2">Metric</h3>
                        {isEditing ? (
                          <textarea
                            value={editedGoal.metric}
                            onChange={(e) => setEditedGoal({...editedGoal, metric: e.target.value})}
                            className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[120px]"
                            placeholder="Enter success metric"
                          />
                        ) : (
                          <p className="text-gray-300">{goal.metric}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Ratings */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <h3 className="text-sm font-medium text-green-200 mb-3">Current Ratings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-blue-700/30">
                        <p className="text-gray-400 text-sm mb-1">Employee Rating</p>
                        <p className="text-3xl font-bold text-blue-400">{goal.employeeRating}<span className="text-lg text-blue-500/70">/4</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-green-700/30">
                        <p className="text-gray-400 text-sm mb-1">Manager Rating</p>
                        <p className="text-3xl font-bold text-green-400">{goal.managerRating}<span className="text-lg text-green-500/70">/4</span></p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg text-center backdrop-blur-sm border border-purple-700/30">
                        <p className="text-gray-400 text-sm mb-1">Supervisor Rating</p>
                        <p className="text-3xl font-bold text-purple-400">{goal.adminRating}<span className="text-lg text-purple-500/70">/4</span></p>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Rating Selection - Only show if not editing */}
                  {!isEditing && (
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">Your Rating</label>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          Rating {ratingValue}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="h-2 bg-gray-700 rounded-full w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${ratingValue * 25}%`
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20"
                          />
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          {[0, 1, 2, 3, 4].map((level) => (
                            <motion.button
                              key={level}
                              whileHover={{ y: -3, scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setRatingValue(level)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                ratingValue === level 
                                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30" 
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              {level}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Only show error in non-editing mode here */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-start"
                    >
                      <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                      <p>{error}</p>
                    </motion.div>
                  )}
                  
                  {/* Action Buttons */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-end gap-3"
                  >
                    {isEditing ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setIsEditing(false)}
                          className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleGoalUpdate}
                          disabled={isSubmitting || !editedGoal.goalName || !editedGoal.goalTitle || !editedGoal.metric || !editedGoal.weightage}
                          className={`px-5 py-2.5 rounded-lg transition-colors ${
                            isSubmitting || !editedGoal.goalName || !editedGoal.goalTitle || !editedGoal.metric || !editedGoal.weightage
                              ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {setExpandedGoal(null);
                            setError('');
                          }}
                          className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleGoalRatingSubmit}
                          disabled={isSubmitting || ratingValue < 1}
                          className={`px-5 py-2.5 rounded-lg transition-colors ${
                            isSubmitting || ratingValue < 1
                              ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Rating'}
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          );
      })()}

      {showDeleteConfirm && expandedGoal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-red-700/30 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Goal</h3>
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete this goal? This action cannot be undone.
              </p>
              <p className="text-red-400 text-sm">
                Note: This will only remove the goal from this users profile.
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDeleteGoal}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Goal'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {showAddGoalModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-lg rounded-xl border border-gray-700 p-0 max-w-2xl w-full shadow-2xl overflow-auto max-h-[85vh]"
            >
              {/* Header with gradient background */}
              <div className="relative bg-neutral-950 p-4">
                <div 
                  className="absolute top-0 left-0 w-full h-full opacity-40"
                  style={{
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "10px 10px"
                  }}
                />
                
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-1">
                      Add New Goal
                    </div>
                    <h2 className="text-2xl text-white font-bold">
                      Create Goal for {searchedUsername}
                    </h2>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowAddGoalModal(false);
                      setError(''); // Clear error when closing modal
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-all duration-200"
                  >
                    <LucideX size={18} />
                  </motion.button>
                </div>
              </div>
              
              {/* Content area */}
              <div className="p-6">
              
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  {/* Goal Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Goal Name</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <textarea
                          value={newGoal.goalName}
                          onChange={(e) => setNewGoal({...newGoal, goalName: e.target.value})}
                          className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[80px]"
                          placeholder="Enter goal name"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Goal Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Goal Title</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <textarea
                          value={newGoal.goalTitle}
                          onChange={(e) => setNewGoal({...newGoal, goalTitle: e.target.value})}
                          className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[80px]"
                          placeholder="Enter goal title"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Metric */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Metric</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <textarea
                          value={newGoal.metric}
                          onChange={(e) => setNewGoal({...newGoal, metric: e.target.value})}
                          className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50 min-h-[120px]"
                          placeholder="Enter success metric"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Weightage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weightage (%)</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newGoal.weightage}
                          onChange={(e) => setNewGoal({...newGoal, weightage: e.target.value})}
                          className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          placeholder="Enter weightage percentage"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Goal Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Goal Category</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-neutral-800/50 rounded-lg border border-gray-700 shadow-xl p-4">
                        <input
                          type="text"
                          value={newGoal.goalCategory}
                          onChange={(e) => setNewGoal({...newGoal, goalCategory: e.target.value})}
                          className="bg-neutral-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500/50"
                          placeholder="Enter goal category"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-start mt-2"
                >
                  <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                  <p>{error}</p>
                </motion.div>
              )}
                
                {/* Action Buttons */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-end gap-3 mt-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowAddGoalModal(false);
                      setError('');
                    }}
                    className="px-5 py-2.5 bg-gray-800/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors border border-gray-700/50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddGoal}
                    disabled={isSubmitting || !newGoal.goalName || !newGoal.goalTitle || !newGoal.metric || !newGoal.weightage}
                    className={`px-5 py-2.5 rounded-lg transition-colors ${
                      isSubmitting || !newGoal.goalName || !newGoal.goalTitle || !newGoal.metric || !newGoal.weightage
                        ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                    }`}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Goal'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
        
        </div>
        
      );
    }