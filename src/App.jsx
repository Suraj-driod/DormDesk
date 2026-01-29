import { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import ReportIssue from './pages/ReportIssue';
import Complaint from './pages/Complaint';
import LostFound from './pages/LostFound';
import PostDemo from './pages/PostDemo';

function App() {
  const [page, setPage] = useState('postdemo'); // Changed default to show PostDemo

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

  return <Register onNavigateToLogin={() => setPage('login')} />;
}

export default App;
