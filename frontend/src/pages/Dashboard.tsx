import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import successAnim from '../assets/lottie/success.json';
import SubjectsPage from './SubjectsPage';
import { useEventStream } from '../hooks/useEventStream';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  useEventStream();
  const nav = useNavigate();
  return (
    <div>
      <nav className="navbar">
        <div style={{ fontWeight:700 }}>Tuition Center</div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <span>{user?.firstName} ({user?.role})</span>
          <button className="button" onClick={()=>{ logout(); nav('/login'); }}>Logout</button>
        </div>
      </nav>
      <main style={{ padding:'1.5rem' }} className="grid">
        <div className="card">
          <h3>Welcome back</h3>
          <p>This is an initial dashboard placeholder. More modules will appear here.</p>
          <div style={{ width:180 }}>
            <Lottie animationData={successAnim} loop />
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link to="subjects" className="button" style={{ textDecoration:'none' }}>Subjects</Link>
            <Link to="classes" className="button" style={{ textDecoration:'none' }}>Classes</Link>
            <Link to="students" className="button" style={{ textDecoration:'none' }}>Students</Link>
            <Link to="exams" className="button" style={{ textDecoration:'none' }}>Exams</Link>
            <Link to="homework" className="button" style={{ textDecoration:'none' }}>Homework</Link>
          </div>
        </div>
      </main>
      <Routes>
        <Route path="subjects" element={<SubjectsPage />} />
      </Routes>
    </div>
  );
};

export default Dashboard;
