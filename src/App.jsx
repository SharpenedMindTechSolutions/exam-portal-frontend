import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import ExamPage from "./pages/ExamPage";
import Submit from "./pages/Submit";
import AdminDashboard from "./pages/AdminDashboard";
import { Toaster } from 'react-hot-toast';
import Adminloginpage from "./pages/Adminloginpage";


function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          },
          success: {
            style: { background: '#D1FAE5', color: '#065F46' },
            iconTheme: { primary: '#10B981', secondary: '#fff' },
          },
          error: {
            style: { background: '#FEE2E2', color: '#991B1B' },
            iconTheme: { primary: '#DC2626', secondary: '#fff' },
          },
        }}
      />

      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/dashboard/:doamin/:id" element={<StudentDashboard />} />
        <Route path="/exam/:domain/:Id" element={<ExamPage />} />
        <Route path="submitexam" element={<Submit />} />

        <Route path="/admin/login" element={<Adminloginpage />} />
        <Route path="/admin/dashboard/:id" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
