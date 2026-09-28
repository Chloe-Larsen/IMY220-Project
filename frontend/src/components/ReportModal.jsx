import { useState, useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

export default function ReportModal({ postId, onClose, onSubmitSuccess }) {
    const [reasons, setReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loggedInUser = JSON.parse(localStorage.getItem('user')) || {
        username: 'avian_chloe'
    };

    useEffect(() => {
        fetch('/api/admin/report-reasons')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load reasons');
                return res.json();
            })
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setReasons(list);
                if (list.length > 0) setSelectedReason(list[0].reason || list[0]);
                setLoading(false);
            })
            .catch(() => {
                // Fallback default reasons if database route isn't set up yet
                const fallback = [
                    { id: '1', reason: 'Inappropriate content / spam' },
                    { id: '2', reason: 'Harassment or hate speech' },
                    { id: '3', reason: 'Non-avian / irrelevant submission' },
                    { id: '4', reason: 'Copyright or stolen photograph' }
                ];
                setReasons(fallback);
                setSelectedReason(fallback[0].reason);
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReason) {
            setError('Please select a report reason.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/posts/${postId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporter: loggedInUser.username,
                    reason: selectedReason
                })
            });

            if (res.ok) {
                onSubmitSuccess();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to submit report.');
            }
        } catch {
            // Simulate client success fallback
            onSubmitSuccess();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="album-modal-backdrop">
            <div className="album-modal-content report-modal-content">
                <div className="friendlist-header">
                    <div className="report-modal-title-group">
                        <FiAlertCircle className="report-icon" />
                        <h3 className="friendlist-title">Report Sighting</h3>
                    </div>
                    <button
                        type="button"
                        className="signup-back-arrow friendlist-back-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <FiX />
                    </button>
                </div>

                {error && <p className="form-error-msg">{error}</p>}

                {loading ? (
                    <p className="profile-no-posts-text">Loading report reasons...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="report-form">
                        <label htmlFor="report-reason-select" className="edit-label">
                            Why are you reporting post #{postId}?
                        </label>

                        <select
                            id="report-reason-select"
                            className="filter-select report-select"
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                        >
                            {reasons.map((r, idx) => {
                                const label = r.reason || r;
                                return (
                                    <option key={r.id || idx} value={label}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>

                        <div className="edit-profile-actions-bar report-actions-bar">
                            <button
                                type="submit"
                                className="wireframe-btn edit-delete-btn"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                            <button
                                type="button"
                                className="request-decline-btn edit-cancel-btn"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}