import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostPreview from '../components/PostPreview';
import PostSkeleton from '../components/PostSkeleton';
import FriendList from '../components/FriendList';
import Requests from '../components/Requests';
import EditProfile from '../components/EditProfile';

export default function ProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Active logged-in user
    const loggedInUser = JSON.parse(localStorage.getItem('user')) || {
        id: '1',
        username: 'avian_chloe'
    };

    if (!id) {
        return <Navigate to={`/profile/${loggedInUser.username}`} replace />;
    }

    const targetUsername = id.toLowerCase();
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

    const [pendingRequests, setPendingRequests] = useState([
        { id: '5', username: 'falconer_dan', name: 'Dan Jacobs' },
        { id: '6', username: 'pelican_pete', name: 'Peter Van Wyk' }
    ]);

    const [showFriendsList, setShowFriendsList] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    const [relationshipStatus, setRelationshipStatus] = useState('Not Friends');
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const canViewFriends = isOwnProfile || relationshipStatus === 'Friends';

    useEffect(() => {
        setShowFriendsList(false);
        setShowRequests(false);
        setShowEditProfile(false);
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

        Promise.allSettled([fetchProfile, fetchPosts]).then(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            setTimeout(() => setLoading(false), remainingTime);
        });
    }, [targetUsername, loggedInUser.username]);

    const handleStatusClick = () => {
        if (isOwnProfile) return;

        if (relationshipStatus === 'Friends') {
            const confirmRemove = window.confirm(
                `Are you sure you want to remove @${profile.username} as a friend?`
            );
            if (confirmRemove) setRelationshipStatus('Not Friends');
        } else if (relationshipStatus === 'Friend Request Pending') {
            const cancelRequest = window.confirm(
                `Cancel pending friend request to @${profile.username}?`
            );
            if (cancelRequest) setRelationshipStatus('Not Friends');
        } else if (relationshipStatus === 'Not Friends') {
            setRelationshipStatus('Friend Request Pending');
        }
    };

    const handleSaveProfile = (updatedData) => {
        setProfile((prev) => ({
            ...prev,
            ...updatedData
        }));
        setShowEditProfile(false);
    };

    const handleAcceptRequest = (requestId) => {
        const acceptedUser = pendingRequests.find((r) => r.id === requestId);
        if (acceptedUser) {
            setProfile((prev) => ({
                ...prev,
                friends: [...prev.friends, acceptedUser]
            }));
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        }
    };

    const handleDeclineRequest = (requestId) => {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    };

    return (
        <div className="app-container profile-desktop-screen">
            <Navigation isLoggedIn={true} profile={true}/>

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
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        onBack={() => setShowRequests(false)}
                    />
                </main>
            ) : showEditProfile ? (
                <main className="profile-fullscreen-friendlist-container">
                    <EditProfile
                        profile={profile}
                        onSave={handleSaveProfile}
                        onCancel={() => setShowEditProfile(false)}
                    />
                </main>
            ) :
                (
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
                                <div className="wf-friends-count-container">
                                    <button
                                        type="button"
                                        className={`wf-friends-count-btn ${canViewFriends ? 'active' : 'disabled'}`}
                                        onClick={() => canViewFriends && setShowFriendsList(true)}
                                        disabled={!canViewFriends}
                                        title={canViewFriends ? 'Click to view friends' : 'Friends list is private'}
                                    >
                                        <strong>{profile.friends?.length || '##'}</strong> Friends
                                    </button>
                                    <div className="wf-friends-underline" />
                                </div>

                                <div className="wf-bio-details-stack">
                                    <div className="wf-bio-entry">
                                        <span className="wf-bio-key">Name</span>
                                        <span className="wf-bio-val">{profile.name}</span>
                                    </div>
                                    <div className="wf-bio-entry">
                                        <span className="wf-bio-key text-pronouns">Pronouns</span>
                                        <span className="wf-bio-val text-pronouns">{profile.pronouns}</span>
                                    </div>
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
                                    <div className="wf-bio-entry wf-bio-block">
                                        <span className="wf-bio-key">Bio</span>
                                        <p className="wf-bio-val wf-bio-desc">{profile.bio}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="wf-profile-picture-container">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.username}
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
                                    onClick={() => navigate('/create-post')}
                                >
                                    Make Post
                                </button>
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

                        {/* Horizontal Divider Line */}
                        <hr className="wf-profile-full-divider" />

                        {/* 3-Column Posts Grid */}
                        <section className="profile-three-col-grid">
                            {loading && (
                                <>
                                    <PostSkeleton />
                                    <PostSkeleton />
                                    <PostSkeleton />
                                </>
                            )}

                            {!loading && userPosts.length === 0 && (
                                <p className="profile-no-posts-text">No posts available.</p>
                            )}

                            {!loading &&
                                userPosts.map((post, idx) => (
                                    <div
                                        key={post.id}
                                        className="post-card-animated-wrapper"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <PostPreview post={post} />
                                    </div>
                                ))}
                        </section>
                    </main>
                )}

            <Footer isLoggedIn={true} />
        </div>
    );
}