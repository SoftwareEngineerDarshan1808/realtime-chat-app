import { sendFriendRequest } from '../api/client';

export default function UserProfileModal({ user, isFriend, onClose, onOpenChat, onFriendRequestSent }) {
  const displayName = user.nickname || user.name;

  const handleAddFriend = async () => {
    await sendFriendRequest(user._id);
    onFriendRequestSent?.();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-avatar">{displayName[0].toUpperCase()}</div>
        <h3>{displayName}</h3>
        {isFriend && user.email && <p className="profile-email">{user.email}</p>}

        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
          {isFriend ? (
            <button className="join-btn full-width" onClick={() => { onOpenChat(user); onClose(); }}>
              Open Chat
            </button>
          ) : (
            <button className="join-btn full-width" onClick={handleAddFriend}>
              Add Friend
            </button>
          )}
        </div>
        <button className="logout-btn full-width" style={{ marginTop: 8 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}