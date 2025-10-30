import React, { useState } from "react";

const StudentReportView = ({ users = [], loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(users.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleUsers = users.slice(startIndex, startIndex + rowsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded shadow min-h-[100vh]">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">
        Student Exam Records
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No records found.</p>
      ) : (
        <>
          <div className="overflow-y-auto overflow-x-auto max-h-[500px] border rounded-lg">
            <table className="min-w-full text-sm md:text-base text-left border-collapse">
              <thead className="bg-purple-600 text-white sticky top-0 text-center">
                <tr>
                  <th className="py-3 px-4">Number</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Domain</th> 
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user, index) => (
                  <tr
                    key={user._id || index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-700 text-center">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4 text-center">{user.name}</td>
                    <td className="py-3 px-4 text-center">{user.email}</td>
                    <td className="py-3 px-4 text-center">{user.domain}</td>
                    <td className="py-3 px-4 text-center">{user.examTitle}</td>
                    <td className="py-3 px-4 text-center">{user.score}/50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center items-center gap-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Prev
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentReportView;
