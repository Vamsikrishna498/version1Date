import React, { useEffect, useState } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOInputShopView.css';

const FPOInputShopModal = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [formData, setFormData] = useState({
    shopName: '',
    seedLicense: '',
    pesticideLicense: '',
    fertiliserLicense: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    if (isOpen && fpoId) loadShops();
  }, [isOpen, fpoId]);

  useEffect(() => {
    const close = (e) => {
      if (activeDropdown && !e.target.closest('.action-dropdown')) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [activeDropdown]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const res = await fpoAPI.getFPOInputShops(fpoId);
      const data = res?.data || res || [];
      setShops(Array.isArray(data) ? data : []);
    } catch (e) {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        shopName: formData.shopName,
        seedLicense: formData.seedLicense || null,
        pesticideLicense: formData.pesticideLicense || null,
        fertiliserLicense: formData.fertiliserLicense || null,
      };
      await fpoAPI.createInputShop(fpoId, payload);
      setShowForm(false);
      setFormData({ shopName: '', seedLicense: '', pesticideLicense: '', fertiliserLicense: '' });
      setTimeout(loadShops, 300);
      alert('Input Shop created successfully!');
    } catch (e) {
      alert('Error creating shop: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleEdit = (shop) => {
    setEditing(shop);
    setFormData({
      shopName: shop.shopName || '',
      seedLicense: shop.seedLicense || '',
      pesticideLicense: shop.pesticideLicense || '',
      fertiliserLicense: shop.fertiliserLicense || ''
    });
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        shopName: formData.shopName,
        seedLicense: formData.seedLicense || null,
        pesticideLicense: formData.pesticideLicense || null,
        fertiliserLicense: formData.fertiliserLicense || null,
      };
      await fpoAPI.updateInputShop(fpoId, editing.id, payload);
      setShowForm(false);
      setEditing(null);
      setFormData({ shopName: '', seedLicense: '', pesticideLicense: '', fertiliserLicense: '' });
      loadShops();
      alert('Input Shop updated successfully!');
    } catch (e) {
      alert('Error updating shop: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this input shop?')) return;
    try {
      await fpoAPI.deleteInputShop(fpoId, id);
      loadShops();
      alert('Input Shop deleted');
    } catch (e) {
      alert('Error deleting shop: ' + (e.response?.data?.message || e.message));
    }
  };

  const filtered = shops.filter(s =>
    (s.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.seedLicense || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.pesticideLicense || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.fertiliserLicense || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>FPO Input Shop List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button className="create-button" onClick={() => { setEditing(null); setFormData({ shopName: '', seedLicense: '', pesticideLicense: '', fertiliserLicense: '' }); setShowForm(true); }}>+ Create Input Shop</button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadShops();
                }}
                title="Refresh input shops list"
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
                  <th>Shop Name</th>
                  <th>Seed License</th>
                  <th>Pesticide License</th>
                  <th>Fertiliser License</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="loading-cell">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="no-data-cell">No data</td></tr>
                ) : filtered.map((shop, index) => (
                  <tr key={shop.id || index}>
                    <td>{shop.id || index + 1}</td>
                    <td>{shop.shopName || '-'}</td>
                    <td>{shop.seedLicense || '-'}</td>
                    <td>{shop.pesticideLicense || '-'}</td>
                    <td>{shop.fertiliserLicense || '-'}</td>
                    <td>
                      <div className="action-dropdown">
                        <button className="dropdown-toggle" onClick={() => setActiveDropdown(activeDropdown === shop.id ? null : shop.id)}>⋯</button>
                        {activeDropdown === shop.id && (
                          <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                            <button className="dropdown-item-enhanced edit-item" onClick={() => { handleEdit(shop); setActiveDropdown(null); }}>Edit</button>
                            <button className="dropdown-item-enhanced delete-item" onClick={() => { handleDelete(shop.id); setActiveDropdown(null); }}>Delete</button>
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
              <h3>{editing ? 'Edit Input Shop' : 'Add Input Shop'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditing(null); }}>×</button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={editing ? handleUpdate : handleCreate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Shop Name *</label>
                    <input 
                      type="text" 
                      value={formData.shopName} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9\s&.,()-]/g, '').substring(0, 100);
                        setFormData({...formData, shopName: value});
                      }}
                      onFocus={() => setFocusedField('shopName')}
                      onBlur={() => setFocusedField('')}
                      required 
                      maxLength={100}
                      className={`form-input ${!formData.shopName ? 'required-field' : ''}`}
                      placeholder="Enter shop name"
                    />
                    {focusedField === 'shopName' && !formData.shopName && <div className="field-hint">Please enter shop name (letters, numbers, spaces, and common business characters)</div>}
                  </div>
                  <div className="form-group">
                    <label>Seed License</label>
                    <input 
                      type="text" 
                      value={formData.seedLicense} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9\s&.,()-]/g, '').substring(0, 50);
                        setFormData({...formData, seedLicense: value});
                      }}
                      onFocus={() => setFocusedField('seedLicense')}
                      onBlur={() => setFocusedField('')}
                      maxLength={50}
                      className="form-input"
                      placeholder="Enter seed license number"
                    />
                    {focusedField === 'seedLicense' && !formData.seedLicense && <div className="field-hint">Please enter seed license number</div>}
                  </div>
                  <div className="form-group">
                    <label>Pesticide License</label>
                    <input 
                      type="text" 
                      value={formData.pesticideLicense} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9\s&.,()-]/g, '').substring(0, 50);
                        setFormData({...formData, pesticideLicense: value});
                      }}
                      onFocus={() => setFocusedField('pesticideLicense')}
                      onBlur={() => setFocusedField('')}
                      maxLength={50}
                      className="form-input"
                      placeholder="Enter pesticide license number"
                    />
                    {focusedField === 'pesticideLicense' && !formData.pesticideLicense && <div className="field-hint">Please enter pesticide license number</div>}
                  </div>
                  <div className="form-group">
                    <label>Fertiliser License</label>
                    <input 
                      type="text" 
                      value={formData.fertiliserLicense} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9\s&.,()-]/g, '').substring(0, 50);
                        setFormData({...formData, fertiliserLicense: value});
                      }}
                      onFocus={() => setFocusedField('fertiliserLicense')}
                      onBlur={() => setFocusedField('')}
                      maxLength={50}
                      className="form-input"
                      placeholder="Enter fertiliser license number"
                    />
                    {focusedField === 'fertiliserLicense' && !formData.fertiliserLicense && <div className="field-hint">Please enter fertiliser license number</div>}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className={`submit-btn ${!formData.shopName ? 'disabled' : ''}`} disabled={!formData.shopName}>{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOInputShopModal;
