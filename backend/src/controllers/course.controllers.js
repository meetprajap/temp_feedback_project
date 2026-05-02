import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import requestHandler from '../utils/asyncHandler.js';
import { createCourseblock, getTeacherCourseAveragesFromBlockchain, getCourseFromBlockchain, getCoursesFromBlockchain, getCourseTeachersFromBlockchain, getAllFeedbacksFromBlockchain } from '../services/blockchainService.js';

const BRANCH_NORMALIZATION_MAP = {
  ce: 'CE',
  it: 'IT',
  ec: 'EC',
  me: 'ME',
  civil: 'Civil'
};

const normalizeBranch = (value) => {
  if (!value) return null;
  const normalized = BRANCH_NORMALIZATION_MAP[String(value).trim().toLowerCase()];
  return normalized || null;
};

// Create a new course (Admin only) - Send only to blockchain
const createCourse = requestHandler(async (req, res) => {
  const { courseId, courseName, teachers, branch } = req.body;
  const normalizedBranch = normalizeBranch(branch);

  // Validate all fields are provided
  if (!courseId || !courseName || !teachers || !normalizedBranch) {
    throw new ApiError(400, "courseId, courseName, teachers, and valid branch are required");
  }

  // Validate teachers array
  if (!Array.isArray(teachers) || teachers.length === 0) {
    throw new ApiError(400, "At least one teacher is required");
  }

  // Validate each teacher has required fields
  for (const teacher of teachers) {
    if (!teacher.teacherId || !teacher.teacherName) {
      throw new ApiError(400, "Each teacher must have teacherId and teacherName");
    }
  }

  // Prepare teacher data for blockchain
  const teachersData = teachers.map(t => ({
    teacherId: t.teacherId.toString().trim(),
    teacherName: t.teacherName.toString().trim()
  }));

  console.log(`📚 Creating course: ${courseName} (ID: ${courseId})`);
  console.log(`📝 Adding ${teachers.length} teacher(s)`);

  // Register course and teachers on blockchain
  try {
    console.log(`🔗 Sending to blockchain with ${teachersData.length} teacher(s)...`);
    const txHash = await createCourseblock({
      courseId: courseId.toString(),
      courseName: courseName,
      branch: normalizedBranch,
      teachers: teachersData
    }, req.user?.walletAddress || null);

    console.log(`✅ Course and teachers registered on blockchain with hash: ${txHash}`);

    // Fetch the created course from blockchain to return
    const createdCourse = await getCourseFromBlockchain(courseId.toString());

    return res.status(201).json(
      new ApiResponse(201, {
        ...createdCourse,
        branch: normalizedBranch,
        txHash: txHash
      }, "Course created successfully on blockchain")
    );
  } catch (blockchainError) {
    console.error(`❌ Blockchain registration failed:`, blockchainError.message);
    throw new ApiError(500, `Failed to create course on blockchain: ${blockchainError.message}`);
  }
});

// Get all courses - Fetches from blockchain
const getAllCourses = requestHandler(async (req, res) => {
  try {
    // Fetch all courses from blockchain (blockchain now tracks all courseIds)
    console.log(`📚 Fetching all courses from blockchain...`);
    const courses = await getCoursesFromBlockchain();

    const expandedCourses = [];
    
    for (const course of courses) {
      const branch = course.branch || null;

      // Expand courses: create one entry per teacher
      if (course.teachers && course.teachers.length > 0) {
        course.teachers.forEach(teacher => {
          expandedCourses.push({
            courseId: course.courseId,
            courseName: course.courseName,
            teacherId: teacher.teacherId,
            teacherName: teacher.teacherName,
            branch,
            teachers: [teacher] // Single teacher per expanded entry
          });
        });
      } else {
        expandedCourses.push({
          ...course,
          branch
        });
      }
    }

    console.log(`✅ Retrieved ${expandedCourses.length} expanded courses from blockchain`);
    
    return res.status(200).json(
      new ApiResponse(200, expandedCourses, "Courses retrieved from blockchain")
    );
  } catch (error) {
    console.error(`❌ Error fetching courses:`, error.message);
    throw new ApiError(500, `Failed to fetch courses: ${error.message}`);
  }
});

