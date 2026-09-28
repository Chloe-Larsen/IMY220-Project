import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostList from '../components/PostList';
import PostSkeleton from '../components/PostSkeleton';
import FriendList from '../components/FriendList';
import Requests from '../components/Requests';
import EditProfile from '../components/EditProfile';
import NewPost from '../components/NewPost';
import NewAlbum from '../components/NewAlbum';
import AlbumCard from '../components/AlbumCard';
import AlbumDetail from '../components/AlbumDetail';
import Image from '../components/Image';

export default function ProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const loggedInUser = JSON.parse(localStorage.getItem('user')) || {
        id: '1',
        username: 'avian_chloe'
    };

    const targetUsername = (id || loggedInUser.username).toLowerCase();
    const isOwnProfile = loggedInUser.username.toLowerCase() === targetUsername;

    const [profile, setProfile] = useState({
        id: targetUsername,
        username: targetUsername,
        name: '',
        pronouns: '',
        links: '',
        bio: '',
        avatarUrl: '',
        friends: []
    });

    const [postFeed, setPostFeed] = useState('posts');
    const [relationshipStatus, setRelationshipStatus] = useState('Not Friends');
    const [userPosts, setUserPosts] = useState([]);
    const [userAlbums, setUserAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [loading, setLoading] = useState(true);

    const [pendingRequests, setPendingRequests] = useState([
        { id: '5', username: 'falconer_dan', name: 'Dan Jacobs' },
        { id: '6', username: 'pelican_pete', name: 'Peter Van Wyk' }
    ]);

    const [showFriendsList, setShowFriendsList] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showNewPost, setShowNewPost] = useState(false);
    const [showNewAlbum, setShowNewAlbum] = useState(false);

    const canViewFullProfile = isOwnProfile || relationshipStatus === 'Friends';
    const canViewFriends = isOwnProfile || relationshipStatus === 'Friends';

    useEffect(() => {
        setShowFriendsList(false);
        setShowRequests(false);
        setShowEditProfile(false);
        setShowNewPost(false);
        setShowNewAlbum(false);
        setSelectedAlbum(null);
        setLoading(true);

        const startTime = Date.now();        
        const fetchProfile = fetch(`http://localhost:5000/api/auth/profile/${encodeURIComponent(targetUsername)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setProfile(data);
                    const isFriend = (data.friends || []).some(
                        (f) => f.username.toLowerCase() === loggedInUser.username.toLowerCase()
                    );
                    setRelationshipStatus(isFriend ? 'Friends' : 'Not Friends');
                } else {
                    setProfile({
                        id: targetUsername,
                        username: targetUsername,
                        name: targetUsername.replace('_', ' ').toUpperCase(),
                        pronouns: '',
                        links: '',
                        bio: 'Wildlife observer and community contributor.',
                        avatarUrl: '',
                        friends: []
                    });
                    setRelationshipStatus('Not Friends');
                }
            });

        const fetchPosts = fetch(`http://localhost:5000/api/posts?q=${encodeURIComponent(targetUsername)}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((posts) => {
                setUserPosts(Array.isArray(posts) ? posts : []);
            });

        const fetchAlbums = fetch(`http://localhost:5000/api/albums?user=${encodeURIComponent(targetUsername)}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((albums) => {
                setUserAlbums(Array.isArray(albums) ? albums : []);
            })
            .catch(() => {
                setUserAlbums([]);
            });

        Promise.allSettled([fetchProfile, fetchPosts, fetchAlbums]).then(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            setTimeout(() => setLoading(false), remainingTime);
        });
    }, [targetUsername, loggedInUser.username]);

    const handleStatusClick = () => {
        if (isOwnProfile) return;

        if (relationshipStatus === 'Friends') {
            if (window.confirm(`Are you sure you want to remove @${profile.username} as a friend?`)) {
                setRelationshipStatus('Not Friends');
            }
        } else if (relationshipStatus === 'Friend Request Pending') {
            if (window.confirm(`Cancel pending friend request to @${profile.username}?`)) {
                setRelationshipStatus('Not Friends');
            }
        } else if (relationshipStatus === 'Not Friends') {
            setRelationshipStatus('Friend Request Pending');
        }
    };

    const handlePublishPost = async (newPostData) => {
        const createdPost = {
            id: String(Date.now()),
            username: loggedInUser.username,
            caption: newPostData.caption,
            hashtags: newPostData.hashtags,
            imageUrl: newPostData.imageUrl,
            likes: 0,
            timeAgo: 'Just now',
            comments: []
        };

        try {
            await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createdPost)
            });
        } catch {
        }

        setUserPosts((prev) => [createdPost, ...prev]);
        setShowNewPost(false);
    };

    const handlePublishAlbum = async (newAlbumData) => {
        const createdAlbum = {
            id: String(Date.now()),
            username: loggedInUser.username,
            name: newAlbumData.name,
            description: newAlbumData.description,
            hashtags: newAlbumData.hashtags,
            posts: []
        };

        try {
            await fetch('http://localhost:5000/api/albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createdAlbum)
            });
        } catch {
        }

        setUserAlbums((prev) => [createdAlbum, ...prev]);
        setShowNewAlbum(false);
    };

    const handleUpdateAlbum = async (albumId, updatedData) => {
        try {
            await fetch(`http://localhost:5000/api/albums/${albumId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
        } catch {
            // Local fallback
        }

        const updater = (album) =>
            album.id === albumId ? { ...album, ...updatedData } : album;

        setUserAlbums((prev) => prev.map(updater));
        if (selectedAlbum && selectedAlbum.id === albumId) {
            setSelectedAlbum((prev) => ({ ...prev, ...updatedData }));
        }
    };

    const handleDeleteAlbum = async (albumId) => {
        if (!window.confirm('Are you sure you want to delete this album? Sightings inside will not be deleted.')) {
            return;
        }

        try {
            await fetch(`http://localhost:5000/api/albums/${albumId}`, { method: 'DELETE' });
        } catch {
            // Local fallback
        }

        setUserAlbums((prev) => prev.filter((a) => a.id !== albumId));
        setSelectedAlbum(null);
    };

    const handleAddPostToAlbum = async (albumId, post) => {
        try {
            await fetch(`http://localhost:5000/api/albums/${albumId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id })
            });
        } catch {
        }

        const addPost = (album) => {
            if (album.id !== albumId) return album;
            const current = album.posts || [];
            return { ...album, posts: [...current, post] };
        };

        setUserAlbums((prev) => prev.map(addPost));
        if (selectedAlbum && selectedAlbum.id === albumId) {
            setSelectedAlbum((prev) => ({
                ...prev,
                posts: [...(prev.posts || []), post]
            }));
        }
    };

    const handleRemovePostFromAlbum = async (albumId, postId) => {
        try {
            await fetch(`http://localhost:5000/api/albums/${albumId}/posts/${postId}`, {
                method: 'DELETE'
            });
        } catch {

        }

        const removePost = (album) => {
            if (album.id !== albumId) return album;
            return {
                ...album,
                posts: (album.posts || []).filter((p) => String(p.id) !== String(postId))
            };
        };

        setUserAlbums((prev) => prev.map(removePost));
        if (selectedAlbum && selectedAlbum.id === albumId) {
            setSelectedAlbum((prev) => ({
                ...prev,
                posts: (prev.posts || []).filter((p) => String(p.id) !== String(postId))
            }));
        }
    };

    return (
        <div className="app-container profile-desktop-screen">
            <Navigation isLoggedIn={true} profile={true} isProfile={isOwnProfile} />

            {showFriendsList ? (
                <main className="profile-fullscreen-friendlist-container">
                    <FriendList
                        friends={profile.friends}
                        onBack={() => setShowFriendsList(false)}
                    />
                </main>
            ) : showRequests ? (
                <main className="profile-fullscreen-friendlist-container">
                    <Requests
                        requests={pendingRequests}
                        onAccept={(id) => {
                            const req = pendingRequests.find((r) => r.id === id);
                            if (req) {
                                setProfile((prev) => ({ ...prev, friends: [...prev.friends, req] }));
                                setPendingRequests((prev) => prev.filter((r) => r.id !== id));
                            }
                        }}
                        onDecline={(id) => setPendingRequests((prev) => prev.filter((r) => r.id !== id))}
                        onBack={() => setShowRequests(false)}
                    />
                </main>
            ) : showEditProfile ? (
                <main className="profile-fullscreen-friendlist-container">
                    <EditProfile
                        profile={profile}
                        onSave={(updated) => {
                            setProfile((prev) => ({ ...prev, ...updated }));
                            setShowEditProfile(false);
                        }}
                        onCancel={() => setShowEditProfile(false)}
                        onDelete={() => {
                            localStorage.removeItem('user');
                            navigate('/signup');
                        }}
                    />
                </main>
            ) : showNewPost ? (
                <main className="profile-fullscreen-friendlist-container">
                    <NewPost
                        onPublish={handlePublishPost}
                        onCancel={() => setShowNewPost(false)}
                    />
                </main>
            ) : showNewAlbum ? (
                <main className="profile-fullscreen-friendlist-container">
                    <NewAlbum
                        onPublish={handlePublishAlbum}
                        onCancel={() => setShowNewAlbum(false)}
                    />
                </main>
            ) : selectedAlbum ? (
                <main className="profile-fullscreen-friendlist-container">
                    <AlbumDetail
                        album={selectedAlbum}
                        isOwnProfile={isOwnProfile}
                        allUserPosts={userPosts}
                        onBack={() => setSelectedAlbum(null)}
                        onUpdateAlbum={handleUpdateAlbum}
                        onDeleteAlbum={handleDeleteAlbum}
                        onAddPostToAlbum={handleAddPostToAlbum}
                        onRemovePostFromAlbum={handleRemovePostFromAlbum}
                    />
                </main>
            ) : (
                <main className="profile-wireframe-layout">
                    <div className="profile-status-bar-row">
                        {isOwnProfile ? (
                            <span className="wf-status-text">Your Profile</span>
                        ) : (
                            <button
                                type="button"
                                className={`profile-status-btn status-${relationshipStatus
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')}`}
                                onClick={handleStatusClick}
                            >
                                {relationshipStatus}
                            </button>
                        )}

                        <span className="wf-username-text">
                            {profile.username || 'Username'}
                        </span>
                    </div>

                    <section className="profile-bio-hero-section">
                        <div className="profile-left-bio-pane">
                            {canViewFriends && (
                                <div className="wf-friends-count-container">
                                    <button
                                        type="button"
                                        className="wf-friends-count-btn active"
                                        onClick={() => setShowFriendsList(true)}
                                    >
                                        <strong>{profile.friends?.length || 0}</strong> Friends
                                    </button>
                                    <div className="wf-friends-underline" />
                                </div>
                            )}

                            <div className="wf-bio-details-stack">
                                <div className="wf-bio-entry">
                                    <span className="wf-bio-key">Name</span>
                                    <span className="wf-bio-val">{profile.name}</span>
                                </div>

                                {canViewFullProfile && (
                                    <>
                                        <div className="wf-bio-entry">
                                            <span className="wf-bio-key text-pronouns">Pronouns</span>
                                            <span className="wf-bio-val text-pronouns">{profile.pronouns}</span>
                                        </div>
                                        {profile.links && (
                                            <div className="wf-bio-entry">
                                                <span className="wf-bio-key text-links">Links</span>
                                                <a
                                                    href={`https://${profile.links}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="wf-bio-val text-links"
                                                >
                                                    {profile.links}
                                                </a>
                                            </div>
                                        )}
                                        <div className="wf-bio-entry wf-bio-block">
                                            <span className="wf-bio-key">Bio</span>
                                            <p className="wf-bio-val wf-bio-desc">{profile.bio}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="wf-profile-picture-container">
                            {profile.avatarUrl ? (
                                <Image
                                    imageValue={profile.avatarUrl}
                                    altText={profile.username}
                                    className="wf-profile-avatar-img"
                                />
                            ) : (
                                <div className="wf-profile-avatar-placeholder" />
                            )}
                        </div>
                    </section>

                    {isOwnProfile && (
                        <div className="wf-profile-actions-bar">
                            <button
                                type="button"
                                className="wireframe-btn wf-btn"
                                onClick={() => setShowRequests(true)}
                            >
                                Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                            </button>
                            <button
                                type="button"
                                className="wireframe-btn wf-btn"
                                onClick={() => setShowEditProfile(true)}
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}

                    <hr className="wf-profile-full-divider" />
                    {canViewFullProfile && (
                        <div className="wf-posts-album-action-bar">
                            <div className="home-feed-toggle-group">
                                <button
                                    className={`feed-switch-btn ${postFeed === 'posts' ? 'active' : ''}`}
                                    onClick={() => setPostFeed('posts')}
                                >
                                    Posts
                                </button>
                                <span className="feed-switch-divider">|</span>
                                <button
                                    className={`feed-switch-btn ${postFeed === 'albums' ? 'active' : ''}`}
                                    onClick={() => setPostFeed('albums')}
                                >
                                    Albums
                                </button>
                            </div>

                            {isOwnProfile && (
                                postFeed === 'posts' ? (
                                    <button
                                        type="button"
                                        className="wireframe-btn wf-btn"
                                        onClick={() => setShowNewPost(true)}
                                    >
                                        Create Post
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="wireframe-btn wf-btn"
                                        onClick={() => setShowNewAlbum(true)}
                                    >
                                        Create Album
                                    </button>
                                )
                            )}
                        </div>
                    )}
                    {canViewFullProfile && (
                        <section className="profile-three-col-grid">
                            {loading && (
                                <>
                                    <PostSkeleton />
                                    <PostSkeleton />
                                    <PostSkeleton />
                                </>
                            )}

                            {!loading && postFeed === 'posts' && (
                                userPosts.length === 0 ? (
                                    <p className="profile-no-posts-text">No posts available.</p>
                                ) : (
                                    <PostList userPosts={userPosts} />
                                )
                            )}

                            {!loading && postFeed === 'albums' && (
                                userAlbums.length === 0 ? (
                                    <p className="profile-no-posts-text">No albums created yet.</p>
                                ) : (
                                    userAlbums.map((album) => (
                                        <AlbumCard
                                            key={album.id}
                                            album={album}
                                            onSelectAlbum={(alb) => setSelectedAlbum(alb)}
                                        />
                                    ))
                                )
                            )}
                        </section>
                    )}
                </main>
            )}

            <Footer isLoggedIn={true} />
        </div>
    );
}