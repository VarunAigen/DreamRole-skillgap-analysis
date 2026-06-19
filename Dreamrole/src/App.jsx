import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import WorkflowPage from './pages/WorkflowPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RoadmapPage from './pages/RoadmapPage'
import MentorPage from './pages/MentorPage'
import ReportPage from './pages/ReportPage'
import ProgressPage from './pages/ProgressPage'
import InterviewPage from './pages/InterviewPage'
import VideoInterviewPage from './pages/VideoInterviewPage'
import InterviewHistoryPage from './pages/InterviewHistoryPage'
import MentorsDiscoverPage from './pages/MentorsDiscoverPage'
import MentorProfilePage from './pages/MentorProfilePage'
import MentorAnalyticsDashboard from './pages/MentorAnalyticsDashboard'
import ProfilePage from './pages/ProfilePage'
import MentorDashboard from './pages/MentorDashboard'
import ChatPage from './pages/ChatPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminPage /></RoleProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="workflow" element={<WorkflowPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="mentors" element={<MentorsDiscoverPage />} />
            <Route path="mentors/:id" element={<MentorProfilePage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="interview" element={<InterviewPage />} />
            <Route path="video-interview" element={<VideoInterviewPage />} />
            <Route path="interview-history" element={<InterviewHistoryPage />} />
            <Route path="mentor-analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'mentor']}><MentorAnalyticsDashboard /></RoleProtectedRoute>} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="mentor-dashboard" element={<RoleProtectedRoute allowedRoles={['admin', 'mentor']}><MentorDashboard /></RoleProtectedRoute>} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
