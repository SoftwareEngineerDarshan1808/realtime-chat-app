const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const StatusTicks = ({ status }) => {
  if (status === 'seen') return <span className="ticks seen">✓✓</span>;
  if (status === 'delivered') return <span className="ticks">✓✓</span>;
  return <span className="ticks">✓</span>;
};

export default function MessageBubble({ message, isMine, showName }) {
  return (
    <div className={`bubble-row ${isMine ? 'mine' : ''}`}>
      <div className={`bubble ${isMine ? 'mine' : 'received'}`}>
        {showName && <span className="sender-name">{message.senderName}</span>}
        {message.text}
        <div className="bubble-meta">
          <span className="time">{formatTime(message.createdAt)}</span>
          {isMine && message.status && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}