
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock, AlertTriangle } from "lucide-react";
import { BookOpen, CheckCircle2, PlayCircle, XCircle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const QUESTIONS_PER_PAGE = 10;

const ExamPage = () => {
  const { Id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [malpracticeCount, setMalpracticeCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [visibleRange, setVisibleRange] = useState([0, QUESTIONS_PER_PAGE - 1]);
  const [examStarted, setExamStarted] = useState(false); // 👈 New state

  const userId = localStorage.getItem("userId");
  const domain = localStorage.getItem("domain");

  // Store examId
  useEffect(() => {
    if (Id) localStorage.setItem("examId", Id);
  }, [Id]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/exam/${Id}`);
        setExam(res.data);
        setTimeRemaining(res.data.duration * 60);
        localStorage.setItem("malpracticeCount", 0);

        if (userId && Id) {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/exam/status/${userId}/${Id}`);
            if (statusRes.data?.completed) {
              toast.error("You have already completed this exam!");
              navigate(`/student/dashboard/${domain}/${userId}`);
            }
          } catch (statusErr) {
            if (statusErr.response && statusErr.response.status === 403) {
              toast.error(statusErr.response.data?.message || "You are not allowed to take this exam.");
              navigate(`/student/dashboard/${domain}/${userId}`);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching exam:", err);
      }
    };
    if (Id) fetchExam();
  }, [Id, userId, navigate]);

  // Timer countdown ⏰
  useEffect(() => {
    if (!examStarted || !exam) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        // ⏳ Alert at 5 min and 1 min remaining
        if (newTime === 300) toast(`⚠️ Only 5 minutes left!`, { icon: "⏰" });
        if (newTime === 60) toast(`⚠️ Last 1 minute remaining!`, { icon: "🚨" });

        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, exam]);

  // Malpractice tracking 🚨
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        setMalpracticeCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem("malpracticeCount", newCount);
          if (newCount >= 3) handleSubmitExam(false);
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examStarted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ Submit Exam
  const handleSubmitExam = async (auto = false) => {
    try {
      const examId = localStorage.getItem("examId");
      const malpractice = parseInt(localStorage.getItem("malpracticeCount") || 0);
      const payload = { userId, examId, answers, malpracticeCount: malpractice };
      await axios.post(`${API_BASE_URL}/api/exam/${examId}/submit`, payload);

      toast.success(auto ? "Time’s up! Exam auto-submitted." : "Exam submitted successfully!");
      localStorage.clear();
      navigate("/submitexam");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast.error("Failed to submit exam.");
    }
  };

  // Visible range
  const clampVisibleRange = (start, total) => {
    const allowedMaxStart = Math.max(0, total - QUESTIONS_PER_PAGE);
    const newStart = Math.min(Math.max(0, start), allowedMaxStart);
    const newEnd = Math.min(newStart + QUESTIONS_PER_PAGE - 1, total - 1);
    return [newStart, newEnd];
  };

  const handleNextQuestion = () => {
    if (!exam) return;
    const total = exam.questions.length;
    const nextIndex = Math.min(currentQuestion + 1, total - 1);
    if (nextIndex > visibleRange[1]) {
      const [newStart] = clampVisibleRange(visibleRange[0] + QUESTIONS_PER_PAGE, total);
      setVisibleRange([newStart, Math.min(newStart + QUESTIONS_PER_PAGE - 1, total - 1)]);
    }
    setCurrentQuestion(nextIndex);
  };

  const handlePrevQuestion = () => {
    if (!exam) return;
    const prevIndex = Math.max(currentQuestion - 1, 0);
    if (prevIndex < visibleRange[0]) {
      const [newStart, newEnd] = clampVisibleRange(visibleRange[0] - QUESTIONS_PER_PAGE, exam.questions.length);
      setVisibleRange([newStart, newEnd]);
    }
    setCurrentQuestion(prevIndex);
  };

  if (!exam) return <p className="text-center mt-10">Loading Exam...</p>;

  const currentQ = exam.questions[currentQuestion];
  const allAnswered = exam.questions.every((q) => answers[q._id] !== undefined);

  // 🧾 Show Instructions before starting exam
  if (!examStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4">
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-2xl rounded-3xl p-10 animate-fadeIn">

          {/* Header Section */}
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-blue-700 w-8 h-8" />
            <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">
              {exam.title}
            </h1>
          </div>

          <p className="text-gray-600 mb-8 text-base">
            Please review the instructions carefully before starting your exam.
          </p>

          {/* Exam Details Box */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-5 rounded-2xl shadow-sm mb-8">
            <h2 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              Exam Details
            </h2>

            <ul className="list-none space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-1" />
                <span>Total Duration: <b>{exam.duration} minutes</b></span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                <span>Do not switch tabs or minimize the window (3 warnings = auto submit).</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
                <span>Once submitted, you cannot retake the exam.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
                <span>Answer all questions before submission.</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-1" />
                <span>Exam will auto-submit automatically when time ends.</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setExamStarted(true)}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <PlayCircle className="w-5 h-5" />
              Start Exam
            </button>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-md transition-all duration-300"
            >
              <XCircle className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      </div>

    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {exam.questions.length}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Warnings: {malpracticeCount}/3</span>
          </div>

          <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-mono text-lg">
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full shadow-sm border border-blue-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 20.25a8.25 8.25 0 0 1 15 0"
              />
            </svg>
            <span className="text-blue-700 font-semibold">
              ID: {localStorage.getItem("userId")?.slice(0, 10).toUpperCase()}
            </span>
          </div>

        </div>
      </div>

      {/* Question Box */}
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-lg font-medium mb-6">{currentQ.question}</h2>
        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${answers[currentQ._id] === index
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
              <input
                type="radio"
                name={`question-${currentQ._id}`}
                value={index}
                checked={answers[currentQ._id] === index}
                onChange={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQ._id]: index,
                  }))
                }
                className="w-4 h-4 text-blue-600 mr-4"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className={`px-6 py-2 rounded ${currentQuestion === 0
              ? "bg-gray-200 opacity-60 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            Previous
          </button>

          {exam.questions.slice(visibleRange[0], visibleRange[1] + 1).map((_, index) => {
            const realIndex = visibleRange[0] + index;
            const isAnswered = answers[exam.questions[realIndex]._id] !== undefined;
            return (
              <button
                key={realIndex}
                onClick={() => setCurrentQuestion(realIndex)}
                aria-label={`Go to question ${realIndex + 1}`}
                className={`w-8 h-8 mx-0.5 rounded text-sm focus:outline-none transition ${realIndex === currentQuestion
                  ? "bg-blue-600 text-white shadow-lg"
                  : isAnswered
                    ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-700"
                  }`}
              >
                {realIndex + 1}
              </button>
            );
          })}

          {allAnswered && currentQuestion === exam.questions.length - 1 ? (
            <button
              onClick={() => handleSubmitExam(false)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
