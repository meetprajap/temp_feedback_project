import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Star,
  MessageSquare,
  Calendar,
  User,
  Filter,
  ChevronDown,
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/course";

export default function FeedbackResults() {
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourseKey, setExpandedCourseKey] = useState(null);
  const [courseResults, setCourseResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});
  const [viewMode, setViewMode] = useState("summary"); // "summary" or "detailed"
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");

  useEffect(() => {
    fetchCourses();
    fetchAllFeedbacks();
  }, []);

  const fetchAllFeedbacks = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData?.token;
      
      const response = await fetch(`${API_BASE_URL}/all-feedbacks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      console.log("📊 All feedbacks from blockchain:", data);

      if (data.success && data.data) {
        setAllFeedbacks(data.data.feedbacks || []);
      }
    } catch (err) {
      console.error("Error fetching all feedbacks:", err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();

      if (data.success && data.data) {
        setCourses(data.data);
        setError("");
      } else {
        setError("Failed to load courses");
      }
    } catch (err) {
      setError(err.message || "Failed to load courses");
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseResults = async (courseId, teachers) => {
    setLoadingResults((prev) => ({ ...prev, [courseId]: true }));

    try {
      const results = {};
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData?.token;

      for (const teacher of teachers) {
        const teacherId = teacher.teacherId || teacher.id;
        const key = `${courseId}-${teacherId}`;

        try {
          const response = await fetch(
            `${API_BASE_URL}/results/${courseId}/${teacherId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();

          console.log(`📊 Response for ${key}:`, data);

          if (data.success) {
            results[key] = data.data;
          } else {
            results[key] = { error: data.message || "No feedback data" };
            console.error(`❌ API error for ${key}:`, data.message);
          }
        } catch (err) {
          console.error(
            `❌ Network error fetching results for ${courseId}-${teacherId}:`,
            err
          );
          results[key] = { error: "Failed to fetch results" };
        }
      }

      setCourseResults((prev) => ({ ...prev, ...results }));
    } finally {
      setLoadingResults((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const getCourseEntryKey = (course) => String(course.courseId);

  const toggleCourse = (course) => {
    const entryKey = getCourseEntryKey(course);
    if (expandedCourseKey === entryKey) {
      setExpandedCourseKey(null);
    } else {
      setExpandedCourseKey(entryKey);
      // Fetch results if not already fetched
      const teachers = course.teachers || [];
      const needsSync = teachers.some((t) => {
        const teacherId = t.teacherId || t.id;
        const key = `${course.courseId}-${teacherId}`;
        return !courseResults[key];
      });

      if (needsSync) {
        fetchCourseResults(course.courseId, teachers);
      }
    }
  };

  const groupedCourses = React.useMemo(() => {
    const byCourseId = new Map();
    courses.forEach((course) => {
      const courseId = course.courseId;
      if (!byCourseId.has(courseId)) {
        byCourseId.set(courseId, {
          courseId: course.courseId,
          courseName: course.courseName,
          branch: course.branch,
          teachers: []
        });
      }

      const entry = byCourseId.get(courseId);
      const incomingTeachers = course.teachers && course.teachers.length > 0
        ? course.teachers
        : [{
            teacherId: course.teacherId,
            teacherName: course.teacherName,
            name: course.teacherName
          }];

      incomingTeachers.forEach((teacher) => {
        const teacherId = teacher.teacherId || teacher.id;
        if (!teacherId) {
          return;
        }
        const exists = entry.teachers.some((t) => (t.teacherId || t.id) === teacherId);
        if (!exists) {
          entry.teachers.push(teacher);
        }
      });
    });

    return Array.from(byCourseId.values());
  }, [courses]);

  const getRatingColor = (score) => {
    if (score >= 4.5) return "text-emerald-400";
    if (score >= 4) return "text-blue-400";
    if (score >= 3) return "text-amber-400";
    return "text-red-400";
  };

  const getRatingBg = (score) => {
    if (score >= 4.5) return "bg-emerald-900/30 border-emerald-600/50";
    if (score >= 4) return "bg-blue-900/30 border-blue-600/50";
    if (score >= 3) return "bg-amber-900/30 border-amber-600/50";
    return "bg-red-900/30 border-red-600/50";
  };

  // Filter feedbacks based on selected course and teacher
  const filteredFeedbacks = allFeedbacks.filter(fb => {
    if (filterCourse !== "all" && fb.courseId !== filterCourse) return false;
    if (filterTeacher !== "all" && fb.teacherId !== filterTeacher) return false;
    return true;
  });

  // Get unique courses and teachers for filters
  const uniqueCourses = [...new Set(allFeedbacks.map(fb => fb.courseId))];
  const uniqueTeachers = [...new Set(allFeedbacks.map(fb => fb.teacherId))];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white">Feedback Results</h2>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "summary"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "detailed"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Feedbacks ({allFeedbacks.length})
            </button>
          </div>
        </div>
        <p className="text-slate-400">
          {viewMode === "summary" 
            ? "View feedback averages for each teacher per course"
            : "View all individual feedback submissions from blockchain"}
        </p>
      </div>

      {/* Error Message */}
      {error && (
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
      ) : viewMode === "detailed" ? (
        /* DETAILED VIEW - Show All Individual Feedbacks */
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Filter by Course</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(courseId => (
                  <option key={courseId} value={courseId}>Course {courseId}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">Filter by Teacher</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Teachers</option>
                {uniqueTeachers.map(teacherId => (
                  <option key={teacherId} value={teacherId}>Teacher {teacherId}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">Total Feedbacks</p>
              <p className="text-3xl font-bold text-white">{filteredFeedbacks.length}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-indigo-400">
                {filteredFeedbacks.length > 0 
                  ? (filteredFeedbacks.reduce((sum, fb) => sum + parseFloat(fb.averageScore), 0) / filteredFeedbacks.length).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">Courses</p>
              <p className="text-3xl font-bold text-emerald-400">{uniqueCourses.length}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">Teachers</p>
              <p className="text-3xl font-bold text-amber-400">{uniqueTeachers.length}</p>
            </div>
          </div>

          {/* Feedback Cards */}
          <div className="space-y-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No feedbacks found</p>
              </div>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`bg-slate-800 border-2 rounded-xl p-6 ${getRatingBg(feedback.averageScore)}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-xs font-semibold">
                          Feedback #{feedback.id}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {feedback.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Course: <span className="text-white font-semibold">{feedback.courseId}</span></span>
                        <span>•</span>
                        <span>Teacher: <span className="text-white font-semibold">{feedback.teacherId}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getRatingColor(feedback.averageScore)}`}>
                        {feedback.averageScore}
                      </div>
                      <p className="text-xs text-slate-400">Average</p>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Teaching</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="text-lg font-bold text-white">{feedback.ratings.teaching}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Communication</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="text-lg font-bold text-white">{feedback.ratings.communication}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Fairness</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="text-lg font-bold text-white">{feedback.ratings.fairness}</p>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Engagement</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="text-lg font-bold text-white">{feedback.ratings.engagement}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {feedback.comments && (
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <p className="text-sm font-semibold text-slate-300">Comments</p>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{feedback.comments}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : groupedCourses.length === 0 ? (
        /* NO COURSES */
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No courses available</p>
        </div>
      ) : (
        /* SUMMARY VIEW - Course-wise Teacher Averages */
        <div className="space-y-4">
          {groupedCourses.map((course) => {
            const entryKey = getCourseEntryKey(course);
            return (
            <div
              key={entryKey}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-all"
            >
              {/* Course Header */}
              <button
                onClick={() => toggleCourse(course)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <p className="text-sm text-indigo-400 font-semibold">
                      ID: {course.courseId}
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {(course.teachers || []).length} teachers • {course.branch}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedCourseKey === entryKey ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Course Results */}
              {expandedCourseKey === entryKey && (
                <div className="border-t border-slate-700 bg-slate-800/50 p-6">
                  {loadingResults[course.courseId] ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mr-2" />
                      <p className="text-slate-400">Loading results...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(course.teachers || []).map((teacher) => {
                        const teacherId = teacher.teacherId || teacher.id;
                        const key = `${course.courseId}-${teacherId}`;
                        const result = courseResults[key];

                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border ${
                              result?.error
                                ? "bg-slate-700/50 border-slate-600"
                                : getRatingBg(result?.overallScore || 0)
                            }`}
                          >
                            {/* Teacher Name */}
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-white">
                                {teacher.teacherName || teacher.name}
                              </h4>
                              {result?.overallScore && (
                                <div className={`text-2xl font-bold ${getRatingColor(result.overallScore)}`}>
                                  {result.overallScore.toFixed(2)}
                                  <span className="text-sm text-slate-400">/5</span>
                                </div>
                              )}
                            </div>

                            {/* Error Message */}
                            {result?.error ? (
                              <p className="text-slate-400 text-sm">{result.error}</p>
                            ) : (
                              <>
                                {/* Rating Breakdown */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  {result?.ratings?.map((rating, idx) => (
                                    <div key={idx} className="bg-slate-700/50 p-3 rounded-lg">
                                      <p className="text-xs text-slate-400 mb-1">
                                        {rating.label}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <p className="text-lg font-bold text-white">
                                          {rating.score.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      result?.overallScore >= 4.5
                                        ? "bg-emerald-500"
                                        : result?.overallScore >= 4
                                        ? "bg-blue-500"
                                        : result?.overallScore >= 3
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${(result?.overallScore / 5) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
