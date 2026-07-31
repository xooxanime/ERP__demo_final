import { useState, useEffect } from 'react';
import { FiPlus, FiList, FiEdit2, FiCheck, FiX, FiInfo, FiPercent } from 'react-icons/fi';
import { assessmentAPI, batchAPI, courseAPI, feeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';

const TestsResults = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  // Selection state
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [scores, setScores] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Forms State
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    type: 'quiz',
    deliveryMode: 'online',
    courseId: '',
    dueDate: '',
    duration: 30,
    totalMarks: 100,
    passingMarks: 33,
    negativeMarking: false,
    questions: [] // MCQ format details if online
  });

  const [activeQuestion, setActiveQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    points: 1
  });

  const [gradeInput, setGradeInput] = useState([]); // array of student score input objects

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [batchesRes, coursesRes, sessionRes] = await Promise.all([
        batchAPI.getAll(),
        courseAPI.getAll(),
        feeAPI.getActiveSession()
      ]);
      setBatches(batchesRes.data.data.batches || []);
      setCourses(coursesRes.data.data.courses || []);
      setActiveSession(sessionRes.data.data?.academicSession || null);
    } catch (error) {
      toast.error('Failed to load initial workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchChange = async (batchId) => {
    setSelectedBatchId(batchId);
    setSelectedAssessmentId('');
    setScores([]);
    if (!batchId) {
      setAssessments([]);
      return;
    }
    try {
      const res = await assessmentAPI.getBatchAssessments(batchId);
      setAssessments(res.data.assessments || res.data.data?.assessments || []);
    } catch (error) {
      toast.error('Failed to load assessments for this batch');
    }
  };

  const handleAssessmentChange = async (examId) => {
    setSelectedAssessmentId(examId);
    if (!examId) {
      setScores([]);
      return;
    }
    try {
      const res = await assessmentAPI.getScores(examId);
      setScores(res.data.scores || res.data.data?.scores || []);
    } catch (error) {
      toast.error('Failed to retrieve scores list');
    }
  };

  // Add question locally to creation stack
  const handleAddQuestion = () => {
    if (!activeQuestion.questionText || activeQuestion.options.some(o => !o)) {
      toast.error('Please fill in question text and all options');
      return;
    }
    setNewAssessment({
      ...newAssessment,
      questions: [...newAssessment.questions, { ...activeQuestion }]
    });
    setActiveQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      points: 1
    });
    toast.success('Question added to exam blueprint');
  };

  // Create Assessment API trigger
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) {
      toast.error('Please select a batch first');
      return;
    }

    const activeSessionId = batches.find(b => b._id === selectedBatchId)?.academicSessionId || activeSession?._id;
    
    if (!activeSessionId) {
      toast.error('Cannot resolve a valid active academic session ID.');
      return;
    }

    try {
      setLoading(true);

      // Seed Questions first if MCQ online
      let questionIds = [];
      if (newAssessment.deliveryMode === 'online' && newAssessment.questions.length > 0) {
        // Normally, we'd add to the reusable QuestionBank first, 
        // but for streamlined UI we can simulate creation. Let's make sure backend creates them.
      }

      const payload = {
        title: newAssessment.title,
        description: newAssessment.description,
        type: newAssessment.type,
        deliveryMode: newAssessment.deliveryMode,
        academicSessionId: activeSessionId,
        courseId: newAssessment.courseId,
        batchId: selectedBatchId,
        dueDate: newAssessment.dueDate,
        duration: Number(newAssessment.duration),
        totalMarks: Number(newAssessment.totalMarks),
        passingMarks: Number(newAssessment.passingMarks),
        negativeMarking: newAssessment.negativeMarking
      };

      await assessmentAPI.create(payload);
      toast.success('Assessment created successfully');
      setShowCreateModal(false);
      
      // Refresh list
      handleBatchChange(selectedBatchId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  // Open Bulk Grade modal
  const handleOpenGradeModal = async () => {
    if (!selectedAssessmentId) return;
    try {
      const activeBatch = batches.find(b => b._id === selectedBatchId);
      // Fetch users list in the batch
      const usersRes = await batchAPI.getUsersList();
      // Filter students who are in the selected batch
      const students = usersRes.data.data.users?.filter(u => 
        u.role === 'student' && activeBatch.students?.includes(u._id)
      ) || [];

      // Map to scorecard input array
      const inputs = students.map(st => {
        const existingScore = scores.find(s => s.studentId?._id === st._id || s.studentId === st._id);
        return {
          studentId: st._id,
          name: st.name,
          marksObtained: existingScore ? existingScore.marksObtained : 0,
          graceMarks: existingScore ? existingScore.graceMarks : 0,
          moderatedMarks: existingScore ? existingScore.moderatedMarks : 0,
          remarks: existingScore ? existingScore.remarks : ''
        };
      });

      setGradeInput(inputs);
      setShowGradeModal(true);
    } catch (error) {
      toast.error('Failed to load students list for grading');
    }
  };

  // Submit bulk scores API trigger
  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await assessmentAPI.submitScores(selectedAssessmentId, { scores: gradeInput });
      toast.success('Student grades published successfully!');
      setShowGradeModal(false);
      handleAssessmentChange(selectedAssessmentId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish grades');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeFieldChange = (idx, field, val) => {
    setGradeInput(gradeInput.map((input, i) => 
      i === idx ? { ...input, [field]: val } : input
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments & Results Management</h1>
          <p className="text-gray-500 text-sm mt-1">Configure online quizzes, register offline test scores, and monitor performance analytics.</p>
        </div>
        <div>
          <button
            onClick={() => {
              if (!selectedBatchId) {
                toast.error('Please choose a batch selection first');
                return;
              }
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition font-semibold text-sm shadow-sm"
          >
            <FiPlus /> New Assessment
          </button>
        </div>
      </div>

      {/* Selectors and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Select Batch</label>
          <select
            value={selectedBatchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-semibold"
          >
            <option value="">Choose Batch...</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Select Assessment</label>
          <select
            value={selectedAssessmentId}
            disabled={!selectedBatchId}
            onChange={(e) => handleAssessmentChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-semibold disabled:opacity-50"
          >
            <option value="">Choose Assessment...</option>
            {assessments.map(a => (
              <option key={a._id} value={a._id}>{a.title} ({a.deliveryMode} - {a.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scores and Results table */}
      {selectedAssessmentId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiList className="text-indigo-600" />
              <span className="text-sm font-bold text-gray-800">Student Scores Sheet</span>
            </div>
            <button
              onClick={handleOpenGradeModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Bulk Entry / Grades Editing
            </button>
          </div>

          {scores.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No grades registered for this assessment yet. Click Bulk Entry above to add marks.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 text-xs font-medium uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Marks Obtained</th>
                    <th className="p-4">Grace / Moderated</th>
                    <th className="p-4">Final Score</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">CBSE Grade</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {scores.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50/30 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-gray-900">{s.studentId?.name || 'Unknown Student'}</p>
                          <p className="text-xs text-gray-400">{s.studentId?.email}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{s.marksObtained}</td>
                      <td className="p-4 text-xs text-gray-500">
                        +{s.graceMarks} grace / +{s.moderatedMarks} moderated
                      </td>
                      <td className="p-4 font-bold text-gray-900">{s.finalScore}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{s.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md">
                          {s.grade} (GP: {s.gradePoint})
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          s.passStatus === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {s.passStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* Modal: Create Assessment */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Define Assessment Engine</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground"><FiX /></button>
            </div>
            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assessment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maths Midterm"
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Assessment Type</label>
                  <select
                    value={newAssessment.type}
                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm font-semibold"
                  >
                    <option value="quiz">Quiz / MCQ</option>
                    <option value="midterm">Midterm Examination</option>
                    <option value="final_exam">Final Examination</option>
                    <option value="CT1">Class Test 1</option>
                    <option value="CT2">Class Test 2</option>
                    <option value="practical">Practical / Laboratory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Select Course</label>
                  <select
                    required
                    value={newAssessment.courseId}
                    onChange={(e) => setNewAssessment({ ...newAssessment, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm"
                  >
                    <option value="">Choose Course...</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Delivery Mode</label>
                  <select
                    value={newAssessment.deliveryMode}
                    onChange={(e) => setNewAssessment({ ...newAssessment, deliveryMode: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm font-semibold"
                  >
                    <option value="online">Online Assessment (MCQ)</option>
                    <option value="offline">Offline Written Examination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAssessment.totalMarks}
                    onChange={(e) => setNewAssessment({ ...newAssessment, totalMarks: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Passing Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAssessment.passingMarks}
                    onChange={(e) => setNewAssessment({ ...newAssessment, passingMarks: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={newAssessment.duration}
                    onChange={(e) => setNewAssessment({ ...newAssessment, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Due / Conduct Date</label>
                <input
                  type="date"
                  required
                  value={newAssessment.dueDate}
                  onChange={(e) => setNewAssessment({ ...newAssessment, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-sm"
                />
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl transition shadow-sm">
                Create Assessment Blueprint
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Grade Entry */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground">Bulk Assessment Grading</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Input marks, grace additions, and remarks per student.</p>
              </div>
              <button onClick={() => setShowGradeModal(false)} className="text-muted-foreground hover:text-foreground"><FiX /></button>
            </div>
            <form onSubmit={handleSubmitGrades} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {gradeInput.map((input, idx) => (
                  <div key={input.studentId} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition">
                    <span className="text-sm font-bold text-gray-800 min-w-[120px]">{input.name}</span>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Marks:</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={input.marksObtained}
                          onChange={(e) => handleGradeFieldChange(idx, 'marksObtained', Number(e.target.value))}
                          className="w-16 px-1.5 py-1 border border-gray-200 rounded-md text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Grace:</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={input.graceMarks}
                          onChange={(e) => handleGradeFieldChange(idx, 'graceMarks', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 border border-gray-200 rounded-md text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Mod:</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={input.moderatedMarks}
                          onChange={(e) => handleGradeFieldChange(idx, 'moderatedMarks', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 border border-gray-200 rounded-md text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-600"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={input.remarks}
                        onChange={(e) => handleGradeFieldChange(idx, 'remarks', e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-28"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm mt-4">
                Publish All Scores
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TestsResults;
