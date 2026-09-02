import { useState } from 'react';

export default function Filters({ onApplyFilters, onResetFilters }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [tagInput, setTagInput] = useState('');

  const handleApply = (e) => {
    e.preventDefault();
    onApplyFilters({
      sortBy,
      tag: tagInput.trim()
    });
  };

  const handleReset = () => {
    setSortBy('recent');
    setTagInput('');
    if (onResetFilters) onResetFilters();
  };

  return (
    <div className="home-filters-dropdown-panel">
      <form onSubmit={handleApply} className="home-filters-form">
        <div className="filter-group">
          <label htmlFor="filter-sort" className="filter-label">Sort By</label>
          <select
            id="filter-sort"
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="likes">Most Liked</option>
            <option value="comments">Most Active</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-tag" className="filter-label">Hashtag / Keyword</label>
          <input
            id="filter-tag"
            type="text"
            className="filter-input"
            placeholder="#Fynbos, #Kruger..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
        </div>

        <div className="filter-actions-group">
          <button type="submit" className="wireframe-btn filter-apply-btn">
            Apply
          </button>
          <button type="button" className="filter-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}