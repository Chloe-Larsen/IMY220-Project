import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostPreview from '../components/PostPreview';
import PostSkeleton from '../components/PostSkeleton';
import Filters from '../components/Filters';

export default function HomePage() {
  const [activeFeed, setActiveFeed] = useState('global');
  const [showFilters, setShowFilters] = useState(false);
  const [posts, setPosts] = useState([]);
  const [rawServerPosts, setRawServerPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const startTime = Date.now();

    fetch(`http://localhost:5000/api/posts?feed=${activeFeed}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const postList = Array.isArray(data) ? data : [];
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        
        setTimeout(() => {
          setPosts(postList);
          setRawServerPosts(postList);
          setLoading(false);
        }, remainingTime);
      })
      .catch(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setError('Failed to load feed from server.');
          setPosts([]);
          setRawServerPosts([]);
          setLoading(false);
        }, remainingTime);
      });
  }, [activeFeed]);

  const handleApplyFilters = (filters) => {
    let filtered = [...rawServerPosts];

    if (filters.tag) {
      filtered = filtered.filter((p) =>
        (p.hashtags || '').toLowerCase().includes(filters.tag.toLowerCase())
      );
    }

    if (filters.sortBy === 'likes') {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (filters.sortBy === 'comments') {
      filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
    }

    setPosts(filtered);
  };

  const handleResetFilters = () => {
    setPosts(rawServerPosts);
  };

  return (
    <div className="app-container home-desktop-screen">
      <Navigation isLoggedIn={true} />

      <div className="home-subbar">
        <div className="home-feed-toggle-group">
          <button
            className={`feed-switch-btn ${activeFeed === 'local' ? 'active' : ''}`}
            onClick={() => setActiveFeed('local')}
          >
            Local Feed
          </button>
          <span className="feed-switch-divider">|</span>
          <button
            className={`feed-switch-btn ${activeFeed === 'global' ? 'active' : ''}`}
            onClick={() => setActiveFeed('global')}
          >
            Global Feed
          </button>
        </div>

        <button
          className={`home-filters-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <Filters
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      )}

      <main className="home-post-grid-container">
        {loading && (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {error && !loading && (
          <p className="form-error-msg" style={{ gridColumn: '1 / -1', margin: '20px auto', maxWidth: '500px' }}>
            {error}
          </p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: '#7b8377' }}>
            No posts found in this feed.
          </p>
        )}

        {!loading && !error && posts.map((post, idx) => (
          <div 
            key={post.id} 
            className="post-card-animated-wrapper"
            style={{ animationDelay: `${idx * 0.15}s` }}
          >
            <PostPreview post={post} />
          </div>
        ))}
      </main>

      <Footer isLoggedIn={true} />
    </div>
  );
}