// Get course by ID - Fetches from blockchain
const getCourseById = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  try {
    console.log(`📚 Fetching course ${courseId} from blockchain...`);
    const course = await getCourseFromBlockchain(courseId);
    
    return res.status(200).json(
      new ApiResponse(200, course, "Course retrieved from blockchain")
    );
  } catch (error) {
    throw new ApiError(404, `Course with ID ${courseId} not found on blockchain`);
  }
});

// Update course - Not supported (blockchain is immutable)
const updateCourse = requestHandler(async (req, res) => {
  throw new ApiError(400, "Course update not supported - blockchain data is immutable. Create a new course instead.");
});

// Delete course - Not supported (blockchain is immutable)
const deleteCourse = requestHandler(async (req, res) => {
  throw new ApiError(400, "Course deletion not supported - blockchain data is immutable.");
});

// Get courses by branch - Fetches from blockchain with courseIds
const getCoursesByBranch = requestHandler(async (req, res) => {
  const { branch } = req.params;
  const normalizedBranch = normalizeBranch(branch);

  if (!normalizedBranch) {
    throw new ApiError(400, 'Invalid branch. Use CE, IT, EC, ME, or Civil');
  }
  
  try {
    // Fetch all courses from blockchain (blockchain tracks all courseIds now)
    const courses = await getCoursesFromBlockchain();
    const filteredCourses = courses
      .filter((course) => normalizeBranch(course.branch) === normalizedBranch)
      .map((course) => ({
        ...course,
        branch: normalizedBranch
      }));
    
    console.log(`✅ Retrieved ${filteredCourses.length} courses from blockchain for branch: ${normalizedBranch}`);

    return res.status(200).json(
      new ApiResponse(200, filteredCourses, `Courses retrieved from blockchain. Total: ${filteredCourses.length}`)
    );
  } catch (error) {
    console.error(`❌ Error fetching courses:`, error.message);
    throw new ApiError(500, `Failed to fetch courses: ${error.message}`);
  }
});

// Get feedback results for a specific teacher in a specific course
const getTeacherCourseResults = requestHandler(async (req, res) => {
  const { courseId, teacherId } = req.params;

  if (!courseId || !teacherId) {
    throw new ApiError(400, "courseId and teacherId are required");
  }

  console.log(`📊 Fetching results for course ${courseId}, teacher ${teacherId}`);

  try {
    // Get course from blockchain
    const course = await getCourseFromBlockchain(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found on blockchain");
    }

    console.log(`✅ Course found:`, course.courseName);
    console.log(`📋 Teachers in course:`, course.teachers.map(t => ({ name: t.teacherName, teacherId: t.teacherId })));

    // Find the specific teacher in the course
    const teacher = course.teachers.find(t => t.teacherId === teacherId);
    if (!teacher) {
      console.error(`❌ Teacher ${teacherId} not found. Available teachers:`, course.teachers.map(t => t.teacherId));
      throw new ApiError(404, `Teacher ${teacherId} not found in course ${courseId}`);
    }

    console.log(`✅ Teacher found: ${teacher.teacherName} (${teacher.teacherId})`);

    // Get averages from blockchain
    let averages;
    try {
      const courseIdStr = String(courseId);
      const teacherIdStr = String(teacherId);
      console.log(`🔗 Calling blockchain with courseId=${courseIdStr}, teacherId=${teacherIdStr}`);
      averages = await getTeacherCourseAveragesFromBlockchain(teacherIdStr, courseIdStr);
      console.log(`✅ Got averages from blockchain:`, averages);
    } catch (blockchainError) {
      console.error(`❌ Blockchain error:`, blockchainError.message);
      if (blockchainError.message.includes("No feedback")) {
        throw new ApiError(404, "No feedback available for this teacher-course combination yet");
      }
      throw blockchainError;
    }

    const ratingLabels = ['Teaching', 'Communication', 'Fairness', 'Engagement'];
    const ratingDetails = ratingLabels.map((label, index) => ({
      label,
      score: parseFloat(averages[index])
    }));

    const overallScore = ratingDetails.reduce((sum, item) => sum + item.score, 0) / ratingDetails.length;

    return res.status(200).json(
      new ApiResponse(200, {
        courseId,
        courseName: course.courseName,
        teacherId,
        teacherName: teacher.teacherName,
        ratings: ratingDetails,
        overallScore: parseFloat(overallScore.toFixed(2))
      }, "Teacher course results retrieved from blockchain")
    );
  } catch (err) {
    console.error(`❌ Error in getTeacherCourseResults:`, err.message);
    throw err;
  }
});

