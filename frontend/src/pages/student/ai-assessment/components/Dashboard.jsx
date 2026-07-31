import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { Plus, Activity, Rocket, CheckCircle2, AlertTriangle, FileText, Code, Calculator, BookOpen, Target, ArrowRight, ArrowUp, Trophy, Star, Brain, TrendingUp, Search, Bell, Flame, PieChart, Type, Lightbulb } from 'lucide-react';
import { aiAssessmentAPI } from '../../../../services/api';

const COLORS = ['#5238ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function Dashboard({ student, history, onStartAssessment, isLoading }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Embedded Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState('AI');
  const [customTopic, setCustomTopic] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('Intermediate');
  const [customNumQuestions, setCustomNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState('No Limit');
  const [selectedTypes, setSelectedTypes] = useState(['MCQ', 'True/False', 'Short Answer']);
  
  const availableTypes = ['MCQ', 'True/False', 'Short Answer', 'Coding', 'Fill in the Blanks', 'Scenario Based'];

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleGenerate = () => {
    if (selectedTypes.length === 0) {
      alert("Please select at least one question type.");
      return;
    }
    
    let finalTopic = customTopic;
    if (assessmentMode === 'ERP') {
      finalTopic = student?.course || 'General Programming';
    } else {
      if (!finalTopic.trim()) {
        alert("Please enter a topic or concept.");
        return;
      }
    }

    onStartAssessment({ 
      topic: finalTopic,
      difficulty: customDifficulty,
      numQuestions: customNumQuestions,
      questionTypes: selectedTypes,
      timeLimit: timeLimit
    });
  };

  useEffect(() => {
    if (!student || !student._id) return;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await aiAssessmentAPI.getDashboard(student._id || student.id);
        setDashboardData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [student]);

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2 style={{ color: 'var(--color-text-muted)' }}>Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-danger)' }}>
        <h2>Error: {error}</h2>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { studentInfo, statistics, recentAssessments, performanceOverview, questionTypeBreakdown, aiInsights, weakTopics } = dashboardData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      {/* Top Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Good Morning, {studentInfo?.name || 'Student'}! 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Keep practicing and improve every day. You're doing great!</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search anything..." style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', width: '250px', outline: 'none', background: 'var(--bg-card)', color: 'var(--color-text-main)' }} />
          </div>
          <div style={{ position: 'relative', cursor: 'pointer', background: 'var(--bg-card)', padding: '8px', borderRadius: '50%', border: '1px solid var(--color-border)' }}>
            <Bell size={20} color="var(--color-text-muted)" />
            <span style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--color-primary)', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', fontSize: '0.6rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowGenerator(!showGenerator)} style={{ marginLeft: '1rem' }}>
            <Plus size={18} /> Generate Assessment
          </button>
        </div>
      </div>
      
      {/* Collapsible Generator Panel */}
      {showGenerator && (
        <div id="generate-card" className="card animate-fade-in" style={{ 
          padding: '1.5rem', 
          background: assessmentMode === 'AI' 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)' 
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)', 
          border: assessmentMode === 'AI' ? '2px solid #8b5cf6' : '2px solid #2563eb', 
          boxShadow: assessmentMode === 'AI' 
            ? '0 10px 25px rgba(139, 92, 246, 0.2), inset 0 0 15px rgba(139, 92, 246, 0.1)' 
            : '0 10px 25px rgba(37, 99, 235, 0.2), inset 0 0 15px rgba(37, 99, 235, 0.1)',
          borderRadius: '16px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: assessmentMode === 'AI' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #2563eb, #059669)', 
                padding: '12px', 
                borderRadius: '12px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: assessmentMode === 'AI' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.3s ease'
              }}>
                {assessmentMode === 'AI' ? <Brain size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                    {assessmentMode === 'AI' ? '🤖 Generative AI Mode' : '🏫 ERP Curriculum Mode'}
                  </h3>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    padding: '3px 10px', 
                    borderRadius: '9999px',
                    color: 'white',
                    background: assessmentMode === 'AI' ? '#8b5cf6' : '#2563eb',
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {assessmentMode === 'AI' ? '⚡ Gemini 1.5 Flash' : '📚 Syllabus Aligned'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                  {assessmentMode === 'AI' 
                    ? 'Generative Mode: Ask AI on ANY custom topic (e.g. Quantum Computing, React Fiber) to build an instant test.' 
                    : 'Institutional Mode: Strict alignment with your officially enrolled ERP course modules & curriculum.'}
                </p>
              </div>
            </div>
            {/* Mode Switcher Buttons */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
              <button 
                type="button"
                onClick={() => setAssessmentMode('AI')}
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: assessmentMode === 'AI' ? '#8b5cf6' : 'transparent', 
                  color: assessmentMode === 'AI' ? 'white' : 'var(--color-text-muted)', 
                  fontWeight: 'bold', 
                  fontSize: '0.85rem',
                  boxShadow: assessmentMode === 'AI' ? '0 2px 8px rgba(139, 92, 246, 0.4)' : 'none', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s' 
                }}>
                🤖 AI Mode
              </button>
              <button 
                type="button"
                onClick={() => setAssessmentMode('ERP')}
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: assessmentMode === 'ERP' ? '#2563eb' : 'transparent', 
                  color: assessmentMode === 'ERP' ? 'white' : 'var(--color-text-muted)', 
                  fontWeight: 'bold', 
                  fontSize: '0.85rem',
                  boxShadow: assessmentMode === 'ERP' ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s' 
                }}>
                🏫 ERP Mode
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Topic Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '6px' }}>Topic / Concept</label>
              {assessmentMode === 'AI' ? (
                <input 
                  type="text" 
                  placeholder="e.g., Python Decorators, System Design, DBMS..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--color-text-main)' }}
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.3)', fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: '600' }}>
                  Curriculum Course: <strong>{student?.course || 'General Programming'}</strong>
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '6px' }}>Difficulty</label>
              <select 
                value={customDifficulty} 
                onChange={(e) => setCustomDifficulty(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--color-text-main)' }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Questions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '6px' }}>Questions</label>
              <select 
                value={customNumQuestions} 
                onChange={(e) => setCustomNumQuestions(parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--color-text-main)' }}
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
              </select>
            </div>

            {/* Time Limit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '6px' }}>Time Limit</label>
              <select 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--color-text-main)' }}
              >
                <option value="No Limit">No Limit</option>
                <option value="10 Minutes">10 Minutes</option>
                <option value="20 Minutes">20 Minutes</option>
                <option value="30 Minutes">30 Minutes</option>
                <option value="60 Minutes">60 Minutes</option>
              </select>
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '1rem', 
              fontWeight: 'bold',
              background: assessmentMode === 'AI' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #2563eb, #059669)',
              border: 'none',
              color: 'white'
            }}
            onClick={handleGenerate}
          >
            {assessmentMode === 'AI' ? '🚀 Generate AI Custom Assessment' : '📚 Generate ERP Syllabus Assessment'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Stat 1 */}
        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#f0fdf4', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <FileText color="#22c55e" size={22} strokeWidth={2.5} />
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Total Assessments</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a' }}>{statistics?.totalAssessments || 0}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#22c55e', fontWeight: '700' }}>
            <ArrowUp size={14} strokeWidth={3} /> {statistics?.improvement || 0}% vs last month
          </div>
          
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px' }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,25 L15,22 L30,24 L45,18 L60,20 L75,10 L90,15 L100,8 L100,30 L0,30 Z" fill="url(#grad1)" />
              <polyline points="0,25 15,22 30,24 45,18 60,20 75,10 90,15 100,8" fill="none" stroke="#22c55e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#eff6ff', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <TrendingUp color="#3b82f6" size={22} strokeWidth={2.5} />
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Average Score</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a' }}>{statistics?.averageScore || 0}%</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#22c55e', fontWeight: '700' }}>
            <ArrowUp size={14} strokeWidth={3} /> {statistics?.improvement || 0}% vs last month
          </div>
          
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px' }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,22 L15,25 L30,15 L45,20 L60,10 L75,18 L90,8 L100,12 L100,30 L0,30 Z" fill="url(#grad2)" />
              <polyline points="0,22 15,25 30,15 45,20 60,10 75,18 90,8 100,12" fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fefce8', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Trophy color="#eab308" size={22} strokeWidth={2.5} />
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Highest Score</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a' }}>{statistics?.highestScore || 0}%</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#ea580c', fontWeight: '700' }}>
            <span style={{ fontSize: '1rem' }}>🔥</span> All Time Best
          </div>
          
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px' }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,26 L20,24 L40,15 L60,22 L80,12 L100,8 L100,30 L0,30 Z" fill="url(#grad3)" />
              <polyline points="0,26 20,24 40,15 60,22 80,12 100,8" fill="none" stroke="#f59e0b" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fef2f2', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Flame color="#ef4444" size={22} strokeWidth={2.5} />
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Current Streak</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a' }}>{studentInfo?.streak || 0} Days</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#ea580c', fontWeight: '700' }}>
            <span style={{ fontSize: '1rem' }}>🔥</span> Keep it up!
          </div>
          
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px' }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,25 L15,22 L30,28 L45,20 L60,24 L75,15 L90,20 L100,10 L100,30 L0,30 Z" fill="url(#grad4)" />
              <polyline points="0,25 15,22 30,28 45,20 60,24 75,15 90,20 100,10" fill="none" stroke="#ef4444" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>

      {/* Grid Layouts below Stats */}
      <div className="dashboard-row-2">
        {/* Performance Overview Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>Performance Overview</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Last 7 Assessments <span style={{fontSize: '0.6rem'}}>▼</span>
            </div>
          </div>
          <div style={{ flexGrow: 1, width: '100%', minHeight: '220px', position: 'relative' }}>
            <div style={{ position: 'absolute', right: '10%', top: '30%', background: 'white', padding: '8px 12px', borderRadius: '10px', boxShadow: 'var(--shadow-card)', zIndex: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{performanceOverview && performanceOverview.length > 0 ? performanceOverview[performanceOverview.length - 1].name : 'Test'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{performanceOverview && performanceOverview.length > 0 ? performanceOverview[performanceOverview.length - 1].score : 0}%</div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5238ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#5238ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v) => `${v}%`} />
                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights (Compact) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>AI Insights</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>View All</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px', background: 'var(--color-success-bg)', borderRadius: '50%', padding: '4px' }}><ArrowUp size={14} color="var(--color-success)" /></div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '2px' }}>Strong Areas</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Great job! You excel in {aiInsights?.strongAreas?.join(', ') || 'many topics'}.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px', background: 'var(--color-warning-bg)', borderRadius: '50%', padding: '4px' }}><Search size={14} color="var(--color-warning)" /></div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '2px' }}>Focus Areas</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Consider more practice in {aiInsights?.weakAreas?.join(', ') || 'weak topics'}.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px', background: 'var(--color-blue)', borderRadius: '50%', padding: '4px' }}><Target size={14} color="white" /></div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '2px' }}>Recommendation</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{aiInsights?.suggestions?.[0] || 'Take more tests to get recommendations.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weak Topics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="#ef4444" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>Weak Topics</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {weakTopics?.length > 0 ? weakTopics.slice(0,4).map((topic, idx) => {
              const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
              const c = colors[idx % colors.length];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>{topic.topic}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{topic.percentage}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${topic.percentage}%`, background: c, height: '100%', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              );
            }) : (
               <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No data yet.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="dashboard-row-3">
        {/* Recent Assessments */}
        <div className="card" style={{ flexGrow: 1, gridColumn: 'span 2' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>Recent Assessments</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentAssessments?.length > 0 ? recentAssessments.map((a, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} color="var(--color-primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{a.name}</h4>
                      <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{a.difficulty} • 10 Questions</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '800', color: a.status === 'Passed' ? '#10b981' : '#f59e0b', fontSize: '0.9rem' }}>{a.score}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'none' }}>{a.date}</span>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Review</button>
                  </div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No recent assessments found.</p>
              )}
          </div>
        </div>

        {/* Question Type Breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>Question Breakdown</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', position: 'relative' }}>
            {questionTypeBreakdown && questionTypeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={questionTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {questionTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name, props) => [`${props.payload.percentage}% (${val})`, name]} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No data available.</p>
            )}
            {questionTypeBreakdown && questionTypeBreakdown.length > 0 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Total</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
                  {questionTypeBreakdown.reduce((acc, curr) => acc + curr.value, 0)}
                </div>
              </div>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
            {questionTypeBreakdown?.slice(0, 4).map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{entry.name}</span>
                </div>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{entry.percentage}% ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
