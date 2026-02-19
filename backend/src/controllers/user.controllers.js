import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import requestHandler from '../utils/asyncHandler.js';
import { addStudent, submitFeedbackLogic, ensureAdminOnChain } from '../services/blockchainService.js';
// Email validation pattern: starts with 23 and ends with @ddu.ac.in
const validateDDUEmail = (email) => {
  const emailPattern = /^23[a-zA-Z0-9]*@ddu\.ac\.in$/;
  return emailPattern.test(email);
};

// Register User - Students only (email format: 23*@ddu.ac.in)
const registerUser = requestHandler(async (req, res) => {
  // Get user data from frontend
  const { fullName, email, password, confirmPassword, department, walletAddress } = req.body;
  
  // Validate all fields are provided
  if (!fullName?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim() || !department?.trim()) {
    throw new ApiError(400, "All fields including department are required");
  }
  
  // Validate email format (must start with 23 and end with @ddu.ac.in)
  if (!validateDDUEmail(email)) {
    throw new ApiError(400, "Invalid email. Email must start with '23' and end with '@ddu.ac.in' (e.g., 23xxxxx@ddu.ac.in)");
  }
  
  // Validate password length
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  
  // Validate passwords match
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }
  
  // Validate department
  const validDepartments = ['CE', 'IT', 'EC', 'ME', 'Civil'];
  if (!validDepartments.includes(department)) {
    throw new ApiError(400, `Invalid department. Must be one of: ${validDepartments.join(', ')}`);
  }
  
  // Check if user already exists
  const existedUser = await User.findOne({ email });
  
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }
  
  // Create new user object
  const user = await User.create({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    department: department.toUpperCase(),
    branch: department.toUpperCase(),
    walletAddress: walletAddress || null
  });
  
  // Get created user without password and refreshToken
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  
  // Note: Blockchain registration (addStudent) will be called from frontend after wallet connection
  
  // Generate tokens for the new user
  const accessToken = createdUser.generateAccessToken();
  const refreshToken = createdUser.generateRefreshToken();
  
  // Update refresh token in database
  createdUser.refreshToken = refreshToken;
  await createdUser.save({ validateBeforeSave: false });
  
  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  };
  
  // Return success response with tokens
  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(201, {
        user: createdUser,
        accessToken: accessToken,
        refreshToken: refreshToken
      }, "User registered successfully")
    );
});

const HARD_CODED_ADMIN_EMAIL = "23ceubg1@ddu.ac.in";
const HARD_CODED_ADMIN_PASSWORD = "Meet@123";

// Login User
const loginUser = requestHandler(async (req, res) => {
  // Get email, password, and optional adminKey from frontend
  const { email, password, adminKey } = req.body;
  
  // Validate fields are provided
  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "Email and password are required");
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  const isHardcodedAdmin = normalizedEmail === HARD_CODED_ADMIN_EMAIL.toLowerCase();
  let user = null;

  if (isHardcodedAdmin) {
    if (password !== HARD_CODED_ADMIN_PASSWORD) {
      throw new ApiError(401, "Invalid admin credentials");
    }

    user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        fullName: "Admin",
        email: normalizedEmail,
        password: HARD_CODED_ADMIN_PASSWORD,
        role: "admin",
        department: "ADMIN",
        branch: "ADMIN"
      });
    }

    const adminWalletHeader = req.header("x-wallet-address");
    if (adminWalletHeader) {
      user.walletAddress = adminWalletHeader.toLowerCase();
      try {
        await ensureAdminOnChain(user.walletAddress);
      } catch (chainError) {
        throw new ApiError(500, `Failed to set admin on-chain: ${chainError.message}`);
      }
    }

    const isAdminPasswordValid = await user.isPasswordCorrect(HARD_CODED_ADMIN_PASSWORD);
    if (!isAdminPasswordValid) {
      user.password = HARD_CODED_ADMIN_PASSWORD;
    }

    user.role = "admin";
    await user.save({ validateBeforeSave: false });
  } else {
    // Admin key for simple admin authentication
    const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Find user by email
    user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check if admin key is provided and valid
    if (adminKey) {
      if (adminKey === ADMIN_KEY) {
        if (ADMIN_EMAIL && normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
          throw new ApiError(401, "Invalid admin email");
        }

        if (ADMIN_PASSWORD && password !== ADMIN_PASSWORD) {
          throw new ApiError(401, "Invalid admin password");
        }

        const adminWalletHeader = req.header("x-wallet-address");
        if (adminWalletHeader) {
          if (user.walletAddress && user.walletAddress.toLowerCase() !== adminWalletHeader.toLowerCase()) {
            throw new ApiError(403, "Forbidden - Admin wallet mismatch");
          }
          if (!user.walletAddress) {
            user.walletAddress = adminWalletHeader.toLowerCase();
          }
        }

        user.role = "admin";
        await user.save({ validateBeforeSave: false });
      } else {
        throw new ApiError(401, "Invalid admin key");
      }
    }
  }
  
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Update refresh token in database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  
  // Get user without password and refreshToken
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  };
  
  // Return response with tokens in cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken
        },
        "User logged in successfully"
      )
    );
});

