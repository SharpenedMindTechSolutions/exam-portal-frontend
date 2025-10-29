
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Clock, AlertTriangle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ExamPage = () => {
  const { Id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [malpracticeCount, setMalpracticeCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [visibleRange, setVisibleRange] = useState([0, 9]);

  const userId = localStorage.getItem("userId");

  // Store exam ID locally
  useEffect(() => {
    if (Id) localStorage.setItem("examId", Id);
  }, [Id]);

  // Fetch exam details & auto-start
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/exam/${Id}`);
        setExam(res.data);
        setTimeRemaining(res.data.duration * 60);
        localStorage.setItem("malpracticeCount", 0);
      } catch (err) {
        console.error("Error fetching exam:", err);
      }
    };
    if (Id) fetchExam();
  }, [Id]);

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

  const handleSubmitExam = async () => {
    try {
      const examId = localStorage.getItem("examId");
      const malpractice = parseInt(localStorage.getItem("malpracticeCount") || 0);
      const payload = { userId, examId, answers, malpracticeCount: malpractice };
      await axios.post(`${API_BASE_URL}/api/exam/${examId}/submit`, payload);
      localStorage.removeItem("examId");
      localStorage.removeItem("malpracticeCount");
      navigate("/submitexam");
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Error submitting exam:", err);
    }
  };


  const handlePagination = (direction) => {
    if (!exam) return;
    const [start, end] = visibleRange;
    const total = exam.questions.length;

    if (direction === "next" && end < total - 1) {
      setVisibleRange([start + 10, end + 10]);
    } else if (direction === "prev" && start > 0) {
      setVisibleRange([start - 10, end - 10]);
    }
  };

  if (!exam) return <p className="text-center mt-10">Loading Exam...</p>;

  const currentQ = exam.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

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
            <span className="text-sm font-medium">
              Warnings: {malpracticeCount}/3
            </span>
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


      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePagination("prev")}
            disabled={visibleRange[0] === 0}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            &lt;
          </button>

          {exam.questions.slice(visibleRange[0], visibleRange[1] + 1).map((_, index) => {
            const realIndex = visibleRange[0] + index;
            return (
              <button
                key={realIndex}
                onClick={() => setCurrentQuestion(realIndex)}
                className={`w-8 h-8 rounded text-sm ${realIndex === currentQuestion
                    ? "bg-blue-600 text-white"
                    : answers[exam.questions[realIndex]._id] !== undefined
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
              >
                {realIndex + 1}
              </button>
            );
          })}

          <button
            onClick={() => handlePagination("next")}
            disabled={visibleRange[1] >= exam.questions.length - 1}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            &gt;
          </button>
        </div>

        <div className="flex justify-between gap-4 mt-2">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(prev - 1, 0))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-200 rounded"
          >
            Previous
          </button>

          {currentQuestion === exam.questions.length - 1 ? (
            <button
              onClick={handleSubmitExam}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(prev + 1, exam.questions.length - 1)
                )
              }
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
