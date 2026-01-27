import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api/v1/course";

const BRANCHES = ["CE", "IT", "EC", "ME", "Civil"];

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    courseId: "",
    courseName: "",
    teacherName: "",
    branch: "",
  });

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        setError("");
      } else {
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.courseId || !formData.courseName || !formData.teacherName || !formData.branch) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/${editingId}`
        : `${API_BASE_URL}/`;
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save course");
      }

      setSuccess(editingId ? "Course updated successfully!" : "Course created successfully!");
      setFormData({
        courseId: "",
        courseName: "",
        teacherName: "",
        branch: "",
      });
      setEditingId(null);
      setShowForm(false);
      await fetchCourses();
    } catch (err) {
      setError(err.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (course) => {
    setFormData(course);
    setEditingId(course.courseId);
    setShowForm(true);
    setError("");
  };

  // Handle delete
  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${courseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete course");
      }

      setSuccess("Course deleted successfully!");
      await fetchCourses();
    } catch (err) {
      setError(err.message || "Failed to delete course");
    } finally {
      setLoading(false);
    }
  };

  // Clear form and close
  const handleClose = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      courseId: "",
      courseName: "",
      teacherName: "",
      branch: "",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Course Management</h1>
            <p className="text-slate-400">Manage courses for student feedback</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-[1.02] transition-all px-6 py-3 rounded-xl text-white font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-500 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-900/30 border border-emerald-500 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-200">{success}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? "Edit Course" : "Add New Course"}
              </h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course ID */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Course ID
                </label>
                <input
                  type="number"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  disabled={editingId !== null}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 101"
                />
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g., Data Structures"
                />
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Teacher Name
                </label>
                <input
                  type="text"
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g., Dr. John Smith"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Department/Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Branch</option>
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg disabled:opacity-70 transition-all px-6 py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {editingId ? "Update Course" : "Create Course"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 transition-all px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {loading && !courses.length ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p>No courses added yet. Click "Add Course" to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">ID</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Course Name</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Teacher</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Branch</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.courseId}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-semibold">{course.courseId}</td>
                      <td className="px-6 py-4 text-white">{course.courseName}</td>
                      <td className="px-6 py-4 text-slate-300">{course.teacherName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                          {course.branch}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded-lg transition-colors text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(course.courseId)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm font-semibold">Total Courses</p>
            <p className="text-3xl font-bold text-white mt-2">{courses.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm font-semibold">Branches</p>
            <p className="text-3xl font-bold text-white mt-2">
              {new Set(courses.map((c) => c.branch)).size}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm font-semibold">Teachers</p>
            <p className="text-3xl font-bold text-white mt-2">
              {new Set(courses.map((c) => c.teacherName)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