// Get all feedbacks from blockchain (Admin) - with ratings and comments
const getAllFeedbacks = requestHandler(async (req, res) => {
  console.log('📊 Fetching all feedbacks from blockchain...');
  
  try {
    const feedbacks = await getAllFeedbacksFromBlockchain();
    
    // Format feedbacks for frontend display
    const formattedFeedbacks = feedbacks.map((fb) => ({
      id: fb.id?.toString() || fb.feedbackId?.toString() || fb[5]?.toString(),
      teacherId: fb.facultyId || fb[1],
      courseId: fb.courseId || fb[2],
      ratings: {
        teaching: parseInt(fb.ratings[0]),
        communication: parseInt(fb.ratings[1]),
        fairness: parseInt(fb.ratings[2]),
        engagement: parseInt(fb.ratings[3])
      },
      totalScore: parseInt(fb.totalScore),
      averageScore: (parseInt(fb.totalScore) / 4).toFixed(2),
      comments: fb.comments || "",
      timestamp: new Date(parseInt(fb.timestamp) * 1000).toLocaleString(),
      timestampRaw: parseInt(fb.timestamp)
    }));
    
    // Group by course and teacher
    const groupedByCourse = {};
    const groupedByTeacher = {};
    
    formattedFeedbacks.forEach(fb => {
      if (!groupedByCourse[fb.courseId]) {
        groupedByCourse[fb.courseId] = [];
      }
      groupedByCourse[fb.courseId].push(fb);
      
      if (!groupedByTeacher[fb.teacherId]) {
        groupedByTeacher[fb.teacherId] = [];
      }
      groupedByTeacher[fb.teacherId].push(fb);
    });
    
    console.log(`✅ Retrieved ${formattedFeedbacks.length} feedbacks from blockchain`);
    
    return res.status(200).json(
      new ApiResponse(200, {
        feedbacks: formattedFeedbacks,
        totalCount: formattedFeedbacks.length,
        groupedByCourse,
        groupedByTeacher
      }, "All feedbacks retrieved from blockchain successfully")
    );
  } catch (err) {
    console.error('❌ Error fetching all feedbacks:', err);
    throw new ApiError(500, `Failed to fetch feedbacks: ${err.message}`);
  }
});

