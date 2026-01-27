# Feedlith Backend API Documentation

## Overview
The backend has been configured with authentication endpoints for student registration and login. All code follows the existing folder hierarchy and uses established patterns.

## Database
- **MongoDB URL**: `mongodb+srv://feedback:Feedback123@cluster0.dirtg5t.mongodb.net/?appName=Cluster0`
- All user data is stored in the MongoDB database connected via the URL above.

---

## API Endpoints

### 1. User Registration (Students Only)
**Endpoint**: `POST /api/v1/user/register`

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "23xxxxx@ddu.ac.in",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Email Requirements**:
- ✅ Must start with `23`
- ✅ Must end with `@ddu.ac.in`
- ✅ Valid format: `23xxxxx@ddu.ac.in`
- ❌ Invalid examples: `john@ddu.ac.in`, `23xxx@gmail.com`

**Password Requirements**:
- ✅ Minimum 6 characters
- ✅ Must match confirmPassword field
- ✅ Will be hashed using bcrypt before storage

**Success Response** (201):
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "23xxxxx@ddu.ac.in",
    "createdAt": "2024-01-23T10:00:00.000Z",
    "updatedAt": "2024-01-23T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400` - Missing required fields or invalid format
- `409` - Email already exists in database
- `500` - Server error

---

### 2. User Login
**Endpoint**: `POST /api/v1/user/login`

**Request Body**:
```json
{
  "email": "23xxxxx@ddu.ac.in",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "23xxxxx@ddu.ac.in",
      "createdAt": "2024-01-23T10:00:00.000Z"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

**Cookies Set**:
- `accessToken` - Expires in 1 day
- `refreshToken` - Expires in 10 days
- Both are httpOnly, secure, and sameSite strict

**Error Responses**:
- `400` - Missing email or password
- `401` - Invalid credentials

---

### 3. User Logout
**Endpoint**: `POST /api/v1/user/logout`

**Authentication Required**: Yes (Bearer token required)

**Success Response** (200):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged out successfully",
  "data": {}
}
```

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── user.controllers.js          ✅ Register, Login, Logout functions
│   ├── models/
│   │   └── user.model.js                ✅ User schema with validation
│   ├── routes/
│   │   └── user.route.js                ✅ API endpoints
│   ├── middleware/
│   │   └── multer.middleware.js         (File upload handling)
│   ├── utils/
│   │   ├── ApiError.js                  (Error handling)
│   │   ├── ApiResponse.js               (Response formatting)
│   │   └── asyncHandler.js              (Async error handling)
│   ├── db/                              (Database connection)
│   ├── app.js                           ✅ Express app setup
│   ├── constants.js                     (Constants)
│   └── index.js                         (Entry point)
├── package.json                         ✅ Updated with all dependencies
├── .env                                 ✅ Environment variables configured
└── .gitignore
```

---

## Key Features Implemented

### Register Function Features:
1. ✅ Email validation (must start with 23, end with @ddu.ac.in)
2. ✅ Password validation (min 6 characters, confirmation match)
3. ✅ Duplicate email checking
4. ✅ Password hashing with bcrypt
5. ✅ User data storage in MongoDB
6. ✅ Returns user data without password/tokens

### Login Function Features:
1. ✅ Email and password validation
2. ✅ Password verification using bcrypt
3. ✅ JWT access token generation (expires in 1 day)
4. ✅ JWT refresh token generation (expires in 10 days)
5. ✅ Token storage in secure cookies
6. ✅ Returns user data with tokens

### General Features:
1. ✅ Proper error handling with custom ApiError class
2. ✅ Consistent response format with ApiResponse class
3. ✅ Async error handling with requestHandler wrapper
4. ✅ Database connection to MongoDB
5. ✅ CORS enabled for frontend communication

---

## Environment Variables

Required in `.env` file:
```
PORT=4000
MONGODB_URL=mongodb+srv://feedback:Feedback123@cluster0.dirtg5t.mongodb.net/?appName=Cluster0
ORIGIN=*
ACCESS_TOKEN_SECRET=aa2d577cb94bf8b3c9063f122cb36e0e4f21f84bc0bb8dccbc2c4b60a3a53112
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=a999de4a127581fda645c8fa1da5ecb964167a6ee6ed7fcf4ad3428ee97cbc56
REFRESH_TOKEN_EXPIRY=10d
```

---

## Testing the API

### Using cURL or Postman:

**Register**:
```bash
POST http://localhost:4000/api/v1/user/register
Content-Type: application/json

{
  "fullName": "Test Student",
  "email": "23comp001@ddu.ac.in",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Login**:
```bash
POST http://localhost:4000/api/v1/user/login
Content-Type: application/json

{
  "email": "23comp001@ddu.ac.in",
  "password": "password123"
}
```

---

## Notes

1. All emails MUST follow the DDU pattern: `23xxxxx@ddu.ac.in`
2. Passwords are automatically hashed with bcrypt before storage
3. All responses follow the ApiResponse format for consistency
4. Tokens are stored in HTTP-only cookies for security
5. Database connection is already configured in .env
6. The API is ready to connect with the frontend application
