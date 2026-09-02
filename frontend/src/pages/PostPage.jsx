import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import EditPost from '../components/EditPost';
import Comments from '../components/Comments';
import { FiHeart, FiClock, FiMoreHorizontal, FiEdit2, FiAlertCircle } from 'react-icons/fi';

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem('user')) || {
    id: '1',
    username: 'avian_chloe'
  };

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const startTime = Date.now();

    fetch(`http://localhost:5000/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then((data) => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setPost(data);
          setLikesCount(data.likes || 0);
          setLoading(false);
        }, remainingTime);
      })
      .catch(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setPost(null);
          setLoading(false);
        }, remainingTime);
      });
  }, [id]);
  
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isOwner =
    post && loggedInUser.username.toLowerCase() === post.username.toLowerCase();

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleReportPost = () => {
    setShowOptionsMenu(false);
    alert(`Report submitted for post #${id}. Our team will review it.`);
  };

  const handleSavePost = (updatedData) => {
    setPost((prev) => ({
      ...prev,
      caption: updatedData.caption,
      hashtags: updatedData.hashtags
    }));
    setIsEditingPost(false);
  };

  const handleAddComment = async (text) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          user: loggedInUser.username
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPost((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment]
        }));
      }
    } catch {
      const newComment = {
        id: Date.now(),
        user: loggedInUser.username,
        text
      };
      setPost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
    }
  };

  const renderHashtags = () => {
    if (!post?.hashtags) return null;
    const tags = Array.isArray(post.hashtags)
      ? post.hashtags
      : post.hashtags.trim().split(/\s+/);

    return tags.map((tag, idx) => {
      const cleanTag = tag.replace(/^#/, '');
      return (
        <button
          key={`${cleanTag}-${idx}`}
          type="button"
          className="hashtag-btn postpage-hashtag-btn"
          onClick={() => navigate(`/search?q=${encodeURIComponent(cleanTag)}`)}
        >
          #{cleanTag}
        </button>
      );
    });
  };

  if (loading) {
    return (
      <div className="app-container postpage-desktop-screen">
        <Navigation isLoggedIn={true} />
        <main className="postpage-desktop-split-layout">
          <div className="postpage-desktop-left-col">
            <div className="postpage-skeleton-box skeleton-shimmer" />
          </div>
          <div className="postpage-desktop-right-col">
            <div className="postpage-skeleton-line skeleton-shimmer" style={{ width: '60%', height: '32px' }} />
            <div className="postpage-skeleton-line skeleton-shimmer" style={{ width: '40%', height: '24px' }} />
            <div className="postpage-skeleton-line skeleton-shimmer" style={{ width: '90%', height: '80px', marginTop: '16px' }} />
          </div>
        </main>
        <Footer isLoggedIn={true} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="app-container postpage-desktop-screen">
        <Navigation isLoggedIn={true} />
        <main className="postpage-desktop-split-layout" style={{ justifyContent: 'center' }}>
          <div className="search-empty-state">
            <p className="empty-title">Post not found</p>
            <button
              type="button"
              className="wireframe-btn"
              onClick={() => navigate('/home')}
              style={{ marginTop: '16px' }}
            >
              Return Home
            </button>
          </div>
        </main>
        <Footer isLoggedIn={true} />
      </div>
    );
  }

  return (
    <div className="app-container postpage-desktop-screen">
      <Navigation isLoggedIn={true} />

      <main className="postpage-desktop-split-layout">        
        <div className="postpage-desktop-left-col">
          <div className="postpage-main-image-container">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.caption || 'Post image'}
                className="postpage-main-image"
              />
            ) : (
              <div className="postpage-image-placeholder" />
            )}
          </div>
        </div>
        
        <div className="postpage-desktop-right-col">
          <div className="postpage-sub-header">
            <div className="postpage-user-left">
              <button
                type="button"
                className="postpage-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                ←
              </button>
              <Link
                to={`/profile/${post.username}`}
                className="postpage-header-username"
              >
                @{post.username}
              </Link>
            </div>

            <div className="postpage-options-container" ref={menuRef}>
              <button
                type="button"
                className="postpage-options-btn"
                title="Post options"
                onClick={() => setShowOptionsMenu((prev) => !prev)}
              >
                <FiMoreHorizontal />
              </button>

              {showOptionsMenu && (
                <div className="postpage-dropdown-menu">
                  {isOwner ? (
                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        setIsEditingPost(true);
                      }}
                    >
                      <FiEdit2 className="dropdown-item-icon" />
                      <span>Edit Post</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dropdown-menu-item item-danger"
                      onClick={handleReportPost}
                    >
                      <FiAlertCircle className="dropdown-item-icon" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEditingPost ? (
            <EditPost
              post={post}
              onSave={handleSavePost}
              onCancel={() => setIsEditingPost(false)}
            />
          ) : (
            <>
              <div className="postpage-metrics-bar">
                <button
                  type="button"
                  className={`like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                >
                  <FiHeart className="heart-icon postpage-heart-icon" />
                  <span className="metric-number postpage-metric-num">
                    {likesCount} Likes
                  </span>
                </button>

                <span className="postpage-time-display">
                  <FiClock className="postpage-clock-icon" />
                  <strong>{post.timeAgo || 'Recent'}</strong>
                </span>
              </div>

              <div className="postpage-tags-list">{renderHashtags()}</div>
              <p className="postpage-caption-text">
                {post.caption || 'No description provided.'}
              </p>

              <hr className="post-card-divider" />
              
              <Comments
                comments={post.comments || []}
                onAddComment={handleAddComment}
              />
            </>
          )}
        </div>
      </main>

      <Footer isLoggedIn={true} />
    </div>
  );
}