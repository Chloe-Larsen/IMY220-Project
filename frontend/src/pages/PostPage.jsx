import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import EditPost from '../components/EditPost';
import Comments from '../components/Comments';
import { FiHeart, FiClock, FiMoreHorizontal, FiEdit2, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import Image from '../components/Image';
import ReportModal from '../components/ReportModal';

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
  const [showReportModal, setShowReportModal] = useState(false);
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

  const handleToggleLike = async () => {
    const nextLikedState = !isLiked;
    setIsLiked(nextLikedState);
    setLikesCount((prev) => (nextLikedState ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser.username })
      });

      if (!res.ok) {
        setIsLiked(!nextLikedState);
        setLikesCount((prev) => (nextLikedState ? prev - 1 : prev + 1));
      }

      const data = await res.json();
      if (typeof data.liked === 'boolean') {
        setIsLiked(data.liked);
      }
      if (typeof data.likesCount === 'number') {
        setLikesCount(data.likesCount);
      }
    } catch {
      setIsLiked(!nextLikedState);
      setLikesCount((prev) => (nextLikedState ? prev - 1 : prev + 1));
    }
  };

  const handleReportPost = () => {
    setShowOptionsMenu(false);
    setShowReportModal(true);
  };

  const handleSavePost = async (updatedData) => {
    try {
      await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch {
      // Local fallback
    }

    setPost((prev) => ({
      ...prev,
      caption: updatedData.caption,
      hashtags: updatedData.hashtags
    }));
    setIsEditingPost(false);
  };

  const handleDeletePost = async () => {
    setShowOptionsMenu(false);

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this sighting? This will remove all associated comments.'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        navigate('/home');
      } else {
        alert('Failed to delete the post. Please try again.');
      }
    } catch {
      navigate('/home');
    }
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

  const handleEditComment = async (commentId, newText) => {
    try {
      await fetch(`http://localhost:5000/api/posts/${id}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      });
    } catch {
    }

    setPost((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((c) =>
        c.id === commentId ? { ...c, text: newText } : c
      )
    }));
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await fetch(`http://localhost:5000/api/posts/${id}/comments/${commentId}`, {
        method: 'DELETE'
      });
    } catch {
    }

    setPost((prev) => ({
      ...prev,
      comments: (prev.comments || []).filter((c) => c.id !== commentId)
    }));
  };

  if (loading) {
    return (
      <div className="app-container postpage-desktop-screen">
        <Navigation  />
        <main className="postpage-desktop-split-layout">
          <div className="postpage-desktop-left-col">
            <div className="postpage-skeleton-box skeleton-shimmer" />
          </div>
          <div className="postpage-desktop-right-col">
            <div className="postpage-skeleton-line postpage-skeleton-title skeleton-shimmer" />
            <div className="postpage-skeleton-line postpage-skeleton-subtitle skeleton-shimmer" />
            <div className="postpage-skeleton-line postpage-skeleton-body skeleton-shimmer" />
          </div>
        </main>
        <Footer  />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="app-container postpage-desktop-screen">
        <Navigation  />
        <main className="postpage-desktop-split-layout postpage-empty-layout">
          <div className="search-empty-state">
            <p className="empty-title">Post not found</p>
            <button
              type="button"
              className="wireframe-btn postpage-return-btn"
              onClick={() => navigate('/home')}
            >
              Return Home
            </button>
          </div>
        </main>
        <Footer  />
      </div>
    );
  }

  return (
    <div className="app-container postpage-desktop-screen">
      <Navigation  />

      <main className="postpage-desktop-split-layout">
        <div className="postpage-desktop-left-col">
          <div className="postpage-main-image-container">
            {post.imageUrl ? (
              <Image
                imageValue={post.imageUrl}
                altText={post.caption || 'Post image'}
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
                    <>
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
                      <button
                        type="button"
                        className="dropdown-menu-item item-danger"
                        onClick={handleDeletePost}
                      >
                        <FiTrash2 className="dropdown-item-icon" />
                        <span>Delete Post</span>
                      </button>
                    </>
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
                currentUsername={loggedInUser.username}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
              />
            </>
          )}
        </div>
      </main>

      {showReportModal && (
        <ReportModal
          postId={id}
          onClose={() => setShowReportModal(false)}
          onSubmitSuccess={() => {
            setShowReportModal(false);
            alert(`Report submitted for post #${id}. Our team will review it.`);
          }}
        />
      )}

      <Footer  />
    </div>
  );
}