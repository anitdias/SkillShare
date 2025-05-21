"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Users, Plus, X, Trash, Star } from "lucide-react";
import {
    DropdownItem,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    Avatar,
  } from "@heroui/react";
  import { signOut } from "next-auth/react";
  import { Search } from "lucide-react";
  import { useRouter } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";

  interface OrgNode {
    id: string;
    employeeNo: string;
    name: string;
    position?: string;
    userId?: string | null; // Add userId to the interface
    children: OrgNode[];
  }

interface SearchUser {
  id: string;
  name: string;
}

interface AddEmployeeFormData {
  employeeNo: string;
  employeeName: string;
  managerNo: string;
  managerName: string;
  effectiveDate: Date | null;
}

const TreeNode = ({ 
  node, 
  level = 0,
  onDeleteClick,
  parentNode = null
}: { 
  node: OrgNode; 
  level?: number;
  onDeleteClick?: (employee: {employeeNo: string, name: string}) => void;
  parentNode?: OrgNode | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const bgOpacity = Math.max(0.2, 1 - level * 0.15); // Gradually reduce opacity for deeper levels
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const isManager = session?.user?.role === "manager";
  const router = useRouter();

  const handleFeedbackClick = () => {
    if (node.userId) {
      router.push(`/admin-feedback?userid=${node.userId}&username=${node.name}`);
    }
  };

  const handleCompetencyClick = () => {
    if (node.userId) {
      router.push(`/search-competency?userid=${node.userId}&username=${node.name}`);
    }
  };

  const isUserManagerOfThisNode = parentNode && 
    session?.user?.employeeNo && 
    parentNode.employeeNo === session.user.employeeNo;;

    const showFeedbackButton = node.userId && (
      // Admin can see feedback button on all nodes except those with admin role
      // and except on themselves
      (isAdmin && node.position !== "admin" && node.userId !== session?.user?.id) || 
      // Manager can see feedback button ONLY on their direct subordinates
      (isManager && isUserManagerOfThisNode)
    );

    const showCompetencyButton = node.userId && (
      isAdmin || (isManager && isUserManagerOfThisNode)
    );

  return (
    <div className="mb-3">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: level * 0.1 }}
      >
        <Card 
          className={`p-4 border border-[#3b3b3b] bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300`}
        >
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ 
                background: `linear-gradient(135deg, rgba(100,100,100,${bgOpacity}) 0%, rgba(30,30,30,${bgOpacity}) 100%)` 
              }}
            >
              <span className="text-white font-medium">{node.name.charAt(0)}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-medium">{node.name}</h3>
              <div className="flex items-center">
                <span className="text-gray-400 text-xs mr-2">{node.employeeNo}</span>
                {node.position && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                    {node.position}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Competency button - visible to admins and managers */}
              {showCompetencyButton && (
                <button
                  onClick={handleCompetencyClick}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-900/30 hover:bg-purple-700/50 transition-colors"
                  title="View Competencies"
                >
                  <Star size={14} className="text-purple-400" />
                </button>
              )}
            
            <div className="flex items-center gap-2">
              {/* 360° Feedback button - visible based on role and position */}
              {showFeedbackButton && (
                <button
                  onClick={handleFeedbackClick}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-900/30 hover:bg-blue-700/50 transition-colors"
                  title="360° Feedback"
                >
                  <Users size={14} className="text-blue-400" />
                </button>
              )}
              
              {/* Delete button - only visible to admins */}
              {isAdmin && onDeleteClick && (
                <button
                  onClick={() => onDeleteClick({ employeeNo: node.employeeNo, name: node.name })}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-red-900/30 hover:bg-red-700/50 transition-colors"
                  title="Delete employee"
                >
                  <Trash size={14} className="text-red-400" />
                </button>
              )}
              
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
          </div>
        </Card>
      </motion.div>

      {hasChildren && isExpanded && (
        <div className="ml-6 pl-6 border-l border-[#3b3b3b] mt-2">
          <AnimatePresence>
            {node.children.map((child) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
                onDeleteClick={onDeleteClick}
                parentNode={node} // Pass the current node as parent to children
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default function OrganizationPage() {
  const { data: session, status } = useSession();
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [formData, setFormData] = useState<AddEmployeeFormData>({
    employeeNo: '',
    employeeName: '',
    managerNo: '',
    managerName: '',
    effectiveDate: null
  });
  const [availableManagers, setAvailableManagers] = useState<{employeeNo: string, employeeName: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{employeeNo: string, name: string} | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const fulltext = "<SkillSikt/>";

  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        const response = await fetch("/api/org-chart");
        if (!response.ok) throw new Error("Failed to fetch org chart");
        const data = await response.json();
        setOrgData(data);
        
        // Extract only employees who have subordinates (managers)
        const extractManagers = (node: OrgNode | null): {employeeNo: string, employeeName: string}[] => {
          if (!node) return [];
          
          let managers: {employeeNo: string, employeeName: string}[] = [];
          
          // Only add this node as a manager if it has children
          if (node.children && node.children.length > 0) {
            managers.push({
              employeeNo: node.employeeNo,
              employeeName: node.name
            });
            
            // Recursively find managers in children
            node.children.forEach(child => {
              managers = [...managers, ...extractManagers(child)];
            });
          }
          
          return managers;
        };
        
        if (data) {
          setAvailableManagers(extractManagers(data));
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchOrgChart();
    }
  }, [status]);

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


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };
  
  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, effectiveDate: date }));
    setDatePickerOpen(false);
  };
  
  const handleManagerSelect = (manager: {employeeNo: string, employeeName: string}) => {
    setFormData(prev => ({
      ...prev,
      managerNo: manager.employeeNo,
      managerName: manager.employeeName
    }));
    setShowManagerDropdown(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeNo || !formData.employeeName) {
      setErrorMessage("Employee number and name are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/org-chart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add employee");
      }
      
      // Refresh org chart data
      const updatedOrgChart = await fetch("/api/org-chart");
      const updatedData = await updatedOrgChart.json();
      setOrgData(updatedData);
      
      // Update available managers
      if (updatedData) {
        const extractEmployees = (node: OrgNode | null): {employeeNo: string, employeeName: string}[] => {
          if (!node) return [];
          
          const employees = [{
            employeeNo: node.employeeNo,
            employeeName: node.name
          }];
          
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              employees.push(...extractEmployees(child));
            });
          }
          
          return employees;
        };
        
        setAvailableManagers(extractEmployees(updatedData));
      }
      
      // Reset form and close modal
      setFormData({
        employeeNo: '',
        employeeName: '',
        managerNo: '',
        managerName: '',
        effectiveDate: null
      });
      setIsAddEmployeeOpen(false);
      
      // Show success message
      setErrorMessage('');
    } catch (error) {
      console.error("Error adding employee:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/org-chart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ employeeNo: employeeToDelete.employeeNo })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete employee");
      }
      
      // Refresh org chart data
      const updatedOrgChart = await fetch("/api/org-chart");
      const updatedData = await updatedOrgChart.json();
      setOrgData(updatedData);
      
      // Update available managers
      if (updatedData) {
        const extractManagers = (node: OrgNode | null): {employeeNo: string, employeeName: string}[] => {
          if (!node) return [];
          
          let managers: {employeeNo: string, employeeName: string}[] = [];
          
          // Only add this node as a manager if it has children
          if (node.children && node.children.length > 0) {
            managers.push({
              employeeNo: node.employeeNo,
              employeeName: node.name
            });
            
            // Recursively find managers in children
            node.children.forEach(child => {
              managers = [...managers, ...extractManagers(child)];
            });
          }
          
          return managers;
        };
        
        setAvailableManagers(extractManagers(updatedData));
      }
      
      // Close modal
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      
    } catch (error) {
      console.error("Error deleting employee:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative">
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
              className="w-full p-2 pl-10  border-gray-300 border-2 rounded-full shadow-sm focus:outline-none text-white"
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
      
      {/* Background effects */}
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

      {/* Content */}
      <div className="relative z-10 container mx-auto py-12 px-4 mt-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Organization Structure</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore our companys hierarchical structure and team organization
          </p>
          
          {/* Add Employee Button - Only visible to admins, now centered */}
          <div className="flex justify-center mt-6">
            {session?.user?.role === "admin" && (
              <Button 
                onClick={() => setIsAddEmployeeOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-md shadow-md transition-all duration-300 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Employee
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : orgData ? (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-[#3b3b3b]">
              <TreeNode node={orgData} onDeleteClick={(employee) => {
              setEmployeeToDelete(employee);
              setIsDeleteModalOpen(true);
            }} />
            </div>
          ) : (
            <div className="text-center py-12 bg-black/30 backdrop-blur-sm rounded-xl border border-[#3b3b3b]">
              <Users size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Organization Data</h3>
              <p className="text-gray-400">
                The organization chart hasnt been uploaded yet.
              </p>
              
              {/* Show add employee button if admin and no data */}
              {session?.user?.role === "admin" && (
                <Button 
                  onClick={() => setIsAddEmployeeOpen(true)}
                  className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-md shadow-md transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Add First Employee
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Employee Modal - Custom implementation without Dialog component */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#121212] border border-[#3b3b3b] text-white max-w-md w-full rounded-lg shadow-xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-[#3b3b3b]">
              <h2 className="text-xl font-bold text-white">Add New Employee</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsAddEmployeeOpen(false)}
                className="rounded-full h-8 w-8 p-0 hover:bg-[#2a2a2a]"
              >
                <X size={18} className="text-gray-400" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-2 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Employee Number *</p>
                <Input
                  id="employeeNo"
                  name="employeeNo"
                  value={formData.employeeNo}
                  onChange={handleFormChange}
                  placeholder="Enter employee number"
                  className="bg-[#1e1e1e] border-[#3b3b3b] text-white placeholder:text-gray-500 focus:border-blue-600"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Employee Name *</p>
                <Input
                  id="employeeName"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleFormChange}
                  placeholder="Enter employee name"
                  className="bg-[#1e1e1e] border-[#3b3b3b] text-white placeholder:text-gray-500 focus:border-blue-600"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Manager</p>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                    className="w-full justify-between bg-[#1e1e1e] border-[#3b3b3b] text-white hover:bg-[#2a2a2a] text-left"
                  >
                    {formData.managerName || "Select a manager"}
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </Button>
                  
                  {showManagerDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-[#3b3b3b] rounded-md shadow-lg max-h-60 overflow-auto">
                      {availableManagers.length > 0 ? (
                        availableManagers.map((manager) => (
                          <div
                            key={manager.employeeNo}
                            className="p-2 hover:bg-[#2a2a2a] cursor-pointer"
                            onClick={() => handleManagerSelect(manager)}
                          >
                            {manager.employeeName} ({manager.employeeNo})
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-400">No managers available</div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave empty for top-level employee</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-300">Effective Date</p>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDatePickerOpen(!datePickerOpen)}
                    className="w-full justify-start bg-[#1e1e1e] border-[#3b3b3b] text-white hover:bg-[#2a2a2a]"
                  >
                    {formData.effectiveDate ? (
                      formData.effectiveDate.toLocaleDateString()
                    ) : (
                      <span className="text-gray-500">Select a date</span>
                    )}
                  </Button>
                  
                  {datePickerOpen && (
                    <div className="absolute z-10 mt-1 p-3 bg-[#1e1e1e] border border-[#3b3b3b] rounded-md shadow-lg">
                      <input 
                        type="date" 
                        className="bg-[#2a2a2a] text-white p-2 rounded border border-[#3b3b3b]"
                        onChange={(e) => handleDateChange(new Date(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#3b3b3b]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="bg-transparent border-[#3b3b3b] text-white hover:bg-[#2a2a2a]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    {isDeleteModalOpen && employeeToDelete && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#121212] border border-[#3b3b3b] text-white max-w-md w-full rounded-lg shadow-xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-[#3b3b3b]">
            <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setEmployeeToDelete(null);
              }}
              className="rounded-full h-8 w-8 p-0 hover:bg-[#2a2a2a]"
            >
              <X size={18} className="text-gray-400" />
            </Button>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="text-center">
              <Trash size={40} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Delete Employee</h3>
              <p className="text-gray-400">
                Are you sure you want to delete <span className="text-white font-medium">{employeeToDelete.name}</span> ({employeeToDelete.employeeNo}) from the organization chart?
              </p>
              <p className="text-red-400 text-sm mt-2">
                This action cannot be undone. All subordinates will be reassigned to this employees manager.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#3b3b3b]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setEmployeeToDelete(null);
                }}
                className="bg-transparent border-[#3b3b3b] text-white hover:bg-[#2a2a2a]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteEmployee}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete Employee"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </div>
  );
}