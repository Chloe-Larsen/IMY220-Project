import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Comments({ comments = [], onAddComment }) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(commentText.trim());
    setCommentText('');
  };

  return (
    <div className="postpage-comments-container">
      <h3 className="postpage-comments-heading">
        Comments ({comments.length})
      </h3>

      <div className="postpage-comments-scroller">
        {comments.length === 0 ? (
          <p className="postpage-no-comments">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} className="postpage-comment-item">
              <Link
                to={`/profile/${comment.user || 'observer'}`}
                className="postpage-comment-author"
              >
                @{comment.user || 'observer'}:
              </Link>
              <span className="postpage-comment-body"> {comment.text}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="postpage-add-comment-form">
        <input
          type="text"
          className="postpage-comment-input"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button
          type="submit"
          className="wireframe-btn postpage-comment-submit-btn"
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </form>
    </div>
  );
}