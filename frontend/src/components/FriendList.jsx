import { useNavigate } from 'react-router-dom';

export default function FriendList({ friends = [], onBack }) {
  const navigate = useNavigate();

  return (
    <div className="friendlist-view-container">
      <div className="friendlist-header">
        <button
          type="button"
          className="signup-back-arrow friendlist-back-btn"
          onClick={onBack}
          aria-label="Back to profile"
        >
          ←
        </button>
        <h2 className="friendlist-title">Friends ({friends.length})</h2>
      </div>

      <div className="friendlist-items-stack">
        {friends.length === 0 ? (
          <p className="friendlist-empty-msg">No friends to display.</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friendlist-card">
              <div className="friendlist-card-details">
                <span className="friendlist-card-name">{friend.name}</span>
                <span className="friendlist-card-handle">@{friend.username}</span>
              </div>
              <button
                type="button"
                className="wireframe-btn friendlist-view-btn"
                onClick={() => {
                  onBack();
                  navigate(`/profile/${friend.username || friend.id}`);
                }}
              >
                View Profile
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}