// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FeedbackSystem {
    address public admin;
    uint256 private feedbackIdCounter;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    struct Student {
        string studentId;
        string name;
        bool isRegistered;
    }

    struct Teacher {
        string teacherId;
        string name;
        bool isRegistered;
    }

    struct Course {
        string courseId;
        string courseName;
        bool exists;
    }

    struct Feedback {
        uint256 id;
       
        string facultyId;
        string courseId;
        uint8[4] ratings;
        uint256 totalScore;
        string comments;
        uint256 timestamp;
    }

    struct Stats {
        uint256[4] ratingSums;
        uint256 feedbackCount;
    }

    mapping(string => Student) public students;
    mapping(string => Teacher) public teachers;
    mapping(string => Course) public courses;

    // courseId => teacherId => assigned?
    mapping(string => mapping(string => bool)) public courseTeachers;

    // courseId => list of teachers
    mapping(string => string[]) public courseTeacherList;

    Feedback[] public feedbacks;

    // facultyId => courseId => stats
    mapping(string => mapping(string => Stats)) public teacherCourseStats;

    // studentId => facultyId => courseId => submitted?
    mapping(string => mapping(string => mapping(string => bool)))
        public hasSubmitted;
    event CourseAdded(string courseId, string courseName);
    event TeacherAssignedToCourse(string courseId, string teacherId);

    event StudentAdded(string studentId, string name);
    event TeacherAdded(string teacherId, string name);
    event FeedbackSubmitted(uint256 id, string facultyId, string studentId);

    function addStudent(
        string memory _studentId,
        string memory _name
    ) external  {
        students[_studentId] = Student(_studentId, _name, true);
        emit StudentAdded(_studentId, _name);
    }
    function isTeacherRegistered(string memory _teacherId)
    external
    view
    returns (bool)
{
    return teachers[_teacherId].isRegistered;
}

function isStudentRegistered(string memory _studentId)
    external
    view
    returns (bool)
{
    return students[_studentId].isRegistered;
}

    function addTeacher(
        string memory _teacherId,
        string memory _name
    ) external onlyAdmin {
        teachers[_teacherId] = Teacher(_teacherId, _name, true);
        emit TeacherAdded(_teacherId, _name);
    }
    function addCourse(
        string memory _courseId,
        string memory _courseName
    ) external onlyAdmin {
        require(!courses[_courseId].exists, "Course already exists");

        courses[_courseId] = Course(_courseId, _courseName, true);

        emit CourseAdded(_courseId, _courseName);
    }
    function assignTeacherToCourse(
        string memory _courseId,
        string memory _teacherId
    ) external onlyAdmin {
        require(courses[_courseId].exists, "Course not found");
        require(teachers[_teacherId].isRegistered, "Teacher not registered");
        require(!courseTeachers[_courseId][_teacherId], "Already assigned");

        courseTeachers[_courseId][_teacherId] = true;
        courseTeacherList[_courseId].push(_teacherId);

        emit TeacherAssignedToCourse(_courseId, _teacherId);
    }

    function submitFeedback(
        string memory _studentId,
        string memory _facultyId,
        string memory _courseId,
        uint8[4] memory _ratings,
        string memory _comments
    ) external {
        require(students[_studentId].isRegistered, "Student not registered");
        require(teachers[_facultyId].isRegistered, "Teacher not found");
        require(
            !hasSubmitted[_studentId][_facultyId][_courseId],
            "Already submitted"
        );

        uint256 score;

        for (uint i = 0; i < 4; i++) {
            require(_ratings[i] >= 1 && _ratings[i] <= 5, "Rating must be 1-5");
            score += _ratings[i];
        }

        feedbackIdCounter++;

        feedbacks.push(
            Feedback(
                feedbackIdCounter,
                _studentId,
                _facultyId,
                _courseId,
                _ratings,
                score,
                _comments,
                block.timestamp
            )
        );

        // mark submitted
        hasSubmitted[_studentId][_facultyId][_courseId] = true;

        // aggregate per teacher + course
        Stats storage stats = teacherCourseStats[_facultyId][_courseId];

        for (uint i = 0; i < 4; i++) {
            stats.ratingSums[i] += _ratings[i];
        }

        stats.feedbackCount++;

        emit FeedbackSubmitted(feedbackIdCounter, _facultyId, _studentId);
    }

    // ================= RESULTS =================

    function getTeacherCourseAverages(
        string memory facultyId,
        string memory courseId
    ) external view returns (uint256[4] memory) {
        Stats memory stats = teacherCourseStats[facultyId][courseId];
        require(stats.feedbackCount > 0, "No feedback");

        uint256[4] memory averages;

        for (uint i = 0; i < 4; i++) {
            averages[i] = stats.ratingSums[i] / stats.feedbackCount;
        }

        return averages;
    }

    function getAllFeedbacks() external view returns (Feedback[] memory) {
        return feedbacks;
    }
}
