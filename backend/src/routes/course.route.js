import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByBranch,
  getTeacherCourseResults,
  getAllFeedbacks,
  getSubmissionTracking,
  getDashboardStats
} from "../controllers/course.controllers.js";
import { Router } from 'express';
import { getAllFeedbacksFromBlockchain } from '../services/blockchainService.js';

const router = Router();

// Debug endpoint to see blockchain feedbacks
router.get("/debug-feedbacks", async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacksFromBlockchain();
    console.log("🔍 DEBUG - RAW Feedbacks from blockchain:");
    console.log("Total feedbacks:", feedbacks.length);
    if (feedbacks.length > 0) {
      console.log("First feedback raw structure:", JSON.stringify(feedbacks[0]));
      console.log("First feedback keys:", Object.keys(feedbacks[0]));
      console.log("First feedback values:", Object.values(feedbacks[0]));
    }
    
    // Analyze by teacher
    const byTeacher = {};
    feedbacks.forEach(fb => {
      if (!byTeacher[fb.facultyId]) {
        byTeacher[fb.facultyId] = [];
      }
      byTeacher[fb.facultyId].push({
        courseId: fb.courseId,
        ratings: fb.ratings
      });
    });
    
    console.log("📊 Grouped by teacher:", byTeacher);
    
    res.json({ success: true, feedbacks, groupedByTeacher: byTeacher, debug: true });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: error.message });
  }
});

// Public routes - Students can view courses
router.route("/").get(getAllCourses);

// Dashboard stats (Admin) - must be before /:courseId
router.route("/dashboard/stats").get(getDashboardStats);

// Get all feedbacks from blockchain (Admin) - must be before /:courseId
router.route("/all-feedbacks").get(getAllFeedbacks);

// Get submission tracking from MongoDB (Admin) - must be before /:courseId
router.route("/submission-tracking").get(getSubmissionTracking);

// Course by ID and branch - with dynamic params after static routes
router.route("/:courseId").get(getCourseById);
router.route("/branch/:branch").get(getCoursesByBranch);

// Get teacher course feedback results (Admin)
router.route("/results/:courseId/:teacherId").get(getTeacherCourseResults);

// Admin only routes - Create, Update, Delete courses
router.route("/").post(createCourse);
router.route("/:courseId").put(updateCourse);
router.route("/:courseId").delete(deleteCourse);

export default router;
