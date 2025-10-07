import React, { useState } from 'react';
import '../styles/RegistrationApproval.css';

const RegistrationApprovalModal = ({ 
  isOpen, 
  onClose, 
  registration, 
  onApprove, 
  onReject 
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !registration) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(registration.id);
      onClose();
    } catch (error) {
      console.error('Error approving registration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(registration.id, rejectionReason);
      onClose();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'status-pending',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected'
    };
    
    return (
      <span className={`status-badge ${statusColors[status] || 'status-pending'}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'FARMER': 'role-farmer',
      'EMPLOYEE': 'role-employee',
      'FPO': 'role-fpo'
    };
    
    return (
      <span className={`role-badge ${roleColors[role] || 'role-default'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="registration-approval-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Registration Approval</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="registration-info">
            <div className="info-row">
              <label>Registration ID:</label>
              <span>{registration.id}</span>
            </div>
            <div className="info-row">
              <label>User Type:</label>
              {getRoleBadge(registration.role)}
            </div>
            <div className="info-row">
              <label>Status:</label>
              {getStatusBadge(registration.status)}
            </div>
            <div className="info-row">
              <label>Registration Date:</label>
              <span>{new Date(registration.registrationDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="user-details">
            <h3>User Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Name:</label>
                <span>{registration.fullName}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{registration.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{registration.phone}</span>
              </div>
              <div className="detail-item">
                <label>State:</label>
                <span>{registration.state}</span>
              </div>
              <div className="detail-item">
                <label>District:</label>
                <span>{registration.district}</span>
              </div>
              {registration.role === 'FARMER' && (
                <>
                  <div className="detail-item">
                    <label>Land Area:</label>
                    <span>{registration.landArea} acres</span>
                  </div>
                  <div className="detail-item">
                    <label>Crop Type:</label>
                    <span>{registration.cropType}</span>
                  </div>
                </>
              )}
              {registration.role === 'EMPLOYEE' && (
                <>
                  <div className="detail-item">
                    <label>Department:</label>
                    <span>{registration.department}</span>
                  </div>
                  <div className="detail-item">
                    <label>Designation:</label>
                    <span>{registration.designation}</span>
                  </div>
                </>
              )}
              {registration.role === 'FPO' && (
                <>
                  <div className="detail-item">
                    <label>Organization Name:</label>
                    <span>{registration.organizationName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Registration Number:</label>
                    <span>{registration.registrationNumber}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {registration.status === 'PENDING' && (
            <div className="approval-actions">
              <h3>Approval Actions</h3>
              <div className="action-buttons">
                <button 
                  className="approve-btn"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Approving...' : 'Approve Registration'}
                </button>
                <button 
                  className="reject-btn"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Registration'}
                </button>
              </div>
              
              <div className="rejection-reason">
                <label htmlFor="rejection-reason">Rejection Reason (Required for rejection):</label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows="3"
                />
              </div>
            </div>
          )}

          {registration.status === 'REJECTED' && (
            <div className="rejection-info">
              <h3>Rejection Information</h3>
              <div className="info-row">
                <label>Rejected By:</label>
                <span>{registration.rejectedBy}</span>
              </div>
              <div className="info-row">
                <label>Rejection Date:</label>
                <span>{new Date(registration.rejectionDate).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <label>Rejection Reason:</label>
                <span className="rejection-reason-text">{registration.rejectionReason}</span>
              </div>
            </div>
          )}

          {registration.status === 'APPROVED' && (
            <div className="approval-info">
              <h3>Approval Information</h3>
              <div className="info-row">
                <label>Approved By:</label>
                <span>{registration.approvedBy}</span>
              </div>
              <div className="info-row">
                <label>Approval Date:</label>
                <span>{new Date(registration.approvalDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationApprovalModal; 