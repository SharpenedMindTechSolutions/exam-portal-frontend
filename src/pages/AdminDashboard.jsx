
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { User, FileText, LogOut, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import StudentReportView from "../Admin components/StudentReportView";
import CreateQuestionPaperView from "../Admin components/CreateQuestionPaperView";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const AdminDashboard = () => {
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("student_report");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (activeView === "student_report") {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API_BASE_URL}/api/admin/results`);
          setUsers(res.data);
          console.log("Fetched users:", res.data);
        } catch (err) {
          console.error("Error fetching data:", err);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [activeView]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    window.location.href = "/admin/login";
  };

  const renderContent = () => {
    switch (activeView) {
      case "student_report":
        return <StudentReportView users={users} loading={loading} />;
      case "create_paper":
        return <CreateQuestionPaperView />;
      default:
        return <div>Select a menu item from the sidebar.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside
        className={`flex flex-col bg-gray-800 text-white transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"
          }`}
      >
        <div className="flex items-center justify-between py-4 px-3 border-b">
          <div
            className={`flex-shrink-0 bg-purple-600 rounded-full flex items-center justify-center transition-all duration-300 ${sidebarCollapsed ? "w-10 h-10" : "w-16 h-16"
              }`}
          >
            <User className="w-6 h-6" />
          </div>
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold ml-3 flex-1">Admin</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center  bg-gray-700 rounded-full hover:bg-gray-600 transition ml-3"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
        {/* Menu Items */}
        <nav className="flex flex-col flex-1 p-2 gap-2">
          <button
            onClick={() => setActiveView("student_report")}
            className={`flex items-center justify-center sm:justify-start gap-2 p-3 rounded transition ${activeView === "student_report" ? "bg-purple-600 shadow-lg" : "hover:bg-gray-700"
              }`}
          >
            <UserRound className="w-5 h-5" />
            {!sidebarCollapsed && <span className="hidden sm:inline">Student Report</span>}
          </button>

          <button
            onClick={() => setActiveView("create_paper")}
            className={`flex items-center justify-center sm:justify-start gap-2 p-3 rounded transition ${activeView === "create_paper" ? "bg-purple-600 shadow-lg" : "hover:bg-gray-700"
              }`}
          >
            <FileText className="w-5 h-5" />
            {!sidebarCollapsed && <span className="hidden sm:inline">Create Question Paper</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center sm:justify-start gap-2 p-3 mt-auto rounded hover:bg-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="hidden sm:inline">Logout</span>}
          </button>
        </nav>

      </aside>
      <main className="flex-1">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
