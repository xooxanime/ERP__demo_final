import { useState, useEffect } from 'react';
import { batchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Award, Clock, Calendar, CheckCircle2, AlertTriangle, 
  HelpCircle, ChevronRight, X, Sparkles, Trophy 
} from 'lucide-react';

const StudentTests = () => {
  const [batch, setBatch] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz attempt state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    fetchStudentBatchAndQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0 || quizComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, quizComplete]);

  const fetchStudentBatchAndQuizzes = async () => {
    try {
      setLoading(true);
      const batchResponse = await batchAPI.getStudentBatch();
      const studentBatch = batchResponse.data.data.batch;
      setBatch(studentBatch);

      if (studentBatch) {
        const quizzesResponse = await batchAPI.getQuizzes(studentBatch._id);
        setQuizzes(quizzesResponse.data.data.quizzes);
      }
    } catch (error) {
      console.error('Error fetching student tests:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setTimeLeft(quiz.duration * 60);
    setQuizComplete(false);
    setQuizScore(null);
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[qIdx] = optIdx;
      return updated;
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && answers.some(ans => ans === null)) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    try {
      setAttempting(true);
      const payload = {
        answers: answers.map(ans => ans === null ? -1 : ans) // Use -1 for unselected answers
      };

      const response = await batchAPI.attemptQuiz(activeQuiz._id, payload);
      const { attempt } = response.data.data;
      
      setQuizScore({
        score: attempt.score,
        totalPoints: attempt.totalPoints
      });
      setQuizComplete(true);
      toast.success(autoSubmit ? 'Time expired! Quiz submitted automatically.' : 'Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setAttempting(false);
    }
  };

  const handleCloseQuizAttempt = () => {
    setActiveQuiz(null);
    setAnswers([]);
    setQuizComplete(false);
    setQuizScore(null);
    fetchStudentBatchAndQuizzes(); // Reload quiz list to show completion
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Group quizzes
  const activeQuizzes = quizzes.filter(q => !q.attempt && !q.isOverdue);
  const completedQuizzes = quizzes.filter(q => q.attempt);
  const missedQuizzes = quizzes.filter(q => q.isOverdue);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-7 h-7 text-primary" />
          Test Series
        </h1>
        {batch ? (
          <p className="text-sm text-slate-500 mt-1">
            Assigned Batch: <span className="font-bold text-slate-700 dark:text-slate-300">{batch.name}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-1">Practice mock tests and check your quiz results.</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : !batch ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <Award className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-display">No batch assigned</h3>
          <p className="text-slate-500 text-sm mt-1">You are not currently enrolled in any academic batches. Please contact Admin.</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <Award className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 font-display">No tests scheduled</h3>
          <p className="text-slate-500 text-sm mt-1">No quizzes are currently scheduled for your batch. Keep studying!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Quizzes */}
          {activeQuizzes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> Available Tests ({activeQuizzes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeQuizzes.map(q => (
                  <div key={q._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-44">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{q.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{q.courseId?.title}</p>
                      <div className="flex gap-4 mt-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {q.duration} Mins</span>
                        <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> {q.questions?.length} Questions</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartQuiz(q)}
                      className="w-full mt-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      Start Test <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Quizzes */}
          {completedQuizzes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Tests ({completedQuizzes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedQuizzes.map(q => {
                  const pct = Math.round((q.attempt.score / q.attempt.totalPoints) * 100);
                  return (
                    <div key={q._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex justify-between items-center gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{q.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{q.courseId?.title}</p>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">Attempted on: {new Date(q.attempt.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`p-3 rounded-2xl text-center border flex flex-col justify-center min-w-[70px] ${
                        pct >= 85 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : pct >= 50 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-red-500/10 border-red-500/20 text-red-500'
                      }`}>
                        <span className="text-[9px] block uppercase font-bold leading-none">Score</span>
                        <span className="text-sm font-extrabold block leading-none mt-1">{q.attempt.score}/{q.attempt.totalPoints}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missed Quizzes */}
          {missedQuizzes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Missed Tests ({missedQuizzes.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {missedQuizzes.map(q => (
                  <div key={q._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex justify-between items-center gap-4 opacity-75">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{q.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{q.courseId?.title}</p>
                      <p className="text-[10px] text-red-500 font-semibold mt-2">Missed Deadline: {new Date(q.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] px-3 py-1 bg-red-500/10 text-red-600 font-extrabold rounded-lg uppercase">Closed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Immersive Quiz-Taking Screen Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-955 bg-slate-900 flex flex-col h-screen text-slate-100 overflow-hidden">
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/90 flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-md">{activeQuiz.title}</h2>
              <p className="text-[10px] text-slate-400">{activeQuiz.courseId?.title}</p>
            </div>

            <div className="flex items-center gap-6">
              {!quizComplete && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl font-mono text-sm text-yellow-400 font-bold">
                  <Clock className="w-4 h-4 animate-pulse" />
                  {formatTime(timeLeft)}
                </div>
              )}
              {!quizComplete && (
                <button
                  onClick={() => handleSubmitQuiz(false)}
                  disabled={attempting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  Submit Test
                </button>
              )}
              {quizComplete && (
                <button
                  onClick={handleCloseQuizAttempt}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950 flex flex-col items-center">
            {!quizComplete ? (
              <div className="w-full max-w-3xl space-y-8 py-4">
                {activeQuiz.questions.map((question, qIdx) => (
                  <div key={question._id} className="p-6 border border-slate-800 bg-slate-900/50 rounded-2xl space-y-4">
                    <p className="text-sm font-bold text-white leading-relaxed flex gap-2">
                      <span className="text-primary select-none font-extrabold">{qIdx + 1}.</span>
                      {question.questionText}
                    </p>

                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {question.options.map((opt, optIdx) => {
                        const isSelected = answers[qIdx] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleOptionSelect(qIdx, optIdx)}
                            className={`p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                              isSelected 
                                ? 'bg-primary/25 border-primary text-white shadow-md shadow-primary/10' 
                                : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <div className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-slate-900" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Success / Result Screen */
              <div className="flex-1 flex flex-col justify-center items-center max-w-md text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/5 animate-bounce">
                  <Trophy className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white font-display">Test Completed!</h3>
                  <p className="text-slate-400 text-xs">Your test responses have been analyzed and scored instantly.</p>
                </div>

                {quizScore && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Final Score</span>
                    <h2 className="text-3xl font-extrabold text-white leading-none">{quizScore.score} / {quizScore.totalPoints}</h2>
                    <span className="text-sm font-extrabold text-emerald-400 block pt-1">
                      {Math.round((quizScore.score / quizScore.totalPoints) * 100)}% Accuracy
                    </span>
                  </div>
                )}

                <button
                  onClick={handleCloseQuizAttempt}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md border border-slate-700/80 transition-colors w-full"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTests;
