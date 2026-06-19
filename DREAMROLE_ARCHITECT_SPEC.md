# DreamRole: Senior Architect & Product Specification
**Version:** 2.0 (Production-Ready MVP)
**Focus:** Scalability, AI Agent Orchestration, and Strict Multi-Tenant Security.

---

## 🧩 1. Project Overview
**DreamRole** is a Career Intelligence Platform that utilizes AI to bridge the "Industry-Skill Gap." Unlike generic job boards, it provides a surgical analysis of a user's current readiness for a specific career path and generates a high-fidelity roadmap to bridge that gap.

- **Real-World Use Case:** A Junior Web Developer wants to transition into a "Senior DevOps Engineer" role. DreamRole analyzes their resume, identifies specifically what they lack (e.g., Kubernetes, CI/CD patterns), evaluates their theoretical knowledge through adaptive testing, and provides a project-based learning path.
- **Target Users:** College students, career switchers, and professionals aiming for role progression.

---

## 🎨 2. Frontend Architecture (Next.js)
We recommend **Next.js 14+ (App Router)** for its SSR capabilities (SEO for Landing Pages) and optimized routing.

### 📁 Recommended Folder Structure
```
dreamrole-frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/             # Auth Route Groups (Login/Signup)
│   │   ├── (dashboard)/        # Main App Route Groups
│   │   │   ├── workflow/       # Unified Stepper Flow
│   │   │   └── profile/        # User Profile
│   │   └── api/                # Client-Side API handlers
│   ├── components/
│   │   ├── ui/                 # Reusable Base Components (ShadcnUI)
│   │   ├── workflow/           # Steps (ResumeStep, AnalysisStep, etc.)
│   │   └── shared/             # Navbar, Footer, Sidebar
│   ├── context/
│   │   └── WorkflowContext.tsx # Global State for the 6-Step pipeline
│   ├── hooks/                  # Custom hooks (useAI, useUser)
│   └── lib/                    # Utils, Axios config
```

### 🔄 UI/UX Flow (Step-by-Step Workflow)
Instead of a fragmented sidebar, use a **Unified Progress Stepper**.
1. **Resume Upload**: Drag-drop PDF → Auto-trigger extraction.
2. **Dream Role Selection**: Search 320+ roles (Client-side filtering).
3. **Skill Extraction**: Visual "Skill Tags" (Editable by user).
4. **Skill Analysis**: Radial Gauges & Gap Lists.
5. **Evaluation Test**: 5-10 Adaptive MCQs.
6. **Career Roadmap**: Dynamic timeline with project links.

### 💾 State Management (Context API Example)
```typescript
// src/context/WorkflowContext.tsx
export const WorkflowProvider = ({ children }) => {
  const [data, setData] = useState({
    resumeText: "",
    skills: [],
    targetRole: null,
    analysis: null,
    testResults: null,
    currentStep: 1
  });

  const updateStep = (step, stepData) => {
    setData(prev => ({ ...prev, ...stepData, currentStep: step }));
  };

  return <WorkflowContext.Provider value={{ data, updateStep }}>{children}</WorkflowContext.Provider>;
};
```

---

## ⚙️ 3. Backend Architecture (Node.js/Express)
Adopt a **Controller-Service-Repository** pattern to decouple business logic from the HTTP layer.

### 📁 Folder Structure
```
dreamrole-backend/
├── src/
│   ├── controllers/      # Handle Request/Response
│   ├── services/         # Business Logic (AI Orchestrator)
│   ├── repositories/     # Database Queries (User Isolation here)
│   ├── models/           # DB Schemas
│   ├── middleware/       # Auth, Validation, Rate Limiting
│   └── routes/           # API Endpoints
```

### 🔑 Authentication Flow
- **Provider:** Google OAuth 2.0.
- **Session:** JWT stored in `HttpOnly` cookies.
- **Flow:** User signs in → Backend validates Google Token → Creates/finds User in DB → Issues JWT.

### 📝 Example Snippet (Service Layer)
```javascript
// src/services/AnalysisService.js
const analyzeSkillGap = async (userId, userSkills, targetRole) => {
  // 1. Fetch role-skills from Repository
  const roleData = await RoleRepository.findByName(targetRole);
  
  // 2. Business Logic: Detect Gaps
  const missing = roleData.skills.filter(s => !userSkills.includes(s));
  
  // 3. Save progress via Repository (ensuring User Isolation)
  return await AnalysisRepository.save(userId, { missing, roleData });
};
```

