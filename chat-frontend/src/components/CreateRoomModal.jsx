import { useState } from 'react';
import { createRoom } from '../api/client';

export default function CreateRoomModal({ friends, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);

  const toggleMember = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createRoom(name.trim(), selected);
    onCreated();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Create a room</h3>
        <input
          className="search-box"
          style={{ margin: '12px 0' }}
          placeholder="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="empty-hint" style={{ textAlign: 'left', padding: '4px 0' }}>
          Add friends (optional — you can approve join requests later too)
        </p>
        <div className="member-picker">
          {friends.length === 0 && <p className="empty-hint">No friends yet to add directly.</p>}
          {friends.map((f) => (
            <label key={f._id} className="member-row">
              <input
                type="checkbox"
                checked={selected.includes(f._id)}
                onChange={() => toggleMember(f._id)}
              />
              {f.nickname || f.name}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="logout-btn" onClick={onClose}>Cancel</button>
          <button className="join-btn" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}