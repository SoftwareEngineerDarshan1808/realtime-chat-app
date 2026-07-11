import { useState } from 'react';
import { login } from '../api/client';

export default function Login({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Log in to keep the conversation going.</p>
        {error && <p style={{ color: '#e57373', fontSize: 13 }}>{error}</p>}
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Log in</button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          No account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={onGoToRegister}>Create one</span>
        </p>
      </form>
    </div>
  );
}