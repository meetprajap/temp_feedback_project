import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByBranch,
  getTeacherCourseResults
} from "../controllers/course.controllers.js";
import { Router } from 'express';
import Course from '../models/course.model.js';
import { getAllFeedbacksFromBlockchain } from '../services/blockchainService.js';

const router = Router();

// Debug endpoint to see raw course data - MUST BE BEFORE DYNAMIC ROUTES
router.get("/debug-courses", async (req, res) => {
  try {
    const courses = await Course.find().populate('teachers');
    console.log("🔍 DEBUG - Raw courses from DB:", JSON.stringify(courses, null, 2));
    res.json({ success: true, courses, debug: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to see blockchain feedbacks
router.get("/debug-feedbacks", async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacksFromBlockchain();
    console.log("🔍 DEBUG - Feedbacks from blockchain:", feedbacks);
    
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
router.route("/:courseId").get(getCourseById);
router.route("/branch/:branch").get(getCoursesByBranch);

// Get teacher course feedback results (Admin)
router.route("/results/:courseId/:teacherId").get(getTeacherCourseResults);

// Admin only routes - Create, Update, Delete courses
router.route("/").post(createCourse);
router.route("/:courseId").put(updateCourse);
router.route("/:courseId").delete(deleteCourse);

export default router;
