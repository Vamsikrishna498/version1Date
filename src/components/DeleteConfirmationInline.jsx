import React, { useState } from 'react';
import '../styles/Dashboard.css';

const DeleteConfirmationInline = ({ item, type, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      await onConfirm({ ...item, reason });
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
        'Name': item?.name,
        'Phone': item?.phone,
        'State': item?.state,
        'District': item?.district
      };
    } else if (type === 'employee') {
      return {
        'Name': item?.name,
        'Email': item?.email,
        'Phone': item?.phone,
        'Designation': item?.designation
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
        'Name': item?.name,
        'Email': item?.email,
        'Phone': item?.phoneNumber,
        'Role': item?.role,
        'Status': item?.status
      };
    }
    return {};
  };

  const details = getItemDetails();

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Warning Section */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '32px',
          flexShrink: 0
        }}>
          ⚠️
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#92400e'
          }}>
            Are you sure you want to delete this {type}?
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#78350f'
          }}>
            This action cannot be undone.
          </p>
        </div>
      </div>

      {/* Item Details Section */}
      <div style={{
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {type?.toUpperCase()}
          </span>
          Details:
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {Object.entries(details).map(([key, value]) => (
            <div key={key} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {key}:
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                padding: '8px 12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                {value || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reason Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Reason for Deletion (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for deletion..."
            rows="4"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '8px'
        }}>
          <button 
            type="button" 
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#4b5563';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6b7280';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                Delete {getItemName()}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeleteConfirmationInline;

