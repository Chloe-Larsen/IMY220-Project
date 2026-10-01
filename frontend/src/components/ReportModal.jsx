import { useState, useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

export default function ReportModal({ postId, currentUsername, onClose, onSubmitSuccess }) {
    const [reasons, setReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const activeUsername = currentUsername || JSON.parse(localStorage.getItem('user'))?.username;    

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/report-reasons')
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
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporter: activeUsername,
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
            console.error('Error submitting report:', err);
            setError('Network error: Could not reach the backend server.');
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