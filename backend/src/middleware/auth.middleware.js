import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import requestHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = requestHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken;
    let tokenSource = "cookie";
    
    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7); // Remove "Bearer " prefix
        tokenSource = "header";
      }
    }

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    // Verify token secret is available
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error("❌ ACCESS_TOKEN_SECRET is not set in environment variables");
      throw new ApiError(500, "Server configuration error: TOKEN_SECRET not set");
    }

    // Debug logging
    console.log(`🔑 Token received from ${tokenSource}`);
    console.log(`🔑 Token length: ${token.length}`);
    console.log(`🔑 Token starts with: ${token.substring(0, 20)}...`);
    console.log(`🔑 SECRET length: ${process.env.ACCESS_TOKEN_SECRET.length}`);

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    console.log(`✅ Token verified successfully for user: ${decodedToken._id}`);

    // Find user by ID
    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Unauthorized - User not found");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Enhanced error logging for JWT issues
    console.error(`❌ JWT Verification Error: ${error.message}`);
    if (error.name === 'JsonWebTokenError') {
      console.error(`   Error type: ${error.message}`);
    } else if (error.name === 'TokenExpiredError') {
      console.error(`   Token expired at: ${error.expiredAt}`);
    }
    throw new ApiError(401, error?.message || "Unauthorized - Invalid token");
  }
});
