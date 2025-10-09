import React, { useEffect, useState } from 'react';
import { fpoAPI } from '../api/apiService';

const FPOProductCategoriesModal = ({ isOpen, onClose, fpoId }) => {
  const [categories, setCategories] = useState([]);
  const CATEGORY_OPTIONS = [
    'Urea',
    'Fertilizers',
    'Pesticides',
    'Bio-stimulants',
    'Manure - FYM/Poultry manure',
  ];
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ categoryName: '' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => { if (isOpen && fpoId) load(); }, [isOpen, fpoId]);
  useEffect(() => {
    const cb = (e) => { 
      if (activeDropdown && !e.target.closest('.action-dropdown')) setActiveDropdown(null);
      if (showCategoryDropdown && !e.target.closest('.custom-dropdown-container')) setShowCategoryDropdown(false);
    };
    document.addEventListener('mousedown', cb); return () => document.removeEventListener('mousedown', cb);
  }, [activeDropdown, showCategoryDropdown]);

  const load = async () => {
    try {
      setLoading(true);
      // Assuming categories are part of product categories endpoint list
      const res = await fpoAPI.getFPOProductCategories(fpoId);
      const data = res?.data || res || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      setCategories([]);
    } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fpoAPI.createProductCategory(fpoId, { categoryName: formData.categoryName });
      setShowForm(false); setFormData({ categoryName: '' });
      setTimeout(load, 300);
    } catch (e2) {
      alert('Error creating category: ' + (e2.response?.data?.message || e2.message));
    }
  };

  const handleEdit = (cat) => { setEditing(cat); setFormData({ categoryName: cat.categoryName || '' }); setShowForm(true); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await fpoAPI.updateProductCategory(fpoId, editing.id, { categoryName: formData.categoryName });
      setShowForm(false); setEditing(null); setFormData({ categoryName: '' }); load();
    } catch (e2) {
      alert('Error updating category: ' + (e2.response?.data?.message || e2.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await fpoAPI.deleteProductCategory(fpoId, id); load(); } catch (e2) { alert('Error deleting category: ' + (e2.response?.data?.message || e2.message)); }
  };

  const selectCategory = (category) => {
    setFormData({ categoryName: category });
    setShowCategoryDropdown(false);
  };

  const getFilteredCategories = () => {
    if (!formData.categoryName) return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter(cat => 
      cat.toLowerCase().includes(formData.categoryName.toLowerCase())
    );
  };

  const updateCategoryField = (value) => {
    setFormData({ categoryName: value });
    setShowCategoryDropdown(true);
  };

  const filtered = categories.filter(c => (c.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>FPO Product Category List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button className="create-button" onClick={() => { setEditing(null); setFormData({ categoryName: '' }); setShowForm(true); }}>+ Create Product Category</button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  load();
                }}
                title="Refresh product categories list"
              >
                <i className="fas fa-sync-alt"></i>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Filter Section - Hidden */}
          <div className="filter-section" style={{ display: 'none' }}>
            <div className="filter-label">FILTER</div>
            <div className="filter-inputs">
              <input className="search-input" placeholder="Search here..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
              <input className="date-range-input" placeholder="Enter a date range" readOnly />
              <div className="date-format-hint">MM/DD/YYYY - MM/DD/YYYY</div>
            </div>
          </div>
          <div className="table-container">
            <table className="turnover-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Product Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (<tr><td colSpan="3" className="loading-cell">Loading...</td></tr>) :
                 filtered.length === 0 ? (<tr><td colSpan="3" className="no-data-cell">No data</td></tr>) :
                 filtered.map((cat, index)=> (
                  <tr key={cat.id || index}>
                    <td>{cat.id || index + 1}</td>
                    <td>{cat.categoryName || '-'}</td>
                    <td>
                      <div className="action-dropdown">
                        <button className="dropdown-toggle" onClick={() => setActiveDropdown(activeDropdown === cat.id ? null : cat.id)}>⋯</button>
                        {activeDropdown === cat.id && (
                          <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                            <button className="dropdown-item-enhanced edit-item" onClick={() => { handleEdit(cat); setActiveDropdown(null); }}>Edit</button>
                            <button className="dropdown-item-enhanced delete-item" onClick={() => { handleDelete(cat.id); setActiveDropdown(null); }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                 ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editing ? 'Edit Product Category' : 'Add New Product Category'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditing(null); }}>×</button>
            </div>
            <div className="form-modal-body">
              {!editing && <p className="form-subtitle">Add a new category for Food Product</p>}
              <form onSubmit={editing ? handleUpdate : handleCreate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>CATEGORY NAME *</label>
                    <div className="custom-dropdown-container">
                      <input
                        type="text"
                        value={formData.categoryName}
                        onChange={(e)=>updateCategoryField(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Select Category"
                        required
                        className={!formData.categoryName ? 'required-field' : ''}
                        autoComplete="off"
                      />
                      <button 
                        type="button"
                        className="dropdown-arrow"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      >
                        <i className={`fas fa-chevron-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showCategoryDropdown && (
                        <div className="custom-dropdown-menu">
                          {getFilteredCategories().length > 0 ? (
                            getFilteredCategories().map(option => (
                              <div 
                                key={option}
                                className="custom-dropdown-item"
                                onClick={() => selectCategory(option)}
                              >
                                {option}
                              </div>
                            ))
                          ) : (
                            <div className="custom-dropdown-item no-results">
                              No matching categories
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className={`submit-btn ${!formData.categoryName ? 'disabled' : ''}`} disabled={!formData.categoryName}>{editing ? 'Update Category' : 'Add Category'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOProductCategoriesModal;
