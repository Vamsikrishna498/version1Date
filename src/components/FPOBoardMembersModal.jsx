import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fpoAPI } from '../api/apiService';

const FPOBoardMembersModal = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRefs = useRef({});

  // Form state for creating/editing board members
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phoneNumber: '',
    email: '',
    linkedinProfileUrl: '',
    location: '',
    role: 'MEMBER'
  });

  useEffect(() => {
    if (isOpen && fpoId) {
      loadBoardMembers();
    }
  }, [isOpen, fpoId]);

  // Calculate dropdown position with viewport awareness
  const calculateDropdownPosition = (buttonElement) => {
    if (!buttonElement) return { top: 0, left: 0 };

    const rect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Expected dropdown size
    const MENU_WIDTH = 120;
    const MENU_HEIGHT = 80;
    const GAP = 8;

    // Default: place below and right-aligned to the button
    let top = rect.bottom + GAP + window.scrollY;
    let left = rect.right - MENU_WIDTH + window.scrollX;

    // If dropdown would overflow bottom, place it above the button
    if (top + MENU_HEIGHT > window.scrollY + viewportHeight) {
      top = rect.top - MENU_HEIGHT - GAP + window.scrollY;
    }

    // Clamp horizontally within the viewport
    const padding = 8;
    const maxLeft = window.scrollX + viewportWidth - MENU_WIDTH - padding;
    const minLeft = window.scrollX + padding;
    if (left > maxLeft) left = maxLeft;
    if (left < minLeft) left = minLeft;

    // Clamp top
    if (top < window.scrollY + padding) {
      top = window.scrollY + padding;
    }

    return { top, left };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const loadBoardMembers = async () => {
    try {
      setLoading(true);
      console.log('Loading board members for FPO ID:', fpoId);
      const response = await fpoAPI.getFPOBoardMembers(fpoId);
      console.log('Board members response:', response);
      
      // Handle different response formats
      const members = response.data || response || [];
      console.log('Board members data:', members);
      console.log('First member details:', members[0]);
      console.log('Member qualification:', members[0]?.qualification);
      console.log('Member address:', members[0]?.address);
      setBoardMembers(Array.isArray(members) ? members : []);
    } catch (error) {
      console.error('Error loading board members:', error);
      setBoardMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.phoneNumber) {
        alert('Name and phone number are required fields');
        return;
      }

      // Clean phone number - remove any non-digits and ensure it's exactly 10 digits
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, '');
      if (cleanPhoneNumber.length !== 10) {
        alert('Phone number must be exactly 10 digits');
        return;
      }

      // Validate email format if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert('Please provide a valid email address');
        return;
      }

      // Map frontend form data to backend DTO format
      const boardMemberData = {
        name: formData.name.trim(),
        phoneNumber: cleanPhoneNumber,
        email: formData.email?.trim() || null,
        role: formData.role, // This should be one of: CHAIRMAN, VICE_CHAIRMAN, SECRETARY, TREASURER, MEMBER, CEO
        address: formData.location?.trim() || null,
        qualification: formData.designation?.trim() || null,
        experience: null,
        photoFileName: null,
        documentFileName: null,
        remarks: formData.linkedinProfileUrl?.trim() ? `LinkedIn: ${formData.linkedinProfileUrl.trim()}` : null,
        status: 'ACTIVE' // Set default status
      };
      
      console.log('Creating board member with data:', boardMemberData);
      console.log('FPO ID:', fpoId);
      console.log('Phone number validation:', {
        original: formData.phoneNumber,
        cleaned: cleanPhoneNumber,
        length: cleanPhoneNumber.length
      });
      console.log('Role validation:', {
        role: formData.role,
        type: typeof formData.role
      });
      
      const response = await fpoAPI.addBoardMember(fpoId, boardMemberData);
      console.log('Board member created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        name: '',
        designation: '',
        phoneNumber: '',
        email: '',
        linkedinProfileUrl: '',
        location: '',
        role: 'MEMBER'
      });
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadBoardMembers();
      }, 500);
      
      alert('Board member created successfully!');
    } catch (error) {
      console.error('Error creating board member:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      let errorMessage = 'Error creating board member: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage += 'Invalid data provided. Please check all fields and try again.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    
    // Extract LinkedIn URL from remarks if it exists
    let linkedinUrl = '';
    if (member.remarks && member.remarks.includes('LinkedIn:')) {
      linkedinUrl = member.remarks.replace('LinkedIn:', '').trim();
    }
    
    setFormData({
      name: member.name || '',
      designation: member.qualification || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
      linkedinProfileUrl: linkedinUrl,
      location: member.address || '',
      role: member.role || 'MEMBER'
    });
    setShowCreateForm(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.phoneNumber) {
        alert('Name and phone number are required fields');
        return;
      }

      // Clean phone number - remove any non-digits and ensure it's exactly 10 digits
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, '');
      if (cleanPhoneNumber.length !== 10) {
        alert('Phone number must be exactly 10 digits');
        return;
      }

      // Validate email format if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert('Please provide a valid email address');
        return;
      }

      // Map frontend form data to backend DTO format
      const boardMemberData = {
        name: formData.name.trim(),
        phoneNumber: cleanPhoneNumber,
        email: formData.email?.trim() || null,
        role: formData.role, // This should be one of: CHAIRMAN, VICE_CHAIRMAN, SECRETARY, TREASURER, MEMBER, CEO
        address: formData.location?.trim() || null,
        qualification: formData.designation?.trim() || null,
        experience: null,
        photoFileName: null,
        documentFileName: null,
        remarks: formData.linkedinProfileUrl?.trim() ? `LinkedIn: ${formData.linkedinProfileUrl.trim()}` : null,
        status: 'ACTIVE' // Set default status
      };
      
      console.log('Updating board member with data:', boardMemberData);
      console.log('Board member ID:', editingMember.id);
      
      await fpoAPI.updateBoardMember(fpoId, editingMember.id, boardMemberData);
      setShowCreateForm(false);
      setEditingMember(null);
      setFormData({
        name: '',
        designation: '',
        phoneNumber: '',
        email: '',
        linkedinProfileUrl: '',
        location: '',
        role: 'MEMBER'
      });
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadBoardMembers();
      }, 500);
      
      alert('Board member updated successfully!');
    } catch (error) {
      console.error('Error updating board member:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      let errorMessage = 'Error updating board member: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage += 'Invalid data provided. Please check all fields and try again.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleStatusUpdate = async (memberId, newStatus) => {
    try {
      console.log('Updating board member status:', memberId, 'to', newStatus);
      
      // Update the local state immediately for better UX
      setBoardMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, status: newStatus } : m
      ));
      
      // Find the member to get their current data
      const member = boardMembers.find(m => m.id === memberId);
      if (!member) {
        alert('Board member not found!');
        return;
      }

      // Create update data with the new status
      const updateData = {
        name: member.name,
        phoneNumber: member.phoneNumber,
        email: member.email || null,
        role: member.role,
        address: member.address || null,
        qualification: member.qualification || null,
        experience: member.experience || null,
        photoFileName: member.photoFileName || null,
        documentFileName: member.documentFileName || null,
        remarks: member.remarks || null,
        status: newStatus
      };

      console.log('Update data:', updateData);
      
      // Update the board member with new status
      const response = await fpoAPI.updateBoardMember(fpoId, memberId, updateData);
      console.log('Update response:', response);
      
      alert(`Board member status updated to ${newStatus}!`);
      
      // Don't reload immediately to prevent status reversion
      // The local state update should be sufficient
    } catch (error) {
      console.error('Error updating board member status:', error);
      alert('Error updating board member status: ' + (error.response?.data?.message || error.message));
      
      // Revert the local state on error
      setBoardMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, status: m.status } : m
      ));
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this board member?')) {
      try {
        await fpoAPI.removeBoardMember(fpoId, memberId);
        
        // Add a small delay to ensure backend processing
        setTimeout(() => {
          loadBoardMembers();
        }, 500);
        
        alert('Board member deleted successfully!');
      } catch (error) {
        console.error('Error deleting board member:', error);
        alert('Error deleting board member: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filteredMembers = boardMembers.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.qualification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phoneNumber?.includes(searchTerm);
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content board-members-modal">
        <div className="modal-header">
          <h2>Board Members List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button 
                className="create-button"
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingMember(null);
                  setFormData({
                    name: '',
                    designation: '',
                    phoneNumber: '',
                    location: '',
                    email: '',
                    role: 'MEMBER'
                  });
                }}
              >
                + Create Board Members
              </button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadBoardMembers();
                }}
                title="Refresh board members list"
              >
                <i className="fas fa-sync-alt"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Section - Hidden */}
          <div className="filter-section" style={{ display: 'none' }}>
            <div className="filter-label">
              <span>Filter</span>
            </div>
            <div className="filter-inputs">
              <input
                type="text"
                placeholder="Search here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="date-range-container">
                <input
                  type="text"
                  placeholder="Enter a date range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="date-range-input"
                />
                <span className="calendar-icon">📅</span>
                <div className="date-format-hint">MM/DD/YYYY - MM/DD/YYYY</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="board-members-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Phone number</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="loading-cell">Loading...</td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data-cell">No data matching the filter</td>
                  </tr>
                ) : (
                  filteredMembers.map((member, index) => {
                    console.log('Rendering member:', member);
                    console.log('Qualification:', member.qualification);
                    console.log('Address:', member.address);
                    console.log('Member keys:', Object.keys(member));
                    return (
                    <tr key={member.id || index}>
                      <td>{member.id || `BM${index + 1}`}</td>
                      <td>{member.name || '-'}</td>
                      <td>{member.qualification || '-'}</td>
                      <td>{member.phoneNumber || '-'}</td>
                      <td>{member.address || '-'}</td>
                      <td>
                        <div className="status-toggle-container">
                          <label className="status-toggle">
                            <input
                              type="checkbox"
                              checked={member.status === 'ACTIVE'}
                              onChange={(e) => {
                                const newStatus = e.target.checked ? 'ACTIVE' : 'INACTIVE';
                                handleStatusUpdate(member.id, newStatus);
                              }}
                            />
                            <span className="status-slider">
                              <span className="status-text">
                                {member.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div className="action-dropdown">
                          <button 
                            ref={(el) => { dropdownRefs.current[member.id] = el; }}
                            className="dropdown-toggle"
                            onClick={(e) => {
                              const newActiveDropdown = activeDropdown === member.id ? null : member.id;
                              setActiveDropdown(newActiveDropdown);
                              if (newActiveDropdown) {
                                const position = calculateDropdownPosition(e.currentTarget);
                                setDropdownPosition(position);
                              }
                            }}
                          >
                            ⋯
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="form-modal-overlay">
            <div className="form-modal-content">
              <div className="form-modal-header">
                <h3>{editingMember ? 'Edit Board Member' : 'Create Board Member'}</h3>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingMember(null);
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className={!formData.name ? 'required-field' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      required
                      className={!formData.designation ? 'required-field' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      required
                      className={!formData.phoneNumber ? 'required-field' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={formData.linkedinProfileUrl}
                      onChange={(e) => setFormData({...formData, linkedinProfileUrl: e.target.value})}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`submit-btn ${!formData.name || !formData.designation || !formData.phoneNumber ? 'disabled' : ''}`}
                    disabled={!formData.name || !formData.designation || !formData.phoneNumber}
                  >
                    {editingMember ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Portal-based Dropdown Menu */}
        {activeDropdown && createPortal(
          <div 
            className="board-members-dropdown"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 99999
            }}
          >
            <button 
              className="dropdown-edit-btn"
              onClick={() => {
                const member = boardMembers.find(m => m.id === activeDropdown);
                if (member) handleEditMember(member);
                setActiveDropdown(null);
              }}
            >
              Edit
            </button>
            <button 
              className="dropdown-delete-btn"
              onClick={() => {
                handleDeleteMember(activeDropdown);
                setActiveDropdown(null);
              }}
            >
              Delete
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default FPOBoardMembersModal;
