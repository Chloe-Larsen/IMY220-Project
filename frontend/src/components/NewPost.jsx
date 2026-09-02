import { useState, useRef } from 'react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';

export default function NewPost({ onPublish, onCancel }) {
  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    imageUrl: ''
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileProcess = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Please upload an image for your post.');
      return;
    }
    onPublish(formData);
  };

  return (
    <div className="friendlist-view-container">      
      <div className="friendlist-header">
        <button
          type="button"
          className="signup-back-arrow friendlist-back-btn"
          onClick={onCancel}
          aria-label="Cancel and return to profile"
        >
          ←
        </button>
        <h2 className="friendlist-title">Make Post</h2>
      </div>

      <form className="create-post-form-grid" onSubmit={handleSubmit}>        
        <div className="create-post-media-pane">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div
            className={`wf-profile-avatar-dropzone create-post-dropzone ${
              isDragging ? 'dragging' : ''
            } ${formData.imageUrl ? 'has-image' : ''}`}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            {formData.imageUrl ? (
              <div className="avatar-preview-wrapper">
                <img
                  src={formData.imageUrl}
                  alt="Post preview"
                  className="wf-profile-avatar-img"
                />
                <div className="avatar-overlay-actions">
                  <span className="avatar-replace-text">Click or drag to replace</span>
                  <button
                    type="button"
                    className="avatar-delete-btn"
                    onClick={handleRemoveImage}
                    title="Remove image"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ) : (
              <div className="avatar-empty-dropzone">
                <FiUploadCloud className="avatar-upload-icon" />
                <span className="avatar-dropzone-prompt">
                  <strong>Click to upload</strong> or drag & drop photo
                </span>
                <span className="avatar-dropzone-sub">PNG, JPG, WEBP</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="create-post-details-pane">
          <div className="edit-field-group">
            <label htmlFor="create-post-caption" className="edit-label">
              Description / Caption
            </label>
            <textarea
              id="create-post-caption"
              name="caption"
              rows="5"
              className="edit-wireframe-textarea"
              placeholder="What wildlife sighting did you capture?"
              value={formData.caption}
              onChange={handleChange}
              required
            />
          </div>

          <div className="edit-field-group">
            <label htmlFor="create-post-tags" className="edit-label text-links">
              Hashtags
            </label>
            <input
              id="create-post-tags"
              name="hashtags"
              type="text"
              className="edit-wireframe-input"
              placeholder="#Sugarbird #Protea #CapeTown"
              value={formData.hashtags}
              onChange={handleChange}
            />
          </div>

          <div className="create-post-actions-row">
            <button type="submit" className="wireframe-btn edit-save-btn">
              Publish Post
            </button>
            <button
              type="button"
              className="request-decline-btn edit-cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}