import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, BookOpen, Award, Play } from "lucide-react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function StudentDashboard() {
  const { id } = useParams()
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/exam/get-exam`);
        setExams(res.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10 px-4">
      <div className="container mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Student Dashboard</h1>
            <p className="text-gray-600">Welcome to your exam portal. Choose an exam to get started.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("examId");
              localStorage.removeItem("malpracticeCount")
              localStorage.removeItem("userId")
              window.location.href = "/";
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Logout
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-lg font-medium text-gray-600">Loading exams...</div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
            {exams.length === 0 ? (
              <p className="text-gray-500">No exams available right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {exam.description ? exam.description.slice(0, 200) + (exam.description.length > 200 ? "..." : "") : ""}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Duration: {exam.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Questions: {exam.questions?.length || 0}
                        </div>
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          Passing Score: {exam.passingScore} points
                        </div>
                      </div>

                      <Link
                        to={`/exam/${exam._id}`}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Exam</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
