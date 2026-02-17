import React, { useState, useEffect } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/course";
const USER_API_BASE_URL = "http://localhost:4000/api/v1/user";

export default function FeedbackReport() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("course"); // 'course' or 'all'
  const [feedbackData, setFeedbackData] = useState(null);
  const [allFeedbackData, setAllFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uniqueCourses = React.useMemo(() => {
    const byCourseId = new Map();
    courses.forEach((course) => {
      if (course?.courseId != null && !byCourseId.has(course.courseId)) {
        byCourseId.set(course.courseId, course);
      }
    });
    return Array.from(byCourseId.values());
  }, [courses]);

  // Fetch available courses on mount and load all feedback
  useEffect(() => {
    const fetchCoursesAndAllFeedback = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        if (data.success && data.data) {
          setCourses(data.data);
          setError("");
        }
      } catch (err) {
        setError("Failed to load courses");
        console.error(err);
      }

      // Fetch all submission tracking by default
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const walletAddress = JSON.parse(localStorage.getItem('user'))?.walletAddress;
        console.log('🔑 Token exists:', !!token);
        
        if (token) {
          console.log('📡 Fetching submission tracking from:', `${API_BASE_URL}/submission-tracking`);
          const response = await fetch(
            `${API_BASE_URL}/submission-tracking`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "x-wallet-address": walletAddress || ""
              }
            }
          );

          const data = await response.json();
          console.log('📦 Response:', data);

          if (data.success) {
            console.log('✅ Got', data.data.feedbacks?.length, 'submissions');
            // Data already in correct format from MongoDB
            setAllFeedbackData(data.data.feedbacks);
            setViewMode("all"); // Set default view to all
            console.log('✅ ViewMode set to ALL');
          } else {
            console.error("❌ Failed to load feedback data:", data.message);
          }
        } else {
          console.log('⚠️ No authentication token found');
        }
      } catch (err) {
        console.error("❌ Error fetching all feedback:", err);
      }
    };

    fetchCoursesAndAllFeedback();
  }, []);

  // Fetch feedback for selected course
  const handleCourseSelect = async (course) => {
    setSelectedCourse(course.courseId);
    setLoading(true);
    setError("");
    
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const walletAddress = JSON.parse(localStorage.getItem('user'))?.walletAddress;
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${USER_API_BASE_URL}/course-feedback/${course.courseId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-wallet-address": walletAddress || ""
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setFeedbackData(data.data);
      } else {
        setError(data.message || "Failed to load feedback data");
      }
    } catch (err) {
      setError(err.message || "Error fetching feedback data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all feedback across system
  const handleFetchAllFeedback = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const walletAddress = JSON.parse(localStorage.getItem('user'))?.walletAddress;
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Fetch submission tracking from MongoDB
      const response = await fetch(
        `${API_BASE_URL}/submission-tracking`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-wallet-address": walletAddress || ""
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        // Data already in correct format from MongoDB
        setAllFeedbackData(data.data.feedbacks);
      } else {
        setError(data.message || "Failed to load feedback data");
      }
    } catch (err) {
      setError(err.message || "Error fetching feedback data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Feedback Report</h1>
          <p className="text-slate-600">View which students have submitted feedback for courses</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* View Mode Selector */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => {
              setViewMode("course");
              setAllFeedbackData(null);
              setSelectedCourse(null);
              setFeedbackData(null);
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "course"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            By Course
          </button>
          <button
            onClick={() => {
              setViewMode("all");
              handleFetchAllFeedback();
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            All Submissions
          </button>
        </div>

        {/* Course View */}
        {viewMode === "course" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Course Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-slate-900 text-white font-semibold">
                  Courses
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {uniqueCourses.length === 0 ? (
                    <p className="p-4 text-slate-500 text-sm">No courses available</p>
                  ) : (
                    uniqueCourses.map((course) => (
                      <button
                        key={course.courseId}
                        onClick={() => handleCourseSelect(course)}
                        className={`w-full text-left p-4 transition-colors ${
                          selectedCourse === course.courseId
                            ? "bg-blue-50 border-l-4 border-blue-600"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{course.courseName}</p>
                        <p className="text-sm text-slate-600">{course.courseId}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Data */}
            <div className="lg:col-span-3">
              {selectedCourse ? (
                loading ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading feedback data...</p>
                  </div>
                ) : feedbackData ? (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 bg-slate-900 text-white font-semibold flex items-center justify-between">
                      <span>Feedback Submissions ({feedbackData.totalSubmissions})</span>
                      <span className="text-sm font-normal text-blue-200">
                        {feedbackData.courseName}
                      </span>
                    </div>

                    {feedbackData.submissions && feedbackData.submissions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-100 border-b">
                              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                Student Name
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                Branch
                              </th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                                Submitted At
                              </th>
                              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {feedbackData.submissions.map((submission, idx) => (
                              <tr key={idx} className="border-b hover:bg-slate-50">
                                <td className="px-6 py-3 text-sm text-slate-900">
                                  {submission.studentName}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                  {submission.studentEmail}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                  {submission.studentBranch}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                  {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                                  {new Date(submission.submittedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    ✓ Done
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-600">
                        <p>No feedback submissions for this course yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-600">
                    Failed to load feedback data
                  </div>
                )
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-600">
                  <p>Select a course to view feedback submissions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Feedback View */}
        {viewMode === "all" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-semibold">
              All Feedback Submissions ({allFeedbackData?.length || 0} total)
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading feedback data...</p>
              </div>
            ) : allFeedbackData && allFeedbackData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Course ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Teacher ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeedbackData.map((feedback) => (
                      <tr key={feedback.id} className="border-b hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-900 font-mono">
                          #{feedback.id}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-900 font-medium">
                          {feedback.studentName}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {feedback.studentEmail || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-900">
                          {feedback.courseId}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-900">
                          {feedback.teacherId}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {feedback.timestamp}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            ✓ Submitted
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-600">
                <p>No feedback submissions yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
