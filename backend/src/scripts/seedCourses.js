import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import StudyMaterial from '../models/StudyMaterial.js';
import connectDB from '../config/database.js';

dotenv.config();

const coursesData = [
  {
    title: 'Web Development Masterclass',
    description: 'Learn the core technologies of the web. Build interactive frontend and robust backend services using HTML, CSS, JavaScript, React.js, and Node.js.',
    category: 'Web Development',
    instructor: 'Dr. Amit Patel',
    price: 15000,
    discount: 10,
    thumbnail: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1622582845/sample.jpg',
      publicId: 'webdev_thumb'
    },
    duration: '12 Weeks',
    level: 'Beginner',
    language: 'English',
    features: ['Certificate of Completion', '1-on-1 Mentorship', 'Career Coaching', 'Lifetime Access'],
    requirements: ['Basic computer literacy', 'Good internet connection', 'No prior programming skills required'],
    modules: [
      {
        title: 'Module 1: Introduction to HTML5 & CSS3',
        description: 'Understand web structure and styling using semantic HTML elements and modern CSS practices.',
        order: 1,
        videos: [
          {
            title: 'Web Development Roadmap 2026',
            url: 'https://www.youtube.com/watch?v=z0n1_D110Q8',
            duration: '15:30',
            order: 1,
            isFree: true
          },
          {
            title: 'HTML5 Semantic Structure',
            url: 'https://www.youtube.com/watch?v=kUMe1FH4WHY',
            duration: '12:45',
            order: 2,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'HTML5 & CSS Basics Guide.pdf',
            url: '/uploads/resources/web_development/syllabus.pdf'
          }
        ]
      },
      {
        title: 'Module 2: JavaScript Deep Dive',
        description: 'Master core JavaScript syntax, DOM manipulation, asynchronous operations, and DOM events.',
        order: 2,
        videos: [
          {
            title: 'JavaScript Basics for Beginners',
            url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: '25:10',
            order: 1,
            isFree: true
          },
          {
            title: 'DOM Manipulation & Dynamic Event Handling',
            url: 'https://www.youtube.com/watch?v=y17RuWkWdn8',
            duration: '18:20',
            order: 2,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'JavaScript Cheat Sheet.pdf',
            url: '/uploads/resources/web_development/notes.pdf'
          }
        ]
      },
      {
        title: 'Module 3: React Framework Fundamentals',
        description: 'Understand React components, state, hooks, and component lifecycle.',
        order: 3,
        videos: [
          {
            title: 'React.js Complete Beginner Course',
            url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            duration: '35:40',
            order: 1,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'React Hooks Lifecycle Guide.pdf',
            url: '/uploads/resources/web_development/notes.pdf'
          }
        ]
      }
    ],
    studyMaterials: [
      {
        title: 'Complete HTML & CSS Cheatsheet',
        description: 'Comprehensive cheatsheet for HTML5 tags and CSS3 properties.',
        category: 'Notes',
        subject: 'HTML & CSS',
        fileUrl: '/uploads/resources/web_development/notes.pdf',
        fileSize: '1.2 MB'
      },
      {
        title: 'JavaScript Coding Practice Set',
        description: 'Practice programming questions covering ES6+ concepts and recursion.',
        category: 'Practice Questions',
        subject: 'JavaScript',
        fileUrl: '/uploads/resources/web_development/notes.pdf',
        fileSize: '850 KB'
      }
    ]
  },
  {
    title: 'Python Programming Bootcamp',
    description: 'Master Python programming from syntax basics to object-oriented constructs, database handling, scripting, and web scraping.',
    category: 'Programming',
    instructor: 'Prof. Priya Rao',
    price: 12000,
    discount: 15,
    thumbnail: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1622582845/sample.jpg',
      publicId: 'python_thumb'
    },
    duration: '8 Weeks',
    level: 'Beginner',
    language: 'English',
    features: ['Hands-on Labs', 'Coding Exercises', 'Interactive Forums', 'Certificate of Completion'],
    requirements: ['No prior programming experience required'],
    modules: [
      {
        title: 'Module 1: Python Basics & Local Environment Setup',
        description: 'Install Python, set up VS Code, and learn about data types, inputs, and outputs.',
        order: 1,
        videos: [
          {
            title: 'Python for Beginners - Tutorial 2026',
            url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
            duration: '40:15',
            order: 1,
            isFree: true
          }
        ],
        notes: [
          {
            title: 'Python Installation and Setup.pdf',
            url: '/uploads/resources/python_programming/syllabus.pdf'
          }
        ]
      },
      {
        title: 'Module 2: Control Flow & Custom Functions',
        description: 'Learn conditional branching (if-else), loops (for/while), functions, and variable scope.',
        order: 2,
        videos: [
          {
            title: 'Python Conditionals and Loops',
            url: 'https://www.youtube.com/watch?v=6iF8Xb7Z3kQ',
            duration: '14:50',
            order: 1,
            isFree: false
          },
          {
            title: 'Functions, Parameters and Return Values',
            url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
            duration: '22:15',
            order: 2,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'Functions & Arguments Cheatsheet.pdf',
            url: '/uploads/resources/python_programming/notes.pdf'
          }
        ]
      },
      {
        title: 'Module 3: Object-Oriented Programming (OOP) in Python',
        description: 'Classes, instances, inheritance, polymorphism, encapsulation, and special dunder methods.',
        order: 3,
        videos: [
          {
            title: 'Python OOP Tutorial - Classes & Instances',
            url: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
            duration: '30:05',
            order: 1,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'OOP concepts Cheat Sheet.pdf',
            url: '/uploads/resources/python_programming/notes.pdf'
          }
        ]
      }
    ],
    studyMaterials: [
      {
        title: 'Python Core Syntax Guide',
        description: 'Reference sheet covering loops, dictionary comprehensions, list methods.',
        category: 'Notes',
        subject: 'Python Core',
        fileUrl: '/uploads/resources/python_programming/notes.pdf',
        fileSize: '1.5 MB'
      }
    ]
  },
  {
    title: 'Data Structures & Algorithms Deep Dive',
    description: 'Master Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graphs, Sorting, Searching, and Dynamic Programming.',
    category: 'Programming',
    instructor: 'Harish Mehta',
    price: 18000,
    discount: 5,
    thumbnail: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1622582845/sample.jpg',
      publicId: 'dsa_thumb'
    },
    duration: '16 Weeks',
    level: 'Advanced',
    language: 'English',
    features: ['LeetCode Problem Solving', 'Algorithm Analysis', 'Weekly Quizzes', 'Interview Prep Mock Sessions'],
    requirements: ['Basic programming in C++, Java, or Python'],
    modules: [
      {
        title: 'Module 1: Complexity Analysis & Array Structures',
        description: 'Analyze performance using Big O Notation and understand multi-dimensional arrays.',
        order: 1,
        videos: [
          {
            title: 'Introduction to Big O Notation',
            url: 'https://www.youtube.com/watch?v=V6mKVRU1evU',
            duration: '18:40',
            order: 1,
            isFree: true
          }
        ],
        notes: [
          {
            title: 'Time & Space Complexity Guide.pdf',
            url: '/uploads/resources/data_structures_algorithms/syllabus.pdf'
          }
        ]
      },
      {
        title: 'Module 2: Linked Lists, Stacks & Queues',
        description: 'Singly, doubly, and circular linked lists. Stack and queue implementation using arrays and linked structures.',
        order: 2,
        videos: [
          {
            title: 'Linked List Implementation step-by-step',
            url: 'https://www.youtube.com/watch?v=WwfhLC16bis',
            duration: '24:10',
            order: 1,
            isFree: false
          },
          {
            title: 'Stack & Queue Concepts & Operations',
            url: 'https://www.youtube.com/watch?v=wjI1WNcIntg',
            duration: '15:55',
            order: 2,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'Linear Data Structures Source Code.pdf',
            url: '/uploads/resources/data_structures_algorithms/notes.pdf'
          }
        ]
      },
      {
        title: 'Module 3: Trees and Graph Traversal Algorithms',
        description: 'Binary Tree traversals (pre, in, post order). Graph representations and Breadth-First / Depth-First search implementations.',
        order: 3,
        videos: [
          {
            title: 'Binary Tree Traversals Explained',
            url: 'https://www.youtube.com/watch?v=IpytDKT3y0A',
            duration: '28:12',
            order: 1,
            isFree: false
          },
          {
            title: 'Graph Traversals - BFS & DFS Implementation',
            url: 'https://www.youtube.com/watch?v=pcKY4hjDrxk',
            duration: '21:00',
            order: 2,
            isFree: false
          }
        ],
        notes: [
          {
            title: 'Trees & Graph Traversal Guide.pdf',
            url: '/uploads/resources/data_structures_algorithms/notes.pdf'
          }
        ]
      }
    ],
    studyMaterials: [
      {
        title: 'Top 50 Interview Questions on DSA',
        description: 'Selected problems from Leetcode, GFG, and HackerRank.',
        category: 'Practice Questions',
        subject: 'Algorithms',
        fileUrl: '/uploads/resources/data_structures_algorithms/notes.pdf',
        fileSize: '2.1 MB'
      }
    ]
  }
];

