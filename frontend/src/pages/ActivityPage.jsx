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

    fetch(`http://localhost:5000/api/activity?scope=${feedScope}`)
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
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setError('Failed to load activity feed.');
          setLoading(false);
        }, remainingTime);
      });
  }, [feedScope, loggedInUser.username]);

  const uniqueActivities = activities.filter((act, index, self) => {
    if (act.actionType !== 'friend_accepted' && act.actionType !== 'friend_removed') {
      return true;
    }
    const user1 = act.actor?.username;
    const user2 = act.targetFriend?.username;
    const pairKey = [user1, user2].sort().join('-') + '-' + act.actionType;
    return self.findIndex((other) => {
      if (other.actionType !== act.actionType) return false;
      const other1 = other.actor?.username;
      const other2 = other.targetFriend?.username;
      const otherPairKey = [other1, other2].sort().join('-') + '-' + other.actionType;
      return otherPairKey === pairKey;
    }) === index;
  });

  const displayedActivities = uniqueActivities.filter((item) => {
    if (filterType === 'posts') return item.actionType === 'created_post';
    if (filterType === 'albums') {
      return item.actionType === 'created_album' || item.actionType === 'added_to_album';
    }
    if (filterType === 'friends') {
      return item.actionType === 'friend_accepted' || item.actionType === 'friend_removed';
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
            <button
              type="button"
              className={`activity-filter-pill ${filterType === 'friends' ? 'active' : ''}`}
              onClick={() => setFilterType('friends')}
            >
              Friends
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