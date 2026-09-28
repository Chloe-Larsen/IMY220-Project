import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

export default function Comments({
  comments = [],
  currentUsername = '',
  onAddComment,
  onEditComment,
  onDeleteComment
}) {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(commentText.trim());
    setCommentText('');
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = (commentId) => {
    if (!editText.trim()) return;
    onEditComment(commentId, editText.trim());
    setEditingCommentId(null);
    setEditText('');
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
          comments.map((comment, index) => {
            const commentId = comment.id || index;
            const author = comment.user || 'observer';
            const isOwner =
              currentUsername &&
              author.toLowerCase() === currentUsername.toLowerCase();
            const isEditing = editingCommentId === commentId;

            return (
              <div key={commentId} className="postpage-comment-item">
                <div className="comment-content-area">
                  <Link
                    to={`/profile/${author}`}
                    className="postpage-comment-author"
                  >
                    @{author}:
                  </Link>

                  {isEditing ? (
                    <div className="comment-inline-edit-box">
                      <input
                        type="text"
                        className="comment-edit-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <div className="comment-inline-actions">
                        <button
                          type="button"
                          className="comment-icon-btn save-btn"
                          title="Save comment"
                          onClick={() => handleSaveEdit(commentId)}
                        >
                          <FiCheck />
                        </button>
                        <button
                          type="button"
                          className="comment-icon-btn cancel-btn"
                          title="Cancel edit"
                          onClick={handleCancelEdit}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="postpage-comment-body"> {comment.text}</span>
                  )}
                </div>

                {isOwner && !isEditing && (
                  <div className="comment-actions-bar">
                    <button
                      type="button"
                      className="comment-action-btn"
                      title="Edit comment"
                      onClick={() => handleStartEdit(comment)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="comment-action-btn delete-btn"
                      title="Delete comment"
                      onClick={() => onDeleteComment(commentId)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleCreateSubmit} className="postpage-add-comment-form">
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