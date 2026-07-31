import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  Database,
  Filter,
  GraduationCap,
  LayoutGrid,
  List,
  Lock,
  Search,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
  Workflow,
  Clock,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

const LEVEL_STYLES = {
  Beginner: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
  Intermediate: 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC] dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900',
  Advanced: 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3] dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
};

const fallbackCourses = [
  ['Artificial Intelligence', 'AI & ML', 'Dr. Sarah Johnson', 'Advanced', '12 Weeks', 4.8, 120, 245, 'active'],
  ['Machine Learning', 'AI & ML', 'Dr. Michael Brown', 'Intermediate', '10 Weeks', 4.7, 98, 198, 'active'],
  ['Deep Learning', 'AI & ML', 'Dr. Emily Davis', 'Advanced', '14 Weeks', 4.9, 156, 150, 'upcoming'],
  ['Python Programming', 'Development', 'Dr. James Wilson', 'Beginner', '8 Weeks', 4.6, 156, 320, 'active'],
  ['MERN Stack', 'Development', 'Dr. David Lee', 'Intermediate', '16 Weeks', 4.8, 132, 180, 'active'],
  ['Cloud Computing', 'Cloud', 'Dr. James Wilson', 'Intermediate', '10 Weeks', 4.7, 87, 156, 'active'],
  ['Cybersecurity', 'Cybersecurity', 'Dr. Sarah Johnson', 'Advanced', '12 Weeks', 4.8, 101, 210, 'active'],
  ['DevOps', 'DevOps', 'Dr. Michael Brown', 'Intermediate', '12 Weeks', 4.6, 74, 145, 'active'],
  ['Data Structures & Algorithms', 'Development', 'Dr. Emily Davis', 'Beginner', '8 Weeks', 4.9, 220, 310, 'active'],
  ['React.js', 'Development', 'Dr. David Lee', 'Intermediate', '10 Weeks', 4.7, 95, 168, 'active'],
].map((c, i) => ({
  id: String(i + 1),
  title: c[0],
  category: c[1],
  instructor: { name: c[2] },
  level: c[3],
  duration: c[4],
  rating: c[5],
  reviews: c[6],
  enrolledStudents: c[7],
  status: c[8],
  description: `${c[0]} course designed to build practical skills.`,
}));

function getInstructorAvatar(name) {
  let imgPath = '';
  if (name.includes("Sarah")) imgPath = "/instructors/sarah.png";
  else if (name.includes("Michael")) imgPath = "/instructors/michael.png";
  else if (name.includes("Emily")) imgPath = "/instructors/emily.png";
  else if (name.includes("James")) imgPath = "/instructors/james.png";
  else if (name.includes("David")) imgPath = "/instructors/david.png";

  if (imgPath) {
    return (
      <img
        src={imgPath}
        alt={name}
        className="h-7 w-7 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-800"
      />
    );
  }

  const initials = name.split(' ').map(w => w[0]).slice(-2).join('');
  let gradient = "from-slate-400 to-slate-600";
  if (name.includes("Sarah")) gradient = "from-pink-400 to-rose-600";
  else if (name.includes("Michael")) gradient = "from-blue-400 to-indigo-600";
  else if (name.includes("Emily")) gradient = "from-amber-400 to-orange-600";
  else if (name.includes("James")) gradient = "from-emerald-400 to-teal-600";
  else if (name.includes("David")) gradient = "from-cyan-400 to-blue-600";
  return (
    <div className={cn('grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br text-[10px] font-extrabold text-white shadow-sm', gradient)}>
      {initials}
    </div>
  );
}

function iconFor(category) {
  switch (category) {
    case 'AI & ML':
      return Cpu;
    case 'Development':
      return Code2;
    case 'Cloud':
      return Cloud;
    case 'Cybersecurity':
      return Lock;
    case 'DevOps':
      return Workflow;
    case 'Database':
      return Database;
    case 'Data Science':
      return Brain;
    default:
      return GraduationCap;
  }
}

