import { useEffect, useState } from 'react';
import { getRoomMembers, removeMember, addMember, getFriends } from '../api/client';

export default function RoomMembersModal({ roomId, currentUser, onClose, onMemberClick }) {
  const [members, setMembers] = useState([]);
  const [createdBy, setCreatedBy] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  useEffect(() => {
    loadMembers();
    getFriends().then((d) => setFriends(d.friends));
  }, [roomId]);

  const loadMembers = () => {
    getRoomMembers(roomId).then((d) => { setMembers(d.members); setCreatedBy(d.createdBy); });
  };

  const isCreator = createdBy === currentUser.id;

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await removeMember(roomId, userId);
    loadMembers();
  };

  const handleAdd = async (userId) => {
    await addMember(roomId, userId);
    loadMembers();
  };

  // friends who are NOT already members — the only people you can add
  const addableFriends = friends.filter(
    (f) => !members.some((m) => m._id === f._id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Members</h3>
        <div className="member-picker" style={{ marginTop: 12 }}>
          {members.map((m) => (
            <div key={m._id} className="conversation-item" style={{ padding: '8px 0' }}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                {(m.nickname || m.name)[0].toUpperCase()}
              </div>
              <div className="conv-name" style={{ cursor: 'pointer' }} onClick={() => onMemberClick(m)}>
                {m.nickname || m.name} {m._id === createdBy && <span className="pending-tag">Creator</span>}
              </div>
              {isCreator && m._id !== createdBy && (
                <button className="logout-btn" onClick={() => handleRemove(m._id)}>Remove</button>
              )}
            </div>
          ))}
        </div>

        {isCreator && (
          <>
            <button
              className="join-btn full-width"
              style={{ marginBottom: 12 }}
              onClick={() => setShowAddPanel((s) => !s)}
            >
              {showAddPanel ? 'Close' : '+ Add Member'}
            </button>

            {showAddPanel && (
              <div className="member-picker">
                {addableFriends.length === 0 && (
                  <p className="empty-hint">All your friends are already in this room.</p>
                )}
                {addableFriends.map((f) => (
                  <div key={f._id} className="conversation-item" style={{ padding: '8px 0' }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                      {(f.nickname || f.name)[0].toUpperCase()}
                    </div>
                    <div className="conv-name">{f.nickname || f.name}</div>
                    <button className="join-btn" onClick={() => handleAdd(f._id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button className="logout-btn full-width" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}