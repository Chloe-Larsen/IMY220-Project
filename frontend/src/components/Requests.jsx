import { useNavigate } from 'react-router-dom';

export default function Requests({ requests = [], onAccept, onDecline, onBack }) {
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
        <h2 className="friendlist-title">Friend Requests ({requests.length})</h2>
      </div>

      <div className="friendlist-items-stack">
        {requests.length === 0 ? (
          <p className="friendlist-empty-msg">No pending friend requests.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="friendlist-card">
              <div
                className="friendlist-card-details"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onBack();
                  navigate(`/profile/${req.username || req.id}`);
                }}
              >
                <span className="friendlist-card-name">{req.name}</span>
                <span className="friendlist-card-handle">@{req.username}</span>
              </div>

              <div className="request-actions-row">
                <button
                  type="button"
                  className="wireframe-btn request-accept-btn"
                  onClick={() => onAccept && onAccept(req.id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="request-decline-btn"
                  onClick={() => onDecline && onDecline(req.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}