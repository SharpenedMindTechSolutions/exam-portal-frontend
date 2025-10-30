
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function CreateQuestionPaperView() {
  const emptyQuestion = () => ({ question: "", options: ["", ""], correctAnswer: 0 });
  const [examMeta, setExamMeta] = useState({ title: "", description: "", domain: "", duration: "", passingScore: "" });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [form, setForm] = useState(emptyQuestion());
  const [editingIndex, setEditingIndex] = useState(null);
  const [examList, setExamList] = useState([]);
  const [editingExamId, setEditingExamId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // Check localStorage for adminToken & adminId
  const authCheck = () => {
    const token = localStorage.getItem("adminToken");
    const adminId = localStorage.getItem("adminId");
    if (!token || !adminId) {
      toast.error("Admin not authenticated. Please login.");
      navigate("/admin/login");
      return null;
    }
    return { token, adminId };
  };

  // Fetch exams only if authCheck passes
  const fetchExams = async () => {
    const auth = authCheck();
    if (!auth) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/exam/get-exam`);
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      setExamList(data);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setExamMeta((p) => ({ ...p, [name]: value }));
  };

  const handleFormChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleOptionChange = (i, v) =>
    setForm((p) => {
      const opt = [...p.options];
      opt[i] = v;
      return { ...p, options: opt };
    });

  const addOption = () => setForm((p) => ({ ...p, options: [...p.options, ""] }));
  const removeOption = (i) =>
    setForm((p) => {
      const opt = p.options.filter((_, idx) => idx !== i);
      return {
        ...p,
        options: opt.length >= 2 ? opt : ["", ""],
        correctAnswer: Math.min(p.correctAnswer, Math.max(0, opt.length - 1)),
      };
    });

  const setCorrect = (i) => setForm((p) => ({ ...p, correctAnswer: i }));

  const createQuestion = () => {
    if (!form.question.trim()) return toast.error("Question text cannot be empty.");
    if (form.options.some((o) => !o.trim())) return toast.error("All options must be filled.");
    if (form.options.length < 2) return toast.error("At least two options required.");

    setQuestions((q) => [...q, { ...form }]);
    setForm(emptyQuestion());
    toast.success("Question added successfully!");
  };

  const startEdit = (i) => {
    setEditingIndex(i);
    setForm({ ...questions[i] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveEdit = () => {
    if (!form.question.trim()) return toast.error("Question text cannot be empty.");
    if (form.options.some((o) => !o.trim())) return toast.error("All options must be filled.");
    if (form.options.length < 2) return toast.error("At least two options required.");

    setQuestions((q) => q.map((it, idx) => (idx === editingIndex ? { ...form } : it)));
    setEditingIndex(null);
    setForm(emptyQuestion());
    toast.success("Question updated successfully!");
  };

  const deleteQuestion = (i) => {
    setQuestions((q) => q.filter((_, idx) => idx !== i));
    toast.success("Question deleted!");
  };

  const resetAll = () => {
    setExamMeta({ title: "", description: "", domain: "", duration: "", passingScore: "" });
    setQuestions([emptyQuestion()]);
    setForm(emptyQuestion());
    setEditingIndex(null);
    setEditingExamId(null);
    toast.success("Form reset successfully!");
  };

  const submitExam = async () => {
    const auth = authCheck();
    if (!auth) return;

    if (!examMeta.title.trim() || !examMeta.domain.trim())
      return toast.error("Exam title and domain are required.");
    if (questions.length === 0) return toast.error("Add at least one question.");

    try {
      const payload = { ...examMeta, questions };
      let res;
      if (editingExamId) {
        res = await fetch(`${API_BASE_URL}/api/exam/${editingExamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/exam/create-exam`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save exam");
      const data = await res.json();
      toast.success(editingExamId ? "Exam updated successfully!" : "Exam created successfully!");
      resetAll();
      fetchExams();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const deleteExistingExam = async (id) => {
    const auth = authCheck();
    if (!auth) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/exam/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete exam");
      await res.json();
      toast.success("Exam deleted successfully!");
      fetchExams();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const loadExam = (exam, forEdit = false) => {
    const auth = authCheck();
    if (!auth) return;

    setExamMeta({
      title: exam.title,
      domain: exam.domain,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
    });
    setQuestions(exam.questions || []);
    setEditingIndex(null);
    setEditingExamId(forEdit ? exam._id : null);
    toast.success(forEdit ? "Loaded exam for editing" : "Loaded exam for preview");
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Create / Edit Question Paper</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-4">
          {/* Exam Details */}
          <div className="bg-white shadow rounded p-4">
            <h3 className="font-medium mb-3">Exam Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="title"
                value={examMeta.title}
                onChange={handleMetaChange}
                placeholder="Title"
                className="border rounded px-3 py-2"
              />
              <input
                name="domain"
                value={examMeta.domain}
                onChange={handleMetaChange}
                placeholder="Domain"
                className="border rounded px-3 py-2"
              />
              <input
                name="duration"
                value={examMeta.duration}
                onChange={handleMetaChange}
                placeholder="Duration (min)"
                className="border rounded px-3 py-2"
              />
              <input
                name="passingScore"
                value={examMeta.passingScore}
                onChange={handleMetaChange}
                placeholder="Passing score"
                className="border rounded px-3 py-2"
              />
              <textarea
                name="description"
                value={examMeta.description}
                onChange={handleMetaChange}
                placeholder="Description"
                className="col-span-1 md:col-span-2 border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Question Form */}
          <div className="bg-white shadow rounded p-4">
            <h3 className="font-medium mb-3">{editingIndex == null ? "Create Question" : `Edit Question ${editingIndex + 1}`}</h3>
            <div className="mb-3">
              <input
                value={form.question}
                onChange={(e) => handleFormChange("question", e.target.value)}
                placeholder="Question text"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-3 space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={form.correctAnswer === i}
                      onChange={() => setCorrect(i)}
                      className="text-blue-600"
                    />
                  </label>
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button onClick={() => removeOption(i)} className="px-2 py-1 bg-gray-100 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button onClick={addOption} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
                  <Plus size={16} /> Add option
                </button>
                <span className="text-sm text-gray-500">Select radio for correct answer</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editingIndex == null ? (
                <button onClick={createQuestion} className="px-4 py-2 bg-blue-600 text-white rounded">Add Question</button>
              ) : (
                <>
                  <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                  <button onClick={() => { setEditingIndex(null); setForm(emptyQuestion()); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                </>
              )}
              <button onClick={resetAll} className="ml-auto px-3 py-2 border rounded">Reset All</button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6 lg:space-y-4">
          {/* Current Questions */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">All Questions ({questions.length})</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {questions.map((q, idx) => (
                <div key={idx} className="border rounded-lg p-3 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Q{idx + 1}</div>
                    <div className="font-medium mb-2">{q.question || <span className="text-gray-400">(empty)</span>}</div>
                    <div className="space-y-1 text-sm">
                      {q.options.map((o, i) => (
                        <div key={i} className={`flex items-center gap-2 ${q.correctAnswer === i ? "text-green-600 font-semibold" : "text-gray-600"}`}>
                          <div className="w-5">{String.fromCharCode(65 + i)}.</div>
                          <div>{o || <span className="text-gray-400">(empty)</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 md:flex-col mt-2 md:mt-0">
                    <button onClick={() => startEdit(idx)} className="px-2 py-1 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-blue-700 transition">
                      <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => deleteQuestion(idx)} className="px-2 py-1 bg-red-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-red-700 transition">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && <div className="text-gray-500 text-center py-4">No questions yet.</div>}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <button onClick={() => setQuestions((q) => [...q, emptyQuestion()])} className="px-3 py-2 border rounded-md flex items-center gap-1 hover:bg-gray-100 transition">
                <Plus size={16} /> Add blank question
              </button>
              <button onClick={submitExam} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">
                {editingExamId ? "Update Exam" : "Submit Exam"}
              </button>
            </div>
          </div>

          {/* Backend Exam List */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">All Exams</h3>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 font-semibold text-gray-700">Title</th>
                    <th className="p-3 font-semibold text-gray-700">Domain</th>
                    <th className="p-3 font-semibold text-gray-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examList.length > 0 ? (
                    examList.map((exam) => (
                      <tr key={exam._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 font-medium text-gray-800">{exam.title}</td>
                        <td className="p-3 text-gray-600">{exam.domain}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => loadExam(exam, false)} className="px-2 py-1 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-blue-700">
                              <Edit size={14} /> Preview
                            </button>
                            <button onClick={() => loadExam(exam, true)} className="px-2 py-1 bg-green-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-green-700">
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => deleteExistingExam(exam._id)} className="px-2 py-1 bg-red-600 text-white rounded-md flex items-center gap-1 text-sm hover:bg-red-700">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500 py-4">
                        No exams yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
