import React, { useEffect, useState } from 'react';
import { fpoAPI } from '../api/apiService';

const FPOProductsModal = ({ isOpen, onClose, fpoId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ inputShop: '', categoryId: '', productName: '', quantitySold: '' });
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => { if (isOpen && fpoId) { load(); preload(); } }, [isOpen, fpoId]);
  useEffect(() => { const cb = (e)=>{ if (activeDropdown && !e.target.closest('.action-dropdown')) setActiveDropdown(null); }; document.addEventListener('mousedown', cb); return ()=>document.removeEventListener('mousedown', cb); }, [activeDropdown]);

  const preload = async () => {
    try {
      const [shopsRes, catRes] = await Promise.all([
        fpoAPI.getFPOInputShops(fpoId),
        fpoAPI.getFPOProductCategories(fpoId)
      ]);
      setShops(shopsRes?.data || shopsRes || []);
      setCategories(catRes?.data || catRes || []);
    } catch (e) {}
  };

  const load = async () => {
    try { setLoading(true); const res = await fpoAPI.getFPOProducts(fpoId); const data = res?.data || res || []; setProducts(Array.isArray(data) ? data : []);} finally { setLoading(false);} };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productName: formData.productName,
        description: `Sold via ${formData.inputShop}`,
        brand: formData.inputShop || 'N/A',
        unit: 'MT',
        price: 0.01,
        stockQuantity: Math.max(0, Math.floor(parseFloat(formData.quantitySold) || 0)),
        minimumStock: 0,
        supplier: formData.inputShop || 'N/A',
        supplierContact: null,
        supplierAddress: null,
        batchNumber: null,
        expiryDate: null,
        photoFileName: null,
        remarks: null,
        discountPercentage: 0,
        taxPercentage: 0,
      };
      await fpoAPI.createProduct(fpoId, payload);
      setShowForm(false); setFormData({ inputShop: '', category: '', productName: '', quantitySold: '' }); setTimeout(load, 300);
    } catch (e2) { alert('Error creating product: ' + (e2.response?.data?.message || e2.message)); }
  };

  const handleEdit = (p) => { setEditing(p); setFormData({ inputShop: p.brand || p.supplier || '', categoryId: (p.categoryId ?? '').toString(), productName: p.productName || '', quantitySold: (p.stockQuantity ?? '').toString() }); setShowForm(true); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productName: formData.productName,
        description: `Sold via ${formData.inputShop}`,
        brand: formData.inputShop || 'N/A',
        unit: 'MT',
        price: 0.01,
        stockQuantity: Math.max(0, Math.floor(parseFloat(formData.quantitySold) || 0)),
        minimumStock: 0,
        supplier: formData.inputShop || 'N/A',
        supplierContact: null,
        supplierAddress: null,
        batchNumber: null,
        expiryDate: null,
        photoFileName: null,
        remarks: null,
        discountPercentage: 0,
        taxPercentage: 0,
      };
      await fpoAPI.updateProduct(fpoId, editing.id, payload);
      setShowForm(false); setEditing(null); setFormData({ inputShop: '', category: '', productName: '', quantitySold: '' }); load();
    } catch (e2) { alert('Error updating product: ' + (e2.response?.data?.message || e2.message)); }
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete this product?')) return; try { await fpoAPI.deleteProduct(fpoId, id); load(); } catch (e2) { alert('Error deleting product: ' + (e2.response?.data?.message || e2.message)); } };

  const filtered = products.filter(p => (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>FPO Products List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button className="create-button" onClick={()=>{ setEditing(null); setFormData({ inputShop: '', category: '', productName: '', quantitySold: '' }); setShowForm(true); }}>+ Create Product</button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  load();
                }}
                title="Refresh products list"
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
                  <th>Input shop</th>
                  <th>Category</th>
                  <th>Product name</th>
                  <th>Quantity Sold</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (<tr><td colSpan="6" className="loading-cell">Loading...</td></tr>) :
                 filtered.length === 0 ? (<tr><td colSpan="6" className="no-data-cell">No data</td></tr>) :
                 filtered.map((p, index)=> (
                  <tr key={p.id || index + 1}>
                    <td>{p.id || index + 1}</td>
                    <td>{p.brand || p.supplier || '-'}</td>
                    <td>{p.categoryName || '-'}</td>
                    <td>{p.productName || '-'}</td>
                    <td>{(p.stockQuantity ?? 0).toFixed(2)}</td>
                    <td>
                      <div className="action-dropdown">
                        <button className="dropdown-toggle" onClick={()=>setActiveDropdown(activeDropdown === p.id ? null : p.id)}>⋯</button>
                        {activeDropdown === p.id && (
                          <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                            <button className="dropdown-item-enhanced edit-item" onClick={()=>{ handleEdit(p); setActiveDropdown(null); }}>Edit</button>
                            <button className="dropdown-item-enhanced delete-item" onClick={()=>{ handleDelete(p.id); setActiveDropdown(null); }}>Delete</button>
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
              <h3>{editing ? 'Edit Product Sold' : 'Add Product Sold'}</h3>
              <button className="close-btn" onClick={()=>{ setShowForm(false); setEditing(null); }}>×</button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={editing ? handleUpdate : handleCreate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Input Shop *</label>
                    <select value={formData.inputShop} onChange={(e)=>setFormData({ ...formData, inputShop: e.target.value })} required className={!formData.inputShop ? 'required-field' : ''}>
                      <option value="">Select Input Shop</option>
                      {shops.map(s => (<option key={s.id} value={s.shopName || s.name || s.id}>{s.shopName || s.name || s.id}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={formData.categoryId} onChange={(e)=>setFormData({ ...formData, categoryId: e.target.value })} required className={!formData.categoryId ? 'required-field' : ''}>
                      <option value="">Select Category</option>
                      {categories.map(c => (<option key={c.id} value={c.id}>{c.categoryName || c.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" value={formData.productName} onChange={(e)=>setFormData({ ...formData, productName: e.target.value })} required className={!formData.productName ? 'required-field' : ''} />
                  </div>
                  <div className="form-group">
                    <label>Quantity Sold (Last Year in MT) *</label>
                    <input type="number" min="0" step="0.01" value={formData.quantitySold} onChange={(e)=>setFormData({ ...formData, quantitySold: e.target.value })} required className={!formData.quantitySold ? 'required-field' : ''} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={()=>{ setShowForm(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className={`submit-btn ${!formData.inputShop || !formData.categoryId || !formData.productName || !formData.quantitySold ? 'disabled' : ''}`} disabled={!formData.inputShop || !formData.categoryId || !formData.productName || !formData.quantitySold}>{editing ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOProductsModal;
