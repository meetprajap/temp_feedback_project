import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByBranch
} from "../controllers/course.controllers.js";
import { Router } from 'express';

const router = Router();

// Public routes - Students can view courses
router.route("/").get(getAllCourses);
router.route("/:courseId").get(getCourseById);
router.route("/branch/:branch").get(getCoursesByBranch);

// Admin only routes - Create, Update, Delete courses
router.route("/").post(createCourse);
router.route("/:courseId").put(updateCourse);
router.route("/:courseId").delete(deleteCourse);

export default router;
