import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { SocketProvider } from './context/SocketContext';
import './index.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('login');

  const handleLogin = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u)); // NEW — persist user too
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSelected(null);
    setView('login');
  };

  if (!token) {
    return view === 'login' ? (
      <Login onLogin={handleLogin} onGoToRegister={() => setView('register')} />
    ) : (
      <Register onRegistered={() => setView('login')} />
    );
  }

  return (
    <SocketProvider token={token}>
      <div className="app-shell">
        <Sidebar
          currentUser={user}
          setCurrentUser={setUser}
          selected={selected}
          onSelect={setSelected}
          onLogout={handleLogout}
        />{' '}
        <ChatWindow
          conversation={selected}
          currentUser={user}
          onLeaveRoom={() => setSelected(null)}
        />
      </div>
    </SocketProvider>
  );
}
