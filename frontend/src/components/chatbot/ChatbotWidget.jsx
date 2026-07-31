import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  X, Send, Sparkles, ChevronRight, Trash2, Paperclip,
  BookOpen, CalendarCheck, Award, FileText, CreditCard, Clock, Library, Bell, Calendar, GraduationCap 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

const API = import.meta.env.VITE_CHATBOT_API || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORAGE_KEY = 'erp-chatbot-history';
const DEFAULT_PROMPTS = [
  'Show my attendance',
  'Show my timetable',
  'Show my results',
  'Any pending fees?',
  'What is Python?',
  'Explain Machine Learning',
  'Write a sorting algorithm'
];

export default function ChatbotWidget() {
  const { user, isStudent } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState(DEFAULT_PROMPTS);
  const [initialized, setInitialized] = useState(false);
  const [files, setFiles] = useState([]);
  const [chatMode, setChatMode] = useState('erp'); // 'erp' | 'general'
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleOpenChatbot = () => setOpen(true);
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const setMessagesAndUpdate = (nextMessages) => {
    setMessages(nextMessages);
  };

  const loadGreeting = async () => {
    if (!user) {
      setMessagesAndUpdate([
        {
          role: 'assistant',
          content: 'Hi! I am your AI assistant. How can I help you today?',
          timestamp: new Date().toISOString()
        }
      ]);
      setInitialized(true);
      return;
    }

    try {
      const res = await fetch(`${API}/context`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (res.ok) {
        if (data.data?.history && data.data.history.length > 0) {
          setMessagesAndUpdate(data.data.history);
        }
        setSuggestions(data.data?.suggestions || DEFAULT_PROMPTS);
      }
    } catch {
      // Fallback silently to empty/welcome screen
    } finally {
      setInitialized(true);
    }
  };

  useEffect(() => {
    if (open && !initialized) {
      loadGreeting();
    }
  }, [open, initialized, user]);

  useEffect(() => {
    setInitialized(false);
    setMessages([]);
    setSuggestions(DEFAULT_PROMPTS);
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const send = async (overrideText = null) => {
    const question = (overrideText || text).trim();
    if (!question && files.length === 0) return;
    if (loading) return;

    setText('');
    const currentFiles = [...files]; // capture current files for request
    setFiles([]); // clear for next message

    // Create file descriptors for chat UI (local preview)
    const filePreviews = currentFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    }));

    const nextMessages = [
      ...messages,
      { 
        role: 'user', 
        content: question || 'Uploaded files for analysis.', 
        timestamp: new Date().toISOString(),
        files: filePreviews // Attach metadata to UI message
      }
    ];
    setMessagesAndUpdate(nextMessages);
    setLoading(true);

    try {
      let headers = getAuthHeaders();
      let body;

      if (currentFiles.length > 0) {
        // Send as FormData
        delete headers['Content-Type']; // Let browser set multipart/form-data boundary
        const formData = new FormData();
        if (user?.id) formData.append('user_id', user.id);
        formData.append('message', question);
        formData.append('mode', chatMode);
        formData.append('history', JSON.stringify(nextMessages.slice(-12)));
        currentFiles.forEach(f => formData.append('files', f));
        body = formData;
      } else {
        // Send as JSON
        body = JSON.stringify({
          user_id: user?.id,
          message: question,
          question,
          mode: chatMode,
          history: nextMessages.slice(-12)
        });
      }

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers,
        body
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Unable to get a response');
      }

      setMessagesAndUpdate([
        ...nextMessages,
        {
          role: 'assistant',
          content: data.answer || data.reply || 'No response',
          timestamp: new Date().toISOString()
        }
      ]);
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch (error) {
      setMessagesAndUpdate([
        ...nextMessages,
        {
          role: 'assistant',
          content: error.message || 'Unable to connect to chatbot',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = useMemo(() => suggestions.slice(0, 8), [suggestions]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[100] rounded-full bg-gradient-to-br from-[#5F4BF2] to-[#7C3AED] text-white p-4 shadow-[0_0_20px_rgba(95,75,242,0.45)] hover:shadow-[0_0_30px_rgba(95,75,242,0.65)] hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Open AI assistant"
      >
        {open ? <X className="w-6 h-6 transition-transform duration-300 rotate-90" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[100] w-[25rem] max-w-[calc(100vw-1.5rem)] h-[40rem] max-h-[80vh] bg-background/95 backdrop-blur-xl border border-border/80 rounded-[2.2rem] shadow-[0_20px_50px_rgba(95,75,242,0.15)] flex flex-col overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#5F4BF2] via-[#7C3AED] to-[#4F46E5] text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="font-bold text-[16px] tracking-wide leading-none">EduERP Assistant</div>
                  <div className="text-[11px] text-white/70 mt-1.5 font-medium">Powered by AI Context</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setChatMode('erp')}
                    className={`px-2 py-0.5 rounded transition ${chatMode === 'erp' ? 'bg-white text-[#5F4BF2]' : 'text-white/80 hover:text-white'}`}
                  >
                    ERP Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode('general')}
                    className={`px-2 py-0.5 rounded transition ${chatMode === 'general' ? 'bg-white text-[#5F4BF2]' : 'text-white/80 hover:text-white'}`}
                  >
                    AI Mode
                  </button>
                </div>
                <button
                  onClick={async () => {
                    setMessagesAndUpdate([]);
                    if (user?.id) {
                      try {
                        await fetch(`${API}/history`, { method: 'DELETE', headers: getAuthHeaders() });
                      } catch (e) {
                        console.error('Failed to clear history on server');
                      }
                    }
                  }}
                  title="Clear history"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Container or Welcome View */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/10">
            {messages.length === 0 ? (
              <div className="flex flex-col h-full py-2 items-center justify-center mb-10">
                <div className="text-center mt-3">
                  <div className="p-4 rounded-full bg-muted/50 mb-4 inline-flex items-center justify-center">
                     <Sparkles className="w-8 h-8 text-[#5F4BF2] animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Hello, {user?.name?.split(' ')[0] || 'there'} 👋
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">
                    Ask me about your courses, general knowledge, or upload a file!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={`${message.timestamp}-${index}`} {...message} />
                ))}
                {loading && <TypingIndicator />}
              </>
            )}
          </div>

          {/* Suggestions List */}
          {quickActions.length > 0 && (
            <div className="px-4 py-2 border-t border-border/50 bg-muted/15">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {quickActions.map((item) => (
                  <button
                    key={item}
                    onClick={() => send(item)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 hover:text-foreground hover:border-[#5F4BF2]/40 hover:bg-[#5F4BF2]/5 transition-all shadow-sm"
                  >
                    <span className="truncate max-w-[150px]">{item}</span>
                    <ChevronRight className="w-3 h-3 text-[#5F4BF2] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Area */}
          <div className="p-4 border-t border-border/80 bg-background flex flex-col gap-2">
            
            {/* File Staging Area */}
            {files.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {files.map((file, i) => (
                  <div key={i} className="relative flex items-center bg-muted px-3 py-1.5 rounded-lg border border-border text-xs shrink-0">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <span className="truncate max-w-[100px] text-foreground">{file.name}</span>
                    <button 
                      onClick={() => removeFile(i)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center bg-muted/40 rounded-full border border-border/85 px-4 py-2 focus-within:ring-2 focus-within:ring-[#5F4BF2]/20 focus-within:border-[#5F4BF2]/40 transition-all">
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mr-2 text-muted-foreground hover:text-[#5F4BF2] transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple
                accept=".pdf,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
              />

              <input
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/60 px-2.5 py-1 text-foreground"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && send()}
                placeholder={'Ask a question...'}
                disabled={loading}
              />

              {/* Send Button */}
              <button 
                onClick={() => send()} 
                aria-label="Send message" 
                disabled={loading || (!text.trim() && files.length === 0)}
                className={`ml-2 h-8 w-8 rounded-full text-white flex items-center justify-center transition-all duration-300 shrink-0 ${
                  (text.trim() || files.length > 0) && !loading
                    ? 'bg-gradient-to-r from-[#5F4BF2] to-[#7C3AED] hover:scale-105 active:scale-95 shadow-md shadow-[#5F4BF2]/25'
                    : 'bg-muted-foreground/35 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
