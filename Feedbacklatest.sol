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

    // ================= STRUCTS =================

    struct Student {
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

    // ================= MAPPINGS =================

    mapping(address => Student) public students; // wallet => Student
    mapping(string => Teacher) public teachers;
    mapping(string => Course) public courses;

    // courseId => teacherId => assigned?
    mapping(string => mapping(string => bool)) public courseTeachers;
    mapping(string => string[]) public courseTeacherList;

    // facultyId => courseId => stats
    mapping(string => mapping(string => Stats)) public teacherCourseStats;

    // wallet => facultyId => courseId => submitted?
    mapping(address => mapping(string => mapping(string => bool)))
        public hasSubmitted;

    Feedback[] public feedbacks;
    string[] public courseIds; // Track all course IDs

    // ================= EVENTS =================

    event StudentAdded(address wallet, string name);
    event TeacherAdded(string teacherId, string name);
    event CourseAdded(string courseId, string courseName);
    event TeacherAssignedToCourse(string courseId, string teacherId);
    event FeedbackSubmitted(uint256 id, string facultyId);

    // ================= STUDENT =================

    function addStudent(address _wallet, string memory _name) external onlyAdmin {
        require(!students[_wallet].isRegistered, "Student already registered");
        require(_wallet != address(0), "Invalid wallet address");

        students[_wallet] = Student(_name, true);
        emit StudentAdded(_wallet, _name);
    }

    function isStudentRegistered(address _wallet)
        external
        view
        returns (bool)
    {
        return students[_wallet].isRegistered;
    }
    
    function getStudentName(address _wallet)
        external
        view
        returns (string memory)
    {
        require(students[_wallet].isRegistered, "Student not registered");
        return students[_wallet].name;
    }

    // ================= TEACHER =================

    function addTeacher(
        string memory _teacherId,
        string memory _name
    ) external onlyAdmin {
        teachers[_teacherId] = Teacher(_teacherId, _name, true);
        emit TeacherAdded(_teacherId, _name);
    }

    function isTeacherRegistered(string memory _teacherId)
        external
        view
        returns (bool)
    {
        return teachers[_teacherId].isRegistered;
    }

    // ================= COURSE =================

    function addCourse(
        string memory _courseId,
        string memory _courseName
    ) external onlyAdmin {
        require(!courses[_courseId].exists, "Course already exists");

        courses[_courseId] = Course(_courseId, _courseName, true);
        courseIds.push(_courseId); // Add to list of all courses
        emit CourseAdded(_courseId, _courseName);
    }

    function getAllCourseIds() external view returns (string[] memory) {
        return courseIds;
    }

    function getCourseCount() external view returns (uint256) {
        return courseIds.length;
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

    // ================= FEEDBACK =================

    function submitFeedback(
        address _studentWallet,
        string memory _facultyId,
        string memory _courseId,
        uint8[4] memory _ratings,
        string memory _comments
    ) external {
        require(students[_studentWallet].isRegistered, "Student not registered");
        require(teachers[_facultyId].isRegistered, "Teacher not found");
        require(courses[_courseId].exists, "Course not found");
        require(
            courseTeachers[_courseId][_facultyId],
            "Teacher not assigned to course"
        );
        require(
            !hasSubmitted[_studentWallet][_facultyId][_courseId],
            "You have already submitted feedback for this teacher in this course"
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
                _facultyId,
                _courseId,
                _ratings,
                score,
                _comments,
                block.timestamp
            )
        );

        hasSubmitted[_studentWallet][_facultyId][_courseId] = true;

        Stats storage stats = teacherCourseStats[_facultyId][_courseId];
        for (uint i = 0; i < 4; i++) {
            stats.ratingSums[i] += _ratings[i];
        }
        stats.feedbackCount++;

        emit FeedbackSubmitted(feedbackIdCounter, _facultyId);
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