function CourseThumb({ title, category, status }) {
  let svgContent = null;
  const lowercaseTitle = title.toLowerCase();
  const lowercaseCategory = (category || '').toLowerCase();

  // Helper matching rule
  const isAI = lowercaseTitle.includes("artificial intelligence") || lowercaseTitle.includes(" ai ") || lowercaseTitle.startsWith("ai ") || lowercaseTitle === "ai" || lowercaseCategory.includes("ai") || lowercaseCategory.includes("artificial intelligence");
  const isML = lowercaseTitle.includes("machine learning") || lowercaseTitle.includes(" ml ") || lowercaseTitle.startsWith("ml ") || lowercaseTitle === "ml";
  const isDL = lowercaseTitle.includes("deep learning") || lowercaseTitle.includes(" dl ") || lowercaseTitle.startsWith("dl ") || lowercaseTitle === "dl";
  const isNLP = lowercaseTitle.includes("nlp") || lowercaseTitle.includes("natural language processing");
  const isGenAI = lowercaseTitle.includes("generative ai") || lowercaseTitle.includes("genai") || lowercaseTitle.includes("llm") || lowercaseTitle.includes("gpt") || lowercaseTitle.includes("transformer");
  const isPython = lowercaseTitle.includes("python");
  const isMern = lowercaseTitle.includes("mern");
  const isReact = lowercaseTitle.includes("react");
  const isNode = lowercaseTitle.includes("node.js") || lowercaseTitle.includes("nodejs") || lowercaseTitle.match(/\bnode\b/);
  const isJava = lowercaseTitle.includes("java") && !lowercaseTitle.includes("javascript");
  const isCpp = lowercaseTitle.includes("c++") || lowercaseTitle.includes("cpp");
  const isCProg = (lowercaseTitle.match(/\bc\b/) || lowercaseTitle.includes("c programming")) && !lowercaseTitle.includes("c++") && !lowercaseTitle.includes("css") && !lowercaseTitle.includes("cloud");
  const isJS = lowercaseTitle.includes("javascript") || lowercaseTitle.includes(" js ") || lowercaseTitle.endsWith(" js") || lowercaseTitle === "js";
  const isHtmlCss = lowercaseTitle.includes("html") || lowercaseTitle.includes("css");
  const isDSA = lowercaseTitle.includes("data structures") || lowercaseTitle.includes("algorithms") || lowercaseTitle.includes("dsa") || lowercaseTitle.includes("algorithm") || lowercaseCategory.includes("data structures");
  const isDatabase = lowercaseTitle.includes("database") || lowercaseTitle.includes("sql") || lowercaseTitle.includes("mysql") || lowercaseTitle.includes("postgres") || lowercaseTitle.includes("mongodb") || lowercaseCategory.includes("database");
  const isCloud = lowercaseTitle.includes("cloud") || lowercaseCategory.includes("cloud");
  const isDevOps = lowercaseTitle.includes("devops") || lowercaseTitle.includes("ci/cd") || lowercaseTitle.includes("git") || lowercaseCategory.includes("devops");
  const isSec = lowercaseTitle.includes("cybersecurity") || lowercaseTitle.includes("security") || lowercaseTitle.includes("hacking") || lowercaseCategory.includes("security") || lowercaseCategory.includes("cybersecurity");
  const isDataSci = lowercaseTitle.includes("data science") || lowercaseTitle.includes("analytics") || lowercaseCategory.includes("data science");
  const isOS = lowercaseTitle.includes("operating system") || lowercaseTitle.includes("operating systems") || lowercaseTitle.match(/\bos\b/);
  const isNetwork = lowercaseTitle.includes("network") || lowercaseTitle.includes("networks") || lowercaseTitle.includes("networking") || lowercaseTitle.includes("topology");

  let imageSrc = '';
  if (isAI) imageSrc = '/courses/artificial_intelligence.png';
  else if (isML) imageSrc = '/courses/machine_learning.png';
  else if (isDL) imageSrc = '/courses/deep_learning.png';
  else if (isPython) imageSrc = '/courses/python_programming.png';
  else if (isMern) imageSrc = '/courses/mern_stack.png';
  else if (isCloud) imageSrc = '/courses/cloud_computing.png';
  else if (isSec) imageSrc = '/courses/cybersecurity.png';
  else if (isDevOps) imageSrc = '/courses/devops.png';
  else if (isDSA) imageSrc = '/courses/dsa.png';
  else if (isReact) imageSrc = '/courses/react.png';

  if (imageSrc) {
    return (
      <div className="relative h-24 overflow-hidden rounded-t-[1.75rem]">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute right-4 top-4 rounded-full px-3.5 py-1 text-[10px] font-extrabold capitalize tracking-wider shadow-sm text-white"
          style={{
            backgroundColor: status === 'active' ? '#10B981' : '#F59E0B'
          }}
        >
          {status === 'active' ? 'Active' : 'Upcoming'}
        </div>
      </div>
    );
  }

  if (isGenAI) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#080612" />
        <defs>
          <pattern id="grid-genai" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(217, 119, 6, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-genai" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#D97706" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-genai)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-genai)" />
        
        <g strokeWidth="1.5" strokeLinecap="round" transform="translate(100, 60)">
          <path d="M 0 -25 Q 0 0 25 0 Q 0 0 0 25 Q 0 0 -25 0 Q 0 0 0 -25 Z" fill="none" stroke="#F59E0B" />
          <path d="M -30 -15 Q -30 -5 -20 -5 Q -30 -5 -30 5 Q -30 -5 -40 -5 Q -30 -5 -30 -15 Z" fill="none" stroke="#FBBF24" strokeWidth="1" />
          <path d="M 30 10 Q 30 18 38 18 Q 30 18 30 26 Q 30 18 22 18 Q 30 18 30 10 Z" fill="none" stroke="#FBBF24" strokeWidth="1" />
          <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        </g>
      </svg>
    );
  } else if (isNLP) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050a0f" />
        <defs>
          <pattern id="grid-nlp" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-nlp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-nlp)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-nlp)" />
        
        <g stroke="#34D399" strokeWidth="2" fill="none" transform="translate(68, 38)">
          <path d="M5,5 h54 a10,10 0 0 1 10,10 v14 a10,10 0 0 1 -10,10 h-10 l-10,9 l-2,-9 h-32 a10,10 0 0 1 -10,-10 v-14 a10,10 0 0 1 10,-10 z" fill="#062F20" opacity="0.6" />
          <line x1="15" y1="15" x2="45" y2="15" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="22" x2="35" y2="22" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="29" x2="50" y2="29" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  } else if (isDL) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050818" />
        <defs>
          <pattern id="grid-dl" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-dl" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dl)" />
        <circle cx="100" cy="60" r="55" fill="url(#glow-dl)" />
        
        <g stroke="#818CF8" strokeWidth="0.75" opacity="0.9">
          <line x1="50" y1="35" x2="85" y2="30" />
          <line x1="50" y1="35" x2="85" y2="50" />
          <line x1="50" y1="35" x2="85" y2="70" />
          <line x1="50" y1="35" x2="85" y2="90" />
          
          <line x1="50" y1="60" x2="85" y2="30" />
          <line x1="50" y1="60" x2="85" y2="50" />
          <line x1="50" y1="60" x2="85" y2="70" />
          <line x1="50" y1="60" x2="85" y2="90" />
          
          <line x1="50" y1="85" x2="85" y2="30" />
          <line x1="50" y1="85" x2="85" y2="50" />
          <line x1="50" y1="85" x2="85" y2="70" />
          <line x1="50" y1="85" x2="85" y2="90" />
          
          <line x1="85" y1="30" x2="120" y2="30" stroke="#60A5FA" />
          <line x1="85" y1="30" x2="120" y2="50" stroke="#60A5FA" />
          <line x1="85" y1="30" x2="120" y2="70" stroke="#60A5FA" />
          <line x1="85" y1="30" x2="120" y2="90" stroke="#60A5FA" />
          
          <line x1="85" y1="50" x2="120" y2="30" stroke="#60A5FA" />
          <line x1="85" y1="50" x2="120" y2="50" stroke="#60A5FA" />
          <line x1="85" y1="50" x2="120" y2="70" stroke="#60A5FA" />
          <line x1="85" y1="50" x2="120" y2="90" stroke="#60A5FA" />
          
          <line x1="85" y1="70" x2="120" y2="30" stroke="#60A5FA" />
          <line x1="85" y1="70" x2="120" y2="50" stroke="#60A5FA" />
          <line x1="85" y1="70" x2="120" y2="70" stroke="#60A5FA" />
          <line x1="85" y1="70" x2="120" y2="90" stroke="#60A5FA" />
          
          <line x1="85" y1="90" x2="120" y2="30" stroke="#60A5FA" />
          <line x1="85" y1="90" x2="120" y2="50" stroke="#60A5FA" />
          <line x1="85" y1="90" x2="120" y2="70" stroke="#60A5FA" />
          <line x1="85" y1="90" x2="120" y2="90" stroke="#60A5FA" />
          
          <line x1="120" y1="30" x2="155" y2="45" stroke="#34D399" />
          <line x1="120" y1="30" x2="155" y2="75" stroke="#34D399" />
          
          <line x1="120" y1="50" x2="155" y2="45" stroke="#34D399" />
          <line x1="120" y1="50" x2="155" y2="75" stroke="#34D399" />
          
          <line x1="120" y1="70" x2="155" y2="45" stroke="#34D399" />
          <line x1="120" y1="70" x2="155" y2="75" stroke="#34D399" />
          
          <line x1="120" y1="90" x2="155" y2="45" stroke="#34D399" />
          <line x1="120" y1="90" x2="155" y2="75" stroke="#34D399" />
          
          <circle cx="50" cy="35" r="4.5" fill="#818CF8" stroke="#312E81" strokeWidth="1" />
          <circle cx="50" cy="60" r="4.5" fill="#818CF8" stroke="#312E81" strokeWidth="1" />
          <circle cx="50" cy="85" r="4.5" fill="#818CF8" stroke="#312E81" strokeWidth="1" />
          
          <circle cx="85" cy="30" r="4.5" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
          <circle cx="85" cy="50" r="4.5" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
          <circle cx="85" cy="70" r="4.5" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
          <circle cx="85" cy="90" r="4.5" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1" />
          
          <circle cx="120" cy="30" r="4.5" fill="#38BDF8" stroke="#083344" strokeWidth="1" />
          <circle cx="120" cy="50" r="4.5" fill="#38BDF8" stroke="#083344" strokeWidth="1" />
          <circle cx="120" cy="70" r="4.5" fill="#38BDF8" stroke="#083344" strokeWidth="1" />
          <circle cx="120" cy="90" r="4.5" fill="#38BDF8" stroke="#083344" strokeWidth="1" />
          
          <circle cx="155" cy="45" r="5" fill="#34D399" stroke="#064E3B" strokeWidth="1" />
          <circle cx="155" cy="75" r="5" fill="#34D399" stroke="#064E3B" strokeWidth="1" />
        </g>
      </svg>
    );
  } else if (isML) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#060b16" />
        <defs>
          <pattern id="grid-ml" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-ml" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-ml)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-ml)" />
        
        <g stroke="#38BDF8" strokeWidth="1">
          <circle cx="100" cy="60" r="16" strokeDasharray="2 2" />
          <circle cx="100" cy="60" r="32" strokeDasharray="3 3" opacity="0.5" />
          
          <line x1="100" y1="60" x2="70" y2="40" strokeWidth="1.5" />
          <line x1="100" y1="60" x2="130" y2="40" strokeWidth="1.5" />
          <line x1="100" y1="60" x2="65" y2="70" strokeWidth="1.5" />
          <line x1="100" y1="60" x2="135" y2="70" strokeWidth="1.5" />
          <line x1="100" y1="60" x2="100" y2="25" strokeWidth="1" />
          <line x1="100" y1="60" x2="100" y2="95" strokeWidth="1" />
          
          <line x1="70" y1="40" x2="100" y2="25" strokeWidth="0.75" />
          <line x1="130" y1="40" x2="100" y2="25" strokeWidth="0.75" />
          <line x1="65" y1="70" x2="70" y2="40" strokeWidth="0.75" />
          <line x1="135" y1="70" x2="130" y2="40" strokeWidth="0.75" />
          <line x1="65" y1="70" x2="100" y2="95" strokeWidth="0.75" />
          <line x1="135" y1="70" x2="100" y2="95" strokeWidth="0.75" />
          
          <circle cx="100" cy="60" r="6" fill="#38BDF8" />
          <circle cx="70" cy="40" r="4" fill="#06B6D4" />
          <circle cx="130" cy="40" r="4" fill="#06B6D4" />
          <circle cx="65" cy="70" r="4.5" fill="#22D3EE" />
          <circle cx="135" cy="70" r="4.5" fill="#22D3EE" />
          <circle cx="100" cy="25" r="3.5" fill="#818CF8" />
          <circle cx="100" cy="95" r="3.5" fill="#818CF8" />
        </g>
      </svg>
    );
  } else if (isAI) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#070a13" />
        <defs>
          <pattern id="grid-ai" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-ai" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-ai)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-ai)" />
        
        <g stroke="#A78BFA" strokeWidth="1" opacity="0.8">
          <path d="M100 25 C80 25 70 35 70 50 C70 65 80 75 90 75 C90 85 80 95 100 95" fill="none" strokeWidth="1.5" strokeDasharray="1 1" />
          <path d="M100 25 C120 25 130 35 130 50 C130 65 120 75 110 75 C110 85 120 95 100 95" fill="none" strokeWidth="1.5" strokeDasharray="1 1" />
          <path d="M100 35 L100 85 M80 50 L120 50 M85 65 L115 65" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="100" cy="35" r="3" fill="#60A5FA" />
          <circle cx="100" cy="85" r="3" fill="#60A5FA" />
          <circle cx="80" cy="50" r="3" fill="#818CF8" />
          <circle cx="120" cy="50" r="3" fill="#818CF8" />
          <circle cx="85" cy="65" r="2.5" fill="#34D399" />
          <circle cx="115" cy="65" r="2.5" fill="#34D399" />
          <line x1="100" y1="35" x2="80" y2="50" stroke="#818CF8" strokeWidth="0.75" />
          <line x1="100" y1="35" x2="120" y2="50" stroke="#818CF8" strokeWidth="0.75" />
          <line x1="80" y1="50" x2="85" y2="65" stroke="#34D399" strokeWidth="0.75" />
          <line x1="120" y1="50" x2="115" y2="65" stroke="#34D399" strokeWidth="0.75" />
          <line x1="85" y1="65" x2="100" y2="85" stroke="#60A5FA" strokeWidth="0.75" />
          <line x1="115" y1="65" x2="100" y2="85" stroke="#60A5FA" strokeWidth="0.75" />
        </g>
        
        <rect x="85" y="48" width="30" height="24" rx="6" fill="#0C0F1D" stroke="#8B5CF6" strokeWidth="1.5" />
        <text x="100" y="65" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">AI</text>
      </svg>
    );
  } else if (isPython) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050b18" />
        <defs>
          <pattern id="grid-py" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(234, 179, 8, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-py" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-py)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-py)" />
        
        <g transform="translate(82, 40) scale(0.8)">
          <path d="M22.5 0C10.2 0 11.2 5.3 11.2 5.3L11.3 11H23V12.7H6.5C6.5 6.5 1.5 6.5 0 12C0 17.5 4.3 17.3 4.3 17.3H7.2V13.3C7.2 9.5 11.2 9.5 11.2 9.5H22.7C27.5 9.5 28.5 5.3 28.5 5.3C28.5 5.3 28.7 0 22.5 0ZM17 2.8C17.9 2.8 18.7 3.5 18.7 4.5C18.7 5.4 17.9 6.2 17 6.2C16.1 6.2 15.3 5.4 15.3 4.5C15.3 3.5 16.1 2.8 17 2.8Z" fill="#38BDF8" />
          <path d="M6 34.3C18.3 34.3 17.3 29 17.3 29L17.2 23.3H5.5V21.6H22C22 27.8 27 27.8 28.5 22.3C28.5 16.8 24.2 17 24.2 17H21.3V21C21.3 24.8 17.3 24.8 17.3 24.8H5.8C1 24.8 0 29 0 29C0 29 -0.2 34.3 6 34.3ZM11.5 31.5C10.6 31.5 9.8 30.7 9.8 29.8C9.8 28.9 10.6 28.1 11.5 28.1C12.4 28.1 13.2 28.9 13.2 29.8C13.2 30.7 12.4 31.5 11.5 31.5Z" fill="#FBBF24" />
        </g>
      </svg>
    );
  } else if (isMern || isReact) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#070b13" />
        <defs>
          <pattern id="grid-react" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-react" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-react)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-react)" />
        
        {isMern ? (
          <g transform="translate(15, 20)">
            <circle cx="45" cy="40" r="22" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
            <text x="45" y="46" fill="#F1F5F9" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ex</text>
            <g transform="translate(85, 40) scale(0.65)">
              <ellipse rx="24" ry="9" stroke="#22D3EE" strokeWidth="2" fill="none" transform="rotate(0)"/>
              <ellipse rx="24" ry="9" stroke="#22D3EE" strokeWidth="2" fill="none" transform="rotate(60)"/>
              <ellipse rx="24" ry="9" stroke="#22D3EE" strokeWidth="2" fill="none" transform="rotate(120)"/>
              <circle r="4.5" fill="#22D3EE"/>
            </g>
            <g transform="translate(125, 18) scale(0.85)">
              <rect x="0" y="0" width="30" height="42" rx="4" fill="#022C22" stroke="#4ADE80" strokeWidth="2" />
              <text x="15" y="28" fill="#4ADE80" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="monospace">JS</text>
            </g>
          </g>
        ) : (
          <g transform="translate(100, 60) scale(0.95)">
            <ellipse rx="42" ry="15" stroke="#22D3EE" strokeWidth="2.2" fill="none" transform="rotate(0)"/>
            <ellipse rx="42" ry="15" stroke="#22D3EE" strokeWidth="2.2" fill="none" transform="rotate(60)"/>
            <ellipse rx="42" ry="15" stroke="#22D3EE" strokeWidth="2.2" fill="none" transform="rotate(120)"/>
            <circle r="7.5" fill="#22D3EE"/>
          </g>
        )}
      </svg>
    );
  } else if (isNode) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#060911" />
        <defs>
          <pattern id="grid-node" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(34, 197, 94, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-node)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-node)" />
        
        <g transform="translate(100, 60)">
          <polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill="#062F1E" stroke="#22C55E" strokeWidth="2" />
          <text x="0" y="6" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">node</text>
        </g>
      </svg>
    );
  } else if (isJava) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0a0505" />
        <defs>
          <pattern id="grid-java" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(239, 68, 68, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-java" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-java)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-java)" />
        
        <g transform="translate(78, 32)">
          <path d="M12 36 c0 0 -2 16 16 16 h14 c18 0 16 -16 16 -16 Z" fill="none" stroke="#F87171" strokeWidth="2.5" />
          <path d="M58 12 c4 0 6 3 6 8 c0 5 -2 8 -6 8" fill="none" stroke="#F87171" strokeWidth="2.5" />
          <path d="M22 28 c1 -5 -1 -10 1 -15" fill="none" stroke="#FCA5A5" strokeWidth="1.5" />
          <path d="M30 25 c1 -5 -1 -10 1 -15" fill="none" stroke="#FCA5A5" strokeWidth="1.5" />
          <path d="M38 28 c1 -5 -1 -10 1 -15" fill="none" stroke="#FCA5A5" strokeWidth="1.5" />
        </g>
      </svg>
    );
  } else if (isCpp) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050915" />
        <defs>
          <pattern id="grid-cpp" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-cpp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-cpp)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-cpp)" />
        
        <g transform="translate(100, 60)">
          <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="#0D1E3A" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
          <text x="0" y="8" fill="#60A5FA" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">C++</text>
        </g>
      </svg>
    );
  } else if (isCProg) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050a15" />
        <defs>
          <pattern id="grid-c" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-c" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-c)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-c)" />
        
        <g transform="translate(100, 60)">
          <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="#0C1B33" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 3" />
          <text x="-1" y="8" fill="#60A5FA" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">C</text>
        </g>
      </svg>
    );
  } else if (isJS) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0a0905" />
        <defs>
          <pattern id="grid-js" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(234, 179, 8, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-js" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-js)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-js)" />
        
        <g transform="translate(85, 45)">
          <rect x="0" y="0" width="30" height="30" rx="4" fill="#1E293B" stroke="#FACC15" strokeWidth="2" />
          <text x="15" y="21" fill="#FACC15" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">JS</text>
        </g>
      </svg>
    );
  } else if (isHtmlCss) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0a0705" />
        <defs>
          <pattern id="grid-hc" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(249, 115, 22, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-hc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-hc)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-hc)" />
        
        <g transform="translate(62, 38)">
          <path d="M 15 5 L 28 8 L 25 32 L 15 36 L 5 32 L 2 8 Z" fill="none" stroke="#FB923C" strokeWidth="2" />
          <text x="15" y="23" fill="#FB923C" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">H</text>
          
          <path d="M 60 5 L 73 8 L 70 32 L 60 36 L 50 32 L 47 8 Z" fill="none" stroke="#38BDF8" strokeWidth="2" />
          <text x="60" y="23" fill="#38BDF8" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">C</text>
        </g>
      </svg>
    );
  } else if (isDSA) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#07050f" />
        <defs>
          <pattern id="grid-dsa" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(168, 85, 247, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-dsa" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dsa)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-dsa)" />
        
        <g stroke="#C084FC" strokeWidth="1.5" transform="translate(0, 5)">
          <line x1="100" y1="35" x2="75" y2="58" />
          <line x1="100" y1="35" x2="125" y2="58" />
          <line x1="75" y1="58" x2="60" y2="82" />
          <line x1="75" y1="58" x2="90" y2="82" />
          
          <circle cx="100" cy="35" r="5" fill="#E879F9" stroke="#701A75" strokeWidth="1" />
          <circle cx="75" cy="58" r="5" fill="#E879F9" stroke="#701A75" strokeWidth="1" />
          <circle cx="125" cy="58" r="5" fill="#E879F9" stroke="#701A75" strokeWidth="1" />
          <circle cx="60" cy="82" r="5" fill="#22D3EE" stroke="#0891B2" strokeWidth="1" />
          <circle cx="90" cy="82" r="5" fill="#22D3EE" stroke="#0891B2" strokeWidth="1" />
        </g>
      </svg>
    );
  } else if (isDatabase) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050a0f" />
        <defs>
          <pattern id="grid-db" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-db" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-db)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-db)" />
        
        <g stroke="#22D3EE" strokeWidth="2" fill="none" transform="translate(80, 32)">
          <ellipse cx="20" cy="10" rx="20" ry="6" />
          <path d="M 0 10 L 0 22 A 20 6 0 0 0 40 22 L 40 10" />
          <path d="M 0 22 L 0 34 A 20 6 0 0 0 40 34 L 40 22" />
          <text x="20" y="52" fill="#22D3EE" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace" stroke="none">SQL</text>
        </g>
      </svg>
    );
  } else if (isCloud) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050a15" />
        <defs>
          <pattern id="grid-cloud" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-cloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-cloud)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-cloud)" />
        
        <g stroke="#38BDF8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(68, 38)">
          <path d="M12 25 A 9 9 0 0 1 20 12 A 13 13 0 0 1 44 14 A 10 10 0 0 1 54 25 A 7 7 0 0 1 50 38 L 14 38 A 7 7 0 0 1 12 25 Z" fill="#0C1D36" opacity="0.6" />
          <path d="M33 30 L33 22 M29 25 L33 21 L37 25" stroke="#60A5FA" strokeWidth="1.5" />
          <circle cx="12" cy="25" r="3" fill="#60A5FA" />
          <circle cx="54" cy="25" r="3" fill="#60A5FA" />
        </g>
      </svg>
    );
  } else if (isDevOps) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#090514" />
        <defs>
          <pattern id="grid-ops" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-ops" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-ops)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-ops)" />
        
        <g strokeWidth="3.5" strokeLinecap="round" transform="translate(62, 38)">
          <path d="M24 22 C6 5, 2 39, 24 22 C46 5, 50 39, 32 22" stroke="#3B82F6" fill="none" />
          <path d="M32 22 C50 5, 46 39, 24 22 C2 5, 6 39, 44 22" stroke="#EC4899" fill="none" opacity="0.6" />
          <text x="14" y="26" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.2">DEV</text>
          <text x="44" y="26" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.2">OPS</text>
        </g>
      </svg>
    );
  } else if (isSec) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#070614" />
        <defs>
          <pattern id="grid-sec" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(34, 197, 94, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-sec" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-sec)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-sec)" />
        
        <g stroke="#3B82F6" strokeWidth="2" fill="none" transform="translate(76, 30)">
          <path d="M24 0 L44 8 C44 24 36 36 24 42 C12 36 4 24 4 8 Z" fill="#0A1128" opacity="0.8" />
          <rect x="17" y="20" width="14" height="10" rx="2" stroke="#60A5FA" fill="#1E293B" strokeWidth="1.5" />
          <path d="M20 20 V16 A 4 4 0 0 1 28 16 V20" stroke="#60A5FA" strokeWidth="1.5" />
        </g>
      </svg>
    );
  } else if (isDataSci) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#090510" />
        <defs>
          <pattern id="grid-ds" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-ds" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-ds)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-ds)" />
        
        <g stroke="#F472B6" strokeWidth="1.5" fill="none" transform="translate(68, 38)">
          <rect x="5" y="20" width="10" height="18" rx="1.5" />
          <rect x="20" y="10" width="10" height="28" rx="1.5" />
          <rect x="35" y="2" width="10" height="36" rx="1.5" />
          <path d="M 0 25 L 18 13 L 33 11 L 52 3" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          <circle cx="52" cy="3" r="2.5" fill="#FB7185" />
        </g>
      </svg>
    );
  } else if (isOS) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#08080f" />
        <defs>
          <pattern id="grid-os" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(107, 114, 128, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-os" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6B7280" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#6B7280" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-os)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-os)" />
        
        <g stroke="#9CA3AF" strokeWidth="2" fill="none" transform="translate(70, 38)">
          <rect x="0" y="0" width="60" height="40" rx="4" />
          <path d="M20 40 L20 48 h20 L40 40 Z" />
          <text x="8" y="17" fill="#34D399" fontSize="10" fontWeight="bold" fontFamily="monospace" stroke="none">&gt;_</text>
          <rect x="22" y="9" width="5" height="8" fill="#34D399" stroke="none" opacity="0.8" />
        </g>
      </svg>
    );
  } else if (isNetwork) {
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#050815" />
        <defs>
          <pattern id="grid-net" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(30, 64, 175, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-net" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-net)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-net)" />
        
        <g stroke="#2563EB" strokeWidth="1" transform="translate(0, 2)">
          <line x1="70" y1="45" x2="130" y2="45" />
          <line x1="70" y1="45" x2="100" y2="75" />
          <line x1="130" y1="45" x2="100" y2="75" />
          <line x1="70" y1="45" x2="65" y2="85" />
          <line x1="100" y1="75" x2="65" y2="85" />
          <line x1="130" y1="45" x2="135" y2="85" />
          <line x1="100" y1="75" x2="135" y2="85" />
          
          <circle cx="70" cy="45" r="4.5" fill="#60A5FA" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="130" cy="45" r="4.5" fill="#60A5FA" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="100" cy="75" r="4.5" fill="#38BDF8" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="65" cy="85" r="4" fill="#93C5FD" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="135" cy="85" r="4" fill="#93C5FD" stroke="#1E40AF" strokeWidth="1" />
        </g>
      </svg>
    );
  } else {
    // FALLBACK
    svgContent = (
      <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0a0a0f" />
        <defs>
          <pattern id="grid-def" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="glow-def" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-def)" />
        <circle cx="100" cy="60" r="50" fill="url(#glow-def)" />
        
        <g transform="translate(100, 60)">
          <circle cx="0" cy="0" r="30" fill="#111827" stroke="#8B5CF6" strokeWidth="1.5" />
          <text x="0" y="7" fill="#F3F4F6" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            {category.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </text>
        </g>
      </svg>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden rounded-t-[1.75rem]">
      {svgContent}
      <div className="absolute right-4 top-4 rounded-full px-3.5 py-1 text-[10px] font-extrabold capitalize tracking-wider shadow-sm text-white"
        style={{
          backgroundColor: status === 'active' ? '#10B981' : '#F59E0B'
        }}
      >
        {status === 'active' ? 'Active' : 'Upcoming'}
      </div>
    </div>
  );
}

