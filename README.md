# DreamRole - AI-Powered Career Growth & Skill Gap Analysis Platform

Our system uses a curated dataset where each role contains only 6–8 core skills required in the industry. Users first select their domain and specific role, and the system performs role-specific skill gap analysis.

## Key Features
- **Skill Gap Analysis**: Compares your resume and current skills to your dream role's requirements.
- **AI-Powered Video Interviews**: Simulates realistic technical and behavioral interviews using the Gemini API.
- **Mentor Connect**: Chat in real-time with industry professionals and mentors.
- **Mentor Dashboard**: Real mentors have dedicated dashboards to track mentees, view their profiles, and analyze their performance.
- **Admin Dashboard**: Comprehensive admin tools for user and mentor management, including adding real mentors to the platform.
- **Interactive Roadmaps & Progress Tracking**: Generates personalized learning paths based on identified skill gaps.
- **Dynamic Profiles**: Separate, detailed profiles for Users, Mentors, and Admins.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB / SQLite
- **AI Integration**: Google Gemini API for interviews and skill extraction

## Getting Started

1. Clone the repository
2. Install dependencies for the server and client:
   ```bash
   cd server && npm install
   cd ../Dreamrole && npm install
   ```
3. Set up environment variables in `server/.env`
4. Start the backend: `npm run dev` in `server` directory
5. Start the frontend: `npm run dev` in `Dreamrole` directory
