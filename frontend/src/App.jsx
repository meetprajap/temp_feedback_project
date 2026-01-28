import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  CheckCircle,
  AlertTriangle,
  User,
  ChevronRight,
  TrendingUp,
  Copy,
} from "lucide-react";

// Import Components
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/SideBar";
import FeedbackModal from "./components/FeedbackModal";
import CourseManagement from "./components/CourseManagement";
import StudentCourseSelector from "./components/StudentCourseSelector";
import FeedbackReport from "./components/FeedbackReport";
import AddTeacher from "./components/AddTeacher";

// Import Data
import { COURSES, INITIAL_BLOCKS } from "./data/mockData";

export default function FeedbackApp() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isMining, setIsMining] = useState(false);
  const [miningStep, setMiningStep] = useState(0);
  const [notification, setNotification] = useState(null);

  const handleLogin = (role, id, token, department = null) => {
    // Store user info and token in state and localStorage
    const userData = { role, id, token, department };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView("dashboard");
    showNotification("success", "Wallet Connected Successfully");
  };

  const showNotification = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFeedbackSubmit = async (ratings, comment) => {
    if (
      !ratings.teaching ||
      !ratings.comms ||
      !ratings.fairness ||
      !ratings.engage
    ) {
      showNotification("error", "Please complete all rating fields.");
      return;
    }

    setIsMining(true);

    // Simulate Blockchain Process
    const steps = [
      () => setMiningStep(1), // Hashing
      () => setMiningStep(2), // Encrypting
      () => setMiningStep(3), // Consensus
      async () => {
        // Finalizing
        const newBlock = {
          id: blocks.length + 1,
          hash:
            "0x" +
            Array(64)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join(""),
          prevHash: blocks[blocks.length - 1].hash,
          studentHash:
            "0x" +
            Array(10)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join(""),
          course: selectedCourse.id,
          rating: Object.values(ratings).reduce((a, b) => a + b, 0),
          timestamp: new Date().toLocaleString(),
        };
        setBlocks([newBlock, ...blocks]);
        
        // Track feedback submission in database
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          const response = await fetch('http://localhost:4000/api/v1/user/submit-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData?.token}`
            },
            body: JSON.stringify({
              courseId: selectedCourse.courseId || selectedCourse.id,
              courseName: selectedCourse.courseName || selectedCourse.name,
              feedbackTypes: {
                teaching: !!ratings.teaching,
                communication: !!ratings.comms,
                fairness: !!ratings.fairness,
                engagement: !!ratings.engage
              }
            })
          });
          
          if (response.ok) {
            console.log("Feedback tracking saved");
          }
        } catch (err) {
          console.error("Error tracking feedback:", err);
        }
        
        setIsMining(false);
        setMiningStep(0);
        setSelectedCourse(null);
        showNotification(
          "success",
          "Transaction Mined: Feedback Recorded Immutably."
        );
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      setTimeout(steps[i], (i + 1) * 1200);
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      <Sidebar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={() => setUser(null)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative bg-[#0f172a] scroll-smooth">
        {/* Top Header */}
        {/* <header className="sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {currentView === "dashboard"
                ? "Overview"
                : currentView === "explorer"
                ? "Blockchain Ledger"
                : "Analytics"}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Network: Ethereum Goerli Testnet • Block Height: #
              {14230 + blocks.length}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 text-xs font-mono text-slate-400">
              <Activity className="w-3 h-3 mr-2 text-emerald-400" />
              Gas: 12 Gwei
            </div>
            <button className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </header> */}

        {/* Content Padding */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Notification Toast */}
          {notification && (
            <div
              className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center space-x-4 text-white transform transition-all animate-in slide-in-from-bottom duration-500 border ${
                notification.type === "success"
                  ? "bg-emerald-900/90 border-emerald-500"
                  : "bg-red-900/90 border-red-500"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  notification.type === "success"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              >
                {notification.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {notification.type === "success" ? "Success" : "System Error"}
                </p>
                <p className="text-xs opacity-90">{notification.msg}</p>
              </div>
            </div>
          )}

          {/* DASHBOARD VIEW (STUDENT) */}
          {user.role === "student" && currentView === "dashboard" && (
            <>
              <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-indigo-900 to-purple-900 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                <h2 className="text-3xl font-extrabold text-white mb-2 relative z-10">
                  Hello, Student.
                </h2>
                <p className="text-indigo-200 max-w-xl relative z-10">
                  Your feedback drives the future of education. All submissions
                  are encrypted and stored permanently on the blockchain.
                </p>
              </div>

              <StudentCourseSelector
                onCourseSelect={(course) => setSelectedCourse(course)}
              />
            </>
          )}

          {/* DASHBOARD VIEW (ADMIN) */}
          {user.role === "admin" && currentView === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                    Total Students
                  </p>
                  <p className="text-4xl font-extrabold text-white">
                    {blocks.length}
                  </p>
                  <div className="mt-4 flex items-center text-emerald-400 text-sm font-bold">
                    <TrendingUp className="w-4 h-4 mr-1" /> +12% this week
                  </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                    Total Teachers
                  </p>
                  <p className="text-4xl font-extrabold text-white">3</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                    Total Submiited Feedbacks
                  </p>
                  <p className="text-4xl font-extrabold text-emerald-400">
                    99.9%
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-white">
                    Recent Feedbacks
                  </h3>
                  <button className="text-indigo-400 text-sm font-bold hover:text-indigo-300">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50">
                      <tr className="text-slate-400 text-xs uppercase tracking-wider">
                        {/* <th className="py-4 px-6 font-medium">Hash</th> */}
                        <th className="py-4 px-6 font-medium">Student Name</th>
                        {/* <th className="py-4 px-6 font-medium">Block</th> */}
                        <th className="py-4 px-6 font-medium">Index no.</th>
                        <th className="py-4 px-6 font-medium">Time</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {blocks.slice(0, 5).map((block) => (
                        <tr
                          key={block.id}
                          className="hover:bg-slate-700/30 transition-colors"
                        >
                          {/* <td className="py-4 px-6 font-mono text-indigo-400 text-xs">
                            <div className="flex items-center space-x-2">
                              <span>{block.hash.substring(0, 12)}...</span>
                              <Copy className="w-3 h-3 cursor-pointer hover:text-white" />
                            </div>
                          </td> */}
                          <td className="py-4 px-6 font-mono text-indigo-400 text-xs">
                            #{block.Name}
                          </td>
                          <td className="py-4 px-6 text-white font-mono">
                            #{block.id}
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-sm">
                            {block.timestamp}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">
                              Confirmed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {/* LEDGER EXPLORER */}

          {/* {currentView === "explorer" && (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="p-6 bg-slate-900 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Database className="w-5 h-5 mr-2 text-indigo-500" />
                    Student List
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="p-4 border-b border-slate-700">
                          Student ID
                        </th>
                        <th className="p-4 border-b border-slate-700">
                          Student Name
                        </th>
                        <th className="p-4 border-b border-slate-700">
                          Details
                        </th>
                        <th className="p-4 border-b border-slate-700">
                          Feedback Data
                        </th>
                        <th className="p-4 border-b border-slate-700">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-sm">
                      {blocks.map((block) => (
                        <tr
                          key={block.id}
                          className="hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="p-4 align-top">
                            <span className="font-mono text-indigo-400 font-bold text-lg">
                              #{block.id}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <span className="font-mono text-indigo-400 font-bold text-lg">
                              {block.Name}
                            </span>
                          </td>
                          <td className="p-4 align-top space-y-2">
                            <div>
                              <span className="text-xs text-slate-500 block mb-1">
                                BLOCK HASH
                              </span>
                              <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 block w-max">
                                {block.hash.substring(0, 24)}...
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 block mb-1">
                                PREV HASH
                              </span>
                              <span className="font-mono text-xs text-slate-400 block">
                                {block.prevHash.substring(0, 16)}...
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-slate-700 rounded text-xs text-white font-bold">
                                {block.course}
                              </span>
                              <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded text-xs border border-indigo-500/20">
                                Score: {block.rating}/20
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              Student: {block.studentHash}
                            </div>
                          </td>
                          <td className="p-4 align-top text-slate-400">
                            {block.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )} */}
          {/* LEDGER EXPLORER */}
          {/* COURSE MANAGEMENT */}
          {user.role === "admin" && currentView === "courses" && (
            <CourseManagement />
          )}

          {/* ADD TEACHER */}
          {user.role === "admin" && currentView === "addTeacher" && (
            <AddTeacher 
              onAdd={() => {
                setCurrentView("dashboard");
                showNotification("success", "Teacher added successfully!");
              }} 
              onCancel={() => setCurrentView("dashboard")}
            />
          )}

          {/* FEEDBACK REPORT */}
          {user.role === "admin" && currentView === "feedbackReport" && (
            <FeedbackReport />
          )}
        </div>
      </main>

      {/* FEEDBACK MODAL WRAPPER */}
      {selectedCourse && (
        <FeedbackModal
          selectedCourse={selectedCourse}
          onClose={() => !isMining && setSelectedCourse(null)}
          onSubmit={handleFeedbackSubmit}
          isMining={isMining}
          miningStep={miningStep}
        />
      )}
    </div>
  );
}