export default function AllCoursesNew() {
  const navigate = useNavigate();
  const categoryRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [duration, setDuration] = useState('All');
  const [status, setStatus] = useState('All');
  const [instructor, setInstructor] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [viewMode, setViewMode] = useState('grid');
  const [bookmarked, setBookmarked] = useState({});

  useEffect(() => {
    // Listen for search updates from the global Topbar
    const handleTopbarSearch = (e) => {
      setQuery(e.detail || '');
    };
    window.addEventListener('search-courses', handleTopbarSearch);
    return () => {
      window.removeEventListener('search-courses', handleTopbarSearch);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/student/courses/catalog');
        const data = res?.data?.data?.courses;
        if (mounted && Array.isArray(data) && data.length) {
          setCourses(data.map((c, index) => ({
            id: c._id || c.id || String(index + 1),
            title: c.title || c.name || 'Course',
            category: c.category || 'Development',
            instructor: { name: c.instructor?.name || c.instructor || 'Instructor' },
            level: c.level || 'Beginner',
            duration: c.duration || '10 Weeks',
            rating: Number(c.rating || 4.5),
            reviews: Number(c.reviews || c.reviewCount || 0),
            enrolledStudents: Number(c.enrolledStudents || c.enrolled || 0),
            description: c.description || '',
            status: (c.status || 'active').toLowerCase(),
            thumbnail: c.thumbnail || c.banner || null,
          })));
        } else if (mounted) {
          setCourses(fallbackCourses);
        }
      } catch {
        if (mounted) setCourses(fallbackCourses);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const order = ['All', 'AI & ML', 'Development', 'Data Science', 'Cloud', 'Cybersecurity', 'DevOps', 'Database'];
    const counts = new Map();
    courses.forEach((c) => counts.set(c.category, (counts.get(c.category) || 0) + 1));
    return order.map((name) => ({ name, count: name === 'All' ? courses.length : counts.get(name) || 0 }));
  }, [courses]);

  const instructors = useMemo(() => ['All', ...Array.from(new Set(courses.map((c) => c.instructor?.name || 'Instructor'))).sort()], [courses]);

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = courses.filter((c) => {
      const okQ = !q || c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (c.instructor?.name || '').toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const okCategory = category === 'All' ? true : c.category === category;
      const okLevel = level === 'All' ? true : c.level === level;
      const okStatus = status === 'All' ? true : c.status === status.toLowerCase();
      const okInstructor = instructor === 'All' ? true : (c.instructor?.name || '') === instructor;
      const weeks = Number(String(c.duration).match(/(\d+)/)?.[1] || 0);
      const okDuration = duration === 'All' ? true : duration === 'Under 10 Weeks' ? weeks < 10 : duration === '10-12 Weeks' ? weeks >= 10 && weeks <= 12 : weeks > 12;
      return okQ && okCategory && okLevel && okStatus && okInstructor && okDuration;
    });
    list.sort((a, b) => {
      if (sort === 'Rating') return b.rating - a.rating;
      if (sort === 'Most Enrolled') return b.enrolledStudents - a.enrolledStudents;
      if (sort === 'Newest') return String(b.id).localeCompare(String(a.id));
      return (b.rating * 10 + b.enrolledStudents / 100) - (a.rating * 10 + a.enrolledStudents / 100);
    });
    return list;
  }, [courses, category, duration, instructor, level, query, sort, status]);

  const trending = [
    { id: '1', title: 'Generative AI', instructor: 'Dr. Sarah Johnson', rating: 4.9, category: 'AI & ML' },
    { id: '2', title: 'NLP', instructor: 'Dr. Emily Davis', rating: 4.8, category: 'AI & ML' },
    { id: '3', title: 'Data Science', instructor: 'Dr. Sarah Johnson', rating: 4.7, category: 'Data Science' },
    { id: '4', title: 'Node.js', instructor: 'Dr. James Wilson', rating: 4.6, category: 'Development' },
    { id: '5', title: 'Git & GitHub', instructor: 'Dr. David Lee', rating: 4.6, category: 'Development' },
  ];

  const topInstructors = [
    { name: 'Dr. Sarah Johnson', role: 'AI Expert', courses: 12, rating: 4.9 },
    { name: 'Dr. Michael Brown', role: 'ML Expert', courses: 12, rating: 4.8 },
    { name: 'Dr. James Wilson', role: 'Cloud Expert', courses: 8, rating: 4.7 },
    { name: 'Dr. Emily Davis', role: 'Data Scientist', courses: 11, rating: 4.9 },
  ];

  const scrollCategories = (dir) => categoryRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  const resetFilters = () => { setQuery(''); setCategory('All'); setLevel('All'); setDuration('All'); setStatus('All'); setInstructor('All'); setSort('Newest'); };

  return (
    <div className="min-h-full space-y-6 pb-12">
      {/* Main LMS Layout Grid */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left Column (Catalog Content) */}
        <div className="space-y-6">
          
          {/* Main Hero Banner with Illustration */}
          <section className="relative overflow-hidden rounded-[2.2rem] border border-violet-100/50 bg-gradient-to-br from-[#FAF8FF] via-[#F4F2FF] to-[#EDF2FF] p-8 md:p-10 shadow-sm dark:border-white/5 dark:bg-gradient-to-br dark:from-[#131129] dark:via-[#0E0E1B] dark:to-[#090C16]">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
            
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="relative z-10 space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/80 dark:bg-violet-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  <Sparkles className="h-3 w-3" /> Upgrade Your Future
                </span>
                <h2 className="text-3xl md:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-tight font-display">
                  Learn In-Demand Tech Skills
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-md">
                  Discover industry-relevant courses designed to boost your career with a cleaner, sharper learning path.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button className="h-11 rounded-full bg-[#5F4BF2] hover:bg-[#4E3CD9] px-6 text-xs text-white font-bold shadow-md shadow-violet-600/15" onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full border-slate-200 bg-white/50 px-6 text-xs text-slate-600 font-bold hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => navigate('/student/my-courses')}>
                    How it Works
                  </Button>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-center">
                <img src="/hero_banner_edu.png" alt="LMS Graduation Cap and Books" className="h-56 md:h-60 object-contain hover:scale-102 transition-transform duration-500" />
              </div>
            </div>
            <div className="relative z-10 mt-6 flex justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5F4BF2]" />
              <span className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </section>

          {/* Categories Selector */}
          <section id="courses-section" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Categories</h3>
              <button className="text-xs font-bold text-[#5F4BF2] hover:text-[#4E3CD9] hover:underline" onClick={() => setCategory('All')}>View All</button>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => scrollCategories('left')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
              
              <div ref={categoryRef} className="no-scrollbar flex flex-1 gap-3 overflow-x-auto pb-1">
                {categories.map((cat) => {
                  const Icon = iconFor(cat.name);
                  const active = category === cat.name;
                  return (
                    <button 
                      key={cat.name} 
                      onClick={() => setCategory(cat.name)} 
                      className={cn(
                        'min-w-[136px] rounded-2xl border px-4 py-4 text-left transition duration-200 shadow-sm', 
                        active 
                          ? 'border-[#5F4BF2] bg-[#ECEBFF] dark:bg-violet-950/20' 
                          : 'border-slate-200/80 bg-white hover:border-violet-200 hover:bg-slate-50 dark:border-white/5 dark:bg-slate-900 dark:hover:bg-slate-850'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={cn('h-5 w-5', active ? 'text-[#5F4BF2]' : 'text-slate-400')} />
                        <span className={cn('text-xs font-extrabold', active ? 'text-[#5F4BF2]/90' : 'text-slate-400')}>{cat.count}</span>
                      </div>
                      <p className={cn('mt-3 text-xs font-bold truncate', active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>{cat.name}</p>
                    </button>
                  );
                })}
              </div>
              
              <button onClick={() => scrollCategories('right')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </section>

          {/* Filters Row */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Inner Search bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Search courses..." 
                  className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-slate-900 dark:text-white" 
                />
              </div>

              {/* Styled Dropdowns */}
              {[
                ['Category', category, setCategory, ['All', 'AI & ML', 'Development', 'Data Science', 'Cloud', 'Cybersecurity', 'DevOps', 'Database']],
                ['Level', level, setLevel, ['All', 'Beginner', 'Intermediate', 'Advanced']],
                ['Duration', duration, setDuration, ['All', 'Under 10 Weeks', '10-12 Weeks', '12+ Weeks']],
                ['Status', status, setStatus, ['All', 'active', 'upcoming']],
                ['Instructor', instructor, setInstructor, instructors]
              ].map(([label, value, setter, options]) => (
                <div key={label} className="relative">
                  <select 
                    value={value} 
                    onChange={(e) => setter(e.target.value)} 
                    className="h-10 rounded-full border border-slate-200 bg-white pl-4 pr-8 text-xs text-slate-600 font-bold outline-none hover:border-violet-200 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-[size:16px_16px] bg-no-repeat"
                  >
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'All' ? label : opt === 'active' ? 'Active' : opt === 'upcoming' ? 'Upcoming' : opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Sort By Dropdown */}
              <div className="relative">
                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value)} 
                  className="h-10 rounded-full border border-slate-200 bg-white pl-4 pr-8 text-xs text-slate-600 font-bold outline-none hover:border-violet-200 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-[size:16px_16px] bg-no-repeat"
                >
                  <option value="Newest">Sort By: Newest</option>
                  <option value="Rating">Sort By: Rating</option>
                  <option value="Most Enrolled">Sort By: Most Enrolled</option>
                  <option value="Trending">Sort By: Trending</option>
                </select>
              </div>

              {/* Grid / List View selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200/60 dark:border-white/5">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full transition-all', 
                    viewMode === 'grid' ? 'bg-[#5F4BF2] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full transition-all', 
                    viewMode === 'list' ? 'bg-[#5F4BF2] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Reset button */}
              <Button 
                variant="outline" 
                onClick={resetFilters} 
                className="h-10 rounded-full border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              >
                <Filter className="mr-1.5 h-4 w-4" />Reset
              </Button>
            </div>
          </section>

          {/* Catalog grid of courses */}
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-white/5 dark:bg-slate-900">
                Loading courses...
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="rounded-[2rem] border-dashed border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                <CardContent className="py-16 text-center">
                  <Shield className="mx-auto h-12 w-12 text-violet-600" />
                  <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">No courses matched your filters</h3>
                  <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
                    Try adjusting the search or resetting filters to see the full catalog.
                  </p>
                  <Button onClick={resetFilters} className="mt-5 rounded-full bg-[#5F4BF2] text-white hover:bg-[#4E3CD9] px-6 text-xs">
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCourses.map((course) => {
                  const bookmarkedCourse = bookmarked[course.id];
                  const hasValidThumbnail = course.thumbnail && !course.thumbnail.includes('placeholder') && !course.thumbnail.includes('via.placeholder');
                  return (
                    <Card key={course.id} className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-white/5 dark:bg-slate-900 flex flex-col h-[305px]">
                      {hasValidThumbnail ? (
                        <div className="relative h-24 w-full overflow-hidden flex-shrink-0">
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <CourseThumb title={course.title} category={course.category} status={course.status} />
                      )}
                      
                      <CardContent className="flex flex-col flex-1 p-3.5 justify-between">
                        <div className="space-y-2">
                          <h4 className="text-[15px] font-extrabold text-slate-900 transition-colors group-hover:text-[#5F4BF2] dark:text-white line-clamp-1 leading-snug">
                            {course.title}
                          </h4>
                          
                          {/* Instructor detail row */}
                          <div className="flex items-center gap-2">
                            {getInstructorAvatar(course.instructor?.name)}
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">{course.instructor?.name}</p>
                          </div>
                        </div>

                        {/* Level and duration */}
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-lg border px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider', LEVEL_STYLES[course.level] || LEVEL_STYLES.Beginner)}>
                            {course.level}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            <Clock className="h-3 w-3" /> {course.duration}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="whitespace-nowrap">{course.rating.toFixed(1)} <span className="text-slate-400 font-medium">({course.reviews})</span></span>
                          </div>
                          <span className="font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">{course.enrolledStudents} Enrolled</span>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button className="h-11 flex-1 rounded-2xl bg-[#5F4BF2] text-xs font-bold text-white hover:bg-[#4E3CD9]" onClick={() => navigate(`/student/course/${course.id}`)}>
                            Enroll Now
                          </Button>
                          <button 
                            onClick={() => setBookmarked((prev) => ({ ...prev, [course.id]: !prev[course.id] }))} 
                            className={cn(
                              'grid h-11 w-11 place-items-center rounded-2xl border transition duration-200 shrink-0', 
                              bookmarkedCourse 
                                ? 'border-violet-300 bg-violet-50 text-[#5F4BF2] dark:border-violet-500/20 dark:bg-violet-950/20' 
                                : 'border-slate-200 bg-white text-slate-400 hover:border-violet-200 hover:text-[#5F4BF2] dark:border-white/5 dark:bg-slate-950/40'
                            )} 
                            aria-label="Bookmark course"
                          >
                            <Bookmark className={cn('h-5 w-5', bookmarkedCourse && 'fill-[#5F4BF2]')} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => {
                  const bookmarkedCourse = bookmarked[course.id];
                  const hasValidThumbnail = course.thumbnail && !course.thumbnail.includes('placeholder') && !course.thumbnail.includes('via.placeholder');
                  return (
                    <Card key={course.id} className="rounded-3xl border border-slate-200 bg-white dark:border-white/5 dark:bg-slate-900">
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                        <div className="w-full overflow-hidden rounded-2xl sm:w-44 shrink-0">
                          {hasValidThumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="h-28 w-full object-cover sm:h-24" />
                          ) : (
                            <CourseThumb title={course.title} category={course.category} status={course.status} />
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{course.title}</h4>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                              {course.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">By {course.instructor?.name}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                            <span className={cn('rounded-lg border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider', LEVEL_STYLES[course.level] || LEVEL_STYLES.Beginner)}>
                              {course.level}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              <Clock className="h-3 w-3" /> {course.duration}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              {course.rating.toFixed(1)} <span className="text-slate-400 font-medium">({course.reviews})</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{course.enrolledStudents} Enrolled</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button className="h-11 rounded-2xl bg-[#5F4BF2] px-5 text-xs font-bold text-white hover:bg-[#4E3CD9]" onClick={() => navigate(`/student/course/${course.id}`)}>
                            Enroll Now
                          </Button>
                          <button 
                            onClick={() => setBookmarked((prev) => ({ ...prev, [course.id]: !prev[course.id] }))} 
                            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:border-violet-200 hover:text-[#5F4BF2] dark:border-white/5 dark:bg-slate-900"
                          >
                            <Bookmark className={cn('h-5 w-5', bookmarkedCourse && 'fill-[#5F4BF2] text-[#5F4BF2]')} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar Column */}
        <aside className="space-y-6">
          {/* Top Instructors Card */}
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">Top Instructors</h3>
                <button className="text-[11px] font-bold text-[#5F4BF2] hover:text-[#4E3CD9]" onClick={() => setSort('Rating')}>View All</button>
              </div>
              <div className="space-y-4">
                {topInstructors.map((ins) => (
                  <div key={ins.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getInstructorAvatar(ins.name)}
                      <div className="leading-tight">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{ins.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{ins.role} • {ins.courses} Courses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{ins.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Get Certified Gradient Card */}
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-[#8076FF] via-[#5F4BF2] to-[#3021D4] text-white shadow-md">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <img src="/trophy_icon.png" alt="Trophy" className="h-10 w-10 object-contain" />
                </div>
                <div className="leading-tight space-y-1">
                  <h3 className="text-[15px] font-extrabold text-white">Get Certified</h3>
                  <p className="text-[11px] text-white/80 font-medium">Earn certificates and boost your career.</p>
                </div>
              </div>
              <Button className="h-10 w-full rounded-2xl bg-white px-4 text-xs font-extrabold text-[#5F4BF2] hover:bg-slate-50 shadow-sm" onClick={() => navigate('/student/profile')}>
                View Certifications
              </Button>
            </CardContent>
          </Card>

          {/* Trending Courses Card */}
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">Trending Courses</h3>
                <button className="text-[11px] font-bold text-[#5F4BF2] hover:text-[#4E3CD9]" onClick={() => setSort('Most Enrolled')}>View All</button>
              </div>
              <div className="space-y-3">
                {trending.map((course, index) => (
                  <button 
                    key={course.id} 
                    onClick={() => navigate(`/student/course/${course.id}`)} 
                    className="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition duration-200 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="w-5 text-xs font-black text-slate-400 text-center">{index + 1}</span>
                    
                    {/* Tiny category designator box */}
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#5F4BF2] dark:bg-slate-800 dark:text-violet-300 font-extrabold text-xs">
                      {course.category.slice(0, 1)}
                    </div>
                    
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">{course.title}</p>
                      <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{course.instructor}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Need Help Card */}
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-3">
                <div className="space-y-1 leading-tight">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">Need Help?</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Our support team is here to help you</p>
                </div>
                <Button className="h-10 rounded-2xl bg-[#5F4BF2] px-4 text-xs font-extrabold text-white hover:bg-[#4E3CD9]" onClick={() => navigate('/student/profile')}>
                  Contact Support
                </Button>
              </div>
              <div className="grid h-18 w-18 shrink-0 place-items-center rounded-full bg-slate-50 dark:bg-slate-850">
                <img src="/headphones_3d.png" alt="Helpdesk Support" className="h-14 w-14 object-contain" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