// Logout User
const logoutUser = requestHandler(async (req, res) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }
    },
    { new: true }
  );
  
  // Clear cookies
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  };
  
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Check if student has submitted feedback for a course and teacher
const checkFeedbackStatus = requestHandler(async (req, res) => {
  const { courseId, teacherId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if feedback already submitted for THIS COURSE + TEACHER combination
  const feedbackExists = user.feedbackSubmissions.some(
    submission => submission.courseId === parseInt(courseId) && submission.teacherId === teacherId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { submitted: feedbackExists }, "Feedback status retrieved"));
});

// Get all feedback submissions for a student
const getStudentFeedbackStatus = requestHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { feedbackSubmissions: user.feedbackSubmissions }, "Student feedback status retrieved"));
});

// Mark feedback as submitted for a course and submit to blockchain
const submitFeedbackTracking = requestHandler(async (req, res) => {
  const { courseId, courseName, feedbackTypes, teacherId, studentId, ratings, comments, feedbackData } = req.body;
  const userId = req.user._id;

  console.log('DEBUG: submitFeedbackTracking received from frontend:', {
    courseId,
    courseName,
    feedbackTypes,
    teacherId,
    studentId,
    ratings,
    comments,
    feedbackData
  });

  if (!courseId || !courseName || !teacherId) {
    throw new ApiError(400, "courseId, courseName, and teacherId are required");
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const walletHeader = req.header("x-wallet-address");
  if (walletHeader && user.walletAddress && walletHeader.toLowerCase() !== user.walletAddress.toLowerCase()) {
    throw new ApiError(403, "Forbidden - Wallet mismatch");
  }

  // Check if feedback already submitted for THIS COURSE + TEACHER combination
  const feedbackExists = user.feedbackSubmissions.some(
    submission => submission.courseId === parseInt(courseId) && submission.teacherId === teacherId
  );

  if (feedbackExists) {
    throw new ApiError(409, "You have already submitted feedback for this course and teacher");
  }

  // Add feedback submission tracking to database (per course + teacher)
  user.feedbackSubmissions.push({
    courseId: parseInt(courseId),
    courseName: courseName,
    teacherId: teacherId,  // ✅ Track per teacher
    teaching: feedbackTypes?.teaching || false,
    communication: feedbackTypes?.communication || false,
    fairness: feedbackTypes?.fairness || false,
    engagement: feedbackTypes?.engagement || false,
    submittedAt: new Date()
  });

  await user.save();

  // Submit feedback to blockchain service with student's wallet address
  let blockchainResult = null;
  try {
    if (!user.walletAddress) {
      throw new ApiError(400, "Student wallet not connected. Please connect wallet first.");
    }
    
    blockchainResult = await submitFeedbackLogic({
      walletAddress: user.walletAddress,
      senderWalletAddress: user.walletAddress,
      courseId: courseId,
      teacherId: teacherId,
      ratings: ratings || [0, 0, 0, 0],
      comments: comments || "",
      feedbackDetails: feedbackData || feedbackTypes
    });
  } catch (error) {
    console.error('Error submitting to blockchain:', error);
    throw error; // Don't continue if blockchain submission fails
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { 
      feedbackSubmission: user.feedbackSubmissions,
      blockchainSubmission: blockchainResult 
    }, "Feedback tracking saved successfully and submitted to blockchain"));
});

