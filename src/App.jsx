import { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import ReportIssue from './pages/ReportIssue';
import Complaint from './pages/Complaint';
import LostFound from './pages/LostFound';

function App() {
  const [page, setPage] = useState('lostfound'); // Changed default to show ReportIssue

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

  return <Register onNavigateToLogin={() => setPage('login')} />;
}

export default App;
