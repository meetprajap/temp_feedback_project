import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByBranch
} from "../controllers/course.controllers.js";
import { Router } from 'express';
import Course from '../models/course.model.js';

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

// Public routes - Students can view courses
router.route("/").get(getAllCourses);
router.route("/:courseId").get(getCourseById);
router.route("/branch/:branch").get(getCoursesByBranch);

// Admin only routes - Create, Update, Delete courses
router.route("/").post(createCourse);
router.route("/:courseId").put(updateCourse);
router.route("/:courseId").delete(deleteCourse);

export default router;
