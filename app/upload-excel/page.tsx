"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import {
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";
import { signOut } from "next-auth/react";
import {  Search } from "lucide-react";


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

  const handleUpload = async () => {
    if (!file) return;
  
    setIsUploading(true);
    setUploadStatus("idle");
    setStatusMessage("");
  
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
        setUploadStatus("success");
        setStatusMessage(`Successfully processed ${data.competenciesAdded} competencies for year ${data.year} and created ${data.userCompetenciesAdded} user competency mappings.`);
      } else {
        throw new Error(data.error || "Failed to upload competencies");
      }
    } catch (error) {
      console.error("Error uploading competencies:", error);
      setUploadStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuery(inputValue);
    if(inputValue!== ''){
      try{
        const res = await fetch('/api/search',{
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputValue }),
        })

        if(res.ok){
          const users = await res.json()
          setSearchUsers(users);
        }
      }
      catch(error){
        console.error('Error while fetching user data:', error);
      }
    }
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
                    <h1 className="hidden sm:block text-lg font-bold font-mono text-white bg-gradient-to-br from-[#222222] via-[#2c3e50] to-[#0a66c2] shadow-md rounded-lg px-2 py-1 sm:px-4 sm:py-1 whitespace-nowrap">
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
                        <DropdownItem key="settings" className="hover:bg-gray-600 transition p-3 rounded-md">My Settings</DropdownItem>
                        <DropdownItem key="help_and_feedback" className="hover:bg-gray-600 transition p-3 rounded-md">Help & Feedback</DropdownItem>
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
        </div>
      </div>
    </div>
  );
}