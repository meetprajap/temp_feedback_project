# Department Feature Implementation

## Overview
Added department management to the Feedlith feedback system. Students now select their department during registration and can only view courses from their respective department when providing feedback.

---

## Changes Made

### Backend

#### 1. **User Model** (`backend/src/models/user.model.js`)
- **Added Department Field:**
  ```javascript
  department: {
    type: String,
    enum: ['CE', 'IT', 'EC', 'ME', 'Civil'],
    required: false
  }
  ```
- **Updated `generateAccessToken()` method** to include department in JWT payload so frontend can access it

#### 2. **User Controller** (`backend/src/controllers/user.controllers.js`)
- **Updated `registerUser()` function:**
  - Now accepts `department` as a required field during registration
  - Validates that department is one of: `CE`, `IT`, `EC`, `ME`, `Civil`
  - Stores department in user document on registration

#### 3. **Course Routes** (`backend/src/routes/course.route.js`)
- **Course routes already include department filtering:**
  ```
  GET /api/v1/course/branch/:branch
  ```
  - Students can fetch courses by their department/branch

### Frontend

#### 1. **Student Authentication Component** (`frontend/src/components/StudentAuth.jsx`)
- **Added Department Selection:**
  - Added `department` state variable
  - Added `Building2` icon import for visual feedback
  - Created department dropdown selector in registration form with options: `CE`, `IT`, `EC`, `ME`, `Civil`
  - Validates department selection is required
  - Passes department to backend during registration

#### 2. **App Component** (`frontend/src/App.jsx`)
- **Updated `handleLogin()` function:**
  - Now accepts optional `department` parameter
  - Stores department in localStorage along with other user data

#### 3. **Student Course Selector Component** (`frontend/src/components/StudentCourseSelector.jsx`)
- **Department-Based Course Filtering:**
  - Fetches user's department from localStorage
  - Automatically fetches only courses matching student's department from `/api/v1/course/branch/{department}`
  - Removes manual branch filter selection (users see only their department's courses)
  - Shows department as read-only display instead of filtering option
  - Updated error messages to be specific: "No courses available for your department"

---

## User Experience

### Registration Flow
1. Student provides: Full Name, Email, Password, **Department**
2. Department is saved to user profile

### Feedback Flow
1. Student logs in → Department is loaded from server
2. When providing feedback, student sees **only courses from their department**
3. Department courses are automatically fetched from: `/api/v1/course/branch/{department}`
4. Course list cannot be filtered to other departments (student-specific enforcement)

---

## API Changes

### Updated Endpoints

#### `POST /api/v1/user/register`
**Request Body (NEW):**
```json
{
  "fullName": "John Doe",
  "email": "23xxxxx@ddu.ac.in",
  "password": "password123",
  "confirmPassword": "password123",
  "department": "CE"
}
```

**Response Includes:**
```json
{
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "23xxxxx@ddu.ac.in",
    "department": "CE",
    "role": "student"
  }
}
```

#### `POST /api/v1/user/login`
**Response Now Includes:**
```json
{
  "data": {
    "user": {
      "_id": "...",
      "fullName": "...",
      "department": "CE",
      "role": "student"
    },
    "accessToken": "..."
  }
}
```
- JWT token includes department claim

#### `GET /api/v1/course/branch/:branch`
- Returns all courses for a specific department/branch
- **Example:** `GET /api/v1/course/branch/CE` → Returns all CE department courses

---

## Data Validation

### Department Validation
- **Valid Values:** `CE`, `IT`, `EC`, `ME`, `Civil`
- **Registration:** Department is required
- **Case Handling:** Frontend sends uppercase, backend converts to uppercase
- **Feedback:** Only courses matching user's department are available

---

## localStorage Format

```javascript
{
  "role": "student",
  "id": "user_id",
  "token": "jwt_token",
  "department": "CE"  // NEW
}
```

---

## Testing Checklist

- [ ] Register new student with department selection
- [ ] Verify department is stored in database
- [ ] Login with student account
- [ ] Verify only department-specific courses appear in course selector
- [ ] Verify cannot filter to other departments
- [ ] Submit feedback for a course in your department
- [ ] Verify feedback is tracked correctly
- [ ] Test with different departments (CE, IT, EC, ME, Civil)

---

## Backend Validation Logic

### Registration Department Validation
```javascript
const validDepartments = ['CE', 'IT', 'EC', 'ME', 'Civil'];
if (!validDepartments.includes(department)) {
  throw new ApiError(400, `Invalid department. Must be one of: ${validDepartments.join(', ')}`);
}
```

### Course Filtering
- Backend filters courses by branch matching user's department
- Frontend cannot override this through manual selection
- Only authorized courses appear in the feedback modal

---

## Security Notes

1. **JWT Token Protection:** Department is included in JWT, server-side filtering verifies department matches
2. **Frontend Enforcement:** UI prevents viewing other departments' courses
3. **Backend Enforcement:** Course API filters by branch (same as department)
4. **No Cross-Department Access:** Feedback can only be submitted for courses in student's department

---

## Future Enhancements

- Allow students to opt into courses from other departments (with admin approval)
- Add department-wise analytics and reporting
- Create department-specific feedback dashboards
- Implement inter-department course sharing policies

