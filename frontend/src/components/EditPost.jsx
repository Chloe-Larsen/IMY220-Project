import { useState } from 'react';

export default function EditPost({ post, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    caption: post?.caption || '',
    hashtags: post?.hashtags || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="postpage-edit-form" onSubmit={handleSubmit}>
      <h3 className="postpage-comments-heading">Edit Post</h3>

      <div className="edit-field-group">
        <label htmlFor="edit-post-caption" className="edit-label">
          Description / Caption
        </label>
        <textarea
          id="edit-post-caption"
          name="caption"
          rows="4"
          className="edit-wireframe-textarea"
          value={formData.caption}
          onChange={handleChange}
          placeholder="Write a description for your post..."
          required
        />
      </div>

      <div className="edit-field-group">
        <label htmlFor="edit-post-hashtags" className="edit-label">
          Hashtags
        </label>
        <input
          id="edit-post-hashtags"
          name="hashtags"
          type="text"
          className="edit-wireframe-input"
          value={formData.hashtags}
          onChange={handleChange}
          placeholder="#birding #wildlife"
        />
      </div>

      <div className="postpage-edit-actions">
        <button type="submit" className="wireframe-btn edit-save-btn">
          Save Changes
        </button>
        <button
          type="button"
          className="request-decline-btn edit-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}