export const seedCourses = async () => {
  console.log('🌱 Starting to seed courses, modules, and study materials...');
  try {
    for (const cData of coursesData) {
      // Find or create course
      let course = await Course.findOne({ title: cData.title });
      if (course) {
        console.log(`\n📝 Updating course: "${cData.title}"`);
        course.description = cData.description;
        course.category = cData.category;
        course.instructor = cData.instructor;
        course.price = cData.price;
        course.discount = cData.discount;
        course.thumbnail = cData.thumbnail;
        course.duration = cData.duration;
        course.level = cData.level;
        course.features = cData.features;
        course.requirements = cData.requirements;
        await course.save();
      } else {
        console.log(`\n🆕 Creating course: "${cData.title}"`);
        course = await Course.create({
          title: cData.title,
          description: cData.description,
          category: cData.category,
          instructor: cData.instructor,
          price: cData.price,
          discount: cData.discount,
          thumbnail: cData.thumbnail,
          duration: cData.duration,
          level: cData.level,
          features: cData.features,
          requirements: cData.requirements
        });
      }

      // Delete and recreate modules for this course
      await Module.deleteMany({ courseId: course._id });
      console.log(`🧹 Cleared old modules for "${cData.title}"`);

      for (const mData of mData_loop(cData.modules, course._id)) {
        await Module.create(mData);
      }
      console.log(`✅ Seeded ${cData.modules.length} modules for "${cData.title}"`);

      // Seed StudyMaterials for this course
      await StudyMaterial.deleteMany({ course: course._id });
      for (const smData of cData.studyMaterials) {
        await StudyMaterial.create({
          ...smData,
          course: course._id
        });
      }
      console.log(`✅ Seeded ${cData.studyMaterials.length} study materials for "${cData.title}"`);
    }
    console.log('✨ Courses seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during course seeding:', error);
    throw error;
  }
};

function mData_loop(modules, courseId) {
  return modules.map(m => ({
    courseId: courseId,
    title: m.title,
    description: m.description,
    order: m.order,
    videos: m.videos,
    notes: m.notes
  }));
}

if (process.argv[1] && process.argv[1].endsWith('seedCourses.js')) {
  (async () => {
    await connectDB();
    await seedCourses();
    process.exit(0);
  })();
}
