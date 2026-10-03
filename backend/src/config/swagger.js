const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CSE Department AI Agentic ERP API',
    version: '2.0.0',
    description: 'Production-ready RESTful APIs for the CSE Department Agentic ERP. Dedicated exclusively to the Computer Science & Engineering Department with 4-year hierarchy (1st to 4th Year, Semesters 1 to 8, Sections A/B), normalized MySQL tables, MongoDB AI memory, Python FastAPI Groq LLM integration, Qdrant vector database, Brevo transactional emails, and Multer document pipelines.',
    contact: {
      name: 'CSE Department IT & AI Lab',
      email: 'cse.erp@college.edu'
    }
  },
  servers: [
    { url: '/api', description: 'Primary API Gateway (/api)' },
    { url: '/api/v1', description: 'Versioned API Gateway (/api/v1)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    // Auth Module
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user & issue access/refresh JWT tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'ayush.student@college.edu' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Authenticated successfully' } }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new student or faculty member in CSE Department',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'role'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'faculty', 'admin'] },
                  year: { type: 'string', example: '3rd Year' },
                  semester: { type: 'integer', example: 5 },
                  section: { type: 'string', example: 'A' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Registered successfully' } }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Obtain new access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } }
              }
            }
          }
        },
        responses: { 200: { description: 'New token issued' } }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Generate 6-digit OTP and send via Brevo email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string' } }
              }
            }
          }
        },
        responses: { 200: { description: 'OTP sent' } }
      }
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP code and reset account password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp', 'newPassword'],
                properties: {
                  email: { type: 'string' },
                  otp: { type: 'string', example: '582910' },
                  newPassword: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Password reset successfully' } }
      }
    },

    // Students Module
    '/students': {
      get: {
        tags: ['Students'],
        summary: 'Get all students with search and pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'year', in: 'query', schema: { type: 'string' } },
          { name: 'semester', in: 'query', schema: { type: 'integer' } },
          { name: 'section', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { 200: { description: 'List of students' } }
      },
      post: {
        tags: ['Students'],
        summary: 'Create student record',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Student created' } }
      }
    },

    // Faculty Module
    '/faculty': {
      get: {
        tags: ['Faculty'],
        summary: 'Get all faculty members with search and designation filter',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Faculty roster' } }
      },
      post: {
        tags: ['Faculty'],
        summary: 'Create faculty record',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Faculty created' } }
      }
    },

    // Attendance Module
    '/attendance/mark': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark single attendance and verify threshold',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Attendance marked' } }
      }
    },
    '/attendance/bulk': {
      post: {
        tags: ['Attendance'],
        summary: 'Bulk mark section attendance for a class session',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Bulk attendance recorded' } }
      }
    },
    '/attendance/stats': {
      get: {
        tags: ['Attendance'],
        summary: 'Get student attendance percentage and subject-wise breakdown',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Attendance analytics and alerts' } }
      }
    },
    '/attendance/student/{studentId}': {
      get: {
        tags: ['Attendance'],
        summary: 'Get full attendance summary and lecture breakdown for a student',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Student attendance statistics' } }
      }
    },
    '/attendance/override': {
      post: {
        tags: ['Attendance'],
        summary: 'Direct manual attendance override by HOD or Admin with immutable audit trail',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['student_id', 'subject_id', 'date', 'status'],
                properties: {
                  student_id: { type: 'string' },
                  subject_id: { type: 'string' },
                  date: { type: 'string', example: '2026-09-29' },
                  status: { type: 'string', enum: ['Present', 'Absent'] },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Attendance manually overridden' } }
      }
    },
    '/attendance/qr/generate': {
      post: {
        tags: ['Attendance'],
        summary: 'Generate dynamic cryptographic QR code session for in-class attendance',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject_id', 'section'],
                properties: {
                  subject_id: { type: 'string' },
                  section: { type: 'string' },
                  semester: { type: 'integer', example: 5 },
                  validity_seconds: { type: 'integer', example: 300 }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'QR session token and base64 code' } }
      }
    },
    '/attendance/qr/scan': {
      post: {
        tags: ['Attendance'],
        summary: 'Scan and verify dynamic QR attendance session for student',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Attendance marked via QR verification' } }
      }
    },

    // Assignments Module
    '/assignments': {
      get: {
        tags: ['Assignments'],
        summary: 'List assignments filtered by subject or semester',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Assignments list' } }
      },
      post: {
        tags: ['Assignments'],
        summary: 'Create assignment with file attachment and trigger student notifications',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Assignment created' } }
      }
    },
    '/assignments/submit': {
      post: {
        tags: ['Assignments'],
        summary: 'Student assignment submission with PDF/DOCX file upload',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Assignment submitted' } }
      }
    },
    '/assignments/evaluate/{submission_id}': {
      put: {
        tags: ['Assignments'],
        summary: 'Evaluate submission with marks and feedback',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Submission graded' } }
      }
    },

    // Timetable Module & AI Scheduler
    '/timetable': {
      get: {
        tags: ['Timetable & Scheduler'],
        summary: 'Get class timetable by Year, Semester, Section, and Day',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'string' } },
          { name: 'semester', in: 'query', schema: { type: 'integer' } },
          { name: 'section', in: 'query', schema: { type: 'string' } },
          { name: 'day', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Weekly master schedule' } }
      }
    },
    '/timetable/generate': {
      post: {
        tags: ['Timetable & Scheduler'],
        summary: 'Generate optimized timetable using deterministic CSP solver and LLM intent constraints',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  department: { type: 'string', example: 'CSE' },
                  year: { type: 'string', example: '3rd Year' },
                  semester: { type: 'integer', example: 5 },
                  section: { type: 'string', example: 'A' },
                  academic_year: { type: 'string', example: '2026-27' },
                  custom_constraints: { type: 'array', items: { type: 'string' }, example: ['Keep Friday lighter', 'Labs should be two consecutive periods'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Draft timetable created with CSP metrics' } }
      }
    },
    '/timetable/conflicts': {
      get: {
        tags: ['Timetable & Scheduler'],
        summary: 'Detect room, teacher, section, and lab scheduling collisions',
        parameters: [
          { name: 'semester', in: 'query', schema: { type: 'integer', example: 5 } },
          { name: 'section', in: 'query', schema: { type: 'string', example: 'A' } }
        ],
        responses: { 200: { description: 'Collision validation report' } }
      }
    },
    '/timetable/{id}/approve': {
      post: {
        tags: ['Timetable & Scheduler'],
        summary: 'Approve draft timetable version (HOD authorization required)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Version approved' } }
      }
    },
    '/timetable/{id}/publish': {
      post: {
        tags: ['Timetable & Scheduler'],
        summary: 'Publish official timetable version and archive previous active schedule',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Version published and locked' } }
      }
    },
    '/timetable/export/excel': {
      get: {
        tags: ['Timetable & Scheduler'],
        summary: 'Export structured formatted timetable grid as XLSX workbook',
        parameters: [
          { name: 'semester', in: 'query', schema: { type: 'integer', example: 5 } },
          { name: 'section', in: 'query', schema: { type: 'string', example: 'A' } }
        ],
        responses: { 200: { description: 'Binary XLSX file stream' } }
      }
    },
    '/timetable/export/pdf': {
      get: {
        tags: ['Timetable & Scheduler'],
        summary: 'Export high-resolution printable timetable grid as PDF document',
        parameters: [
          { name: 'semester', in: 'query', schema: { type: 'integer', example: 5 } },
          { name: 'section', in: 'query', schema: { type: 'string', example: 'A' } }
        ],
        responses: { 200: { description: 'Binary PDF file stream' } }
      }
    },
    // Teacher Absence & Dynamic Scheduler Module
    '/teacher-scheduler/analyze': {
      post: {
        tags: ['Teacher Scheduler'],
        summary: 'Analyze teacher absence and calculate conflict-free substitute proposals',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teacher_name'],
                properties: {
                  teacher_name: { type: 'string', example: 'Dr. Sunita Sharma' },
                  day: { type: 'string', example: 'Monday' },
                  date: { type: 'string', example: '2026-09-28' },
                  department: { type: 'string', example: 'CSE' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Ranked substitute teacher recommendations' } }
      }
    },
    '/teacher-scheduler/apply': {
      post: {
        tags: ['Teacher Scheduler'],
        summary: 'Apply approved teacher substitutions transactionally to MySQL and notify faculty/students',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['absence_data'],
                properties: {
                  absence_data: { type: 'object' },
                  approved_by: { type: 'string', example: 'Dr. Alok Verma (HOD)' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Substitutions activated and audit log written' } }
      }
    },
    '/teacher-scheduler/conflicts': {
      get: {
        tags: ['Teacher Scheduler'],
        summary: 'List pending unresolved substitution conflicts',
        responses: { 200: { description: 'Pending conflict proposals' } }
      }
    },

    // Notes & Documents Module
    '/notes': {
      get: {
        tags: ['Notes'],
        summary: 'List department notes and learning materials',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of documents' } }
      }
    },
    '/notes/upload': {
      post: {
        tags: ['Notes'],
        summary: 'Upload PDF/DOCX/PPT note, save metadata in MySQL, and index to Qdrant vector database',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Document uploaded and queued for vector embedding' } }
      }
    },
    '/notes/status/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Check vector embedding and indexing status of an uploaded document in Qdrant',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Document processing status (completed, processing, failed)' } }
      }
    },

    // AI Multi-Agent Core
    '/ai/chat': {
      post: {
        tags: ['AI Agentic Core'],
        summary: 'Multi-agent orchestration endpoint connecting Node to Python FastAPI and Groq LLM',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string', example: 'Kal meri class kab hai aur assignment pending hai?' },
                  conversation_id: { type: 'string' },
                  role: { type: 'string', example: 'student' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Agentic response with citations, tool calls, and memory updates'
          }
        }
      }
    },
    '/ai/suggestions': {
      get: {
        tags: ['AI Agentic Core'],
        summary: 'Get contextual prompt recommendations based on user role',
        responses: { 200: { description: 'Suggestions list' } }
      }
    },
    '/ai/rag/search': {
      post: {
        tags: ['AI Agentic Core'],
        summary: 'Search Qdrant vector collections with hybrid retrieval',
        responses: { 200: { description: 'Retrieved chunks with similarity scores' } }
      }
    },

    // Academic CSE Hierarchy
    '/academic/hierarchy': {
      get: {
        tags: ['Academic Hierarchy'],
        summary: 'Get complete CSE Department 4-year, 8-semester, and Section breakdown',
        responses: { 200: { description: 'Department hierarchy tree' } }
      }
    },

    // Admin & Analytics
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Department overview analytics, student counts, and AI metrics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Department analytics overview' } }
      }
    },
    '/admin/faculty-workload': {
      get: {
        tags: ['Admin'],
        summary: 'Teaching workload and timetable distribution per faculty member',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Faculty workload matrix' } }
      }
    },

    // Chat & Conversations (Standardized Section 22 Endpoints)
    '/chat': {
      post: {
        tags: ['AI Agentic Core'],
        summary: 'Primary conversational endpoint supporting agent selection, STM memory, and tool calls',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'What is the schedule for 3rd Year CSE Section A?' },
                  conversation_id: { type: 'string' },
                  agent: { type: 'string', example: 'timetable' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Agentic assistant response' } }
      }
    },
    '/chat/stream': {
      post: {
        tags: ['AI Agentic Core'],
        summary: 'Server-Sent Events (SSE) streaming chat endpoint',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  conversation_id: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'SSE chunk stream' } }
      }
    },
    '/chats': {
      get: {
        tags: ['AI Agentic Core'],
        summary: 'List user chat conversation history from MongoDB STM',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of conversations' } }
      }
    },
    '/chats/{chatId}': {
      get: {
        tags: ['AI Agentic Core'],
        summary: 'Get conversation details and message history',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'chatId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Conversation details' } }
      },
      delete: {
        tags: ['AI Agentic Core'],
        summary: 'Delete conversation and prune STM history',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'chatId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Conversation deleted' } }
      }
    },

    // Storage Module (ImageKit Cloud / Local Fallback)
    '/storage/status': {
      get: {
        tags: ['Storage & Media (ImageKit)'],
        summary: 'Check whether ImageKit Cloud CDN is active or local disk fallback is running',
        responses: { 200: { description: 'Storage engine configuration and CDN status' } }
      }
    },
    '/storage/auth': {
      get: {
        tags: ['Storage & Media (ImageKit)'],
        summary: 'Generate client-side ImageKit upload parameters (signature, token, expire time)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Client-side upload authentication payload' } }
      }
    },
    '/storage/upload': {
      post: {
        tags: ['Storage & Media (ImageKit)'],
        summary: 'Direct upload endpoint supporting ImageKit CDN with automatic local fallback',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  folder: { type: 'string', example: '/campusflow-erp' },
                  tags: { type: 'string', example: 'syllabus,notes' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'File uploaded and CDN URL generated' } }
      }
    },

    // System Health Checks (Section 45)
    '/health': {
      get: {
        tags: ['System Health'],
        summary: 'Overall API Gateway health check',
        responses: { 200: { description: 'Gateway healthy' } }
      }
    },
    '/health/db': {
      get: {
        tags: ['System Health'],
        summary: 'PostgreSQL / Relational database connectivity check',
        responses: { 200: { description: 'Database operational' } }
      }
    },
    '/health/qdrant': {
      get: {
        tags: ['System Health'],
        summary: 'Qdrant vector engine connectivity check',
        responses: { 200: { description: 'Qdrant status' } }
      }
    },
    '/health/ai': {
      get: {
        tags: ['System Health'],
        summary: 'Python AI service and LLM connectivity check',
        responses: { 200: { description: 'AI service status' } }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] Interactive API documentation accessible at: http://localhost:5000/api-docs');
};

module.exports = { setupSwagger, swaggerDocument };
