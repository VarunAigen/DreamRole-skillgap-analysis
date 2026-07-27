# DreamRole: AI-Driven Skill-Gap Analysis & Career Readiness Platform
**Final Year Project Synopsis & Technical Overview**

---

## 1. Project Overview
* **Project Title**: **DreamRole** — AI-Driven Skill-Gap Analysis & Career Readiness Platform
* **Domain**: Artificial Intelligence (AI) / Natural Language Processing (NLP) / HR & EdTech Systems
* **Architecture**: Microservice-ready REST API with Single-Page Application (SPA) Frontend

---

## 2. Problem Statement
College graduates and job seekers often struggle to align their academic skills with rapidly evolving industry job descriptions (JDs). Key challenges include:
1. **High ATS Rejection Rates**: Resumes are filtered out by Applicant Tracking Systems (ATS) due to missing technical keywords or uncalibrated formatting.
2. **Lack of Objective Skill-Gap Feedback**: Candidates do not know *which specific skills* or *project experiences* they lack for a target job role.
3. **Interview Anxiety & Poor Communication**: Traditional preparation lacks realistic technical and behavioral interview practice with instant, objective feedback.

---

## 3. Proposed System Solution
**DreamRole** provides an end-to-end, AI-powered platform that analyzes candidate resumes against target job descriptions, identifies skill gaps, simulates realistic video/speech interviews, and generates step-by-step career roadmaps.

---

## 4. Key Features & Functional Modules

| Module | Core Functionality & Technical Implementation |
| :--- | :--- |
| **1. Resume Skill Extractor** | Parses PDF/DOCX resumes using `pdf-parse`, extracts technical skills, tools, frameworks, and projects using OpenAI NLP models, normalizing variations (e.g., *"ReactJS"* → *"React"*). |
| **2. Rubric-Based JD Gap Analyzer** | Compares candidate resumes against target JDs using a weighted 4-tier rubric (Hard Reqs 40%, Core Tech 35%, Preferred 15%, Soft Skills 10%). Flags hard disqualifiers, detects matched/adjacent skills, and provides honesty-guarded suggestions. |
| **3. AI Video & Speech Interview Engine** | Simulates live technical & HR interviews using **OpenAI Whisper (`whisper-1`)** for 98%+ speech accuracy, **OpenAI TTS (`tts-1`)** for natural voice readout, and evaluates answers against the **STAR framework** (Situation, Task, Action, Result) with **HR Re-framed Model Answers**. |
| **4. Adaptive Assessment & Testing** | Dynamically generates multiple-choice questions (MCQs) specifically targeting the candidate's detected missing skills. |
| **5. Mentor & Analytics Dashboard** | Provides mentors/professors with student analytics: voice metrics (WPM, volume, pauses), overall readiness scores, and skill progression timelines. |

---

## 5. Technology Stack & System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                │
│        React.js (Vite) · Tailwind CSS · Lucide Icons · Recharts         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (Bearer Firebase Auth)
┌────────────────────────────────────▼────────────────────────────────────┐
│                            BACKEND LAYER                                │
│       Node.js · Express.js · Zod Validation · Express Rate Limit        │
└──────────────────┬─────────────────┬──────────────────┬─────────────────┘
                   │                 │                  │
┌──────────────────▼──┐   ┌──────────▼───────────┐   ┌──▼─────────────────┐
│     DATA STORE      │   │       AI ENGINE      │   │  REPORT GENERATOR  │
│  MongoDB (Mongoose) │   │ OpenAI GPT-4o-mini   │   │ Puppeteer-Core     │
│  Firebase Auth      │   │ Whisper-1 · TTS-1    │   │ Sparticuz/Chromium │
└─────────────────────┘   └──────────────────────┘   └────────────────────┘
```

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, WebAudio API, WebGL Face-API
* **Backend**: Node.js, Express.js, Mongoose (MongoDB Atlas), Firebase Admin SDK
* **AI Engine**: OpenAI API (`gpt-4o-mini`, `whisper-1`, `tts-1`)
* **Validation & Security**: Zod Schema Validation, Per-User Token Rate Limiting, Firebase JWT Auth

---

## 6. Novelty & System Innovations
1. **Honesty-Guarded AI Suggestions**: Unlike generic resume tools that fabricate experience, DreamRole explicitly frames missing skills as projects/courses to acquire rather than text to blindly paste.
2. **Hybrid Speech-to-Text Architecture**: Combines instant browser speech typing with server-side OpenAI Whisper API to eliminate misheard technical terms (*Kubernetes*, *PostgreSQL*, *CI/CD*).
3. **Structured STAR & HR Re-Framed Feedback**: Gives candidates exact re-framed answers showing how senior candidates structure responses for HR managers.
