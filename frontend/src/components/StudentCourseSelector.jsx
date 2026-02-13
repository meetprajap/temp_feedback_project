import React, { useState, useEffect, useMemo } from "react";
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

// Memoized component for unique courses grid - prevents double rendering
const UniqueCoursesGrid = React.memo(({ courses, feedbackStatus, selectedCourse, handleCourseSelect }) => {
  // Deduplicate using useMemo to prevent recalculation on every render
  const uniqueCourseCards = useMemo(() => {
    console.log("📊 Deduplicating courses...", { totalInput: courses.length });
    
    const uniqueMap = new Map();
    
    // Step 1: Flatten - convert each course with multiple teachers into individual entries
    const flattened = courses.flatMap((course) => {
      const teachers = course.teachers || [];
      
      // If backend already expanded to 1 teacher per course entry, use as-is
      if (teachers.length <= 1) {
        return [course];
      }
      
      // Otherwise, create individual entries for each teacher
      return teachers.map((teacher) => ({
        ...course,
        teachers: [teacher] // Only this teacher for this card
      }));
    });
    
    console.log("📊 After flattening:", { flattened: flattened.length });
    
    // Step 2: Deduplicate - keep only unique (courseId, teacherId) pairs
    flattened.forEach((course) => {
      const cId = String(course.courseId || course.id);
      const teachers = course.teachers || [];
      const teacher = teachers[0];
      
      if (!teacher) return; // Skip if no teacher
      
      const tId = String(teacher.teacherId || teacher.id);
      const uniqueKey = `${cId}-${tId}`;
      
      // Only add if this combination hasn't been seen before
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, { course, cId, tId, uniqueKey });
        console.log(`✅ Added unique card: ${uniqueKey}`);
      } else {
        console.log(`⏭️  Skipped duplicate: ${uniqueKey}`);
      }
    });
    
    console.log("📊 After deduplication:", { unique: uniqueMap.size });
    return Array.from(uniqueMap.values());
  }, [courses]); // Only recalculate when courses array changes

  return (
    <>
      {uniqueCourseCards.map(({ course, cId, tId, uniqueKey }) => {
        const teachers = course.teachers || [];
        const teacher = teachers[0];
        
        const allTeachersSubmitted = teachers.length > 0 && teachers.every(t => {
          const teacherId = String(t.teacherId || t.id);
          const statusKey = `${cId}-${teacherId}`;
          return feedbackStatus[statusKey];
        });
        
        const someTeachersSubmitted = teachers.some(t => {
          const teacherId = String(t.teacherId || t.id);
          const statusKey = `${cId}-${teacherId}`;
          return feedbackStatus[statusKey];
        });
        
        const displayName = teacher?.name || teacher?.teacherName || 'Unassigned';
        const statusKey = `${cId}-${tId}`;
        const teacherSubmitted = feedbackStatus[statusKey];

        return (
          <div
            key={uniqueKey}
            onClick={() => !allTeachersSubmitted && handleCourseSelect(course)}
            className={`p-6 rounded-xl border-2 transition-all ${
              allTeachersSubmitted
                ? "bg-slate-800/50 border-emerald-600/50 cursor-not-allowed opacity-75"
                : selectedCourse?.courseId === Number(cId)
                ? "bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-500 cursor-pointer"
                : "bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-700/50 cursor-pointer"
            }`}
          >
            {/* Course ID & Status */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                ID: {cId}
              </span>
              {allTeachersSubmitted ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  All Done
                </div>
              ) : someTeachersSubmitted ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-900/50 text-amber-300 rounded-full text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Partial
                </div>
              ) : (
                <Building2 className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Course Name */}
            <h3 className="text-lg font-bold text-white mb-3">{course.courseName}</h3>

            {/* Teacher - Only ONE per card */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4" />
                  <span>{displayName}</span>
                </div>
                {teacherSubmitted && (
                  <span className="text-emerald-400 font-semibold text-xs">✓</span>
                )}
              </div>
            </div>

            {/* Branch */}
            <div className="flex items-center gap-2 text-slate-300 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">{course.branch}</span>
            </div>

            {/* Status Message */}
            {allTeachersSubmitted && (
              <div className="text-emerald-400 font-semibold text-sm">
                ✓ All feedback submitted
              </div>
            )}
          </div>
        );
      })}
    </>
  );
});

UniqueCoursesGrid.displayName = "UniqueCoursesGrid";

export default function StudentCourseSelector({ onCourseSelect, feedbackStatus: parentFeedbackStatus, setFeedbackStatus: setParentFeedbackStatus }) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(parentFeedbackStatus || {});
  const [userDepartment, setUserDepartment] = useState(null);

  const branches = ["All", "CE", "IT", "EC", "ME", "Civil"];

  // Sync with parent feedbackStatus when it changes
  useEffect(() => {
    if (parentFeedbackStatus) {
      console.log("👁️ Updated feedbackStatus:", parentFeedbackStatus);
      setFeedbackStatus(parentFeedbackStatus);
    }
  }, [parentFeedbackStatus]);

  // Fetch all courses
  useEffect(() => {
    const fetchCoursesAndStatus = async () => {
      setLoading(true);
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = userData?.token;
        const department = userData?.department;

        setUserDepartment(department);

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
          
          // Check feedback status for each course and teacher
          if (token) {
            const statusObj = { ...parentFeedbackStatus };
            
            for (const course of data.data) {
              const teachers = course.teachers || [];
              const cId = String(course.courseId || course.id);
              
              for (const teacher of teachers) {
                const teacherId = String(teacher.teacherId || teacher.id);
                const statusKey = `${cId}-${teacherId}`;
                
                if (statusObj[statusKey]) {
                  continue;
                }
                
                try {
                  const statusResponse = await fetch(
                    `${USER_API_BASE_URL}/feedback-status/${cId}/${teacherId}`,
                    {
                      headers: {
                        "Authorization": `Bearer ${token}`
                      }
                    }
                  );
                  const statusData = await statusResponse.json();
                  statusObj[statusKey] = statusData.data?.submitted || false;
                  console.log(`✅ Status for ${statusKey}:`, statusObj[statusKey]);
                } catch (err) {
                  console.error(`Error checking status for ${cId}, ${teacherId}:`, err);
                  statusObj[statusKey] = false;
                }
              }
            }
            
            console.log("📊 Final feedbackStatus:", statusObj);
            setFeedbackStatus(statusObj);
            if (setParentFeedbackStatus) {
              setParentFeedbackStatus(statusObj);
            }
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
                <button
                  disabled
                  className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white cursor-not-allowed"
                >
                  {userDepartment}
                </button>
              ) : (
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

          {/* Courses Grid with Deduplication */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">
                No courses found for {selectedBranch} branch
              </div>
            ) : (
              <UniqueCoursesGrid 
                courses={filteredCourses}
                feedbackStatus={feedbackStatus}
                selectedCourse={selectedCourse}
                handleCourseSelect={handleCourseSelect}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
