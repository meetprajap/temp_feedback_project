import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  BookOpen,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/course";
const USER_API_BASE_URL = "http://localhost:4000/api/v1/user";

export default function StudentCourseSelector({ onCourseSelect }) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const [userDepartment, setUserDepartment] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const branches = ["All", "CE", "IT", "EC", "ME", "Civil"];

  // Fetch all courses
  useEffect(() => {
    const fetchCoursesAndStatus = async () => {
      setLoading(true);
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = userData?.token;
        const department = userData?.department;

        // Set user department
        setUserDepartment(department);

        // Fetch courses only for the student's department
        let courseUrl = `${API_BASE_URL}/`;
        if (department) {
          courseUrl = `${API_BASE_URL}/branch/${department}`;
        }

        const response = await fetch(courseUrl);
        const data = await response.json();
        
        console.log("📚 Courses from backend:", data.data);
        
        if (data.success && data.data) {
          setCourses(data.data);
          setFilteredCourses(data.data);
          setError("");
          
          // Check feedback status for each course
          if (token) {
            const statusObj = {};
            
            for (const course of data.data) {
              try {
                const statusResponse = await fetch(
                  `${USER_API_BASE_URL}/feedback-status/${course.courseId}`,
                  {
                    headers: {
                      "Authorization": `Bearer ${token}`
                    }
                  }
                );
                const statusData = await statusResponse.json();
                statusObj[course.courseId] = statusData.data?.submitted || false;
              } catch (err) {
                console.error(`Error checking status for course ${course.courseId}:`, err);
                statusObj[course.courseId] = false;
              }
            }
            
            setFeedbackStatus(statusObj);
          }
        } else {
          setError("No courses available for your department");
          setCourses([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndStatus();
  }, []);

  // Filter courses by branch
  useEffect(() => {
    // If user has a department, set it as selected branch and remove "All" from filters
    if (userDepartment && selectedBranch === "All") {
      setSelectedBranch(userDepartment);
      setFilteredCourses(courses.filter((course) => course.branch === userDepartment));
    } else if (selectedBranch === "All") {
      setFilteredCourses(courses);
    } else {
      setFilteredCourses(courses.filter((course) => course.branch === selectedBranch));
    }
  }, [selectedBranch, courses, userDepartment]);

  const handleCourseSelect = (course) => {
    console.log("🎯 Selected course:", course);
    const hasSubmitted = feedbackStatus[course.courseId];
    
    if (hasSubmitted) {
      alert("You have already submitted feedback for this course");
      return;
    }
    
    setSelectedCourse(course);
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select a Course for Feedback</h2>
        <p className="text-slate-400">Choose a course to provide your feedback</p>
      </div>

      {/* Error Message */}
      {error && !courses.length && (
        <div className="flex items-center gap-3 p-4 bg-orange-900/30 border border-orange-500 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <span className="text-orange-200">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-slate-400">Loading courses...</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">
            {userDepartment 
              ? `No courses available for your department (${userDepartment})`
              : "No courses available at the moment"}
          </p>
        </div>
      ) : (
        <>
          {/* Branch Filter */}
          <div className="mb-6">
            <p className="text-slate-300 font-semibold mb-3">
              {userDepartment ? `Your Department (${userDepartment}):` : "Filter by Department:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {userDepartment ? (
                // If user has a department, only show their department
                <button
                  disabled
                  className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white cursor-not-allowed"
                >
                  {userDepartment}
                </button>
              ) : (
                // If no department, show all options (backward compatibility)
                branches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedBranch === branch
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {branch}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">
                No courses found for {selectedBranch} branch
              </div>
            ) : (
              filteredCourses.map((course) => {
                const hasSubmitted = feedbackStatus[course.courseId];
                return (
                  <div
                    key={course.courseId}
                    onClick={() => !hasSubmitted && handleCourseSelect(course)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      hasSubmitted
                        ? "bg-slate-800/50 border-emerald-600/50 cursor-not-allowed opacity-75"
                        : selectedCourse?.courseId === course.courseId
                        ? "bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-500 cursor-pointer"
                        : "bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700/50 cursor-pointer"
                    }`}
                  >
                    {/* Course ID & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                        ID: {course.courseId}
                      </span>
                      {hasSubmitted ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Done
                        </div>
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Course Name */}
                    <h3 className="text-lg font-bold text-white mb-3">{course.courseName}</h3>

                    {/* Teacher */}
                    <div className="flex items-center gap-2 text-slate-300 mb-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {course.teacherName || (course.teachers && course.teachers.length > 0 
                          ? course.teachers[0].name 
                          : 'Unassigned')}
                      </span>
                    </div>

                    {/* Branch */}
                    <div className="flex items-center gap-2 text-slate-300 mb-4">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">{course.branch}</span>
                    </div>

                    {/* Status Message */}
                    {hasSubmitted && (
                      <div className="text-emerald-400 font-semibold text-sm">
                        ✓ Feedback submitted
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {selectedCourse?.courseId === course.courseId && !hasSubmitted && (
                      <div className="mt-4 pt-4 border-t border-indigo-500 text-indigo-400 font-semibold text-sm">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
