import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Submit = () => {
  const [malpracticeTerminated, setMalpracticeTerminated] = useState(false);

  const userid = localStorage.getItem("userId");

  useEffect(() => {
    const raw = localStorage.getItem("malpracticeCount");
    const count = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : 0;
    if (count >= 3) {
      setMalpracticeTerminated(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl text-center space-y-6 border border-gray-200">
        {!malpracticeTerminated && (
          <div className="text-center">
            <Link
              to={`/student/dashboard/${userid }`}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}

        {malpracticeTerminated ? (
          <>
            <h1 className="text-2xl font-bold text-red-600">🚫 Exam Terminated</h1>
            <p className="text-gray-700">
              Your exam has been terminated due to multiple malpractice violations. Access to results is restricted.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-green-600">🎉 Exam Completed</h1>
            <p className="text-gray-700">
              Thank you for completing the exam. You can view your results in the dashboard.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Submit;
