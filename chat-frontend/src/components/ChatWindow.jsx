import { useEffect, useRef, useState } from 'react';
import {
  getConversation,
  getRoomMessages,
  getPendingRoomRequests,
  respondToRoomRequest,
  leaveRoom,
} from '../api/client';
import { useSocket } from '../context/useSocket';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ conversation, currentUser, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [text, setText] = useState('');
  const { socket, onlineUsers } = useSocket();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation || !currentUser) return;
    setMessages([]);
    setShowRequests(false);
    setPendingRequests([]);

    const load = async () => {
      if (conversation.type === 'dm') {
        const data = await getConversation(conversation.id);
        setMessages(
          data.messages.map((m) => ({
            text: m.text,
            senderName: m.sender.nickname || m.sender.name,
            senderId: m.sender._id,
            isMine: m.sender._id === currentUser.id,
            status: m.status,
            createdAt: m.createdAt,
          })),
        );
        // tell server we've now seen everything from this person
        socket.emit('mark seen', { otherUserId: conversation.id });
      } else {
        socket.emit('join room', conversation.id);
        const data = await getRoomMessages(conversation.id);
        setMessages(
          data.messages.map((m) => ({
            text: m.text,
            senderName: m.sender.name,
            senderId: m.sender._id,
            isMine: m.sender._id === currentUser.id,
            createdAt: m.createdAt,
          })),
        );
      }
    };
    load();
  }, [conversation, currentUser]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handlePrivate = (msg) => {
      if (
        conversation?.type === 'dm' &&
        (msg.sender === conversation.id || msg.sender === currentUser.id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: msg._id,
            text: msg.text,
            senderName: msg.senderName,
            senderId: msg.sender,
            isMine: msg.sender === currentUser.id,
            status: msg.status,
            createdAt: msg.createdAt,
          },
        ]);

        if (msg.sender === conversation.id) {
          socket.emit('mark seen', { otherUserId: conversation.id });
        }
      }
    };

    const handleRoom = (msg) => {
      if (conversation?.type === 'room' && msg.roomId === conversation.id) {
        setMessages((prev) => [
          ...prev,
          {
            _id: msg._id,
            text: msg.text,
            senderName: msg.senderName,
            senderId: msg.sender,
            isMine: msg.sender === currentUser.id,
            status: msg.status,
            createdAt: msg.createdAt,
          },
        ]);
      }
    };

    //a message I sent got delivered (receiver came online)
    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: 'delivered' } : m,
        ),
      );
    };

    //the other person just saw all my messages in this chat
    const handleSeen = ({ by }) => {
      if (conversation?.type === 'dm' && by === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.isMine ? { ...m, status: 'seen' } : m)),
        );
      }
    };

    socket.on('private message', handlePrivate);
    socket.on('room message', handleRoom);
    socket.on('message delivered', handleDelivered);
    socket.on('messages seen', handleSeen);
    return () => {
      socket.off('private message', handlePrivate);
      socket.off('room message', handleRoom);
      socket.off('message delivered', handleDelivered);
      socket.off('messages seen', handleSeen);
    };
  }, [socket, conversation, currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    if (conversation.type === 'dm') {
      socket.emit('private message', { receiverId: conversation.id, text });
    } else {
      socket.emit('room message', { roomId: conversation.id, text });
    }
    setText('');
  };

  const loadPendingRequests = async () => {
    try {
      const data = await getPendingRoomRequests(conversation.id);
      setPendingRequests(data.requests);
      setShowRequests(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRespond = async (userId, action) => {
    await respondToRoomRequest(conversation.id, userId, action);
    loadPendingRequests(); // refresh the list after accepting/declining
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm(`Leave "${conversation.name}"?`)) return;

    try {
      const data = await leaveRoom(conversation.id);
      alert(data.message); // shows either "Left the room" or the creator-restriction message
      onLeaveRoom?.(); // tell the parent to clear selection + refresh room list
    } catch (err) {
      alert(err.message);
    }
  };

  if (!conversation) {
    return (
      <div className="empty-state">
        <h2>Pick a conversation</h2>
        <p>Select a chat or room from the left to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="avatar">{conversation.name[0].toUpperCase()}</div>
        <div>
          <div className="name">{conversation.name}</div>
          {conversation.type === 'dm' && (
            <div className="status">
              {onlineUsers.includes(conversation.id) ? 'Online' : 'Offline'}
            </div>
          )}
        </div>
        {conversation.type === 'room' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {conversation.isCreator && (
              <button className="join-btn" onClick={loadPendingRequests}>
                ...
              </button>
            )}
            <button className="logout-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
          </div>
        )}
        
      </div>

      {conversation.type === 'room' && showRequests && (
        <div className="requests-panel">
          {pendingRequests.length === 0 && (
            <p className="empty-hint">No pending requests.</p>
          )}
          {pendingRequests.map((r) => (
            <div key={r.user._id} className="conversation-item">
              <div className="avatar">{r.user.name[0].toUpperCase()}</div>
              <div className="conv-name">{r.user.name}</div>
              <button
                className="join-btn"
                onClick={() => handleRespond(r.user._id, 'accept')}
              >
                Accept
              </button>
              <button
                className="logout-btn"
                onClick={() => handleRespond(r.user._id, 'decline')}
              >
                Decline
              </button>
            </div>
          ))}
          <button
            className="logout-btn"
            style={{ margin: '8px 24px' }}
            onClick={() => setShowRequests(false)}
          >
            Close
          </button>
        </div>
      )}

      <div className="messages-area">
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m}
            isMine={m.isMine}
            showName={conversation.type === 'room' && !m.isMine}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-bar">
        <input
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
}
