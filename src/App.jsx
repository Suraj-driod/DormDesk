import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
} from './pages';
import IssuesAdmin from './management/admin/IssuesAdmin';
import AdminAnnouncement from './management/admin/AdminAnnouncement';
import AdminLost from './management/admin/AdminLost';
import AdminCases from './management/admin/AdminCases';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - with AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/announcements" element={<Feed />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/complaints" element={<Complaint />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin routes */}
          <Route path="/admin/issues" element={<IssuesAdmin />} />
          <Route path="/admin/announcements" element={<AdminAnnouncement />} />
          <Route path="/admin/lost" element={<AdminLost />} />
          <Route path="/admin/cases" element={<AdminCases />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
