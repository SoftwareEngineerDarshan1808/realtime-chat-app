import { useState } from 'react';
import { updateNickname, updateTheme } from '../api/client';

const THEMES = ['dark', 'light', 'midnight', 'sunset'];

export default function SettingsMenu({ currentUser, setCurrentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(currentUser?.nickname || '');
  const [copied, setCopied] = useState(false);

  const saveNickname = async () => {
    const data = await updateNickname(nicknameInput.trim());
    setCurrentUser((prev) => {
      const updated = { ...prev, nickname: data.user.nickname };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
    setEditingNickname(false);
  };

  const handleThemeChange = async (theme) => {
    const data = await updateTheme(theme);
    setCurrentUser((prev) => {
      const updated = { ...prev, theme: data.theme };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const inviteLink = `${window.location.origin}/register?ref=${currentUser?.id}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="settings-wrapper">
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Settings">⚙️</button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="settings-dropdown">
            <div className="dropdown-section">
              <label className="dropdown-label">👤Nickname</label>
              {editingNickname ? (
                <input
                  className="nickname-input"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                  onBlur={saveNickname}
                  autoFocus
                />
              ) : (
                <div className="dropdown-value" onClick={() => setEditingNickname(true)}>
                  {currentUser?.nickname || currentUser?.name} <span className="edit-hint">edit</span>
                </div>
              )}
            </div>

            <div className="dropdown-section">
              <label className="dropdown-label">🎨Theme</label>
              <div className="theme-picker">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={`theme-swatch theme-${t} ${currentUser?.theme === t ? 'active' : ''}`}
                    onClick={() => handleThemeChange(t)}
                    title={t}
                  />
                ))}
              </div>
            </div>

            <div className="dropdown-section">
              <label className="dropdown-label">Invite a friend</label>
              <button className="join-btn full-width" onClick={copyInviteLink}>
                {copied ? 'Link copied!' : 'Copy invite link'}
              </button>
            </div>

            <div className="dropdown-section">
              <button className="logout-btn full-width" onClick={onLogout}>Logout</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}