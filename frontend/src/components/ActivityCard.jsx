import { Link, useNavigate } from 'react-router-dom';
import { FiClock, FiFolder, FiImage, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import Image from './Image';

export default function ActivityCard({ activity }) {
  const navigate = useNavigate();

  const actor = activity.actor || {};
  const post = activity.post || {};
  const album = activity.album || {};
  const friend = activity.targetFriend || {};

  const username = actor.username || 'unknown';
  const actionType = activity.actionType;
  const actorAvatar = actor.avatarUrl || '';
  const friendAvatar = friend.avatarUrl || '';


  const renderActionSubtitle = () => {
    switch (activity.actionType) {
      case 'created_album':
        return (
          <span className="activity-action-text">
            created album <strong>{album.name}</strong>
          </span>
        );
      case 'added_to_album':
        return (
          <span className="activity-action-text">
            added a photo to <strong>{album.name}</strong>
          </span>
        );
      case 'friend_accepted':
        return (
          <span className="activity-action-text">
            <strong>@{username}</strong> and{' '}
            <Link to={`/profile/${friend.username}`} className="activity-inline-link">
              @{friend.username || 'someone'}
            </Link>{' '}
            are now friends
          </span>
        );
      case 'friend_removed':
        return (
          <span className="activity-action-text">
            <strong>@{username}</strong> and{' '}
            <Link to={`/profile/${friend.username}`} className="activity-inline-link">
              @{friend.username || 'someone'}
            </Link>{' '}
            are no longer friends
          </span>
        );
      case 'created_post':
      default:
        return <span className="activity-action-text">shared a new sighting</span>;
    }
  };

  const renderMedia = () => {
    if (actionType === 'friend_accepted' || actionType === 'friend_removed') {
      const isAccepted = actionType === 'friend_accepted';
      return (
        <div
          className="post-image-container activity-friend-media-box"
          onClick={() => navigate(`/profile/${friend.username || username}`)}
          role="button"
          tabIndex={0}
        >
          <div className="activity-friend-pair">
            <div className="activity-avatar-slot">
              {actorAvatar  ? (
                <Image imageValue={actorAvatar} altText={username} className="activity-avatar-img" />
              ) : (
                <div className="activity-avatar-placeholder">
                  {(username[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <div className="activity-friend-link-icon">
              {isAccepted ? <FiUserPlus /> : <FiUserMinus />}
            </div>
            <div className="activity-avatar-slot">
              {friendAvatar   ? (
                <Image imageValue={friendAvatar } altText={username} className="activity-avatar-img" />
              ) : (
                <div className="activity-avatar-placeholder">
                  {(friend.username[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activity.actionType === 'added_to_album') {
      return (
        <div
          className="post-image-container activity-album-media-box"
          onClick={() => navigate(`/profile/${username}`)}
          role="button"
          tabIndex={0}
        >
          <div className="post-image-placeholder album-empty-placeholder">
            <FiFolder className="album-placeholder-icon" />
            <span className="album-placeholder-label">
              {album.name || 'Album'}
            </span>
          </div>
        </div>
      );
    }

    if (post.id) {
      return (
        <Link to={`/post/${post.id}`} className="post-image-container">
          {post.imageUrl ? (
            <Image
              imageValue={post.imageUrl}
              altText={post.caption || 'Activity photo'}
              className="post-photo-img"
            />
          ) : (
            <div className="post-image-placeholder" />
          )}
        </Link>
      );
    }
  };

  const renderHashtags = () => {
    const rawTags = post.hashtags;
    if (!rawTags) return null;
    const tagList = Array.isArray(rawTags) ? rawTags : rawTags.trim().split(/\s+/);

    return tagList.map((tag, index) => {
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      return (
        <button
          key={`${cleanTag}-${index}`}
          type="button"
          className="hashtag-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/search?q=${encodeURIComponent(cleanTag.replace(/^#/, ''))}`);
          }}
        >
          {cleanTag}
        </button>
      );
    });
  };

  const renderTypeBadge = () => {
    switch (actionType) {
      case 'created_album':
      case 'added_to_album':
        return (
          <>
            <FiFolder className="metric-icon" /> Album
          </>
        );
      case 'created_post':
        return (
          <>
            <FiImage className="metric-icon" /> Sighting
          </>
        );
      case 'friend_accepted':
        return (
          <>
            <FiUserPlus className="metric-icon" /> New Friend
          </>
        );
      case 'friend_removed':
        return (
          <>
            <FiUserMinus className="metric-icon" /> Unfriended
          </>
        );
      default:
        return (
          <>
            <FiImage className="metric-icon" /> Activity
          </>
        );
    }
  };

  return (
    <article className="feed-post-card">
      {

      }

      {renderMedia()}

      <div className="post-meta-details">
        <div className="post-tags-user-row">
          <div className="post-hashtags-container">
            {renderHashtags()}
          </div>
          <Link
            to={`/profile/${username}`}
            className="post-username-link"
          >
            @{username}
          </Link>
        </div>

        <div className="activity-caption-block">
          {renderActionSubtitle()}
          {actionType !== 'friend_accepted' && actionType !== 'friend_removed' && (
            <p className="post-description-text">
              {post.caption || (actionType === 'created_album'
                ? (album.name ? `New album: ${album.name}` : 'No description provided.')
                : 'No description provided.')}
            </p>
          )}
        </div>

        <hr className="post-card-divider" />

        <div className="post-stats-footer-row">
          <span className="post-comments-count-link activity-type-indicator">
            {renderTypeBadge()}
          </span>

          <div className="post-metrics-group">
            <div className="metric-item" title="Time of activity">
              <FiClock className="metric-icon" />
              <span className="metric-number">{activity.timeAgo || 'Just now'}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}