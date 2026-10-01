import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiClock } from 'react-icons/fi';
import Image from './Image';

export default function PostPreview({ post }) {
    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem('user'))
    const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
    const [likesCount, setLikesCount] = useState(post.likes ?? 0);

    useEffect(() => {
        setIsLiked(Boolean(post.isLiked));
        setLikesCount(post.likes ?? 0);
    }, [post.id, post.likes, post.isLiked]);

    const handleLikeClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();        
        const nextLikedState = !isLiked;
        setIsLiked(nextLikedState);
        setLikesCount((prev) => (nextLikedState ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const res = await fetch(`http://localhost:5000/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loggedInUser.username })
            });

            if (!res.ok) {
                throw new Error('Failed to update like status');
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
            setLikesCount((prev) => (nextLikedState ? Math.max(0, prev - 1) : prev + 1));
        }
    };

    const renderHashtags = () => {
        const rawTags = post.hashtags;
        const tagList = Array.isArray(rawTags) ? rawTags : rawTags.trim().split(/\s+/);

        return tagList.map((tag, index) => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            return (
                <button
                    key={`${cleanTag}-${index}`}
                    type="button"
                    className="hashtag-btn"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(cleanTag)}`)}
                >
                    {cleanTag}
                </button>
            );
        });
    };

    return (
        <article className="feed-post-card">
            <Link to={`/post/${post.id}`} className="post-image-container">
                {post.imageUrl ? (
                    <Image imageValue={post.imageUrl} alt={post.caption} className="post-photo-img" />
                ) : (
                    <div className="post-image-placeholder" />
                )}
            </Link>

            <div className="post-meta-details">
                <div className="post-tags-user-row">
                    <div className="post-hashtags-container">
                        {renderHashtags()}
                    </div>
                    <Link to={`/profile/${post.username}`} className="post-username-link">
                        @{post.username}
                    </Link>
                </div>

                <p className="post-description-text">{post.caption || 'Text Description'}</p>

                <hr className="post-card-divider" />

                <div className="post-stats-footer-row">
                    <Link to={`/post/${post.id}`} className="post-comments-count-link">
                        Comments ({post.comments?.length || 0})
                    </Link>

                    <div className="post-metrics-group">
                        <button
                            type="button"
                            className={`metric-item-btn like-btn ${isLiked ? 'liked' : ''}`}
                            onClick={handleLikeClick}
                            title={isLiked ? 'Unlike' : 'Like'}
                            aria-label={isLiked ? 'Unlike post' : 'Like post'}
                        >
                            <FiHeart className="metric-icon heart-icon" />
                            <span className="metric-number">{likesCount}</span>
                        </button>

                        <div className="metric-item" title="Time posted">
                            <FiClock className="metric-icon" />
                            <span className="metric-number">{post.timeAgo || '2h'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}