import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';
import { USER_ROLES } from '../utils/constants';

// Lazy load page components for better performance
// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

// Student Pages
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const ActivityList = lazy(() => import('../pages/student/ActivityList'));
const SpeakingSubmission = lazy(() => import('../pages/student/SpeakingSubmission'));
const WritingSubmission = lazy(() => import('../pages/student/WritingSubmission'));
const QuizSubmission = lazy(() => import('../pages/student/QuizSubmission'));
const SubmissionResults = lazy(() => import('../pages/student/SubmissionResults'));
const MyProgress = lazy(() => import('../pages/student/MyProgress'));
const StudentProfile = lazy(() => import('../pages/student/Profile'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('../pages/teacher/Dashboard'));
const ActivityManagement = lazy(() => import('../pages/teacher/ActivityManagement'));
const CreateActivity = lazy(() => import('../pages/teacher/CreateActivity'));
const RubricManagement = lazy(() => import('../pages/teacher/RubricManagement'));
const CreateRubric = lazy(() => import('../pages/teacher/CreateRubric'));
const PendingReviews = lazy(() => import('../pages/teacher/PendingReviews'));
const EvaluationReview = lazy(() => import('../pages/teacher/EvaluationReview'));
const StudentList = lazy(() => import('../pages/teacher/StudentList'));
const StudentDetail = lazy(() => import('../pages/teacher/StudentDetail'));
const TeacherAnalytics = lazy(() => import('../pages/teacher/TeacherAnalytics'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'));
const SystemAnalytics = lazy(() => import('../pages/admin/SystemAnalytics'));
const SubmissionAnalytics = lazy(() => import('../pages/admin/SubmissionAnalytics'));
const UserEngagement = lazy(() => import('../pages/admin/UserEngagement'));
const TeacherPerformance = lazy(() => import('../pages/admin/TeacherPerformance'));
const PerformanceDistribution = lazy(() => import('../pages/admin/PerformanceDistribution'));
const AIModelManagement = lazy(() => import('../pages/admin/AIModelManagement'));
const AnalyticsExport = lazy(() => import('../pages/admin/AnalyticsExport'));

/**
 * Loading Component
 * Shown while lazy-loaded components are loading
 */
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

/**
 * AppRoutes Component
 * Main routing configuration for the application
 * Includes all 28 pages with authentication and role-based access control
 */
const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Routes (Protected) */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <StudentDashboard />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/activities"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <ActivityList />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/activities/speaking/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <SpeakingSubmission />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/activities/writing/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <WritingSubmission />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/activities/quiz/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <QuizSubmission />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/submissions/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <SubmissionResults />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <MyProgress />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                  <StudentProfile />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Teacher Routes (Protected) */}
          <Route
            path="/teacher/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <TeacherDashboard />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/activities"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <ActivityManagement />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/activities/create"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <CreateActivity />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/rubrics"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <RubricManagement />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/rubrics/create"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <CreateRubric />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/reviews"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <PendingReviews />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/reviews/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <EvaluationReview />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <StudentList />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/students/:id"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <StudentDetail />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                  <TeacherAnalytics />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Admin Routes (Protected) */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminDashboard />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <UserManagement />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AuditLogs />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <SystemAnalytics />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics/submissions"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <SubmissionAnalytics />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics/engagement"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <UserEngagement />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics/teachers"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <TeacherPerformance />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics/performance"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <PerformanceDistribution />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/ai-models"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AIModelManagement />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics/export"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AnalyticsExport />
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
