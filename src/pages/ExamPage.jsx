
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Clock, AlertTriangle } from "lucide-react";

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

  const userId = localStorage.getItem("userId");

  // Store examId in localStorage
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
            const statusRes = await axios.get(
              `${API_BASE_URL}/api/exam/status/${userId}/${Id}`
            );
            if (statusRes.data?.completed) {
              toast.error(" You have already completed this exam!");
            }
          } catch (statusErr) {
            if (statusErr.response && statusErr.response.status === 403) {
              toast.error(
                statusErr.response.data?.message ||
                  "You are not allowed to take this exam."
              )
                  navigate(`/student/dashboard/${userId}`);
            } else {
              console.error("Status check failed:", statusErr);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching exam:", err);
      }
    };

    if (Id) fetchExam();
  }, [Id, userId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam]);

  // Malpractice tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && exam) {
        setMalpracticeCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem("malpracticeCount", newCount);
          if (newCount >= 3) handleSubmitExam();
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [exam]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ Submit Exam
  const handleSubmitExam = async () => {
    try {
      const examId = localStorage.getItem("examId");
      const malpractice = parseInt(localStorage.getItem("malpracticeCount") || 0);
      const payload = { userId, examId, answers, malpracticeCount: malpractice };
      await axios.post(`${API_BASE_URL}/api/exam/${examId}/submit`, payload);
      toast.success("Exam submitted successfully!");
      localStorage.removeItem("examId");
      localStorage.removeItem("malpracticeCount");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      navigate("/submitexam");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast.error("Failed to submit exam.");
    }
  };

  // Visible question range logic
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

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Question Box */}
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-lg font-medium mb-6">{currentQ.question}</h2>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                answers[currentQ._id] === index
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
            className={`px-6 py-2 rounded ${
              currentQuestion === 0
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
                className={`w-8 h-8 mx-0.5 rounded text-sm focus:outline-none transition ${
                  realIndex === currentQuestion
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
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className={`px-6 py-2 rounded-lg ${
                allAnswered
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 text-white"
              }`}
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

