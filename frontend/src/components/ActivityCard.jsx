import { Link, useNavigate } from 'react-router-dom';
import { FiClock, FiFolder, FiImage } from 'react-icons/fi';
import Image from './Image';

export default function ActivityCard({ activity }) {
  const navigate = useNavigate();

  const renderActionSubtitle = () => {
    switch (activity.actionType) {
      case 'created_album':
        return (
          <span className="activity-action-text">
            created album <strong>{activity.albumName}</strong>
          </span>
        );
      case 'added_to_album':
        return (
          <span className="activity-action-text">
            added {activity.photoCount || 1} {activity.photoCount === 1 ? 'photo' : 'photos'} to{' '}
            <strong>{activity.albumName}</strong>
          </span>
        );
      case 'created_post':
      default:
        return <span className="activity-action-text">shared a new sighting</span>;
    }
  };

  const renderMedia = () => {
    if (activity.actionType === 'created_album' || activity.actionType === 'added_to_album') {
      const images = activity.images || [];
      return (
        <div
          className="post-image-container activity-album-media-box"
          onClick={() => navigate(`/profile/${activity.username}`)}
        >
          {images.length > 0 ? (
            <div className="activity-multi-photo-grid">
              {images.slice(0, 2).map((img, idx) => (
                <div key={idx} className="activity-photo-cell">
                  <Image imageValue={img} altText="Album photo" className="post-photo-img" />
                </div>
              ))}
            </div>
          ) : (
            <div className="post-image-placeholder album-empty-placeholder">
              <FiFolder className="album-placeholder-icon" />
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Link to={`/post/${activity.targetId}`} className="post-image-container">
        {activity.imageUrl ? (
          <Image
            imageValue={activity.imageUrl}
            altText={activity.caption || 'Activity photo'}
            className="post-photo-img"
          />
        ) : (
          <div className="post-image-placeholder" />
        )}
      </Link>
    );
  };

  const renderHashtags = () => {
    const rawTags = activity.hashtags;
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

  return (
    <article className="feed-post-card">
      {renderMedia()}

      <div className="post-meta-details">
        <div className="post-tags-user-row">
          <div className="post-hashtags-container">
            {renderHashtags()}
          </div>
          <Link
            to={`/profile/${activity.username}`}
            className="post-username-link"
          >
            @{activity.username}
          </Link>
        </div>

        <div className="activity-caption-block">
          {renderActionSubtitle()}
          <p className="post-description-text">
            {activity.caption || 'No description provided.'}
          </p>
        </div>

        <hr className="post-card-divider" />

        <div className="post-stats-footer-row">
          <span className="post-comments-count-link activity-type-indicator">
            {activity.actionType === 'created_post' ? (
              <>
                <FiImage className="metric-icon" /> Sighting
              </>
            ) : (
              <>
                <FiFolder className="metric-icon" /> Album
              </>
            )}
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