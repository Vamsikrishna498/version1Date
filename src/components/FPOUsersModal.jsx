import React, { useEffect, useState } from 'react';
import { fpoUsersAPI } from '../api/apiService';
import PasswordInput from './PasswordInput';

// Restrict to FPO-scoped roles only
const USER_TYPES = ['FPO', 'EMPLOYEE', 'FARMER'];

const FPOUsersModal = ({ isOpen, onClose, fpoId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ email: '', phoneNumber: '', firstName: '', lastName: '', role: '', password: '' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { if (isOpen && fpoId) load(); }, [isOpen, fpoId]);
  useEffect(() => { const cb = (e)=>{ if (activeDropdown && !e.target.closest('.action-dropdown')) setActiveDropdown(null); }; document.addEventListener('mousedown', cb); return ()=>document.removeEventListener('mousedown', cb); }, [activeDropdown]);

  const load = async () => {
    try { setLoading(true); const res = await fpoUsersAPI.list(fpoId); const data = res?.data || res || []; setUsers(Array.isArray(data) ? data : []);} finally { setLoading(false);} };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await fpoUsersAPI.create(fpoId, formData); setShowForm(false); setFormData({ email: '', phoneNumber: '', firstName: '', lastName: '', role: '', password: '' }); setTimeout(load, 300);} catch (e2) { alert('Error creating user: ' + (e2.response?.data?.message || e2.message)); }
  };

  const toggleActive = async (user) => {
    // Optimistic update; don't revert unless request fails
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: (u.status === 'APPROVED' ? 'REJECTED' : 'APPROVED') } : u));
    try { await fpoUsersAPI.toggleActive(fpoId, user.id, !(user.status === 'APPROVED')); } catch (e2) { alert('Error updating status: ' + (e2.response?.data?.message || e2.message)); load(); }
  };

  const openPasswordModal = (u) => { setPasswordUser(u); setNewPassword(''); setShowPasswordModal(true); };
  const submitPassword = async (e) => {
    e.preventDefault();
    try { await fpoUsersAPI.updatePassword(fpoId, passwordUser.id, newPassword); setShowPasswordModal(false); alert('Password updated'); }
    catch (e2) { alert('Error updating password: ' + (e2.response?.data?.message || e2.message)); }
  };

  const filtered = users.filter(u => ((u.firstName||'') + ' ' + (u.lastName||'')).toLowerCase().includes(searchTerm.toLowerCase()) || (u.email||'').toLowerCase().includes(searchTerm.toLowerCase()) || (u.phoneNumber||'').includes(searchTerm));

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>FPO's Users List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button className="create-button" onClick={()=>{ setEditing(null); setFormData({ email: '', phoneNumber: '', firstName: '', lastName: '', role: '', password: '' }); setShowForm(true); }}>+ Create FPO User</button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  load();
                }}
                title="Refresh FPO users list"
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
                  <th>Cust Id</th>
                  <th>Full name</th>
                  <th>User Type</th>
                  <th>Email</th>
                  <th>Phone number</th>
                  <th>Join Date</th>
                  <th>Active Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (<tr><td colSpan="8" className="loading-cell">Loading...</td></tr>) :
                 filtered.length === 0 ? (<tr><td colSpan="8" className="no-data-cell">No data</td></tr>) :
                 filtered.map((u, index)=> (
                  <tr key={u.id || index}>
                    <td>{u.id || index + 1}</td>
                    <td>{`${u.firstName||''} ${u.lastName||''}`}</td>
                    <td>{u.role || '-'}</td>
                    <td>{u.email || '-'}</td>
                    <td>{u.phoneNumber || '-'}</td>
                    <td>{u.createdAt || '-'}</td>
                    <td>
                      <label className="status-toggle">
                        <input type="checkbox" checked={u.status === 'APPROVED'} onChange={()=>toggleActive(u)} />
                        <span className="status-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-dropdown">
                        <button className="dropdown-toggle" onClick={()=>setActiveDropdown(activeDropdown===u.id?null:u.id)}>⋯</button>
                        {activeDropdown===u.id && (
                          <div className={`dropdown-menu ${index>=2?'dropdown-menu-bottom':'dropdown-menu-top'}`}>
                            <button className="dropdown-item-enhanced edit-item" onClick={()=>{ setEditing(u); setFormData({ email: u.email, phoneNumber: u.phoneNumber, firstName: u.firstName, lastName: u.lastName, role: u.role, password: '' }); setShowForm(true); setActiveDropdown(null); }}>Edit</button>
                            <button className="dropdown-item-enhanced edit-item" onClick={()=>{ openPasswordModal(u); setActiveDropdown(null); }}>Edit Password</button>
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
              <h3>Add User</h3>
              <button className="close-btn" onClick={()=>{ setShowForm(false); }}>×</button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-grid">
                  <div className="form-group"><label>Email *</label><input type="email" value={formData.email} onChange={(e)=>setFormData({...formData,email:e.target.value})} required className={!formData.email?'required-field':''} /></div>
                  <div className="form-group"><label>Phone Number *</label><input type="tel" value={formData.phoneNumber} onChange={(e)=>setFormData({...formData,phoneNumber:e.target.value})} required /></div>
                  <div className="form-group"><label>First Name *</label><input value={formData.firstName} onChange={(e)=>setFormData({...formData,firstName:e.target.value})} required /></div>
                  <div className="form-group"><label>Last Name *</label><input value={formData.lastName} onChange={(e)=>setFormData({...formData,lastName:e.target.value})} required /></div>
                  <div className="form-group"><label>User Type *</label>
                    <select value={formData.role} onChange={(e)=>setFormData({...formData,role:e.target.value})} required className={!formData.role?'required-field':''}>
                      <option value="">Select</option>
                      {USER_TYPES.map(t=> (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                  <div className="form-group"><label>Password *</label><PasswordInput value={formData.password} onChange={(e)=>setFormData({...formData,password:e.target.value})} required /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={()=>setShowForm(false)}>Cancel</button>
                  <button type="submit" className={`submit-btn ${!formData.email||!formData.phoneNumber||!formData.firstName||!formData.lastName||!formData.role||!formData.password?'disabled':''}`} disabled={!formData.email||!formData.phoneNumber||!formData.firstName||!formData.lastName||!formData.role||!formData.password}>Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>Update Password</h3>
              <button className="close-btn" onClick={()=>setShowPasswordModal(false)}>×</button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={submitPassword}>
                <div className="form-grid">
                  <div className="form-group"><label>Enter First name *</label><input value={passwordUser?.firstName||''} disabled /></div>
                  <div className="form-group"><label>Enter Last name *</label><input value={passwordUser?.lastName||''} disabled /></div>
                  <div className="form-group"><label>Enter email *</label><input value={passwordUser?.email||''} disabled /></div>
                  <div className="form-group" style={{gridColumn:'1 / span 2'}}><label>Enter Password *</label><PasswordInput value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={()=>setShowPasswordModal(false)}>Close</button>
                  <button type="submit" className={`submit-btn ${!newPassword?'disabled':''}`} disabled={!newPassword}>Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOUsersModal;
