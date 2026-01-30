import { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import ReportIssue from './pages/ReportIssue';
import Complaint from './pages/Complaint';
import LostFound from './pages/LostFound';
import PostDemo from './pages/PostDemo';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';    
import Issues from './pages/Issues/Issues';
import Feed from './pages/Feed/Feed';
import IssuesAdmin from './management/admin/IssuesAdmin';
import AdminAnnouncement from './management/admin/AdminAnnouncement';
import AdminLost from './management/admin/AdminLost';
import AdminCases from './management/admin/AdminCases';
import Responses from './management/admin/Responses';
import Assignment from './management/caretaker/Assignment';

function App() {
  const [page, setPage] = useState('register'); 

  if (page === 'login') {
    return <Login onNavigateToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <Register onNavigateToLogin={() => setPage('login')} />;
  }

  if (page === 'report') {
    return <ReportIssue />;
  }

  if (page === 'complaint') {
    return <Complaint />;
  }

  if (page === 'lostfound') {
    return <LostFound />;
  }

  if (page === 'postdemo') {
    return <PostDemo />;
  }
  
  if (page === 'dashboard') {
    return <Dashboard />;
  } 

  if (page === 'profile') {
    return <Profile  />;
  }

  if (page === 'issues') {
    return <Issues />;
  } 

  if (page === 'feed') {
    return <Feed />;
  }
 //ADMIN PAGES FROM HERE

  if(page === 'issuesadmin') {
    return <IssuesAdmin />;
  } 
  
  if(page === 'adminannouncement') {
    return <AdminAnnouncement />;
  } 

  if(page === 'adminlost') {
    return <AdminLost />;
  } 

  if(page === 'admincases') {
    return <AdminCases />;
  } 

  if(page === 'responses') {    
    return <Responses />;
  }

  if (page === 'assignment') {
    return <Assignment />;
  } 

  return <Register onNavigateToLogin={() => setPage('login')} />;
}

export default App;
