import React, { useState, useEffect } from 'react';
import { idCardAPI, employeeAPI, employeeSelfAPI, farmersAPI } from '../api/apiService';
import IdCardViewer from './IdCardViewer';
import '../styles/MyIdCard.css';

const MyIdCard = ({ userId, userType }) => {
  const [idCards, setIdCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [uploading, setUploading] = useState(false);
  // state removed: currentPhotoFileName

  useEffect(() => {
    if (userId) {
      fetchMyIdCards();
    }
  }, [userId]);

  // Load current employee photo for quick visual verification
  // Optionally pre-load photo name for validation

  const fetchMyIdCards = async () => {
    try {
      setLoading(true);
      // Determine correct holder id
      let holderId = userId;
      if (userType === 'EMPLOYEE') {
        try {
          const profile = await employeeAPI.getProfile();
          if (profile?.id) holderId = profile.id;
        } catch (e) {
          console.warn('Failed to resolve employee profile id, falling back to userId', e);
        }
      }

      const response = await idCardAPI.getMyIdCards(String(holderId));
      // Debug: allow both single object and paged arrays
      if (response && (response.cardId || response.pngUrl || response.pdfUrl)) {
        setIdCards([response]);
        return;
      }
      const listRaw = Array.isArray(response)
        ? response
        : (response?.content || response?.items || response?.data || []);
      const list = Array.isArray(listRaw) ? listRaw : [];
      // Prefer cards that belong to this holder id first
      let filtered = list.filter((c) => String(c.holderId) === String(holderId));
      // If none match strictly by holder, fall back to type-based filtering but be tolerant
      if ((!filtered || filtered.length === 0) && userType) {
        const acceptedTypes = ['EMPLOYEE', 'EMP', 'EMPLOYEE_CARD', 'FARMER', 'FAM', 'FARMER_CARD'];
        const wantEmp = userType === 'EMPLOYEE';
        filtered = list.filter((c) => {
          const t = String(c.cardType || '').toUpperCase();
          return wantEmp ? acceptedTypes.includes(t) && t.includes('EMP') : acceptedTypes.includes(t) && t.includes('FARM');
        });
      }

      // Fallback: if nothing returned for holder, fetch by type and match holderId
      // Avoid calling admin-only endpoints from employee UI. If not found, retry with fallback holder id.
      if ((!filtered || filtered.length === 0) && userType === 'EMPLOYEE') {
        try {
          if (String(holderId) !== String(userId)) {
            const res2 = await idCardAPI.getIdCardsByHolder(String(userId));
            const arrRaw = Array.isArray(res2) ? res2 : (res2?.content || res2?.items || res2?.data || []);
            const arr = Array.isArray(arrRaw) ? arrRaw : [];
            const matches = arr.filter((c) => String(c.holderId) === String(userId));
            filtered = matches;
          }
        } catch (e) {
          // ignore
        }
      }
      // Final fallback: if still empty, show any cards at all (helps diagnose)
      if ((!filtered || filtered.length === 0) && list.length > 0) {
        filtered = list;
      }

      setIdCards(filtered || []);
    } catch (err) {
      setError('Failed to load ID cards');
      console.error('Error fetching ID cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCard = (cardId) => {
    setSelectedCard(cardId);
  };

  const handleDownloadPDF = async (cardId) => {
    try {
      const response = await idCardAPI.downloadIdCardPdf(cardId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_idcard_${cardId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleDownloadPNG = async (cardId) => {
    try {
      const response = await idCardAPI.downloadIdCardPng(cardId);
      const blob = new Blob([response], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_idcard_${cardId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PNG:', err);
      alert('Failed to download PNG');
    }
  };

  const handleUploadPhoto = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!/image\/(png|jpeg|jpg)/.test(file.type)) {
        alert('Please select a JPG or PNG image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Max 5 MB.');
        return;
      }

      setUploading(true);

      // holder id not needed here; API uses profile id internally
      if (userType === 'EMPLOYEE') {
        // Resolve employee entity id
        let empId = userId;
        try {
          const profile = await employeeAPI.getProfile();
          if (profile?.id) empId = profile.id;
        } catch {}
        await employeeSelfAPI.uploadPhoto(empId, file);
        // no-op
        // Optionally refresh profile cache after upload
      } else if (userType === 'FARMER') {
        // Farmer endpoint: PATCH /api/farmers/{id}/photo
        await farmersAPI.uploadPhoto(userId, file);
        // no-op
      }

      // Refresh list to ensure latest profile photo is used during rendering
      setTimeout(fetchMyIdCards, 300);
      alert('Photo updated successfully.');
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      ACTIVE: 'status-active',
      EXPIRED: 'status-expired',
      REVOKED: 'status-revoked'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-unknown'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="my-id-card">
        <div className="loading">Loading your ID cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-id-card">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (idCards.length === 0) {
    const tryGenerate = async () => {
      try {
        let holderId = userId;
        if (userType === 'EMPLOYEE') {
          try {
            const profile = await employeeAPI.getProfile();
            if (profile?.id) holderId = profile.id;
          } catch {}
        }
        await idCardAPI.generateMyEmployeeIdCard(String(holderId));
        setTimeout(fetchMyIdCards, 500);
        alert('Requested ID card generation. If permitted, it will appear shortly.');
      } catch (e) {
        console.error('ID card generate failed:', e);
        alert(e?.response?.data?.message || 'Unable to generate ID card. Please contact admin.');
      }
    };

    return (
      <div className="my-id-card">
        <div className="no-id-cards">
          <div className="no-id-cards-icon">🆔</div>
          <h3>No ID Card Found</h3>
          <p>Your ID card will be generated automatically after your registration is approved.</p>
          <p>Please contact your administrator if you believe this is an error.</p>
          <div style={{ marginTop: 12 }}>
            <button className="action-btn" onClick={tryGenerate}>Generate my ID card</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-id-card">
      <div className="id-card-header">
        <h2>My ID Card</h2>
        <p>View and download your digital ID card</p>
      </div>

      <div className="id-cards-list">
        <div style={{ marginBottom: 12 }}>
          <label className="action-btn" style={{ cursor: 'pointer' }}>
            <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={handleUploadPhoto} disabled={uploading} />
            {uploading ? 'Uploading...' : 'Change Photo'}
          </label>
        </div>
        {idCards.map((card) => (
          <div key={String(card.id || card.cardId || `${card.holderId}-${card.cardType || 'CARD'}`)} className="id-card-item">
            <div className="card-main">
              <div className="card-info">
                <div className="card-id">
                  <h3>{card.cardId}</h3>
                  {getStatusBadge(card.status)}
                </div>
                
                <div className="card-details">
                  {card.cardType && <p><strong>Type:</strong> {card.cardType}</p>}
                  {card.generatedAt && (
                    <p><strong>Generated:</strong> {new Date(card.generatedAt).toLocaleDateString()}</p>
                  )}
                  {card.expiresAt && (
                    <p><strong>Expires:</strong> {new Date(card.expiresAt).toLocaleDateString()}</p>
                  )}
                  {(card.village || card.district || card.state) && (
                    <p><strong>Location:</strong> {card.village || ''}{card.village && (card.district || card.state) ? ', ' : ''}{card.district || ''}{card.district && card.state ? ', ' : ''}{card.state || ''}</p>
                  )}
                </div>
              </div>
              
              <div className="card-actions">
                <button onClick={() => handleViewCard(card.cardId)} className="action-btn view">
                  <span>👁️</span> View
                </button>
                <button onClick={() => handleDownloadPDF(card.cardId)} className="action-btn download pdf">
                  <span>📄</span> PDF
                </button>
                <button onClick={() => handleDownloadPNG(card.cardId)} className="action-btn download png">
                  <span>🖼️</span> PNG
                </button>
              </div>
            </div>
            
            {card.status === 'EXPIRED' && (
              <div className="expired-notice">
                <span>⚠️</span> This ID card has expired. Please contact your administrator for renewal.
              </div>
            )}
            
            {card.status === 'REVOKED' && (
              <div className="revoked-notice">
                <span>🚫</span> This ID card has been revoked. Please contact your administrator for assistance.
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCard && (
        <div style={{ marginTop: 16 }}>
          <IdCardViewer cardId={selectedCard} onClose={() => setSelectedCard(null)} inlineMode />
        </div>
      )}
    </div>
  );
};

export default MyIdCard;
