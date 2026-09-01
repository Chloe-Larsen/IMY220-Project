import { useState, useRef } from 'react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';

export default function EditProfile({ profile, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    pronouns: profile.pronouns || '',
    links: profile.links || '',
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || ''
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert uploaded/dropped file into a base64 image preview URL
  const handleFileProcess = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
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
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="edit-profile-form-layout" onSubmit={handleSubmit}>
      {/* Header bar matching view transitions */}
      <div className="friendlist-header">
        <button
          type="button"
          className="signup-back-arrow friendlist-back-btn"
          onClick={onCancel}
          aria-label="Cancel and back to profile"
        >
          ←
        </button>
        <h2 className="friendlist-title">Edit Profile</h2>
      </div>
      
      <section className="profile-bio-hero-section edit-hero-section">        
        <div className="profile-left-bio-pane edit-left-pane">
          <div className="edit-fields-stack">
            <div className="edit-field-group">
              <label htmlFor="edit-name" className="edit-label">Name</label>
              <input
                id="edit-name"
                type="text"
                name="name"
                className="edit-wireframe-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="edit-field-group">
              <label htmlFor="edit-pronouns" className="edit-label text-pronouns">Pronouns</label>
              <input
                id="edit-pronouns"
                type="text"
                name="pronouns"
                className="edit-wireframe-input"
                value={formData.pronouns}
                onChange={handleChange}
                placeholder="e.g. they/them, she/her"
              />
            </div>

            <div className="edit-field-group">
              <label htmlFor="edit-links" className="edit-label text-links">Links</label>
              <input
                id="edit-links"
                type="text"
                name="links"
                className="edit-wireframe-input"
                value={formData.links}
                onChange={handleChange}
                placeholder="linktr.ee/yourname"
              />
            </div>

            <div className="edit-field-group">
              <label htmlFor="edit-bio" className="edit-label">Bio</label>
              <textarea
                id="edit-bio"
                name="bio"
                rows="3"
                className="edit-wireframe-textarea"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell others about your birding & wildlife interests..."
              />
            </div>
          </div>
        </div>
        
        <div className="wf-profile-picture-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div
            className={`wf-profile-avatar-dropzone ${isDragging ? 'dragging' : ''} ${formData.avatarUrl ? 'has-image' : ''
              }`}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            {formData.avatarUrl ? (
              <div className="avatar-preview-wrapper">
                <img
                  src={formData.avatarUrl}
                  alt="Avatar preview"
                  className="wf-profile-avatar-img"
                />
                <div className="avatar-overlay-actions">
                  <span className="avatar-replace-text">Click or drag to replace</span>
                  <button
                    type="button"
                    className="avatar-delete-btn"
                    onClick={handleRemoveImage}
                    title="Remove avatar"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ) : (
              <div className="avatar-empty-dropzone">
                <FiUploadCloud className="avatar-upload-icon" />
                <span className="avatar-dropzone-prompt">
                  <strong>Click to upload</strong> or drag & drop
                </span>
                <span className="avatar-dropzone-sub">PNG, JPG, or WEBP</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Action Buttons Row */}
      <div className="edit-profile-actions-bar">
        <button type="submit" className="wireframe-btn edit-save-btn">
          Save Changes
        </button>
        <button type="button" className="request-decline-btn edit-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}