---

## 🗄️ 4. Database Schema (PostgreSQL)
**Justification:** Relational data is critical here. Skills, Users, and Evaluations have complex relationships that JSON/CSV cannot handle reliably at scale.

### 📊 Tables & Relationships
- **Users**: `id (UUID)`, `email`, `name`, `created_at`
- **Resumes**: `id`, `user_id (FK)`, `raw_text`, `file_url`, `version`
- **Skills**: `id`, `user_id (FK)`, `skill_name`, `proficiency`
- **Evaluations**: `id`, `user_id (FK)`, `role_id`, `score`, `questions_json`
- **Progress**: `id`, `user_id (FK)`, `current_stage`, `last_active`

### 🔒 User Isolation Logic
Every query **MUST** include `WHERE user_id = $1`.
```sql
-- Correct way to fetch a user's evaluations
SELECT * FROM evaluations WHERE user_id = 'user-uuid-here';
```

---

## 🤖 5. AI Multi-Agent System
We use an **Orchestrator Pattern** to manage multiple specialized agents.

| Agent | Purpose | Prompt Strategy |
| :--- | :--- | :--- |
| **Orchestrator** | Routes data between agents | Control flow, error handling |
| **Extraction Agent** | Resume -> Clean JSON Skills | "Extract skills as a JSON array from this text..." |
| **Analysis Agent** | Gap detection & Feedback | "Compare User A's skills with Role B. Return improvements." |
| **Interviewer** | Generate adaptive MCQs | "Generate 5 MCQs for [Skill] at [Proficiency] level." |

### 💬 Sample Prompt (Extraction Agent)
```text
Role: Expert IT Recruiter
Task: Extract technical and soft skills from the following resume text.
Format: JSON only: { "technical": [], "soft": [], "summary": "" }
Text: [RESUME_TEXT]
```

---

## 🔄 6. Workflow Design (The Pipeline)
1. **Ingest**: `POST /api/resume` -> Stores text in `Resumes` table.
2. **Process**: `POST /api/skills/extract` -> Updates `Skills` table.
3. **Analyze**: `POST /api/analysis` -> Compares against static Role DB -> Generates `Analysis` record.
4. **Evaluate**: `POST /api/test/generate` -> Creates entry in `Evaluations`.
5. **Output**: `GET /api/report` -> Aggregates all table data into a single JSON/PDF.

---

## 🔐 9. Security Fix (CRITICAL)
**The Bug:** State leakage between users.
**The Fix:** 
- **Backend:** Middleware injects `req.user.id` into all service calls.
- **Frontend:** Never store global user state in a static `current_user` object; always use authenticated hooks.

```javascript
// middleware/auth.js
const protect = (req, res, next) => {
  const token = req.cookies.jwt;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { id: decoded.userId }; // Global isolation point
  next();
};

// repository/progressRepository.js
const getProgress = (userId) => {
  return db.query('SELECT * FROM progress WHERE user_id = $1', [userId]); 
};
```

---

## 🚀 10. Advanced Features
- **AI Mock Interview:** Real-time speech-to-text interview simulations with instant scoring.
- **Gamification:** "Skill Levels" (Lvl 1-10) for each category to encourage learning.
- **Job Matching:** Integration with Adzuna or LinkedIn API to show real jobs matching the user's analyzed profile.

---

## 📁 12. Full Folder Structure
```
dreamrole-monorepo/
├── client/          # Next.js App
├── server/          # Node.js/Express
├── shared/          # Interfaces & Types
├── docker-compose.yml
└── README.md
```

---

## 👉 Architect's Summary: Priority Order
1. **DB Migration**: Move from `progress.json` to PostgreSQL (Supabase/Neon) to fix data isolation.
2. **Auth Integration**: Implement JWT/OAuth to secure the workflow.
3. **Unified Stepper**: Refactor the frontend into a single `WorkflowPage` with a centralized Context.
4. **Agent Orchestration**: Clean up the OpenAI calls into a dedicated `AiService`.

---
*Sign-off: DreamRole Senior Architect Spec V2.0*
