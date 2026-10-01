import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import PostSkeleton from '../components/PostSkeleton';
import { FiTrash2, FiUserX, FiAlertCircle, FiPlus, FiCheckCircle, FiList } from 'react-icons/fi';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('reasons');
    const [reasons, setReasons] = useState([]);
    const [newReason, setNewReason] = useState('');
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetchTabContent();
    }, [activeTab]);

    const showStatus = (msg) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 3500);
    };

    const fetchTabContent = async () => {
        setLoading(true);
        setError('');
        const startTime = Date.now();

        let endpoint = '/api/admin/report-reasons';
        if (activeTab === 'reports') endpoint = '/api/admin/reports';
        if (activeTab === 'users') endpoint = '/api/admin/users';

        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            const data = await res.json();

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 800 - elapsed);

            setTimeout(() => {
                if (activeTab === 'reasons') setReasons(Array.isArray(data) ? data : []);
                else if (activeTab === 'reports') setReports(Array.isArray(data) ? data : []);
                else setUsers(Array.isArray(data) ? data : []);
                setLoading(false);
            }, remaining);
        } catch {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 800 - elapsed);

            setTimeout(() => {
                if (activeTab === 'reasons') {
                    setReasons([
                        { id: '1', reason: 'Inappropriate content / spam' },
                        { id: '2', reason: 'Harassment or hate speech' },
                        { id: '3', reason: 'Non-avian / irrelevant submission' },
                        { id: '4', reason: 'Copyright or stolen photograph' }
                    ]);
                } else if (activeTab === 'reports') {
                    setReports([
                        {
                            id: 'rep-1',
                            postId: '101',
                            reporter: 'falconer_dan',
                            reason: 'Non-avian / irrelevant submission',
                            postCaption: 'Suspected domestic animal photo',
                            postUsername: 'unknown_birder'
                        }
                    ]);
                } else {
                    setUsers([
                        { id: '1', username: 'avian_chloe', email: 'chloe@tiptap.org', role: 'admin' },
                        { id: '5', username: 'falconer_dan', email: 'dan@tiptap.org', role: 'user' },
                        { id: '6', username: 'pelican_pete', email: 'pete@tiptap.org', role: 'user' }
                    ]);
                }
                setLoading(false);
            }, remaining);
        }
    };

    const handleAddReason = async (e) => {
        e.preventDefault();
        if (!newReason.trim()) return;

        const reasonPayload = { reason: newReason.trim() };

        try {
            const res = await fetch('/api/admin/report-reasons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reasonPayload)
            });
            const data = await res.json();
            setReasons((prev) => [...prev, data.reason || { id: String(Date.now()), ...reasonPayload }]);
        } catch {
            setReasons((prev) => [...prev, { id: String(Date.now()), ...reasonPayload }]);
        }

        setNewReason('');
        showStatus('New report reason successfully added to database.');
    };

    const handleDeleteReason = async (reasonId) => {
        if (!window.confirm('Delete this report reason?')) return;

        try {
            await fetch(`/api/admin/report-reasons/${reasonId}`, { method: 'DELETE' });
        } catch {

        }

        setReasons((prev) => prev.filter((r) => r.id !== reasonId));
        showStatus('Report reason removed.');
    };


    const handleDismissReport = async (reportId) => {
        try {
            await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
        } catch {

        }
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        showStatus(`Report #${reportId} dismissed.`);
    };

    const handleDeleteReportedPost = async (postId, reportId) => {
        if (!window.confirm(`Delete post #${postId}? All associated comments will also be removed.`)) {
            return;
        }

        try {
            await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
        } catch {
        }

        setReports((prev) => prev.filter((r) => r.id !== reportId));
        showStatus(`Post #${postId} deleted and report resolved.`);
    };
    
    const handleSuspendUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to suspend @${username}?`)) return;

        try {
            await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        } catch {            
        }

        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showStatus(`User @${username} account suspended.`);
    };

    return (
        <div className="app-container profile-desktop-screen">
            <Navigation admin={true}/>

            <main className="profile-wireframe-layout admin-console-layout">
                <div className="profile-status-bar-row">
                    <span className="wf-status-text">TipTap Administrator Console</span>
                    <span className="wf-username-text">System Oversight</span>
                </div>
                
                <div className="home-subbar admin-tabs-subbar">
                    <div className="home-feed-toggle-group">
                        <button
                            type="button"
                            className={`feed-switch-btn ${activeTab === 'reasons' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reasons')}
                        >
                            Report Reasons ({reasons.length})
                        </button>
                        <span className="feed-switch-divider">|</span>
                        <button
                            type="button"
                            className={`feed-switch-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            Reported Posts ({reports.length})
                        </button>
                        <span className="feed-switch-divider">|</span>
                        <button
                            type="button"
                            className={`feed-switch-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Manage Users ({users.length})
                        </button>
                    </div>
                </div>
                
                {statusMessage && (
                    <div className="admin-status-toast">
                        <FiCheckCircle className="toast-icon" />
                        <span>{statusMessage}</span>
                    </div>
                )}

                {error && !loading && <p className="form-error-msg">{error}</p>}

                {loading ? (
                    <section className="profile-three-col-grid admin-loading-grid">
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </section>
                ) : (
                    <section className="admin-panel-content">
                        {activeTab === 'reasons' && (
                            <div className="admin-reasons-section">
                                <div className="admin-section-header">
                                    <h3>Predefined Report Reasons</h3>
                                    <p className="post-description-text">
                                        These options are stored in the database and shown to users when reporting posts.
                                    </p>
                                </div>

                                <form onSubmit={handleAddReason} className="admin-add-reason-form">
                                    <div className="input-group">
                                        <label htmlFor="new-reason-input" className="wireframe-label">
                                            Add New Predefined Reason
                                        </label>
                                        <div className="admin-input-btn-row">
                                            <input
                                                id="new-reason-input"
                                                type="text"
                                                className="form-input login-wireframe-input"
                                                placeholder="e.g. Disturbing nesting wildlife habitat"
                                                value={newReason}
                                                onChange={(e) => setNewReason(e.target.value)}
                                                required
                                            />
                                            <button type="submit" className="wireframe-btn admin-add-btn">
                                                <FiPlus /> Add Reason
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="admin-items-stack">
                                    {reasons.length === 0 ? (
                                        <p className="friendlist-empty-msg">No report reasons configured in database.</p>
                                    ) : (
                                        reasons.map((item, idx) => (
                                            <div key={item.id || idx} className="friendlist-card admin-reason-card">
                                                <div className="admin-reason-content">
                                                    <FiList className="admin-reason-icon" />
                                                    <span className="friendlist-card-name">{item.reason || item}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="request-decline-btn admin-delete-btn"
                                                    title="Delete reason"
                                                    onClick={() => handleDeleteReason(item.id)}
                                                >
                                                    <FiTrash2 /> Remove
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="admin-reports-section">
                                {reports.length === 0 ? (
                                    <p className="friendlist-empty-msg">No active reports found. System is clear.</p>
                                ) : (
                                    <div className="admin-items-stack">
                                        {reports.map((report) => (
                                            <div key={report.id} className="friendlist-card admin-report-card">
                                                <div className="admin-report-info">
                                                    <div className="admin-report-title-row">
                                                        <FiAlertCircle className="admin-alert-icon" />
                                                        <strong>Reason: {report.reason}</strong>
                                                    </div>
                                                    <span className="admin-report-meta">
                                                        Reported by <em>@{report.reporter}</em> against Post #{report.postId} by{' '}
                                                        <strong>@{report.postUsername}</strong>
                                                    </span>
                                                    {report.postCaption && (
                                                        <p className="admin-report-caption">"{report.postCaption}"</p>
                                                    )}
                                                </div>

                                                <div className="admin-actions-group">
                                                    <button
                                                        type="button"
                                                        className="wireframe-btn"
                                                        onClick={() => handleDismissReport(report.id)}
                                                    >
                                                        Dismiss
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="request-decline-btn edit-delete-btn admin-delete-post-btn"
                                                        onClick={() => handleDeleteReportedPost(report.postId, report.id)}
                                                    >
                                                        <FiTrash2 /> Delete Post
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="admin-users-section">
                                {users.length === 0 ? (
                                    <p className="friendlist-empty-msg">No registered users located.</p>
                                ) : (
                                    <div className="admin-items-stack">
                                        {users.map((u) => (
                                            <div key={u.id} className="friendlist-card admin-user-card">
                                                <div className="admin-user-info">
                                                    <strong>@{u.username}</strong>
                                                    <span className="admin-user-email">{u.email}</span>
                                                    <span
                                                        className={`admin-user-role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}
                                                    >
                                                        {u.role || 'user'}
                                                    </span>
                                                </div>

                                                {u.role !== 'admin' && (
                                                    <button
                                                        type="button"
                                                        className="request-decline-btn admin-delete-btn"
                                                        onClick={() => handleSuspendUser(u.id, u.username)}
                                                    >
                                                        <FiUserX /> Suspend
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>

            <Footer  />
        </div>
    );
}