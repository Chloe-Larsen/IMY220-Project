import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostPreview from '../components/PostPreview';
import PostSkeleton from '../components/PostSkeleton';
import { FiSearch } from 'react-icons/fi';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchInput(queryParam);

    if (queryParam.trim()) {
      fetchSearchResults(queryParam.trim());
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [queryParam]);

  const fetchSearchResults = async (term) => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    const startTime = Date.now();

    // Strip leading # or @ so it doesn't break URL query strings
    const cleanTerm = term.replace(/^[#@]/, '').trim();

    try {
      const response = await fetch(
        `http://localhost:5000/api/posts?q=${encodeURIComponent(cleanTerm)}`
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      setTimeout(() => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      }, remainingTime);
    } catch {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      setTimeout(() => {
        setError('Could not connect to the search server.');
        setResults([]);
        setLoading(false);
      }, remainingTime);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmed.replace(/^[#@]/, '') });
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchParams({});
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="app-container search-desktop-screen">
      <Navigation isLoggedIn={true} search={true} />

      <main className="search-main-container">
        <section className="search-bar-section">
          <h1 className="search-page-title">Search & Explore</h1>

          <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
            <FiSearch className="search-input-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search by #hashtag, bird species, or @username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            {searchInput && (
              <button type="button" className="search-clear-btn" onClick={handleClear}>
                ✕
              </button>
            )}
            <button type="submit" className="wireframe-btn search-submit-btn">
              Search
            </button>
          </form>

          {queryParam && !loading && (
            <div className="search-status-bar">
              <span>
                Showing results for: <strong>"{queryParam}"</strong> ({results.length} found)
              </span>
            </div>
          )}
        </section>

        <section className="home-post-grid-container">
          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {error && !loading && (
            <p className="form-error-msg" style={{ gridColumn: '1 / -1', margin: '20px auto', maxWidth: '500px' }}>
              {error}
            </p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="search-empty-state">
              <p className="empty-title">No sightings found</p>
              <p className="empty-subtitle">Try searching for a different species, tag, or photographer handle.</p>
            </div>
          )}

          {!loading && !error && !hasSearched && (
            <div className="search-empty-state">
              <p className="empty-title">Start discovering</p>
              <p className="empty-subtitle">Enter a keyword or click on a hashtag to view matching bird sightings.</p>
            </div>
          )}

          {!loading && !error && results.map((post, idx) => (
            <div
              key={post.id}
              className="post-card-animated-wrapper"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <PostPreview post={post} />
            </div>
          ))}
        </section>
      </main>

      <Footer isLoggedIn={true} />
    </div>
  );
}