import { useState } from 'react';

export default function NewAlbum({ onPublish, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        hashtags: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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
                <h2 className="friendlist-title">Create Album</h2>
            </div>

            <form className="create-post-form-grid" onSubmit={handleSubmit}>
                <div className="create-post-details-pane">
                    <div className="edit-field-group">
                        <label htmlFor="create-album-name" className="edit-label">
                            Album Name
                        </label>
                        <input
                            id="create-album-name"
                            name="name"
                            type="text"
                            className="edit-wireframe-input"
                            placeholder="e.g. Birds of Pretoria"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="edit-field-group">
                        <label htmlFor="create-album-description" className="edit-label">
                            Description
                        </label>
                        <textarea
                            id="create-album-description"
                            name="description"
                            rows="4"
                            className="edit-wireframe-textarea"
                            placeholder="What sightings are grouped in this album?"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="edit-field-group">
                        <label htmlFor="create-album-hashtags" className="edit-label text-links">
                            Hashtags
                        </label>
                        <input
                            id="create-album-hashtags"
                            name="hashtags"
                            type="text"
                            className="edit-wireframe-input"
                            placeholder="#Raptors #Highveld"
                            value={formData.hashtags}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="create-post-actions-row">
                        <button type="submit" className="wireframe-btn edit-save-btn">
                            Publish Album
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