import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Star,
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/course";

export default function FeedbackResults() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseResults, setCourseResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const toggleCourse = (course) => {
    if (expandedCourse?.courseId === course.courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(course);
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
          <h2 className="text-3xl font-bold text-white">Feedback Results</h2>
        </div>
        <p className="text-slate-400">View feedback averages for each teacher per course</p>
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
      ) : courses.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">No courses available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.courseId}
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
                    expandedCourse?.courseId === course.courseId
                      ? "rotate-90"
                      : ""
                  }`}
                />
              </button>

              {/* Course Results */}
              {expandedCourse?.courseId === course.courseId && (
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
          ))}
        </div>
      )}
    </div>
  );
}
