import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostSkeleton from '../components/PostSkeleton';
import ActivityCard from '../components/ActivityCard';

export default function ActivityPage() {
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const [feedScope, setFeedScope] = useState('local');
  const [filterType, setFilterType] = useState('all');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const startTime = Date.now();

    const endpoint = feedScope === 'local'
      ? `http://localhost:5000/api/activities?feed=local&user=${encodeURIComponent(loggedInUser.username)}`
      : `http://localhost:5000/api/activities?feed=global`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setActivities(list);
          setLoading(false);
        }, remainingTime);
      })
      .catch(() => {
      });
  }, [feedScope, loggedInUser.username]);

  const displayedActivities = activities.filter((item) => {
    if (filterType === 'posts') return item.actionType === 'created_post';
    if (filterType === 'albums') {
      return item.actionType === 'created_album' || item.actionType === 'added_to_album';
    }
    return true;
  });

  return (
    <div className="app-container home-desktop-screen">
      <Navigation isActivity={true} />

      <main className="activity-page-main">
        <div className="home-subbar">
          <div className="home-feed-toggle-group">
            <button
              type="button"
              className={`feed-switch-btn ${feedScope === 'local' ? 'active' : ''}`}
              onClick={() => setFeedScope('local')}
            >
              Local Activity
            </button>
            <span className="feed-switch-divider">|</span>
            <button
              type="button"
              className={`feed-switch-btn ${feedScope === 'global' ? 'active' : ''}`}
              onClick={() => setFeedScope('global')}
            >
              Global Activity
            </button>
          </div>

          <div className="activity-type-filters">
            <button
              type="button"
              className={`activity-filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`activity-filter-pill ${filterType === 'posts' ? 'active' : ''}`}
              onClick={() => setFilterType('posts')}
            >
              Posts
            </button>
            <button
              type="button"
              className={`activity-filter-pill ${filterType === 'albums' ? 'active' : ''}`}
              onClick={() => setFilterType('albums')}
            >
              Albums
            </button>
          </div>
        </div>

        <section className="home-post-grid-container">
          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {error && !loading && (
            <p className="form-error-msg">{error}</p>
          )}

          {!loading && !error && displayedActivities.length === 0 && (
            <p className="profile-no-posts-text">
              No recent activity found in this feed.
            </p>
          )}

          {!loading &&
            !error &&
            displayedActivities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}