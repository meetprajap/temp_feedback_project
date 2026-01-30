import { registerUser, loginUser, logoutUser, checkFeedbackStatus, getStudentFeedbackStatus, submitFeedbackTracking, getCourseFeedbackStatus, getAllFeedbackStatus } from "../controllers/user.controllers.js";
import { getTempFeedbackStorage, clearTempFeedbackStorage } from "../services/blockchainService.js";
import { Router } from 'express'

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

// Register route - Public, no authentication required
router.route("/register").post(registerUser)

// Login route - Public, no authentication required
router.route("/login").post(loginUser)

// Logout route - Private, requires authentication
router.route("/logout").post(verifyJWT, logoutUser)

// Check feedback status for a course - Private
router.route("/feedback-status/:courseId").get(verifyJWT, checkFeedbackStatus)

// Get all feedback submissions for student - Private
router.route("/feedback-submissions").get(verifyJWT, getStudentFeedbackStatus)

// Submit feedback tracking - Private
router.route("/submit-feedback").post(verifyJWT, submitFeedbackTracking)

// Get feedback submissions for a specific course (Admin) - Private
router.route("/course-feedback/:courseId").get(verifyJWT, getCourseFeedbackStatus)

// Get all feedback submissions (Admin) - Private
router.route("/all-feedback").get(verifyJWT, getAllFeedbackStatus)

// Get temporary feedback storage (Admin/Debug) - Private
router.route("/temp-feedback-storage").get(verifyJWT, getTempFeedbackStorage)

// Clear temporary feedback storage (Admin/Debug) - Private
router.route("/clear-temp-storage").delete(verifyJWT, clearTempFeedbackStorage)

export default router

