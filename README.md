# DreamRole - AI-Powered Career Growth & Skill Gap Analysis Platform

DreamRole is an intelligent, AI-driven career development platform designed to bridge the gap between academic learning and industry expectations. It provides users with targeted skill gap analysis, personalized roadmaps, real-world mock interviews, and direct mentorship opportunities.

## The Problem We Are Solving

In today's fast-paced job market, candidates often struggle to understand exactly what skills are needed for their dream roles. Generic advice and bloated course curricula can be overwhelming. DreamRole tackles this by curating a precise dataset where each role is defined by only 6–8 essential, industry-required skills. By focusing strictly on these core competencies, we eliminate the noise and give users a clear, actionable path to employment.

## AI Models & Agent Architecture

DreamRole utilizes advanced LLMs (Large Language Models) to power its core features. The platform employs a multi-agent architecture where different AI models handle specific tasks to ensure optimal performance, accuracy, and latency.

- **Gemini 1.5 Flash**: 
  - **Resume Parsing & Skill Extraction Agent**: Handles the fast and efficient extraction of skills, education, and experience from user-uploaded resumes (PDFs).
  - **Skill Gap Analysis Agent**: Compares extracted skills against our curated role requirements to identify missing core skills and generate a match percentage.
  - **Roadmap Generation Agent**: Quickly generates personalized, step-by-step learning roadmaps based on the identified skill gaps.
  
- **Gemini 1.5 Pro**:
  - **Video Interview Agent (Mock Interviews)**: Powers the conversational AI for both technical and behavioral mock interviews. It handles complex context, evaluates user responses in real-time, and provides nuanced, constructive feedback and scoring.

## Key Features
- **Skill Gap Analysis**: Compares your resume and current skills to your dream role's curated requirements.
- **AI-Powered Video Interviews**: Simulates realistic technical and behavioral interviews using the Gemini 1.5 Pro model.
- **Mentor Connect**: Chat in real-time with industry professionals and mentors.
- **Mentor Dashboard**: Real mentors have dedicated dashboards to track mentees, view their profiles, and analyze their performance.
- **Admin Dashboard**: Comprehensive admin tools for user and mentor management, including adding real mentors to the platform.
- **Interactive Roadmaps & Progress Tracking**: Generates personalized learning paths based on identified skill gaps.
- **Dynamic Profiles**: Separate, detailed profiles for Users, Mentors, and Admins.

## Upcoming Feature: JD (Job Description) Matching with Resume

**Why we are including this:**
While matching against our curated 6-8 core skills provides an excellent foundation, real-world job postings often have specific, nuanced requirements. The upcoming **JD Matching** feature will allow users to paste a specific Job Description link or text. The AI will then dynamically compare the user's resume against that exact job posting, providing a highly tailored gap analysis and tailoring the mock interviews specifically for that single job application. This bridges the final gap between general role readiness and applying to a specific company.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB / SQLite
- **AI Integration**: Google Gemini API (Gemini 1.5 Flash & Gemini 1.5 Pro)

## Getting Started

1. Clone the repository
2. Install dependencies for the server and client:
   ```bash
   cd server && npm install
   cd ../Dreamrole && npm install
   ```
3. Set up environment variables in `server/.env` (You will need a Gemini API key)
4. Start the backend: `npm run dev` in the `server` directory
5. Start the frontend: `npm run dev` in the `Dreamrole` directory
