import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Register,
  Login,
  ReportIssue,
  Complaint,
  LostFound,
  Dashboard,
  Profile,
  Issues,
  Feed,
  PostDetail,
  MyIssues,
} from "./pages";

// Management - Admin
import IssuesAdmin from "./management/admin/IssuesAdmin";
import AdminAnnouncement from "./management/admin/AdminAnnouncement";
import AdminLost from "./management/admin/AdminLost";
import AdminCases from "./management/admin/AdminCases";

// Management - Caretaker
import Assignment from "./management/caretaker/Assignment";

// Layout & Auth
import AppLayout from "./layouts/AppLayout";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireAdmin } from "./auth/RequireAdmin";
import { RequireCaretaker } from "./auth/RequireCaretaker";

// UI Components
import { ErrorBoundary, NotFound } from "./UI/Glow";

// Caretaker Feed (read-only)
import CaretakerFeed from "./pages/Feed/CaretakerFeed";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public routes - no layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - with AppLayout */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            {/* Common Routes - All authenticated users */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/post/:type/:id" element={<PostDetail />} />
            <Route path="/feed/post/:id" element={<PostDetail />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/announcements" element={<Feed />} />
            <Route path="/lost-found" element={<LostFound />} />
            <Route path="/my-issues" element={<MyIssues />} />
            <Route path="/profile" element={<Profile />} />

            {/* Student-specific routes */}
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="/complaints" element={<Complaint />} />

            {/* Admin Routes */}
            <Route
              path="/admin/issues"
              element={
                <RequireAdmin>
                  <IssuesAdmin />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <RequireAdmin>
                  <AdminAnnouncement />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/lost"
              element={
                <RequireAdmin>
                  <AdminLost />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/cases"
              element={
                <RequireAdmin>
                  <AdminCases />
                </RequireAdmin>
              }
            />

            {/* Caretaker Routes */}
            <Route
              path="/caretaker/assignments"
              element={
                <RequireCaretaker>
                  <Assignment />
                </RequireCaretaker>
              }
            />
            <Route
              path="/caretaker/feed"
              element={
                <RequireCaretaker>
                  <CaretakerFeed />
                </RequireCaretaker>
              }
            />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