// Get submission tracking from MongoDB (Admin) - student names and submission status only
const getSubmissionTracking = requestHandler(async (req, res) => {
  console.log('📊 Fetching submission tracking from MongoDB...');
  
  try {
    const { User } = await import('../models/user.model.js');
    
    // Get all users who have submitted feedback
    const usersWithFeedback = await User.find({
      'feedbackSubmissions.0': { $exists: true }
    }).select('fullName username email walletAddress feedbackSubmissions');
    
    // Format the data for frontend
    const allSubmissions = [];
    let feedbackId = 1;
    
    usersWithFeedback.forEach(user => {
      user.feedbackSubmissions.forEach(submission => {
        allSubmissions.push({
          id: feedbackId++,
          studentName: user.fullName || user.username || 'Unknown',
          studentEmail: user.email || '',
          studentWallet: user.walletAddress || '',
          courseId: submission.courseId,
          courseName: submission.courseName || '',
          teacherId: submission.teacherId || '',
          timestamp: submission.submittedAt.toLocaleString(),
          timestampRaw: submission.submittedAt.getTime() / 1000
        });
      });
    });
    
    // Sort by timestamp (newest first)
    allSubmissions.sort((a, b) => b.timestampRaw - a.timestampRaw);
    
    // Group by course and teacher
    const groupedByCourse = {};
    const groupedByTeacher = {};
    
    allSubmissions.forEach(fb => {
      if (!groupedByCourse[fb.courseId]) {
        groupedByCourse[fb.courseId] = [];
      }
      groupedByCourse[fb.courseId].push(fb);
      
      if (!groupedByTeacher[fb.teacherId]) {
        groupedByTeacher[fb.teacherId] = [];
      }
      groupedByTeacher[fb.teacherId].push(fb);
    });
    
    console.log(`✅ Retrieved ${allSubmissions.length} submissions from MongoDB`);
    
    return res.status(200).json(
      new ApiResponse(200, {
        feedbacks: allSubmissions,
        totalCount: allSubmissions.length,
        groupedByCourse,
        groupedByTeacher
      }, "Submission tracking retrieved successfully")
    );
  } catch (err) {
    console.error('❌ Error fetching submissions:', err);
    throw new ApiError(500, `Failed to fetch submissions: ${err.message}`);
  }
});

// Get dashboard statistics (Admin only)
const getDashboardStats = requestHandler(async (req, res) => {
  try {
    const { User } = await import('../models/user.model.js');
    
    // Get total students from MongoDB
    const totalStudents = await User.countDocuments({
      $or: [{ role: 'student' }, { role: { $exists: false } }]
    });
    // Prefer blockchain teacher count (unique teacherIds), fallback to DB role count
    const courses = await getCoursesFromBlockchain();
    const teacherIdSet = new Set();

    courses.forEach((course) => {
      (course.teachers || []).forEach((teacher) => {
        if (teacher?.teacherId != null) {
          teacherIdSet.add(String(teacher.teacherId));
        }
      });
    });

    const teacherCountFromBlockchain = teacherIdSet.size;
    const teacherCountFromDb = await User.countDocuments({ role: 'teacher' });
    const totalTeachers = Math.max(teacherCountFromBlockchain, teacherCountFromDb);
    
    // Get all feedbacks from blockchain
    const allFeedbacks = await getAllFeedbacksFromBlockchain();
    const totalSubmittedFeedbacks = allFeedbacks.length;
    
    // Get recent feedbacks (last 5)
    const recentFeedbacks = allFeedbacks
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, 5)
      .map((fb, index) => ({
        id: index + 1,
        studentName: fb.studentWallet ? `${fb.studentWallet.slice(0, 6)}...${fb.studentWallet.slice(-4)}` : 'Anonymous',
        studentWallet: fb.studentWallet,
        courseId: fb.courseId,
        facultyId: fb.facultyId,
        timestamp: new Date(Number(fb.timestamp) * 1000).toLocaleString(),
        status: 'Confirmed'
      }));
    
    console.log(`📊 Dashboard Stats: ${totalStudents} students, ${totalTeachers} teachers, ${totalSubmittedFeedbacks} feedbacks`);
    
    return res.status(200).json(
      new ApiResponse(200, {
        totalStudents,
        totalTeachers,
        totalSubmittedFeedbacks,
        recentFeedbacks
      }, "Dashboard statistics retrieved successfully")
    );
  } catch (err) {
    console.error('❌ Error fetching dashboard stats:', err);
    throw new ApiError(500, `Failed to fetch dashboard statistics: ${err.message}`);
  }
});

export {
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
};
