import { FiFolder, FiImage } from 'react-icons/fi';
import Image from './Image';

export default function AlbumCard({ album, onSelectAlbum }) {
    const coverImage = album.posts && album.posts.length > 0 ? album.posts[0].imageUrl : null;
    const postCount = album.posts ? album.posts.length : 0;

    return (
        <article className="feed-post-card album-card-preview" onClick={() => onSelectAlbum(album)}>
            <div className="post-image-container album-cover-container">
                {coverImage ? (
                    <Image imageValue={coverImage} altText={album.name} className="post-photo-img" />
                ) : (
                    <div className="post-image-placeholder album-empty-placeholder">
                        <FiFolder className="album-placeholder-icon" />
                    </div>
                )}
                <div className="album-badge">
                    <FiImage /> {postCount} {postCount === 1 ? 'photo' : 'photos'}
                </div>
            </div>

            <div className="post-meta-details">
                <h3 className="album-card-title">{album.name}</h3>
                <p className="post-description-text">{album.description || 'No description provided.'}</p>
                {album.hashtags && (
                    <div className="post-hashtags-container">
                        <span className="hashtag-btn">{album.hashtags}</span>
                    </div>
                )}
            </div>
        </article>
    );
}