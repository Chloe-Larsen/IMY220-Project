export default function PostSkeleton() {
  return (
    <article className="feed-post-card skeleton-card" aria-hidden="true">
      <div className="post-image-placeholder skeleton-shimmer" />
      <div className="post-meta-details">
        <div className="post-tags-user-row">
          <div className="skeleton-line skeleton-shimmer" style={{ width: '35%', height: '16px' }} />
          <div className="skeleton-line skeleton-shimmer" style={{ width: '20%', height: '16px' }} />
        </div>
        <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: '18px', marginTop: '6px' }} />
        <hr className="post-card-divider" style={{ opacity: 0.2 }} />
        <div className="post-stats-footer-row">
          <div className="skeleton-line skeleton-shimmer" style={{ width: '25%', height: '16px' }} />
          <div className="skeleton-line skeleton-shimmer" style={{ width: '15%', height: '16px' }} />
        </div>
      </div>
    </article>
  );
}