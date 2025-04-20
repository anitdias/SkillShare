"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertCircle, Users, BarChart, MessageSquare } from "lucide-react";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { signOut } from "next-auth/react";
import { Search } from "lucide-react";


interface SearchUser {
  id: string;
  name: string;
}

export default function UploadExcel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [query, setQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("competencies");
  const [orgFile, setOrgFile] = useState<File | null>(null);
  const [isOrgUploading, setIsOrgUploading] = useState(false);
  const [orgUploadStatus, setOrgUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [orgStatusMessage, setOrgStatusMessage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null>(null);
  const [processingSteps, setProcessingSteps] = useState<Record<string, string>>({});
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
  const [isFeedbackUploading, setIsFeedbackUploading] = useState(false);
  const [feedbackUploadStatus, setFeedbackUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState("");

  const fulltext = "<SkillShare/>";

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        setIsAuthorized(true);
      } else {
        // Not an admin, redirect to unauthorized page
        router.push("/unauthorized");
      }
    }
  }, [session, status, router]);
  
  useEffect(() => {
    // Clean up polling when component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is Excel
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setFile(selectedFile);
        setUploadStatus("idle");
        setStatusMessage("");
      } else {
        setFile(null);
        setUploadStatus("error");
        setStatusMessage("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleFeedbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is Excel
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setFeedbackFile(selectedFile);
        setFeedbackUploadStatus("idle");
        setFeedbackStatusMessage("");
      } else {
        setFeedbackFile(null);
        setFeedbackUploadStatus("error");
        setFeedbackStatusMessage("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleFeedbackUpload = async () => {
    if (!feedbackFile) return;
  
    setIsFeedbackUploading(true);
    setFeedbackUploadStatus("idle");
    setFeedbackStatusMessage("");
  
    try {
      const formData = new FormData();
      formData.append("file", feedbackFile);
      formData.append("year", selectedYear.toString());
  
      const response = await fetch("/api/feedback-upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setFeedbackUploadStatus("success");
        setFeedbackStatusMessage(`Successfully processed ${data.questionsAdded} feedback questions for year ${selectedYear}.`);
      } else {
        throw new Error(data.error || "Failed to upload feedback questions");
      }
    } catch (error) {
      console.error("Error uploading feedback questions:", error);
      setFeedbackUploadStatus("error");
      setFeedbackStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsFeedbackUploading(false);
    }
  };

  const startPollingJobStatus = (id: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set initial job status
    setJobStatus("PENDING");
    
    // Start polling every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/upload-excel/job-status?jobId=${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job status");
        }
        
        setJobStatus(data.job.status);
        setProcessingSteps(data.job.steps || {});
        
        // If job is completed or failed, stop polling
        if (data.job.status === "COMPLETED" || data.job.status === "FAILED") {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (data.job.status === "COMPLETED") {
            setUploadStatus("success");
            setStatusMessage(`Successfully processed competencies for year ${data.job.year}. All data has been imported.`);
          } else if (data.job.status === "FAILED") {
            setUploadStatus("error");
            setStatusMessage(data.job.error || "An error occurred during processing");
          }
          
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        clearInterval(interval);
        setPollingInterval(null);
        setUploadStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Failed to check job status");
        setIsUploading(false);
      }
    }, 10000);
    
    setPollingInterval(interval);
  };

  // Replace the handleUpload function with this updated version
  const handleUpload = async () => {
    if (!file) return;
  
    setIsUploading(true);
    setUploadStatus("idle");
    setStatusMessage("");
    setJobId(null);
    setJobStatus(null);
    setProcessingSteps({});
  
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", selectedYear.toString());
  
      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store the job ID and start polling
        setJobId(data.jobId);
        setStatusMessage(data.message);
        startPollingJobStatus(data.jobId);
      } else {
        throw new Error(data.error || "Failed to upload competencies");
      }
    } catch (error) {
      console.error("Error uploading competencies:", error);
      setUploadStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
      setIsUploading(false);
    }
  };

  const renderProcessingSteps = () => {
    if (!processingSteps || Object.keys(processingSteps).length === 0) {
      return null;
    }

    const stepLabels: Record<string, string> = {
      clearData: "Clearing existing data",
      importCompetencies: "Importing competencies",
      importGoals: "Importing goals",
      mapCompetencies: "Mapping competencies to users",
      mapGoals: "Mapping goals to users"
    };

    return (
      <div className="mt-4 bg-gray-900/50 p-4 rounded-md border border-gray-700">
        <h3 className="text-white text-sm font-medium mb-3">Processing Status:</h3>
        {jobId && (
          <p className="text-gray-400 text-xs mb-3">Job ID: {jobId}</p>
        )}
        <div className="space-y-2">
          {Object.entries(processingSteps).map(([step, status]) => (
            <div key={step} className="flex items-center">
              {status === "COMPLETED" ? (
                <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
              ) : status === "FAILED" ? (
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={16} />
              ) : status === "PROCESSING" ? (
                <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 mr-2 border-2 border-gray-500 rounded-full" />
              )}
              <span className={`text-sm ${
                status === "COMPLETED" ? "text-green-300" : 
                status === "FAILED" ? "text-red-300" : 
                status === "PROCESSING" ? "text-blue-300" : 
                "text-gray-400"
              }`}>
                {stepLabels[step] || step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleOrgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is Excel
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setOrgFile(selectedFile);
        setOrgUploadStatus("idle");
        setOrgStatusMessage("");
      } else {
        setOrgFile(null);
        setOrgUploadStatus("error");
        setOrgStatusMessage("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleOrgUpload = async () => {
    if (!orgFile) return;
  
    setIsOrgUploading(true);
    setOrgUploadStatus("idle");
    setOrgStatusMessage("");
  
    try {
      const formData = new FormData();
      formData.append("file", orgFile);
  
      const response = await fetch("/api/org-chart-upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setOrgUploadStatus("success");
        setOrgStatusMessage(`Successfully processed ${data.entriesAdded} organization entries. Top level manager: ${data.topLevelManager}`);
      } else {
        throw new Error(data.error || "Failed to upload organization chart");
      }
    } catch (error) {
      console.error("Error uploading organization chart:", error);
      setOrgUploadStatus("error");
      setOrgStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsOrgUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Remove the API call from here
  };

  if (status === "loading" || (status === "authenticated" && !isAuthorized)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium">Checking permissions...</p>
        </div>
      </div>
    );
  }

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
                        <DropdownItem key="logout" color="danger" onPress={() => signOut({ callbackUrl: "/" })} className="hover:bg-red-500 text-red-400 hover:text-white transition p-3 rounded-md">
                          Log Out
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </nav>
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <BackgroundBeams />
      </div>
      
      <div className="relative z-10 pt-20 px-4 md:px-8 max-w-4xl mx-auto">
        <Button 
          onClick={() => router.push("/profile")}
          className="mb-6 bg-transparent hover:bg-gray-800 text-white flex items-center gap-2 rounded-md px-4 py-2 transition duration-300"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </Button>
        
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800/50">
          <div className="mb-6 border-b border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab("competencies")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 relative ${
                  activeTab === "competencies" 
                    ? "text-blue-400" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart size={18} />
                  <span>Competency Upload</span>
                </div>
                {activeTab === "competencies" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab("orgchart")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 relative ${
                  activeTab === "orgchart" 
                    ? "text-blue-400" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>Organization Chart</span>
                </div>
                {activeTab === "orgchart" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab("feedback")}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 relative ${
                  activeTab === "feedback" 
                    ? "text-blue-400" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  <span>360° Feedback</span>
                </div>
                {activeTab === "feedback" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
                )}
              </button>
            </div>
          </div>
          
          {activeTab === "competencies" && (
            <>
              <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-6">
                Competency Upload
              </h1>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-gray-900/100 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <p className="text-gray-400 text-sm mt-1">
              Competencies will be stored for the selected year. Any existing competencies for this year will be replaced.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
              <div className="flex items-center mb-4">
                <FileSpreadsheet className="text-blue-400 mr-2" size={24} />
                <h2 className="text-xl text-white font-semibold">Upload Excel File</h2>
              </div>
              
              <p className="text-gray-400 mb-6">
                Upload an Excel file containing competency data.
              </p>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="competency-file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="competency-file"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="text-gray-400 mb-2" size={40} />
                    <p className="text-gray-300 font-medium mb-1">
                      {file ? file.name : "Click to select Excel file"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ".xlsx or .xls files only"}
                    </p>
                  </label>
                </div>
                
                {uploadStatus === "error" && (
                  <div className="bg-red-900/30 border border-red-800 p-4 rounded-md flex items-start">
                    <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-red-300 text-sm">{statusMessage}</p>
                  </div>
                )}
                
                {uploadStatus === "success" && (
                  <div className="bg-green-900/30 border border-green-800 p-4 rounded-md flex items-start">
                    <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-green-300 text-sm">{statusMessage}</p>
                  </div>
                )}
                
                {isUploading && jobStatus && (
                  <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-md">
                    <div className="flex items-start mb-3">
                      <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-2 mt-0.5" />
                      <p className="text-blue-300 text-sm">
                        {jobStatus === "PENDING" ? "Job created, waiting to start..." : 
                         jobStatus === "PROCESSING" ? "Processing your Excel file..." : 
                         "Finalizing import..."}
                      </p>
                    </div>
                    {renderProcessingSteps()}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Upload and Process
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            </div>
            </>
          )}
          {activeTab === "orgchart" && (
            <>
              <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-6">
                Organization Chart Upload
              </h1>
              
              <div className="space-y-6">
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
                  <div className="flex items-center mb-4">
                    <Users className="text-blue-400 mr-2" size={24} />
                    <h2 className="text-xl text-white font-semibold">Upload Organization Chart</h2>
                  </div>
                  
                  <p className="text-gray-400 mb-6">
                    Upload an Excel file containing your organization structure. The file should have the following columns:
                    <span className="block mt-2 font-mono text-xs bg-gray-900 p-2 rounded">
                      Employee No, Employee Name, Manager No, Manager Name, Effective Date
                    </span>
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="orgchart-file"
                        accept=".xlsx,.xls"
                        onChange={handleOrgFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="orgchart-file"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="text-gray-400 mb-2" size={40} />
                        <p className="text-gray-300 font-medium mb-1">
                          {orgFile ? orgFile.name : "Click to select Excel file"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {orgFile ? `${(orgFile.size / 1024 / 1024).toFixed(2)} MB` : ".xlsx or .xls files only"}
                        </p>
                      </label>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                      <h3 className="text-white text-sm font-medium mb-2">File Format Requirements:</h3>
                      <ul className="text-gray-400 text-sm list-disc pl-5 space-y-1">
                        <li>First row should contain column headers</li>
                        <li>Second row should be the top-level manager (with NA as Manager No)</li>
                        <li>All employees must have a unique Employee No</li>
                        <li>All managers (except top-level) must exist as employees in the file</li>
                      </ul>
                    </div>
                    
                    {orgUploadStatus === "error" && (
                      <div className="bg-red-900/30 border border-red-800 p-4 rounded-md flex items-start">
                        <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-red-300 text-sm">{orgStatusMessage}</p>
                      </div>
                    )}
                    
                    {orgUploadStatus === "success" && (
                      <div className="bg-green-900/30 border border-green-800 p-4 rounded-md flex items-start">
                        <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-green-300 text-sm">{orgStatusMessage}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleOrgUpload}
                        disabled={!orgFile || isOrgUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                      >
                        {isOrgUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            Upload and Process
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
         {activeTab === "feedback" && (
            <>
              <h1 className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-bold font-mono mb-6">
                360° Feedback Questions Upload
              </h1>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full bg-gray-900/100 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm mt-1">
                  Feedback questions will be stored for the selected year.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="text-blue-400 mr-2" size={24} />
                    <h2 className="text-xl text-white font-semibold">Upload Feedback Questions</h2>
                  </div>
                  
                  <p className="text-gray-400 mb-6">
                    Upload an Excel file containing 360° feedback questions. The file should have the following columns:
                    <span className="block mt-2 font-mono text-xs bg-gray-900 p-2 rounded">
                      Form Name, Question Number, Question asked, Question Type, Choice 1, Choice 2, Choice 3, Choice 4
                    </span>
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="feedback-file"
                        accept=".xlsx,.xls"
                        onChange={handleFeedbackFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="feedback-file"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="text-gray-400 mb-2" size={40} />
                        <p className="text-gray-300 font-medium mb-1">
                          {feedbackFile ? feedbackFile.name : "Click to select Excel file"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {feedbackFile ? `${(feedbackFile.size / 1024 / 1024).toFixed(2)} MB` : ".xlsx or .xls files only"}
                        </p>
                      </label>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                      <h3 className="text-white text-sm font-medium mb-2">File Format Requirements:</h3>
                      <ul className="text-gray-400 text-sm list-disc pl-5 space-y-1">
                        <li>First row should contain column headers</li>
                        <li>Question Type should be either Multiple Choice or Check Boxes</li>
                        <li>Each question should have a unique Question Number</li>
                        <li>For Multiple Choice questions, provide at least 2 choices</li>
                        <li>For Check Boxes questions, provide at least 1 choice</li>
                      </ul>
                    </div>
                    
                    {feedbackUploadStatus === "error" && (
                      <div className="bg-red-900/30 border border-red-800 p-4 rounded-md flex items-start">
                        <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-red-300 text-sm">{feedbackStatusMessage}</p>
                      </div>
                    )}
                    
                    {feedbackUploadStatus === "success" && (
                      <div className="bg-green-900/30 border border-green-800 p-4 rounded-md flex items-start">
                        <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-green-300 text-sm">{feedbackStatusMessage}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={handleFeedbackUpload}
                        disabled={!feedbackFile || isFeedbackUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                      >
                        {isFeedbackUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            Upload and Process
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
        