// Get all students who submitted feedback for a course (Admin)
const getCourseFeedbackStatus = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    throw new ApiError(400, "courseId is required");
  }

  // Find all users who submitted feedback for this course
  const students = await User.find({
    "feedbackSubmissions.courseId": parseInt(courseId)
  }).select("fullName email branch feedbackSubmissions");

  // Extract only the feedback submissions for this course
  const feedbackData = students.map(student => {
    const submission = student.feedbackSubmissions.find(
      sub => sub.courseId === parseInt(courseId)
    );
    return {
      studentId: student._id,
      studentName: student.fullName,
      studentEmail: student.email,
      studentBranch: student.branch,
      courseName: submission.courseName,
      submittedAt: submission.submittedAt,
      feedbackTypes: {
        teaching: submission.teaching,
        communication: submission.communication,
        fairness: submission.fairness,
        engagement: submission.engagement
      }
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { 
      courseId: parseInt(courseId), 
      totalSubmissions: feedbackData.length,
      submissions: feedbackData 
    }, "Course feedback submissions retrieved"));
});

// Get feedback submission status for all courses (Admin)
const getAllFeedbackStatus = requestHandler(async (req, res) => {
  // Get all students with their feedback submissions
  const students = await User.find().select("fullName email branch feedbackSubmissions");

  const feedbackStatus = students.map(student => ({
    studentId: student._id,
    studentName: student.fullName,
    studentEmail: student.email,
    studentBranch: student.branch,
    submittedCount: student.feedbackSubmissions.length,
    submissions: student.feedbackSubmissions.map(sub => ({
      courseId: sub.courseId,
      courseName: sub.courseName,
      submittedAt: sub.submittedAt,
      feedbackTypes: {
        teaching: sub.teaching,
        communication: sub.communication,
        fairness: sub.fairness,
        engagement: sub.engagement
      }
    }))
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { students: feedbackStatus }, "All feedback submissions retrieved"));
});

// Link wallet to user account
const linkWallet = requestHandler(async (req, res) => {
  const { walletAddress, userId } = req.body;
  
  if (!walletAddress) {
    throw new ApiError(400, "Wallet address is required");
  }
  
  const user = await User.findById(userId || req.user._id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  // Check if wallet is already linked to another account
  const existingWallet = await User.findOne({ 
    walletAddress: walletAddress.toLowerCase(),
    _id: { $ne: user._id }
  });
  
  if (existingWallet) {
    throw new ApiError(409, "This wallet is already linked to another account");
  }
  
  // Link wallet to user
  user.walletAddress = walletAddress.toLowerCase();
  await user.save({ validateBeforeSave: false });
  
  // Register student on blockchain with wallet address
  if (user.role !== "admin") {
    try {
      const transactionHash = await addStudent(walletAddress.toLowerCase(), user.fullName, walletAddress.toLowerCase());
      if (transactionHash) {
        console.log("✅ Student registered on blockchain:", transactionHash);
      } else {
        console.log("ℹ️ Student already existed on blockchain. Wallet link completed without new transaction.");
      }
    } catch (blockchainError) {
      console.error("❌ Blockchain registration failed:", blockchainError.message);
      // Remove wallet from user if blockchain registration fails
      user.walletAddress = null;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, `Failed to register on blockchain: ${blockchainError.message}`);
    }
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, { walletAddress: user.walletAddress }, "Wallet linked successfully"));
});

// Get wallet info for user
const getWalletInfo = requestHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId).select("walletAddress email fullName");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, { 
      walletAddress: user.walletAddress,
      email: user.email,
      fullName: user.fullName
    }, "Wallet info retrieved"));
});

// Verify wallet matches user account
const verifyWallet = requestHandler(async (req, res) => {
  const { walletAddress, userId } = req.body;
  
  if (!walletAddress) {
    throw new ApiError(400, "Wallet address is required");
  }
  
  const user = await User.findById(userId || req.user._id);
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  if (!user.walletAddress) {
    throw new ApiError(400, "No wallet linked to this account");
  }
  
  const isMatch = user.walletAddress.toLowerCase() === walletAddress.toLowerCase();
  
  return res
    .status(200)
    .json(new ApiResponse(200, { 
      isMatch,
      registeredWallet: user.walletAddress 
    }, isMatch ? "Wallet verified successfully" : "Wallet does not match"));
});

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  checkFeedbackStatus, 
  getStudentFeedbackStatus, 
  submitFeedbackTracking, 
  getCourseFeedbackStatus, 
  getAllFeedbackStatus,
  linkWallet,
  getWalletInfo,
  verifyWallet
}; 
