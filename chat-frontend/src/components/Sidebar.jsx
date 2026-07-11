import { useEffect, useState } from 'react';
import {
  getUsers,
  getAllRooms,
  requestJoinRoom,
  updateNickname,
} from '../api/client';
import { useSocket } from '../context/useSocket'; // FIXED — was '../context/SocketContext'
import CreateRoomModal from './CreateRoomModel'; // FIXED — capital C/R/M to match filename exactly

export default function Sidebar({
  currentUser,
  setCurrentUser,
  onSelect,
  selected,
  onLogout,
}) {
  const [tab, setTab] = useState('chats');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(
    currentUser?.nickname || '',
  );
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    getUsers()
      .then((d) => setUsers(d.users))
      .catch(() => {});
    refreshRooms();
  }, []);

  const refreshRooms = () =>
    getAllRooms()
      .then((d) => setRooms(d.rooms))
      .catch(() => {});

  const handleJoinRequest = async (roomId) => {
    await requestJoinRoom(roomId);
    refreshRooms();
  };

  const saveNickname = async () => {
    const data = await updateNickname(nicknameInput.trim());
    setCurrentUser((prev) => {
      const updated = { ...prev, nickname: data.user.nickname };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
    setEditingNickname(false);
  };

  const displayName = currentUser?.nickname || currentUser?.name;

  return (
    <div className="sidebar">
      <div className="sidebar-header profile-row">
        <div className="avatar">{displayName?.[0]?.toUpperCase()}</div>

        {editingNickname ? (
          <input
            className="nickname-input"
            value={nicknameInput}
            placeholder="Set a nickname"
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
            onBlur={saveNickname}
            autoFocus
          />
        ) : (
          <div
            className="profile-name"
            onClick={() => setEditingNickname(true)}
          >
            <span className="name-text">{displayName}</span>
            <span className="edit-hint">edit</span>
          </div>
        )}

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="tabs">
        <div
          className={`tab ${tab === 'chats' ? 'active' : ''}`}
          onClick={() => setTab('chats')}
        >
          Chats
        </div>
        <div
          className={`tab ${tab === 'rooms' ? 'active' : ''}`}
          onClick={() => setTab('rooms')}
        >
          Rooms
        </div>
      </div>
      <input className="search-box" placeholder="Search..." />

      <div className="conversation-list">
        {tab === 'rooms' && (
          <button
            className="join-btn"
            style={{ margin: '12px 16px' }}
            onClick={() => setShowCreateRoom(true)}
          >
            + New Room
          </button>
        )}
        {tab === 'chats' &&
          users.map((u) => (
            <div
              key={u._id}
              className={`conversation-item ${selected?.id === u._id ? 'selected' : ''}`}
              onClick={() =>
                onSelect({ type: 'dm', id: u._id, name: u.nickname || u.name })
              }
            >
              <div className="avatar">
                {(u.nickname || u.name)[0].toUpperCase()}
                {onlineUsers.includes(u._id) && <span className="online-dot" />}
              </div>
              <div>
                <div className="conv-name">{u.nickname || u.name}</div>
                <div className="conv-meta">
                  {onlineUsers.includes(u._id) ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))}

        {tab === 'rooms' &&
          rooms.map((r) => (
            <div
              key={r._id}
              className={`conversation-item ${selected?.id === r._id ? 'selected' : ''}`}
              onClick={() =>
                r.status === 'joined' &&
                onSelect({
                  type: 'room',
                  id: r._id,
                  name: r.name,
                  isCreator: r.isCreator, // FIXED — added, needed by ChatWindow header
                  pendingCount: r.pendingCount, // FIXED — added
                })
              }
            >
              <div className="avatar">{r.name[0].toUpperCase()}</div>
              <div>
                <div className="conv-name">{r.name}</div>
                <div className="conv-meta">{r.memberCount} members</div>
              </div>
              {r.status === 'not_joined' && (
                <button
                  className="join-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinRequest(r._id);
                  }}
                >
                  Request
                </button>
              )}
              {r.status === 'requested' && (
                <span className="pending-tag">Pending</span>
              )}
            </div>
          ))}
      </div>

      {showCreateRoom && (
        <CreateRoomModal
          friends={users}
          onClose={() => setShowCreateRoom(false)}
          onCreated={refreshRooms}
        />
      )}
    </div>
  );
}
