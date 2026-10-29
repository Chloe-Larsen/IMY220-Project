import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostPreview from '../components/PostPreview';
import PostSkeleton from '../components/PostSkeleton';
import { FiSearch, FiUser, FiFolder, FiImage } from 'react-icons/fi';
import Image from '../components/Image';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState({ users: [], posts: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const fetchSearchResults = async (term, type) => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(term)}&type=${type}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch {      setError('Could not connect to the search server.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchInput(queryParam);

    if (queryParam.trim()) {
      fetchSearchResults(queryParam.trim(), typeParam);
    } else {
      setResults({ users: [], posts: [], albums: [] });
      setHasSearched(false);
    }
  }, [queryParam, typeParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmed, type: typeParam });
  };

  const handleTabChange = (newType) => {
    setSearchParams({ q: queryParam, type: newType });
  };

  const totalResults = results.users.length + results.posts.length + results.albums.length;

  return (
    <div className="app-container search-desktop-screen">
      <Navigation search={true} />

      <main className="search-main-container">
        <section className="search-bar-section">
          <h1 className="search-page-title">Search & Explore</h1>

          <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
            <FiSearch className="search-input-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search by name, username, email, #hashtag, album..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="wireframe-btn search-submit-btn">Search</button>
          </form>

          {hasSearched && (
            <div className="search-tabs">
              {['all', 'users', 'posts', 'albums'].map((tab) => (
                <button
                  key={tab}
                  className={`search-tab ${typeParam === tab ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="search-results-container">
          {loading && <PostSkeleton />}

          {error && <p className="form-error-msg">{error}</p>}

          {!loading && !error && hasSearched && totalResults === 0 && (
            <div className="search-empty-state">
              <p className="empty-title">No results found</p>
              <p className="empty-subtitle">Try a different name, tag, or keyword.</p>
            </div>
          )}

          {!loading && (typeParam === 'all' || typeParam === 'users') && results.users.length > 0 && (
            <div className="search-section">
              <h2 className="search-section-title">Users</h2>
              <div className="search-user-grid">
                {results.users.map(u => (
                  <Link to={`/profile/${u.username}`} key={u.id} className="search-user-card">
                    <div className="search-avatar">
                      {u.avatarUrl ? <Image imageValue={u.avatarUrl} altText={u.username} /> : <FiUser />}
                    </div>
                    <div className="search-user-info">
                      <span className="search-user-name">{u.name} {u.surname}</span>
                      <span className="search-user-handle">@{u.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && (typeParam === 'all' || typeParam === 'posts') && results.posts.length > 0 && (
            <div className="search-section">
              <h2 className="search-section-title">Posts</h2>
              <div className="home-post-grid-container">
                {results.posts.map(post => (
                  <PostPreview key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {!loading && (typeParam === 'all' || typeParam === 'albums') && results.albums.length > 0 && (
            <div className="search-section">
              <h2 className="search-section-title">Albums</h2>
              <div className="search-album-grid">
                {results.albums.map(album => (
                  <Link to={`/profile/${album.username}`} key={album.id} className="search-album-card">
                    <div className="search-album-icon"><FiFolder /></div>
                    <div className="search-album-info">
                      <span className="search-album-name">{album.name}</span>
                      <span className="search-album-meta">@{album.username} • {album.photoCount} photos</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
}