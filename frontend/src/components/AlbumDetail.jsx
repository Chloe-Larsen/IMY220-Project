import { useState } from 'react';
import PostList from './PostList';

export default function AlbumDetail({
    album,
    isOwnProfile,
    allUserPosts = [],
    onBack,
    onUpdateAlbum,
    onDeleteAlbum,
    onAddPostToAlbum,
    onRemovePostFromAlbum
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [showAddPostModal, setShowAddPostModal] = useState(false);
    const [editData, setEditData] = useState({
        name: album.name || '',
        description: album.description || '',
        hashtags: album.hashtags || ''
    });

    const handleEditSubmit = (e) => {
        e.preventDefault();
        onUpdateAlbum(album.id, editData);
        setIsEditing(false);
    };

    const currentPostIds = new Set((album.posts || []).map((p) => String(p.id)));
    const availablePostsToAdd = allUserPosts.filter((p) => !currentPostIds.has(String(p.id)));

    return (
        <div className="friendlist-view-container album-detail-container">
            <div className="friendlist-header">
                <button
                    type="button"
                    className="signup-back-arrow friendlist-back-btn"
                    onClick={onBack}
                    aria-label="Back to albums"
                >
                    ←
                </button>
                <h2 className="friendlist-title">{album.name}</h2>
            </div>

            {isEditing ? (
                <form onSubmit={handleEditSubmit} className="edit-profile-form-layout">
                    <div className="edit-field-group">
                        <label htmlFor="album-name-input" className="edit-label">Album Name</label>
                        <input
                            id="album-name-input"
                            type="text"
                            className="edit-wireframe-input"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="edit-field-group">
                        <label htmlFor="album-desc-input" className="edit-label">Description</label>
                        <textarea
                            id="album-desc-input"
                            rows="3"
                            className="edit-wireframe-textarea"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        />
                    </div>

                    <div className="edit-field-group">
                        <label htmlFor="album-tags-input" className="edit-label">Hashtags</label>
                        <input
                            id="album-tags-input"
                            type="text"
                            className="edit-wireframe-input"
                            value={editData.hashtags}
                            onChange={(e) => setEditData({ ...editData, hashtags: e.target.value })}
                            placeholder="#Birds #Wildlife"
                        />
                    </div>

                    <div className="edit-profile-actions-bar">
                        <button type="submit" className="wireframe-btn edit-save-btn">Save Changes</button>
                        <button type="button" className="request-decline-btn edit-cancel-btn" onClick={() => setIsEditing(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="album-meta-header">
                    <p className="post-description-text">{album.description}</p>
                    {album.hashtags && <span className="hashtag-btn">{album.hashtags}</span>}

                    {isOwnProfile && (
                        <div className="album-owner-controls">
                            <button
                                type="button"
                                className="wireframe-btn"
                                onClick={() => setShowAddPostModal(true)}
                            >
                                Add Sighting
                            </button>
                            <button
                                type="button"
                                className="wireframe-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Album
                            </button>
                            <button
                                type="button"
                                className="request-decline-btn"
                                onClick={() => onDeleteAlbum(album.id)}
                            >
                                Delete Album
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="album-posts-section">
                <h3>Sightings in this album ({album.posts?.length || 0})</h3>
                {(!album.posts || album.posts.length === 0) ? (
                    <p className="profile-no-posts-text">No sightings have been added to this album yet.</p>
                ) : (
                    <div className="profile-three-col-grid">
                        {(album.posts || []).map((post) => (
                            <div key={post.id} className="album-post-item-wrapper">
                                <PostList userPosts={[post]} />
                                {isOwnProfile && (
                                    <button
                                        type="button"
                                        className="album-remove-post-btn"
                                        title="Remove from album"
                                        onClick={() => onRemovePostFromAlbum(album.id, post.id)}
                                    >
                                        Remove from Album
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddPostModal && (
                <div className="album-modal-backdrop">
                    <div className="album-modal-content">
                        <div className="friendlist-header">
                            <h3>Add Photo to Album</h3>
                            <button
                                type="button"
                                className="postpage-back-btn"
                                onClick={() => setShowAddPostModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {availablePostsToAdd.length === 0 ? (
                            <p className="friendlist-empty-msg">All your sightings are already in this album.</p>
                        ) : (
                            <div className="album-select-post-list">
                                {availablePostsToAdd.map((p) => (
                                    <div key={p.id} className="friendlist-card">
                                        <span className="friendlist-card-name">{p.caption || 'Untitled Sighting'}</span>
                                        <button
                                            type="button"
                                            className="wireframe-btn"
                                            onClick={() => {
                                                onAddPostToAlbum(album.id, p);
                                                setShowAddPostModal(false);
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}