import React, { useState } from 'react';
import '../styles/Forms.css';

const DeleteModal = ({ item, type, onClose, onConfirm, inlineMode = false }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      await onConfirm({ ...item, reason });
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemName = () => {
    if (type === 'farmer') {
      return item?.name || 'Farmer';
    } else if (type === 'employee') {
      return item?.name || 'Employee';
    } else if (type === 'fpo') {
      return item?.fpoName || item?.name || 'FPO';
    } else if (type === 'registration') {
      return item?.name || 'Registration';
    }
    return 'Item';
  };

  const getItemDetails = () => {
    if (type === 'farmer') {
      return {
        name: item?.name,
        phone: item?.phone,
        state: item?.state,
        district: item?.district
      };
    } else if (type === 'employee') {
      return {
        name: item?.name,
        email: item?.email,
        phone: item?.phone,
        designation: item?.designation
      };
    } else if (type === 'fpo') {
      return {
        'FPO ID': item?.fpoId,
        'FPO Name': item?.fpoName,
        'CEO Name': item?.ceoName,
        'Phone Number': item?.phoneNumber,
        'Join Date': item?.joinDate,
        'Status': item?.status
      };
    } else if (type === 'registration') {
      return {
        name: item?.name,
        email: item?.email,
        phone: item?.phoneNumber,
        role: item?.role,
        status: item?.status
      };
    }
    return {};
  };

  const details = getItemDetails();

  if (inlineMode) {
    return (
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', zIndex: 1100 }}>
        <div className="modal-content" style={{ marginTop: 24, width: '100%', maxWidth: 1100 }}>
          <div className="modal-header">
            <h2>Confirm Delete</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <h3>Are you sure you want to delete this {type}?</h3>
            <p>This action cannot be undone.</p>
          </div>

          <div className="item-details">
            <h4>{getItemName()} Details:</h4>
            <div className="details-grid">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <span className="value">{value || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="reason">Reason for Deletion (Optional)</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-danger"
                disabled={loading}
              >
                {loading ? 'Deleting...' : `Delete ${getItemName()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', zIndex: 1100 }}>
      <div className="modal-content" style={{ marginTop: 24 }}>
        <div className="modal-header">
          <h2>Confirm Delete</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="delete-warning">
          <div className="warning-icon">⚠️</div>
          <h3>Are you sure you want to delete this {type}?</h3>
          <p>This action cannot be undone.</p>
        </div>

        <div className="item-details">
          <h4>{getItemName()} Details:</h4>
          <div className="details-grid">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="detail-item">
                <span className="label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <span className="value">{value || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="reason">Reason for Deletion (Optional)</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for deletion..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-danger"
              disabled={loading}
            >
              {loading ? 'Deleting...' : `Delete ${getItemName()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteModal; 