import React from 'react';
import { ArrowLeft, Download, CheckCircle2, Rocket, ArrowRight } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Result({ result, onBack, onNext }) {
  const { 
    score, 
    correctAnswers, 
    wrongAnswers, 
    weakTopics = [], 
    strongTopics = [], 
    suggestions = [],
    questionResults = [],
    attemptNumber,
    date,
    difficulty = 'Medium',
    timeTaken = '28:34' // Fallback for mockup if not passed
  } = result;

  const totalQuestions = correctAnswers + wrongAnswers || 20; // Fallback
  const isGoodScore = score >= 80;
  
  // Predict next difficulty based on current score
  let nextDifficulty = 'Medium';
  if (score < 50) nextDifficulty = 'Easy';
  else if (score >= 80) nextDifficulty = 'Hard';

  const handleDownloadReport = () => {
    const reportData = {
      title: "AI Assessment Performance Report",
      date: new Date(date || Date.now()).toLocaleString(),
      attemptNumber,
      difficulty,
      score: `${score}%`,
      correctAnswers,
      wrongAnswers,
      accuracy: `${score}%`,
      strongTopics,
      weakTopics,
      suggestions,
      questionResults
    };
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Assessment_Report_Attempt_${attemptNumber || 1}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }} onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Result</span>
        </div>
        <button className="btn btn-outline" onClick={handleDownloadReport} style={{ gap: '0.5rem', color: 'var(--color-primary)', borderColor: 'rgba(92, 78, 237, 0.2)', cursor: 'pointer' }}>
          <Download size={16} /> Download Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ width: '160px', height: '160px', marginBottom: '1.5rem' }}>
            <CircularProgressbar 
              value={score} 
              text={`${score}%`}
              styles={buildStyles({
                pathColor: isGoodScore ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                textColor: 'currentColor',
                trailColor: 'var(--color-border)',
                textSize: '24px'
              })}
            />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text-main)' }}>
            {isGoodScore ? 'Great Job! 🎉' : score >= 50 ? 'Good Effort! 👍' : 'Keep Trying! 💪'}
          </h3>
          <p style={{ color: 'var(--color-success)', fontWeight: '600', marginBottom: '1.5rem' }}>
            You scored {correctAnswers} out of {totalQuestions}
          </p>
          
          <div style={{ background: 'var(--bg-body)', padding: '1rem', width: '100%', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Attempt {attemptNumber}</div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty} Level</span>
          </div>
        </div>

        {/* Middle Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Performance Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--color-success-bg)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Correct Answers</div>
                <div style={{ color: 'var(--color-success)', fontSize: '1.5rem', fontWeight: '700' }}>{correctAnswers}</div>
              </div>
              <div style={{ background: 'var(--color-danger-bg)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Wrong Answers</div>
                <div style={{ color: 'var(--color-danger)', fontSize: '1.5rem', fontWeight: '700' }}>{wrongAnswers}</div>
              </div>
              <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Accuracy</div>
                <div style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: '700' }}>{score}%</div>
              </div>
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#4b5563', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Time Taken</div>
                <div style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: '700' }}>{timeTaken}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#111827' }}>Topic Analysis</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h5 style={{ fontSize: '0.85rem', color: '#111827', marginBottom: '0.75rem' }}>Weak Topics</h5>
                {weakTopics.length > 0 && weakTopics[0] !== 'None' ? weakTopics.map((topic, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>• {topic}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: '600' }}>Needs Improvement</span>
                  </div>
                )) : (
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>None recorded.</span>
                )}
              </div>
              <div>
                <h5 style={{ fontSize: '0.85rem', color: '#111827', marginBottom: '0.75rem' }}>Strong Topics</h5>
                {strongTopics.length > 0 && strongTopics[0] !== 'None' ? strongTopics.map((topic, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>• {topic}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: '600' }}>Good</span>
                  </div>
                )) : (
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>None recorded.</span>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#111827' }}>Suggestions</h4>
            {suggestions.length > 0 ? suggestions.map((s, i) => (
              <p key={i} style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.6', marginBottom: '0.5rem' }}>{s}</p>
            )) : (
              <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.6' }}>Keep up the great work! Practice makes perfect.</p>
            )}
          </div>

        </div>

        {/* Right Column: Next Steps */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '2rem', color: '#111827' }}>Next Assessment</h4>
          
          <div style={{ background: '#f3f4f6', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Rocket size={40} color="var(--color-primary)" />
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Your next assessment will be at</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '2rem' }}>{nextDifficulty} Level</h3>

          <div style={{ width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
            <h5 style={{ fontSize: '0.85rem', color: '#111827', marginBottom: '1rem' }}>What's Next?</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>More advanced questions</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>Problem solving questions</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>Focus on weak topics</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>Improve your score!</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onNext}>
            Start Next Assessment <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* Full Width Answer Review Section */}
      {questionResults && questionResults.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#111827', fontWeight: 'bold' }}>Detailed Answer Review</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {questionResults.map((qr, idx) => (
              <div key={idx} style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                border: `1px solid ${qr.isCorrect ? '#86efac' : '#fca5a5'}`,
                background: qr.isCorrect ? '#f0fdf4' : '#fef2f2',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1rem', color: '#111827', fontWeight: '600', lineHeight: '1.5' }}>
                    Q{idx + 1}. {qr.question || 'Question Details'}
                  </h4>
                  <span className={`badge ${qr.isCorrect ? 'badge-easy' : 'badge-hard'}`} style={{ flexShrink: 0 }}>
                    {qr.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Answer</span>
                    <p style={{ fontSize: '0.9rem', color: '#1f2937', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {qr.studentAnswer || 'Skipped'}
                    </p>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Expected Answer</span>
                    <p style={{ fontSize: '0.9rem', color: '#1f2937', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {qr.expected || 'N/A'}
                    </p>
                  </div>
                </div>

                {qr.explanation && (
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>AI Explanation</span>
                    <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>{qr.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
