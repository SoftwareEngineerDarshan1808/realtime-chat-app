import { useEffect, useState } from 'react';
import {
  getFriends,
  discoverUsers,
  sendFriendRequest,
  getIncomingRequests,
  respondToFriendRequest,
  getAllRooms,
  requestJoinRoom,
} from '../api/client';
import { useSocket } from '../context/useSocket';
import SettingsMenu from './SettingsMenu';
import CreateRoomModal from './CreateRoomModal';

export default function Sidebar({
  currentUser,
  setCurrentUser,
  onSelect,
  selected,
  onLogout,
}) {
  const [tab, setTab] = useState('personal');
  const [friends, setFriends] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [discoverList, setDiscoverList] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const { onlineUsers } = useSocket();
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeople, setShowPeople] = useState(true);
  const [showRoomsList, setShowRoomsList] = useState(true);
  const [showDiscoverPanel, setShowDiscoverPanel] = useState(false);

  useEffect(() => {
    refreshFriends();
    refreshRooms();
    refreshDiscover();
    refreshRequests();
  }, []);

  // close the discover panel and clear search whenever the tab changes,
  // so it doesn't stay open showing stale content from the previous tab
  useEffect(() => {
    setShowDiscoverPanel(false);
    setSearchQuery('');
  }, [tab]);

  const refreshFriends = () =>
    getFriends()
      .then((d) => setFriends(d.friends))
      .catch(() => {});
  const refreshDiscover = () =>
    discoverUsers()
      .then((d) => setDiscoverList(d.users))
      .catch(() => {});
  const refreshRequests = () =>
    getIncomingRequests()
      .then((d) => setRequests(d.requests))
      .catch(() => {});

  const refreshRooms = () =>
    getAllRooms()
      .then((d) => {
        setAllRooms(d.rooms);
        setJoinedRooms(d.rooms.filter((r) => r.status === 'joined'));
      })
      .catch(() => {});

  const handleAddFriend = async (userId) => {
    await sendFriendRequest(userId);
    refreshDiscover();
  };

  const handleRespond = async (fromUserId, action) => {
    await respondToFriendRequest(fromUserId, action);
    refreshRequests();
    refreshFriends();
    refreshDiscover();
  };

  const handleJoinRequest = async (roomId) => {
    await requestJoinRoom(roomId);
    refreshRooms();
  };

  const displayName = currentUser?.nickname || currentUser?.name;

  // non-friends only, used by the Personal tab's discover panel
  const nonFriends = discoverList.filter((u) => u.status !== 'friend');
  // unjoined rooms only, used by the Public tab's discover panel
  const unjoinedRooms = allRooms.filter((r) => r.status !== 'joined');

  const filteredPeople = discoverList.filter((u) =>
    (u.nickname || u.name).toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredRooms = allRooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // same filtering, scoped to non-friends/unjoined for Personal & Public panels
  const filteredNonFriends = nonFriends.filter((u) =>
    (u.nickname || u.name).toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredUnjoinedRooms = unjoinedRooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header profile-row">
        <div className="avatar">{displayName?.[0]?.toUpperCase()}</div>
        <div className="profile-name-static">{displayName}</div>
        <SettingsMenu
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onLogout={onLogout}
        />
      </div>

      <div className="tabs">
        <div
          className={`tab ${tab === 'personal' ? 'active' : ''}`}
          onClick={() => setTab('personal')}
        >
          Personal
        </div>
        <div
          className={`tab ${tab === 'public' ? 'active' : ''}`}
          onClick={() => setTab('public')}
        >
          Public
        </div>
        <div
          className={`tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All
          {requests.length > 0 && (
            <span className="badge">{requests.length}</span>
          )}
        </div>
      </div>

      <div className="conversation-list">
        {/* PERSONAL — friends only, direct messages */}
        {tab === 'personal' &&
          friends.map((u) => (
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
        {tab === 'personal' && friends.length === 0 && !showDiscoverPanel && (
          <p className="empty-hint">
            No friends yet — tap "Find People" below.
          </p>
        )}

        {/* Personal tab's discover panel, shown when the bottom button is toggled */}
        {tab === 'personal' && showDiscoverPanel && (
          <div className="discover-panel">
            <input
              className="search-box"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {filteredNonFriends.map((u) => (
              <div key={u._id} className="conversation-item">
                <div className="avatar">
                  {(u.nickname || u.name)[0].toUpperCase()}
                </div>
                <div className="conv-name">{u.nickname || u.name}</div>
                {u.status === 'none' && (
                  <button
                    className="join-btn"
                    onClick={() => handleAddFriend(u._id)}
                  >
                    Add Friend
                  </button>
                )}
                {u.status === 'requested' && (
                  <span className="pending-tag">Requested</span>
                )}
              </div>
            ))}
            {filteredNonFriends.length === 0 && (
              <p className="empty-hint">No matches.</p>
            )}
          </div>
        )}

        {/* PUBLIC — rooms you've already joined */}
        {tab === 'public' && (
          <button
            className="join-btn"
            style={{ margin: '12px 16px' }}
            onClick={() => setShowCreateRoom(true)}
          >
            + New Room
          </button>
        )}
        {tab === 'public' &&
          joinedRooms.map((r) => (
            <div
              key={r._id}
              className={`conversation-item ${selected?.id === r._id ? 'selected' : ''}`}
              onClick={() =>
                onSelect({
                  type: 'room',
                  id: r._id,
                  name: r.name,
                  isCreator: r.isCreator,
                  pendingCount: r.pendingCount,
                })
              }
            >
              <div className="avatar">{r.name[0].toUpperCase()}</div>
              <div>
                <div className="conv-name">{r.name}</div>
                <div className="conv-meta">{r.memberCount} members</div>
              </div>
            </div>
          ))}
        {tab === 'public' && joinedRooms.length === 0 && !showDiscoverPanel && (
          <p className="empty-hint">
            No rooms joined yet — tap "Find Rooms" below.
          </p>
        )}

        {/* Public tab's discover panel */}
        {tab === 'public' && showDiscoverPanel && (
          <div className="discover-panel">
            <input
              className="search-box"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {filteredUnjoinedRooms.map((r) => (
              <div key={r._id} className="conversation-item">
                <div className="avatar">{r.name[0].toUpperCase()}</div>
                <div>
                  <div className="conv-name">{r.name}</div>
                  <div className="conv-meta">{r.memberCount} members</div>
                </div>
                {r.status === 'not_joined' && (
                  <button
                    className="join-btn"
                    onClick={() => handleJoinRequest(r._id)}
                  >
                    Request
                  </button>
                )}
                {r.status === 'requested' && (
                  <span className="pending-tag">Pending</span>
                )}
              </div>
            ))}
            {filteredUnjoinedRooms.length === 0 && (
              <p className="empty-hint">No matches.</p>
            )}
          </div>
        )}

        {/* ALL — search box now only shows when the discover panel is toggled open, same pattern as Personal/Public */}
        {tab === 'all' && showDiscoverPanel && (
          <input
            className="search-box"
            placeholder="Search people or rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        )}
        {tab === 'all' && (
          <>
            <button
              className="join-btn"
              style={{ margin: '12px 16px' }}
              onClick={() => setShowFriendRequests((s) => !s)}
            >
              Friend Requests{requests.length > 0 && ` (${requests.length})`}
            </button>

            {showFriendRequests && (
              <>
                {requests.length === 0 && (
                  <p className="empty-hint">No pending requests.</p>
                )}
                {requests.map((r) => (
                  <div key={r.from._id} className="conversation-item">
                    <div className="avatar">
                      {(r.from.nickname || r.from.name)[0].toUpperCase()}
                    </div>
                    <div className="conv-name">
                      {r.from.nickname || r.from.name}
                    </div>
                    <button
                      className="join-btn"
                      onClick={() => handleRespond(r.from._id, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="logout-btn"
                      onClick={() => handleRespond(r.from._id, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                ))}
              </>
            )}

            <div
              className="section-label clickable"
              onClick={() => setShowPeople((s) => !s)}
            >
              People ({filteredPeople.length}){' '}
              {showPeople || searchQuery ? '▾' : '▸'}
            </div>
            {(showPeople || searchQuery) &&
              filteredPeople.map((u) => (
                <div key={u._id} className="conversation-item">
                  <div className="avatar">
                    {(u.nickname || u.name)[0].toUpperCase()}
                  </div>
                  <div className="conv-name">{u.nickname || u.name}</div>
                  {u.status === 'none' && (
                    <button
                      className="join-btn"
                      onClick={() => handleAddFriend(u._id)}
                    >
                      Add Friend
                    </button>
                  )}
                  {u.status === 'requested' && (
                    <span className="pending-tag">Requested</span>
                  )}
                  {u.status === 'friend' && (
                    <span className="pending-tag">Friends</span>
                  )}
                </div>
              ))}

            <div
              className="section-label clickable"
              onClick={() => setShowRoomsList((s) => !s)}
            >
              Rooms ({filteredRooms.length}){' '}
              {showRoomsList || searchQuery ? '▾' : '▸'}
            </div>
            {(showRoomsList || searchQuery) &&
              filteredRooms.map((r) => (
                <div key={r._id} className="conversation-item">
                  <div className="avatar">{r.name[0].toUpperCase()}</div>
                  <div>
                    <div className="conv-name">{r.name}</div>
                    <div className="conv-meta">{r.memberCount} members</div>
                  </div>
                  {r.status === 'not_joined' && (
                    <button
                      className="join-btn"
                      onClick={() => handleJoinRequest(r._id)}
                    >
                      Request
                    </button>
                  )}
                  {r.status === 'requested' && (
                    <span className="pending-tag">Pending</span>
                  )}
                  {r.status === 'joined' && (
                    <span className="pending-tag">Joined</span>
                  )}
                </div>
              ))}
          </>
        )}
      </div>

      {showCreateRoom && (
        <CreateRoomModal
          friends={friends}
          onClose={() => setShowCreateRoom(false)}
          onCreated={refreshRooms}
        />
      )}

      <div className="sidebar-footer">
        <button
          className="join-btn full-width"
          onClick={() => setShowDiscoverPanel((s) => !s)}
        >
          {tab === 'personal' && (showDiscoverPanel ? 'Close' : 'Find People')}
          {tab === 'public' && (showDiscoverPanel ? 'Close' : 'Find Rooms')}
          {/* CHANGED — button now reflects toggle state instead of a static label */}
          {tab === 'all' &&
            (showDiscoverPanel ? 'Close Search' : 'Search Everything')}
        </button>
      </div>
    </div>
  );
}
