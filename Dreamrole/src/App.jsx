import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import ResumeUploadPage from './pages/ResumeUploadPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import SkillExtractionPage from './pages/SkillExtractionPage'
import SkillGapPage from './pages/SkillGapPage'
import EvaluationTestPage from './pages/EvaluationTestPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RoadmapPage from './pages/RoadmapPage'
import MentorPage from './pages/MentorPage'
import ReportPage from './pages/ReportPage'
import ProgressPage from './pages/ProgressPage'
import InterviewPage from './pages/InterviewPage'
import MentorsDiscoverPage from './pages/MentorsDiscoverPage'
import MentorProfilePage from './pages/MentorProfilePage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="resume" element={<ResumeUploadPage />} />
            <Route path="role" element={<RoleSelectionPage />} />
            <Route path="skills" element={<SkillExtractionPage />} />
            <Route path="gap" element={<SkillGapPage />} />
            <Route path="test" element={<EvaluationTestPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="mentors" element={<MentorsDiscoverPage />} />
            <Route path="mentors/:id" element={<MentorProfilePage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="interview" element={<InterviewPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
