import React, { useState, useEffect, useRef } from 'react';
import api from '../api/apiService';
import MyIdCard from '../components/MyIdCard';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import KYCModal from '../components/KYCModal';
import ViewFarmerRegistrationDetails from '../components/ViewFarmerRegistrationDetails';
import ViewEditEmployeeDetails from '../components/ViewEditEmployeeDetails';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import UserProfileDropdown from '../components/UserProfileDropdown';
import FPOList from '../components/FPOList';
import FPOCreationForm from '../components/FPOCreationForm';
import FPOEditModal from '../components/FPOEditModal';
import FPOEditForm from '../components/FPOEditForm';
import FPODetailModal from '../components/FPODetailModal';
import FPODetailsView from '../components/FPODetailsView';
import FPOBoardMembersView from '../components/FPOBoardMembersView';
import FPOFarmServicesModal from '../components/FPOFarmServicesModal';
import FPOFarmServicesView from '../components/FPOFarmServicesView';
import FPOInputShopModal from '../components/FPOInputShopModal';
import FPOInputShopView from '../components/FPOInputShopView';
import FPOProductCategoriesModal from '../components/FPOProductCategoriesModal';
import FPOProductCategoriesView from '../components/FPOProductCategoriesView';
import FPOProductsModal from '../components/FPOProductsModal';
import FPOProductsView from '../components/FPOProductsView';
import FPOCropEntriesModal from '../components/FPOCropEntriesModal';
import FPOTurnoverView from '../components/FPOTurnoverView';
import FPOCropEntriesView from '../components/FPOCropEntriesView';
import FPOUsersModal from '../components/FPOUsersModal';
import FPOUsersView from '../components/FPOUsersView';
import FPODashboard from '../pages/FPODashboard';
import { kycAPI, employeeAPI, farmersAPI, fpoAPI, idCardAPI } from '../api/apiService';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeePhoto, setEmployeePhoto] = useState('');
  const [employeeCardId, setEmployeeCardId] = useState('');
  const [assignedFarmers, setAssignedFarmers] = useState([]);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [showEditFarmerForm, setShowEditFarmerForm] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showKYCInline, setShowKYCInline] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showFarmerDetails, setShowFarmerDetails] = useState(false);
  const [showViewFarmerInline, setShowViewFarmerInline] = useState(false);
  const [selectedFarmerData, setSelectedFarmerData] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [idCardImageUrl, setIdCardImageUrl] = useState(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [loadingIdCard, setLoadingIdCard] = useState(false);
  // Profile photo upload (persisted via localStorage)
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);
  
  // User dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // FPO States
  const [fpos, setFpos] = useState([]);
  const [showFPOCreationForm, setShowFPOCreationForm] = useState(false);
  const [showFPOEdit, setShowFPOEdit] = useState(false);
  const [editingFPO, setEditingFPO] = useState(null);
  const [showFPOEditForm, setShowFPOEditForm] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [showFPODetail, setShowFPODetail] = useState(false);
  const [detailFPO, setDetailFPO] = useState(null);
  const [showBoardMembers, setShowBoardMembers] = useState(false);
  const [selectedFPOForBoardMembers, setSelectedFPOForBoardMembers] = useState(null);
  const [showFarmServices, setShowFarmServices] = useState(false);
  const [selectedFPOForFarmServices, setSelectedFPOForFarmServices] = useState(null);
  const [showTurnover, setShowTurnover] = useState(false);
  const [selectedFPOForTurnover, setSelectedFPOForTurnover] = useState(null);
  const [showCropEntries, setShowCropEntries] = useState(false);
  const [selectedFPOForCropEntries, setSelectedFPOForCropEntries] = useState(null);
  const [showInputShop, setShowInputShop] = useState(false);
  const [selectedFPOForInputShop, setSelectedFPOForInputShop] = useState(null);
  const [showProductCategories, setShowProductCategories] = useState(false);
  // Resolve real employee id (entity id) for MyIdCard holder
  useEffect(() => {
    const loadEmployeeProfileId = async () => {
      try {
        const profile = await employeeAPI.getProfile();
        if (profile && profile.id) {
          setEmployeeId(profile.id);
        }
        if (profile) {
          setEmployeeProfile(profile);
        }
        if (profile?.photoFileName) {
          setEmployeePhoto(profile.photoFileName);
        }
      } catch (e) {
        // ignore; fallback to user.id
      }
    };
    loadEmployeeProfileId();
  }, []);

  // Load saved profile photo once
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userProfilePhoto:EMPLOYEE');
      if (saved) setUserPhoto(saved);
    } catch {}
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (typeof data === 'string') { setUserPhoto(data); try { localStorage.setItem('userProfilePhoto:EMPLOYEE', data); } catch {} }
    };
    reader.onerror = () => alert('Error reading the file');
    reader.readAsDataURL(file);
  };
  const handlePhotoClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleRemovePhoto = () => { setUserPhoto(null); try { localStorage.removeItem('userProfilePhoto:EMPLOYEE'); } catch {} };
  
  // User dropdown functions
  const toggleUserDropdown = () => setShowUserDropdown(!showUserDropdown);
  const handleChangePassword = () => {
    setShowUserDropdown(false);
    window.location.href = '/change-password';
  };
  const handleLogout = () => {
    setShowUserDropdown(false);
    logout();
    window.location.href = '/login';
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-profile-dropdown')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Load employee ID Card number once we know the entity id
  useEffect(() => {
    const loadCardId = async () => {
      try {
        if (!employeeId) return;
        const list = await idCardAPI.getIdCardsByHolder(String(employeeId));
        if (Array.isArray(list) && list.length > 0) {
          const active = list.find((c) => c.status === 'ACTIVE') || list[0];
          if (active?.cardId) setEmployeeCardId(active.cardId);
          if (!employeePhoto && active?.photoFileName) {
            setEmployeePhoto(active.photoFileName);
            try {
              localStorage.setItem('employeePhotoFileName', active.photoFileName);
            } catch (_) {}
          }
        }
      } catch (e) {
        // silently ignore; header will just not show card id
      }
    };
    loadCardId();
  }, [employeeId]);
  const [selectedFPOForProductCategories, setSelectedFPOForProductCategories] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedFPOForProducts, setSelectedFPOForProducts] = useState(null);
  const [showFpoUsers, setShowFpoUsers] = useState(false);
  const [selectedFPOForUsers, setSelectedFPOForUsers] = useState(null);
  const [viewingFPO, setViewingFPO] = useState(null);
  const [selectedFPOTab, setSelectedFPOTab] = useState('overview');
  
  // FPO Filters
  const [fpoFilters, setFpoFilters] = useState({
    state: '',
    district: '',
    status: '',
    registrationType: ''
  });

  // Greeting function based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };
  
  // Random greeting content
  const greetingVariants = [
    { title: '🌞 Good Morning!', subtitle: 'Wishing you a bright and productive day ahead filled with positivity.' },
    { title: '🌸 Hello & Warm Greetings!', subtitle: 'May your day be filled with joy, success, and wonderful moments.' },
    { title: '🙌 Hi There!', subtitle: 'Hope you are doing well and everything is going smoothly on your end.' },
    { title: '🌟 Season Greetings!', subtitle: 'Sending best wishes for peace, happiness, and good health.' },
    { title: '🤝 Greetings of the Day!', subtitle: 'May this day bring you opportunities, growth, and good fortune.' }
  ];

  const [randomGreeting, setRandomGreeting] = useState(greetingVariants[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * greetingVariants.length);
    setRandomGreeting(greetingVariants[idx]);
  }, []);

  const [filters, setFilters] = useState({
    kycStatus: '',
    assignedDate: ''
  });

  
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'

  // Load data from API
  useEffect(() => {
    fetchAssignedFarmers();
    loadFPOs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const fetchAssignedFarmers = async () => {
    try {
      console.log('🔄 Fetching assigned farmers for employee...');
      console.log('👤 Current user:', user);
      
      if (!user) {
        console.error('❌ No user available');
        setAssignedFarmers([]);
        return;
      }
      
      // Fetch from API using the correct endpoint
      const response = await employeeAPI.getAssignedFarmers();
      console.log('✅ API Response:', response);
      
      if (response && Array.isArray(response)) {
        // Transform the API response to match our frontend format
        const transformedData = response.map(farmer => ({
          id: farmer.id,
          name: farmer.name,
          phone: farmer.contactNumber,
          state: farmer.state,
          district: farmer.district,
          location: `${farmer.district}, ${farmer.state}`,
          kycStatus: farmer.kycStatus || 'PENDING',
          assignedDate: farmer.assignedDate || farmer.kycSubmittedDate || new Date().toISOString().split('T')[0],
          lastAction: farmer.kycReviewedDate || farmer.kycSubmittedDate || new Date().toISOString().split('T')[0],
          notes: `KYC Status: ${farmer.kycStatus || 'PENDING'}`,
          assignedEmployee: user.name || 'Employee'
        }));
        
        setAssignedFarmers(transformedData);
        console.log('✅ Assigned farmers loaded from API:', transformedData.length);
      } else {
        console.log('⚠️ No API data available');
        setAssignedFarmers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching assigned farmers:', error);
      setAssignedFarmers([]);
    }
  };

  // FPO Data Loading - Filter to show only active/approved FPOs like Super Admin dashboard
  const loadFPOs = async () => {
    try {
      console.log('🔄 Employee Dashboard - Loading FPOs...');
      const fposData = await fpoAPI.getAllFPOs();
      console.log('📊 Employee Dashboard - FPO API response:', fposData);
      
      // Use the same data processing logic as Admin dashboard
      let fpoList = Array.isArray(fposData) ? fposData : (fposData?.content || fposData?.items || fposData?.data || []);
      
      // Filter to show only active/approved FPOs to match Super Admin dashboard count
      fpoList = fpoList.filter(fpo => {
        const status = fpo.status?.toUpperCase();
        return status === 'ACTIVE' || status === 'APPROVED' || status === 'APPROVED_BY_ADMIN';
      });
      
      setFpos(fpoList || []);
      console.log('📊 Employee Dashboard - Processed FPOs:', fpoList?.length || 0, 'records (filtered for active/approved)');
    } catch (error) {
      console.error('❌ Employee Dashboard - Error loading FPOs:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error response:', error.response?.data);
      setFpos([]);
    }
  };

  // FPO Handlers
  const handleViewFPO = (fpo) => {
    setDetailFPO(fpo);
    setShowFPODetail(true);
  };

  const handleEditFPO = (fpo) => {
    setEditingFPO(fpo);
    setShowFPOEdit(true);
  };

  const handleFPOCreated = async (payload) => {
    try {
      // Persist via API to ensure id and fpoId are generated
      const created = await fpoAPI.createFPO(payload);
      setFpos(prev => [...prev, created]);
      setToast({ type: 'success', message: 'FPO created successfully' });
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Employee Dashboard - Failed to create FPO:', err);
      const msg = err?.response?.data?.message || 'Failed to create FPO';
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setShowFPOCreationForm(false);
    }
  };

  const handleBoardMembers = (fpo) => {
    setSelectedFPOForBoardMembers(fpo);
    setShowBoardMembers(true);
  };

  const handleFarmServices = (fpo) => {
    setSelectedFPOForFarmServices(fpo);
    setShowFarmServices(true);
  };

  const handleTurnover = (fpo) => {
    setSelectedFPOForTurnover(fpo);
    setShowTurnover(true);
  };

  const handleCropEntries = (fpo) => {
    setSelectedFPOForCropEntries(fpo);
    setShowCropEntries(true);
  };

  const handleInputShop = (fpo) => {
    setSelectedFPOForInputShop(fpo);
    setShowInputShop(true);
  };

  const handleProductCategories = (fpo) => {
    setSelectedFPOForProductCategories(fpo);
    setShowProductCategories(true);
  };

  const handleProducts = (fpo) => {
    setSelectedFPOForProducts(fpo);
    setShowProducts(true);
  };

  const handleFpoUsers = (fpo) => {
    setSelectedFPOForUsers(fpo);
    setShowFpoUsers(true);
  };

  const handleAddFPO = () => {
    setShowFPOCreationForm(true);
  };

  const getFilteredFPOs = () => {
    const list = Array.isArray(fpos) ? fpos : [];
    return list.filter(fpo => {
      const matchesState = !fpoFilters.state || fpo.state === fpoFilters.state;
      const matchesDistrict = !fpoFilters.district || fpo.district === fpoFilters.district;
      const matchesStatus = !fpoFilters.status || fpo.status === fpoFilters.status;
      const matchesRegistrationType = !fpoFilters.registrationType || fpo.registrationType === fpoFilters.registrationType;
      
      return matchesState && matchesDistrict && matchesStatus && matchesRegistrationType;
    });
  };

  const getFilteredFarmers = () => {
    return assignedFarmers.filter(farmer => {
      const matchesKycStatus = !filters.kycStatus || farmer.kycStatus === filters.kycStatus;
      const matchesAssignedDate = !filters.assignedDate || (farmer.assignedDate && farmer.assignedDate === filters.assignedDate);
      
      return matchesKycStatus && matchesAssignedDate;
    });
  };

  const getStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Helper function to check if a date is within the specified period
    const isWithinPeriod = (dateString, period) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      
      switch (period) {
        case 'today':
          return date >= today;
        case 'month':
          return date >= startOfMonth;
        case 'year':
          return date >= startOfYear;
        default:
          return true; // 'all' period
      }
    };

    // Filter data based on time period
    const filteredFarmers = assignedFarmers.filter(farmer => {
      const createdDate = farmer.assignedDate || farmer.createdAt || farmer.created_at || farmer.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const totalAssigned = timeFilter === 'all' ? assignedFarmers.length : filteredFarmers.length;
    const approved = filteredFarmers.filter(f => f.kycStatus === 'APPROVED').length;
    const pending = filteredFarmers.filter(f => f.kycStatus === 'PENDING').length;
    const referBack = filteredFarmers.filter(f => f.kycStatus === 'REFER_BACK').length;
    const rejected = filteredFarmers.filter(f => f.kycStatus === 'REJECTED').length;

    return {
      totalAssigned,
      approved,
      pending,
      referBack,
      rejected,
      timeFilter
    };
  };

  const getTodoList = () => {
    const newAssignments = assignedFarmers.filter(f => {
      // New assignments not yet viewed (assigned within last 3 days)
      if (!f.assignedDate) return false;
      const assignedDate = new Date(f.assignedDate);
      const today = new Date();
      const daysDiff = (today - assignedDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 3 && f.kycStatus === 'PENDING';
    });

    const pendingReviews = assignedFarmers.filter(f => f.kycStatus === 'PENDING');
    const referBackCases = assignedFarmers.filter(f => f.kycStatus === 'REFER_BACK');

        return {
      newAssignments,
      pendingReviews,
      referBackCases
    };
  };

  const handleKYCUpdate = async (farmerId, newStatus, reason = '', documents = null) => {
    try {
      console.log(`🔄 Updating KYC status for farmer ${farmerId} to ${newStatus}`);
      
      // Prepare approval data
      const approvalData = {
        reason: reason,
        updatedBy: user?.name || 'Employee',
        updatedAt: new Date().toISOString(),
        ...(documents && { aadharNumber: documents.aadharNumber, panNumber: documents.panNumber })
      };

      console.log('📋 Approval data:', approvalData);

      // Make API call
      let response;
      switch (newStatus) {
        case 'APPROVED':
          response = await kycAPI.approveKYC(farmerId, approvalData);
          break;
        case 'REJECTED':
          response = await kycAPI.rejectKYC(farmerId, approvalData);
          break;
        case 'REFER_BACK':
          response = await kycAPI.referBackKYC(farmerId, approvalData);
          break;
        default:
          response = await kycAPI.approveKYC(farmerId, approvalData);
      }
      
      console.log('✅ KYC API response:', response);
      
      // Update local state after successful API call
      setAssignedFarmers(prev => prev.map(farmer => 
        farmer.id === farmerId 
          ? { 
          ...farmer,
          kycStatus: newStatus,
          lastAction: new Date().toISOString().split('T')[0],
              notes: reason || `Status updated to ${newStatus} by ${user?.name || 'Employee'}`,
              ...(documents && { aadharNumber: documents.aadharNumber, panNumber: documents.panNumber })
            }
          : farmer
      ));
      
      // Show success message
      alert(`KYC status updated to ${newStatus} successfully!`);
      
      // Trigger a global event to notify other dashboards
      window.dispatchEvent(new CustomEvent('kycStatusUpdated', {
        detail: { farmerId, newStatus, reason, documents }
      }));
      
    } catch (error) {
      console.error('❌ Error updating KYC status:', error);
      alert(`Failed to update KYC status: ${error.response?.data || error.message}`);
    }
  };


  const API_BASE = process.env.REACT_APP_API_URL || api.defaults.baseURL || 'http://localhost:8080/api';

  const viewFarmerIdCard = async (farmerId) => {
    try {
      setLoadingIdCard(true);
      setIdCard(null);
      setIdCardImageUrl(null);
      const res = await api.get(`/employees/dashboard/farmers/${farmerId}/id-card`, {
        withCredentials: true,
        headers: { 'Accept': 'application/json' }
      }).then(r => r).catch(err => (err && err.response) ? err.response : { status: 0, data: { message: err?.message || 'Network error' } });

      if (!res || typeof res.status !== 'number') {
        throw new Error(res?.data?.message || 'No response from server');
      }

      if (res.status === 403) {
        alert("You don't have access to this farmer's ID card.");
        return;
      }
      if (res.status === 404) {
        // Fallback: fetch existing cards by holderId and display first FARMER card
        const listRes = await api.get(`/id-cards/holder/${farmerId}`, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
        }).then(r => r).catch(err => (err && err.response) ? err.response : { status: 0, data: { message: err?.message || 'Network error' } });

        if (!listRes || (listRes.status && listRes.status >= 400)) {
          throw new Error(listRes?.data?.message || `Failed to fetch holder cards (${listRes?.status || 'unknown'})`);
        }

        const list = listRes?.data;
        const card = Array.isArray(list)
          ? (list.find(c => (c.cardType === 'FARMER' || c.cardType === 'farmer')) || list[0])
          : null;

        if (!card) {
          alert('No ID card record found for this farmer.');
          return;
        }

        const resultCard = {
          cardId: card.cardId,
          status: card.status,
          holderId: card.holderId,
          holderName: card.holderName,
          pngUrl: `${API_BASE}/id-cards/${card.cardId}/download/png`,
          pdfUrl: `${API_BASE}/id-cards/${card.cardId}/download/pdf`
        };
        setIdCard(resultCard);
        try {
          let pngPath = resultCard.pngUrl;
          if (pngPath.startsWith(API_BASE)) pngPath = pngPath.substring(API_BASE.length);
          if (pngPath.startsWith('/api/')) pngPath = pngPath.substring(4);
          const blobRes = await api.get(pngPath, { responseType: 'blob' });
          const objectUrl = URL.createObjectURL(blobRes.data);
          setIdCardImageUrl(objectUrl);
        } catch (e) {
          // Fallback to direct URL if blob fetch fails
          setIdCardImageUrl(resultCard.pngUrl);
        }
        setShowIdCardModal(true);
        return;
      }
      if (res.status && (res.status < 200 || res.status >= 300)) {
        const txt = res.data ? JSON.stringify(res.data) : String(res.status);
        throw new Error(txt || `Failed (${res.status})`);
      }
      const data = res?.data;
      if (!data) {
        throw new Error('Empty response from server');
      }
      setIdCard(data);
      try {
        let pngPath = data.pngUrl;
        if (pngPath.startsWith(API_BASE)) pngPath = pngPath.substring(API_BASE.length);
        if (pngPath.startsWith('/api/')) pngPath = pngPath.substring(4);
        const blobRes = await api.get(pngPath, { responseType: 'blob' });
        const objectUrl = URL.createObjectURL(blobRes.data);
        setIdCardImageUrl(objectUrl);
      } catch (e) {
        setIdCardImageUrl(data.pngUrl);
      }
      setShowIdCardModal(true);
    } catch (e) {
      console.error('ID Card load failed:', e);
      alert(`Unable to load ID Card: ${e.message}`);
    } finally {
      setLoadingIdCard(false);
    }
  };



  const handleViewFarmer = (farmer) => {
    console.log('🔍 EmployeeDashboard - Original farmer data (list item):', farmer);
    // Fetch full details from admin endpoint (same data model)
    fetch(`/api/admin/farmers/${farmer.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }})
      .then(r => r.json())
      .then(full => {
        const merged = { ...full, ...farmer };
        const farmerData = {
          id: merged.id,
          firstName: merged.firstName || '',
          lastName: merged.lastName || '',
          middleName: merged.middleName || '',
          dateOfBirth: merged.dateOfBirth || merged.dob || '',
          gender: merged.gender || '',
          contactNumber: merged.contactNumber || merged.phoneNumber || merged.phone || '',
          email: merged.email || '',
          fatherName: merged.fatherName || merged.relationName || '',
          nationality: merged.nationality || '',
          alternativeContactNumber: merged.alternativeContactNumber || merged.altNumber || '',
          alternativeRelationType: merged.alternativeRelationType || merged.altRelationType || '',
          state: merged.state || '',
          district: merged.district || '',
          block: merged.block || '',
          village: merged.village || '',
          pincode: merged.pincode || '',
          kycStatus: merged.kycStatus || 'PENDING',
          assignedEmployee: merged.assignedEmployee || 'Not Assigned',
          assignedEmployeeId: merged.assignedEmployeeId || null
        };
        console.log('🔍 EmployeeDashboard - Full farmer details fetched:', full);
        console.log('🔍 EmployeeDashboard - Transformed farmer data:', farmerData);
        setSelectedFarmerData(farmerData);
        setShowViewFarmerInline(true);
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch full farmer details, using list item only:', err);
        const farmerData = {
          id: farmer.id,
          firstName: farmer.firstName || '',
          lastName: farmer.lastName || '',
          middleName: farmer.middleName || '',
          dateOfBirth: farmer.dateOfBirth || farmer.dob || '',
          gender: farmer.gender || '',
          contactNumber: farmer.contactNumber || farmer.phoneNumber || farmer.phone || '',
          email: farmer.email || '',
          fatherName: farmer.fatherName || farmer.relationName || '',
          nationality: farmer.nationality || '',
          alternativeContactNumber: farmer.alternativeContactNumber || farmer.altNumber || '',
          alternativeRelationType: farmer.alternativeRelationType || farmer.altRelationType || '',
          state: farmer.state || '',
          district: farmer.district || '',
          block: farmer.block || '',
          village: farmer.village || '',
          pincode: farmer.pincode || '',
          kycStatus: farmer.kycStatus || 'PENDING',
          assignedEmployee: farmer.assignedEmployee || 'Not Assigned',
          assignedEmployeeId: farmer.assignedEmployeeId || null
        };
        setSelectedFarmerData(farmerData);
        setShowViewFarmerInline(true);
      });
  };

  const handleCloseFarmerDetails = () => {
    setShowViewFarmerInline(false);
    setSelectedFarmerData(null);
  };

  const handleCloseEmployeeDetails = () => {
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleUpdateEmployee = (updatedData) => {
    // Update employee profile
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleSaveFarmer = async (updatedData) => {
    try {
      // Update farmer data in backend
      const updatedFarmer = await farmersAPI.updateFarmer(selectedFarmerData.id, updatedData);
      
      // Update local state
      setAssignedFarmers(prev => prev.map(farmer => 
        farmer.id === selectedFarmerData.id ? updatedFarmer : farmer
      ));
      
      // Update selected farmer data
      setSelectedFarmerData(updatedFarmer);
      
      alert('Farmer updated successfully!');
    } catch (error) {
      console.error('Error updating farmer:', error);
      alert('Failed to update farmer. Please try again.');
    }
  };

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setShowEditFarmerForm(true);
  };

  const renderOverview = () => {
    const stats = getStats();
    const todoList = getTodoList();

    return (
      <div className="employee-overview-section">
        <div className="employee-overview-header">
          <div>
            <h2 className="employee-overview-title">Employee Dashboard Overview</h2>
            <p className="employee-overview-description">
              Manage your assigned farmers and KYC verification tasks efficiently.
            </p>
          </div>
          <div className="overview-actions">
            <button 
              className={`action-btn refresh ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                console.log('🔄 Refresh clicked - showing all data');
                setTimeFilter('all');
                // Also refresh FPO data
                loadFPOs();
              }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
            <button 
              className={`action-btn today ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 Today filter clicked');
                setTimeFilter('today');
              }}
            >
              Today
            </button>
            <button 
              className={`action-btn month ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 This Month filter clicked');
                setTimeFilter('month');
              }}
            >
              This Month
            </button>
            <button 
              className={`action-btn year ${timeFilter === 'year' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 This Year filter clicked');
                setTimeFilter('year');
              }}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon farmers">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-title">TOTAL ASSIGNED</div>
            <div className="stats-value">{stats.totalAssigned}</div>
            <div className="stats-change neutral">
              <i className="fas fa-minus"></i>
              +0.0%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>

          <div className="stats-card">
            <div className="stats-icon employees">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stats-title">APPROVED</div>
            <div className="stats-value">{stats.approved}</div>
            <div className="stats-change positive">
              <i className="fas fa-arrow-up"></i>
              +12.4%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>

          <div className="stats-card">
            <div className="stats-icon fpo">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stats-title">PENDING</div>
            <div className="stats-value">{stats.pending}</div>
            <div className="stats-change negative">
              <i className="fas fa-arrow-down"></i>
              -3.0%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>

          <div className="stats-card">
            <div className="stats-icon fpo">
              <i className="fas fa-building"></i>
            </div>
            <div className="stats-title">FPO</div>
            <div className="stats-value">{fpos.length}</div>
            <div className="stats-change neutral">
              <i className="fas fa-minus"></i>
              +0.0%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>
        </div>

        {/* KYC Progress Chart - Modern Style */}
        <div className="kyc-progress-section-modern">
          <div className="section-header-modern">
            <h3 className="section-title-modern">
              <i className="fas fa-chart-pie"></i>
              KYC Progress Summary
            </h3>
            <p className="section-subtitle-modern">Track your KYC verification progress</p>
          </div>
          <div className="kyc-progress-grid-modern" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginTop: '20px'
          }}>
            <div className="progress-card-modern approved" style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              border: '2px solid #22c55e',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              <div className="progress-icon-modern" style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
              }}>
                <i className="fas fa-check" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div className="progress-number-modern" style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#15803d',
                marginBottom: '4px'
              }}>{stats.approved}</div>
              <div className="progress-label-modern" style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#16a34a',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Approved</div>
            </div>
            
            <div className="progress-card-modern pending" style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              <div className="progress-icon-modern" style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}>
                <i className="fas fa-clock" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div className="progress-number-modern" style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#d97706',
                marginBottom: '4px'
              }}>{stats.pending}</div>
              <div className="progress-label-modern" style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Pending</div>
            </div>
            
            <div className="progress-card-modern refer-back" style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              <div className="progress-icon-modern" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}>
                <i className="fas fa-undo" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div className="progress-number-modern" style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#dc2626',
                marginBottom: '4px'
              }}>{stats.referBack}</div>
              <div className="progress-label-modern" style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Refer Back</div>
            </div>
            
            <div className="progress-card-modern rejected" style={{
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              border: '2px solid #6b7280',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              <div className="progress-icon-modern" style={{
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
              }}>
                <i className="fas fa-times" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div className="progress-number-modern" style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#4b5563',
                marginBottom: '4px'
              }}>{stats.rejected}</div>
              <div className="progress-label-modern" style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Rejected</div>
            </div>
          </div>
        </div>

        {/* Bottom Sections - Quick Actions */}
        <div className="bottom-sections">
          {/* Quick Actions */}
          <div className="section-card">
            <div className="employee-section-header">
              <h3 className="employee-section-title">Quick Actions</h3>
              <p className="employee-section-description">
                Access frequently used functions to manage farmers and track KYC progress.
              </p>
            </div>
            <div className="quick-actions-grid">
              <button 
                onClick={() => {
                  // Switch to farmers tab and open the farmer form
                  setActiveTab('farmers');
                  setShowFarmerForm(true);
                  console.log('🔄 Add New Farmer button clicked - switching to farmers tab and opening form');
                }}
                style={{
                  background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transform: 'translateY(0)',
                  position: 'relative',
                  zIndex: 9999,
                  pointerEvents: 'auto',
                  minWidth: '160px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(21, 128, 61, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.25)';
                }}
              >
                <i className="fas fa-user-plus"></i>
                <span>Add New Farmer</span>
              </button>
              <button 
                className="quick-action-btn secondary"
                onClick={() => setActiveTab('farmers')}
              >
                <i className="fas fa-users"></i>
                <span>View Assigned Farmers</span>
              </button>
              <button 
                className="quick-action-btn info"
                onClick={() => setActiveTab('progress')}
              >
                <i className="fas fa-chart-line"></i>
                <span>KYC Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* Todo List - Modern Style */}
        <div className="todo-section-modern">
          <div className="section-header-modern">
            <h3 className="section-title-modern">
              <i className="fas fa-tasks"></i>
              To-Do List
            </h3>
            <p className="section-subtitle-modern">Manage your daily tasks and priorities</p>
          </div>
          <div className="todo-grid-modern">
            <div className="todo-card-modern new-assignments" style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="todo-icon-modern" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <i className="fas fa-user-plus" style={{ color: 'white', fontSize: '20px' }}></i>
              </div>
              <h4 className="todo-title-modern" style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e40af',
                marginBottom: '8px'
              }}>New Assignments</h4>
              <p className="todo-description-modern" style={{
                fontSize: '14px',
                color: '#1e40af',
                marginBottom: '16px',
                opacity: '0.8'
              }}>{todoList.newAssignments.length} new farmers assigned</p>
              <button 
                onClick={() => setActiveTab('farmers')}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                }}
              >
                Review New
              </button>
            </div>
            
            <div className="todo-card-modern pending-reviews" style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="todo-icon-modern" style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <i className="fas fa-clock" style={{ color: 'white', fontSize: '20px' }}></i>
              </div>
              <h4 className="todo-title-modern" style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#d97706',
                marginBottom: '8px'
              }}>Pending Reviews</h4>
              <p className="todo-description-modern" style={{
                fontSize: '14px',
                color: '#d97706',
                marginBottom: '16px',
                opacity: '0.8'
              }}>{todoList.pendingReviews.length} cases pending</p>
              <button 
                onClick={() => setActiveTab('farmers')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                }}
              >
                Process Pending
              </button>
            </div>
            
            <div className="todo-card-modern refer-back-cases" style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="todo-icon-modern" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: 'white', fontSize: '20px' }}></i>
              </div>
              <h4 className="todo-title-modern" style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#dc2626',
                marginBottom: '8px'
              }}>Refer Back Cases</h4>
              <p className="todo-description-modern" style={{
                fontSize: '14px',
                color: '#dc2626',
                marginBottom: '16px',
                opacity: '0.8'
              }}>{todoList.referBackCases.length} need attention</p>
              <button 
                onClick={() => setActiveTab('farmers')}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                }}
              >
                Review Refer Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignedFarmers = () => {
    const filteredFarmers = getFilteredFarmers();

    return (
      <div className="employee-overview-section">
        {/* Main Content - Show header, filters and overview only when not in forms */}
        {!showFarmerForm && !showEditFarmerForm && !showKYCInline && !showViewFarmerInline ? (
          <>
            <div className="employee-overview-header">
              <div className="header-left">
                <h2 className="employee-overview-title">Assigned Farmers</h2>
                <p className="employee-overview-description">
                  View and manage your assigned farmers with KYC verification tasks.
                </p>
              </div>
              <div className="header-right">
                <div className="overview-actions">
                  <button 
                    className="action-btn-modern primary"
                    onClick={() => setShowFarmerForm(true)}
                  >
                    <i className="fas fa-plus"></i>
                    Add Farmer
                  </button>
                </div>
              </div>
            </div>
            {/* Modern Filters Section */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#475569' }}>Filters & Search</h3>
            <p className="employee-section-description" style={{ color: '#64748b', marginTop: '8px' }}>
              Filter and search through your assigned farmers by KYC status and assignment date.
            </p>
          </div>
          
          <div className="filters-modern">
            <div className="filter-group">
              <label className="filter-label">KYC Status</label>
              <select 
                value={filters.kycStatus} 
                onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                className="filter-select-modern"
              >
                <option value="">All KYC Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REFER_BACK">Refer Back</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Assignment Date</label>
              <select 
                value={filters.assignedDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, assignedDate: e.target.value }))}
                className="filter-select-modern"
              >
                <option value="">All Assignment Dates</option>
                <option value="2024-01-15">Jan 15, 2024</option>
                <option value="2024-01-18">Jan 18, 2024</option>
                <option value="2024-01-20">Jan 20, 2024</option>
                <option value="2024-01-25">Jan 25, 2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern KYC Status Tabs */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#0369a1' }}>KYC Status Overview</h3>
            <p className="employee-section-description" style={{ color: '#0369a1', marginTop: '8px' }}>
              View the distribution of KYC status across your assigned farmers.
            </p>
          </div>
          
          <div className="kyc-tabs-modern">
            <button 
              className={`kyc-tab-modern ${filters.kycStatus === '' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: '' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-chart-pie" style={{ color: '#64748b' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">All</span>
                <span className="tab-count-modern">{filteredFarmers.length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern approved ${filters.kycStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'APPROVED' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Approved</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'APPROVED').length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern pending ${filters.kycStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'PENDING' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Pending</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'PENDING').length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern rejected ${filters.kycStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'REJECTED' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Rejected</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'REJECTED').length}</span>
              </div>
            </button>
          </div>
        </div>

            {/* Farmers Table */}
          <div className="section-card" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '2px solid #22c55e',
            boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
          }}>
                      <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#15803d' }}>Farmer List</h3>
            <p className="employee-section-description" style={{ color: '#15803d', marginTop: '8px' }}>
              View and manage all your assigned farmers with their current KYC status.
            </p>
          </div>
            
            <div className="table-container-modern">
              <DataTable
                data={filteredFarmers}
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'location', label: 'Location' },
                  { key: 'assignedDate', label: 'Assigned Date' },
                  { key: 'kycStatus', label: 'KYC Status' },
                  { key: 'lastAction', label: 'Last Action' }
                ]}
                customActions={[
                  {
                    label: 'View',
                    icon: '👁️',
                    className: 'info',
                    onClick: (farmer) => farmer && handleViewFarmer(farmer)
                  },
                  {
                    label: 'Edit',
                    icon: '✏️',
                    className: 'primary',
                    onClick: (farmer) => farmer && handleEditFarmer(farmer)
                  },
                  {
                    label: 'KYC',
                    icon: '📋',
                    className: 'warning',
                    onClick: (farmer) => {
                      setSelectedFarmer(farmer);
                      setShowKYCInline(true);
                    }
                  },
                  {
                    label: 'ID Card',
                    icon: '🪪',
                    className: 'primary',
                    onClick: (farmer) => farmer && viewFarmerIdCard(farmer.id)
                  }
                ]}
              />
            </div>
          </div>
          </>
        ) : showFarmerForm ? (
          <div className="section-card" style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            <div className="employee-section-header">
              <h3 className="employee-section-title" style={{ color: '#d97706' }}>Add New Farmer</h3>
              <p className="employee-section-description" style={{ color: '#92400e', marginTop: '8px' }}>
                Register new farmers and assign them to your KYC verification workflow.
              </p>
            </div>
            
            <div className="section-actions-modern">
              <button 
                className="action-btn-modern secondary"
                onClick={() => setShowFarmerForm(false)}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Farmers
              </button>
            </div>
            
            <div className="form-container-modern">
              <FarmerRegistrationForm
                isInDashboard={true}
                onClose={() => setShowFarmerForm(false)}
                onSubmit={async (farmerData) => {
                  try {
                    const created = await farmersAPI.createFarmer(farmerData);
                    setAssignedFarmers(prev => [...prev, created]);
                    alert('Farmer created successfully!');
                    setShowFarmerForm(false);
                  } catch (error) {
                    console.error('Error creating farmer:', error);
                    alert('Failed to create farmer. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        ) : showEditFarmerForm ? (
          <div className="section-card" style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            <div className="employee-section-header">
              <h3 className="employee-section-title" style={{ color: '#1d4ed8' }}>Edit Farmer</h3>
              <p className="employee-section-description" style={{ color: '#1e40af', marginTop: '8px' }}>
                Update farmer details and information.
              </p>
            </div>
            
            <div className="section-actions-modern">
              <button 
                className="action-btn-modern secondary"
                onClick={() => {
                  setShowEditFarmerForm(false);
                  setEditingFarmer(null);
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Farmers
              </button>
              <button 
                className="action-btn-modern danger"
                onClick={() => {
                  setShowEditFarmerForm(false);
                  setEditingFarmer(null);
                }}
                style={{
                  background: '#ef4444',
                  marginLeft: '12px'
                }}
              >
                <i className="fas fa-times"></i>
                Close
              </button>
            </div>
            
            <div className="form-container-modern">
              <FarmerRegistrationForm
                isInDashboard={true}
                editData={editingFarmer}
                onClose={() => {
                  setShowEditFarmerForm(false);
                  setEditingFarmer(null);
                }}
                onSubmit={async (farmerData) => {
                  try {
                    if (editingFarmer) {
                      const updated = await farmersAPI.updateFarmer(editingFarmer.id, farmerData);
                      setAssignedFarmers(prev => prev.map(f => 
                        f.id === editingFarmer.id ? updated : f
                      ));
                      alert('Farmer updated successfully!');
                    }
                    setShowEditFarmerForm(false);
                    setEditingFarmer(null);
                  } catch (error) {
                    console.error('Error updating farmer:', error);
                    alert('Failed to update farmer. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        ) : showKYCInline ? (
          <div className="section-card" style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            <div className="employee-section-header">
              <h3 className="employee-section-title" style={{ color: '#d97706' }}>KYC Review - {selectedFarmer?.name}</h3>
              <p className="employee-section-description" style={{ color: '#92400e', marginTop: '8px' }}>
                Review and approve farmer KYC documents and information.
              </p>
            </div>
            
            <div className="section-actions-modern">
              <button 
                className="action-btn-modern secondary"
                onClick={() => {
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Farmers
              </button>
              <button 
                className="action-btn-modern danger"
                onClick={() => {
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
                style={{
                  background: '#ef4444',
                  marginLeft: '12px'
                }}
              >
                <i className="fas fa-times"></i>
                Close
              </button>
            </div>
            
            <div className="form-container-modern">
              <KYCModal
                farmer={selectedFarmer}
                onClose={() => {
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
                onApprove={(farmerId, documents) => {
                  handleKYCUpdate(farmerId, 'APPROVED', '', documents);
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
                onReject={(farmerId, reason) => {
                  handleKYCUpdate(farmerId, 'REJECTED', reason);
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
                onReferBack={(farmerId, reason) => {
                  handleKYCUpdate(farmerId, 'REFER_BACK', reason);
                  setShowKYCInline(false);
                  setSelectedFarmer(null);
                }}
                inlineMode={true}
              />
            </div>
          </div>
        ) : showViewFarmerInline ? (
          <div className="section-card" style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}>
            <div className="employee-section-header">
              <h3 className="employee-section-title" style={{ color: '#059669' }}>Farmer Registration Details</h3>
              <p className="employee-section-description" style={{ color: '#047857', marginTop: '8px' }}>
                View detailed information about the selected farmer.
              </p>
            </div>
            
            <div className="section-actions-modern">
              <button 
                className="action-btn-modern secondary"
                onClick={() => {
                  setShowViewFarmerInline(false);
                  setSelectedFarmerData(null);
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Farmers
              </button>
              <button 
                className="action-btn-modern danger"
                onClick={() => {
                  setShowViewFarmerInline(false);
                  setSelectedFarmerData(null);
                }}
                style={{
                  background: '#ef4444',
                  marginLeft: '12px'
                }}
              >
                <i className="fas fa-times"></i>
                Close
              </button>
            </div>
            
            <div className="form-container-modern">
              <ViewFarmerRegistrationDetails
                farmerData={selectedFarmerData}
                onClose={() => {
                  setShowViewFarmerInline(false);
                  setSelectedFarmerData(null);
                }}
                onSave={handleSaveFarmer}
                inlineMode={true}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderKYCProgress = () => {
    const stats = getStats();
    const total = stats.totalAssigned;
    const approvedPercentage = total > 0 ? Math.round((stats.approved / total) * 100) : 0;
    const pendingPercentage = total > 0 ? Math.round((stats.pending / total) * 100) : 0;
    const referBackPercentage = total > 0 ? Math.round((stats.referBack / total) * 100) : 0;
    const rejectedPercentage = total > 0 ? Math.round((stats.rejected / total) * 100) : 0;

    return (
      <div className="employee-overview-section">
        <div className="employee-overview-header">
          <h2 className="employee-overview-title">KYC Progress Tracking</h2>
          <p className="employee-overview-description">
            Monitor your KYC verification progress and performance metrics.
          </p>
        </div>

        {/* Modern Progress Overview Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#15803d' }}>Overall Progress</h3>
            <p className="employee-section-description" style={{ color: '#15803d', marginTop: '8px' }}>
              Track your overall KYC verification progress with visual indicators.
            </p>
          </div>
          
          <div className="progress-overview-modern">
            <div className="progress-bar-modern">
              <div 
                className="progress-segment approved" 
                style={{ width: `${approvedPercentage}%` }}
                title={`Approved: ${approvedPercentage}%`}
              ></div>
              <div 
                className="progress-segment pending" 
                style={{ width: `${pendingPercentage}%` }}
                title={`Pending: ${pendingPercentage}%`}
              ></div>
              <div 
                className="progress-segment refer-back" 
                style={{ width: `${referBackPercentage}%` }}
                title={`Refer Back: ${referBackPercentage}%`}
              ></div>
              <div 
                className="progress-segment rejected" 
                style={{ width: `${rejectedPercentage}%` }}
                title={`Rejected: ${rejectedPercentage}%`}
              ></div>
            </div>
            
            <div className="progress-legend">
              <div className="legend-item">
                <div className="legend-color approved"></div>
                <span>Approved: {approvedPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span>Pending: {pendingPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color refer-back"></div>
                <span>Refer Back: {referBackPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color rejected"></div>
                <span>Rejected: {rejectedPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Detailed Stats Grid */}
        <div className="stats-grid-modern">
          <div className="stat-card-modern approved" style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e'
          }}>
            <div className="stat-icon">
              <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Approved Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.approved}</span>
                <span className="stat-percentage">{approvedPercentage}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card-modern pending" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="stat-icon">
              <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Pending Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.pending}</span>
                <span className="stat-percentage">{pendingPercentage}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card-modern refer-back" style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6'
          }}>
            <div className="stat-icon">
              <i className="fas fa-undo" style={{ color: '#2563eb' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Refer Back Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.referBack}</span>
                <span className="stat-percentage">{referBackPercentage}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card-modern rejected" style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="stat-icon">
              <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Rejected Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.rejected}</span>
                <span className="stat-percentage">{rejectedPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#475569' }}>Performance Metrics</h3>
            <p className="employee-section-description" style={{ color: '#475569', marginTop: '8px' }}>
              Monitor your KYC verification performance and efficiency metrics.
            </p>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-chart-line" style={{ color: '#15803d' }}></i>
              </div>
              <div className="metric-content">
                <h4>Approval Rate</h4>
                <span className="metric-value">
                  {stats.totalAssigned > 0 ? Math.round((stats.approved / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-stopwatch" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="metric-content">
                <h4>Processing Time</h4>
                <span className="metric-value">2.3 days</span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-trophy" style={{ color: '#3b82f6' }}></i>
              </div>
              <div className="metric-content">
                <h4>Success Rate</h4>
                <span className="metric-value">
                  {stats.totalAssigned > 0 ? Math.round(((stats.approved + stats.pending) / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTodoList = () => {
    const todoList = getTodoList();
    
    return (
      <div className="employee-overview-section">
        <div className="employee-overview-header">
          <h2 className="employee-overview-title">To-Do List</h2>
          <p className="employee-overview-description">
            Manage your daily tasks and priorities for KYC verification.
          </p>
        </div>

        {/* Modern Todo Grid */}
        <div className="todo-grid-modern">
          <div className="todo-card-modern high-priority" style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern high">
                <i className="fas fa-exclamation-triangle"></i>
                <span>High Priority</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-clipboard-check" style={{ color: '#dc2626' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">New KYC Reviews</h4>
              <p className="todo-description">{todoList.newAssignments.length} new farmers need KYC verification</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern primary"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-eye"></i>
                  Review Now
                </button>
              </div>
            </div>
            <div className="todo-accent" style={{ background: '#ef4444' }}></div>
          </div>
          
          <div className="todo-card-modern medium-priority" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern medium">
                <i className="fas fa-clock"></i>
                <span>Medium Priority</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-hourglass-half" style={{ color: '#d97706' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">Pending Reviews</h4>
              <p className="todo-description">{todoList.pendingReviews.length} cases awaiting your review</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern warning"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-cogs"></i>
                  Process Pending
                </button>
              </div>
            </div>
          </div>
          
          <div className="todo-card-modern urgent-priority" style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: '2px solid #dc2626'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern urgent">
                <i className="fas fa-fire"></i>
                <span>Urgent</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-exclamation-circle" style={{ color: '#b91c1c' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">Refer Back Cases</h4>
              <p className="todo-description">{todoList.referBackCases.length} cases need immediate attention</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern danger"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-bolt"></i>
                  Review Urgent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Task Summary Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#0369a1' }}>Task Summary</h3>
            <p className="employee-section-description" style={{ color: '#0369a1', marginTop: '8px' }}>
              Overview of your current tasks and priorities for KYC verification.
            </p>
          </div>
          
          <div className="task-stats-modern">
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-plus-circle" style={{ color: '#0ea5e9' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.newAssignments.length}</span>
                <span className="task-stat-label">New Assignments</span>
              </div>
            </div>
            
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.pendingReviews.length}</span>
                <span className="task-stat-label">Pending Reviews</span>
              </div>
            </div>
            
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-undo" style={{ color: '#ef4444' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.referBackCases.length}</span>
                <span className="task-stat-label">Refer Back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#15803d' }}>Quick Actions</h3>
            <p className="employee-section-description" style={{ color: '#15803d', marginTop: '8px' }}>
              Quick access to common tasks and actions for managing your workload.
            </p>
          </div>
          
          <div className="quick-actions-modern">
            <button 
              className="quick-action-btn-modern primary"
              onClick={() => setActiveTab('farmers')}
            >
              <i className="fas fa-users"></i>
              <span>View All Farmers</span>
            </button>
            
            <button 
              className="quick-action-btn-modern secondary"
              onClick={() => setActiveTab('kyc')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>KYC Progress</span>
            </button>
            
            <button 
              className="quick-action-btn-modern info"
              onClick={() => setActiveTab('summary')}
            >
              <i className="fas fa-chart-bar"></i>
              <span>View Summary</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderKYCSummary = () => {
    const stats = getStats();
    
    return (
      <div className="employee-overview-section">
        <div className="employee-overview-header">
          <h2 className="employee-overview-title">KYC Summary</h2>
          <p className="employee-overview-description">
            Comprehensive overview of your KYC verification activities and performance.
          </p>
        </div>

        {/* Modern KYC Stats Grid */}
        <div className="kyc-stats-grid-modern">
          <div className="kyc-stat-card-modern approved" style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.approved}</span>
              <span className="kyc-stat-label-modern">Approved</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern pending" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.pending}</span>
              <span className="kyc-stat-label-modern">Pending</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#f59e0b' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern refer-back" style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-undo" style={{ color: '#2563eb' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.referBack}</span>
              <span className="kyc-stat-label-modern">Refer Back</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#3b82f6' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern rejected" style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.rejected}</span>
              <span className="kyc-stat-label-modern">Rejected</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#ef4444' }}></div>
          </div>
        </div>

        {/* Modern KYC Performance Metrics */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#475569' }}>Performance Metrics</h3>
            <p className="employee-section-description" style={{ color: '#475569', marginTop: '8px' }}>
              Monitor your KYC verification performance and efficiency metrics.
            </p>
          </div>
          
          <div className="performance-metrics-modern">
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-chart-line" style={{ color: '#15803d' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Approval Rate</h4>
                <span className="metric-value-modern">
                  {stats.totalAssigned > 0 ? Math.round((stats.approved / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-stopwatch" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Processing Time</h4>
                <span className="metric-value-modern">2.3 days</span>
              </div>
            </div>
            
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-trophy" style={{ color: '#3b82f6' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Success Rate</h4>
                <span className="metric-value-modern">
                  {stats.totalAssigned > 0 ? Math.round(((stats.approved + stats.pending) / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Activity Overview */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#0369a1' }}>Activity Overview</h3>
            <p className="employee-section-description" style={{ color: '#0369a1', marginTop: '8px' }}>
              Overview of your recent KYC verification activities and trends.
            </p>
          </div>
          
          <div className="activity-overview-modern">
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-check" style={{ color: '#0ea5e9' }}></i>
              </div>
              <div className="activity-content">
                <h4>Total Cases Handled</h4>
                <span className="activity-value">{stats.totalAssigned}</span>
              </div>
            </div>
            
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-day" style={{ color: '#22c55e' }}></i>
              </div>
              <div className="activity-content">
                <h4>Cases This Month</h4>
                <span className="activity-value">{Math.floor(stats.totalAssigned * 0.3)}</span>
              </div>
            </div>
            
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-week" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="activity-content">
                <h4>Cases This Week</h4>
                <span className="activity-value">{Math.floor(stats.totalAssigned * 0.1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for KYC Summary */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="employee-section-header">
            <h3 className="employee-section-title" style={{ color: '#15803d' }}>Quick Actions</h3>
            <p className="employee-section-description" style={{ color: '#15803d', marginTop: '8px' }}>
              Quick access to common tasks and actions for managing your workload.
            </p>
          </div>
          
          <div className="quick-actions-modern">
            <button 
              className="quick-action-btn-modern primary"
              onClick={() => setActiveTab('farmers')}
            >
              <i className="fas fa-users"></i>
              <span>View All Farmers</span>
            </button>
            
            <button 
              className="quick-action-btn-modern secondary"
              onClick={() => setActiveTab('kyc')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>KYC Progress</span>
            </button>
            
            <button 
              className="quick-action-btn-modern info"
              onClick={() => setActiveTab('todo')}
            >
              <i className="fas fa-tasks"></i>
              <span>To-Do List</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar"></div>
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo-title">DATE</h1>
            <p className="logo-subtitle">Digital Agristack</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-profile-dropdown">
            <div className="user-profile-trigger" onClick={toggleUserDropdown}>
              <div className="user-avatar user-avatar-with-upload" onClick={(e) => { e.stopPropagation(); handlePhotoClick(); }}>
                {userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="user-avatar-photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (() => {
                  let resolvedPhoto = employeePhoto;
                  try {
                    if (!resolvedPhoto && typeof window !== 'undefined') {
                      const cached = JSON.parse(localStorage.getItem('employeeProfile') || '{}');
                      resolvedPhoto = cached.photoFileName || localStorage.getItem('employeePhotoFileName') || user?.photoFileName;
                    }
                  } catch (_) {
                    resolvedPhoto = employeePhoto || user?.photoFileName;
                  }
                  return resolvedPhoto ? (
                    <img
                      src={`http://localhost:8080/uploads/photos/${resolvedPhoto}`}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="user-avatar-initials">{user?.name?.charAt(0) || 'U'}</div>
                  );
                })()}
                <div className="avatar-upload-overlay"><i className="fas fa-camera"></i></div>
              </div>
              <span className="user-email">{user?.email || 'employee@example.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large user-avatar-with-upload" onClick={handlePhotoClick}>
                  {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="user-avatar-photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (() => {
                    let resolvedPhoto = employeePhoto;
                    try {
                      if (!resolvedPhoto && typeof window !== 'undefined') {
                        const cached = JSON.parse(localStorage.getItem('employeeProfile') || '{}');
                        resolvedPhoto = cached.photoFileName || localStorage.getItem('employeePhotoFileName') || user?.photoFileName;
                      }
                    } catch (_) {
                      resolvedPhoto = employeePhoto || user?.photoFileName;
                    }
                    return resolvedPhoto ? (
                      <img
                        src={`http://localhost:8080/uploads/photos/${resolvedPhoto}`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="user-avatar-initials">{user?.name?.charAt(0) || 'U'}</div>
                    );
                  })()}
                  <div className="avatar-upload-overlay"><i className="fas fa-camera"></i></div>
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'Employee'}</div>
                  <div className="user-email">{user?.email || 'employee@example.com'}</div>
                  {(() => {
                    try {
                      const cache = localStorage.getItem('employeeUniqueIds');
                      const cachedId = cache ? JSON.parse(cache)[String(employeeId)] : null;
                      const idToShow = cachedId || employeeCardId;
                      return idToShow ? (
                        <div className="user-email" style={{ fontWeight: 700 }}>ID: {idToShow}</div>
                      ) : null;
                    } catch (_) {
                      return employeeCardId ? (
                        <div className="user-email" style={{ fontWeight: 700 }}>ID: {employeeCardId}</div>
                      ) : null;
                    }
                  })()}
                </div>
              </div>
              <div className="dropdown-actions">
                <button className="dropdown-action-btn" onClick={handlePhotoClick}>
                  <i className="fas fa-camera"></i>
                  {userPhoto ? 'Change Photo' : 'Upload Photo'}
                </button>
                {userPhoto && (
                  <button className="dropdown-action-btn" onClick={handleRemovePhoto}>
                    <i className="fas fa-trash"></i>
                    Remove Photo
                  </button>
                )}
                <button className="dropdown-action-btn" onClick={handleChangePassword}>
                  <i className="fas fa-key"></i>
                  Change Password
                </button>
                <button className="dropdown-action-btn logout" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
          {/* Hidden file input for photo upload */}
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
          
          {/* Original UserProfileDropdown - commented out for now */}
          {/* <UserProfileDropdown /> */}
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <p className="sidebar-role">EMPLOYEE</p>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard Overview</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => setActiveTab('farmers')}
          >
            <i className="fas fa-users"></i>
            <span>Assigned Farmers</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <i className="fas fa-chart-line"></i>
            <span>KYC Progress</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'fpo' ? 'active' : ''}`}
            onClick={() => setActiveTab('fpo')}
          >
            <i className="fas fa-building"></i>
            <span>FPO</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'id-card' ? 'active' : ''}`}
            onClick={() => setActiveTab('id-card')}
          >
            <i className="fas fa-id-card"></i>
            <span>My ID Card</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'todo' ? 'active' : ''}`}
            onClick={() => setActiveTab('todo')}
          >
            <i className="fas fa-tasks"></i>
            <span>To-Do List</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'kyc-summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc-summary')}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>KYC Summary</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* Greeting Banner - Only for Dashboard Overview */}
              <div className="greeting-banner">
                <div className="greeting-left">
                  <div className="greeting-title">{randomGreeting.title}</div>
                  <div className="greeting-subtitle">{randomGreeting.subtitle}</div>
                </div>
                <div className="greeting-right">
                  <span className="greeting-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              {/* Welcome Section - Only for Dashboard Overview */}
              <div className="welcome-section">
                <h1 className="welcome-title">Welcome to DATE Digital Agristack!</h1>
                <p className="welcome-subtitle">
                  Empowering your agricultural journey with data-driven insights and seamless management. 
                  Explore your dashboard below.
                </p>
              </div>
              
              {renderOverview()}
            </>
          )}
          {activeTab === 'farmers' && renderAssignedFarmers()}
          {activeTab === 'progress' && renderKYCProgress()}
          {activeTab === 'todo' && renderTodoList()}
          {activeTab === 'kyc-summary' && renderKYCSummary()}
          {activeTab === 'id-card' && (
            <div className="employee-overview-section">
              <div className="employee-overview-header">
                <h2 className="employee-overview-title">My ID Card</h2>
                <p className="employee-overview-description">View and download your employee ID card.</p>
              </div>
              <div className="section-card">
                <MyIdCard userId={employeeId || user?.id} userType="EMPLOYEE" />
              </div>
            </div>
          )}
          {activeTab === 'fpo' && (
            <div className="superadmin-overview-section">
              {!showFPOCreationForm ? (
                <>
                  {showBoardMembers && selectedFPOForBoardMembers ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOBoardMembersView
                        fpo={selectedFPOForBoardMembers}
                        onClose={() => { setShowBoardMembers(false); setSelectedFPOForBoardMembers(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showFarmServices && selectedFPOForFarmServices ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOFarmServicesView
                        fpo={selectedFPOForFarmServices}
                        onClose={() => { setShowFarmServices(false); setSelectedFPOForFarmServices(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showTurnover && selectedFPOForTurnover ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOTurnoverView
                        fpo={selectedFPOForTurnover}
                        onClose={() => { setShowTurnover(false); setSelectedFPOForTurnover(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showCropEntries && selectedFPOForCropEntries ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOCropEntriesView
                        fpo={selectedFPOForCropEntries}
                        onClose={() => { setShowCropEntries(false); setSelectedFPOForCropEntries(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showInputShop && selectedFPOForInputShop ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOInputShopView
                        fpo={selectedFPOForInputShop}
                        onClose={() => { setShowInputShop(false); setSelectedFPOForInputShop(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showProductCategories && selectedFPOForProductCategories ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOProductCategoriesView
                        fpo={selectedFPOForProductCategories}
                        onClose={() => { setShowProductCategories(false); setSelectedFPOForProductCategories(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showProducts && selectedFPOForProducts ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOProductsView
                        fpo={selectedFPOForProducts}
                        onClose={() => { setShowProducts(false); setSelectedFPOForProducts(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                      />
                    </div>
                  ) : showFpoUsers && selectedFPOForUsers ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOUsersView
                        fpo={selectedFPOForUsers}
                        onClose={() => { setShowFpoUsers(false); setSelectedFPOForUsers(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                        userRole="EMPLOYEE"
                      />
                    </div>
                  ) : !viewingFPO ? (
                    <>
                      <div className="superadmin-overview-header">
                        <div className="header-left">
                          <h2 className="superadmin-overview-title">FPO Management</h2>
                          <p className="overview-description">
                            Manage Farmer Producer Organizations and their operations.
                          </p>
                        </div>
                        <div className="header-right">
                          <div className="overview-actions">
                            <button 
                              onClick={loadFPOs}
                              style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transform: 'translateY(0)',
                                marginRight: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.35)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                              }}
                            >
                              <i className="fas fa-sync-alt"></i>
                              Refresh
                            </button>
                            <button 
                              onClick={handleAddFPO}
                              style={{
                                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transform: 'translateY(0)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(21, 128, 61, 0.35)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.25)';
                              }}
                            >
                              <i className="fas fa-plus"></i>
                              Add FPO
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* FPO Filters */}
                      <div className="filters-section">
                        <div className="filter-group">
                          <label className="filter-label">State</label>
                          <select 
                            value={fpoFilters.state} 
                            onChange={(e) => setFpoFilters(prev => ({ ...prev, state: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All States</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Andhrapradesh">Andhrapradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">District</label>
                          <select 
                            value={fpoFilters.district} 
                            onChange={(e) => setFpoFilters(prev => ({ ...prev, district: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Districts</option>
                            <option value="Karimnagar">Karimnagar</option>
                            <option value="rangareddy">Rangareddy</option>
                            <option value="kadapa">Kadapa</option>
                            <option value="Kadapa">Kadapa</option>
                            <option value="kadpaa">Kadpaa</option>
                            <option value="Kuppam">Kuppam</option>
                            <option value="Pune">Pune</option>
                            <option value="Ahmedabad">Ahmedabad</option>
                            <option value="Amritsar">Amritsar</option>
                            <option value="Lucknow">Lucknow</option>
                            <option value="Chennai">Chennai</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Status</label>
                          <select 
                            value={fpoFilters.status} 
                            onChange={(e) => setFpoFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Registration Type</label>
                          <select 
                            value={fpoFilters.registrationType} 
                            onChange={(e) => setFpoFilters(prev => ({ ...prev, registrationType: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Types</option>
                            <option value="Company">Company</option>
                            <option value="Cooperative">Cooperative</option>
                            <option value="Society">Society</option>
                          </select>
                        </div>
                        
                        <div className="filter-actions">
                          <button 
                            className="filter-btn-clear"
                            onClick={() => setFpoFilters({
                              state: '',
                              district: '',
                              status: '',
                              registrationType: ''
                            })}
                          >
                            <i className="fas fa-times"></i>
                            Clear Filters
                          </button>
                        </div>
                      </div>

                      <div className="table-scroll-wrapper">
                        <DataTable
                          data={getFilteredFPOs()}
                          columns={[
                            { key: 'fpoId', label: 'Id', render: (v, row) => (row.fpoId || row.id || '') },
                            { key: 'fpoName', label: 'FPO name' },
                            { key: 'ceoName', label: 'CEO name' },
                            { key: 'phoneNumber', label: 'Phone number' },
                            { key: 'joinDate', label: 'Join Date' },
                            {
                              key: 'status',
                              label: 'Status',
                              render: (value, row) => (
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={(row.status || '').toUpperCase() === 'ACTIVE'}
                                    onChange={async (e) => {
                                      try {
                                        const newStatus = e.target.checked ? 'ACTIVE' : 'INACTIVE';
                                        let numericId = row.id;
                                        if (!numericId && row.fpoId) {
                                          const full = await fpoAPI.getFPOByFpoId(row.fpoId);
                                          numericId = full?.id;
                                        }
                                        await fpoAPI.updateFPOStatus(numericId, newStatus);
                                        setFpos(prev => prev.map(f => (f.id === numericId || f.fpoId === row.fpoId) ? { ...f, id: numericId, status: newStatus } : f));
                                        setToast({ type: 'success', message: `FPO status updated to ${newStatus}` });
                                        setTimeout(() => setToast(null), 2000);
                                      } catch (err) {
                                        console.error('Failed to toggle FPO status:', err);
                                        setToast({ type: 'error', message: 'Failed to update status' });
                                        setTimeout(() => setToast(null), 2000);
                                      }
                                    }}
                                  />
                                  <span className="slider round"></span>
                                </label>
                              )
                            }
                          ]}
                          customActions={[
                            { label: 'Dashboard', className: 'info', onClick: (fpo) => { setViewingFPO(fpo); setSelectedFPOTab('overview'); } },
                            { label: 'Edit FPO', className: 'warning', onClick: (fpo) => { setEditingFPO(fpo); setShowFPOEditForm(true); setShowFPOCreationForm(true); } },
                            { label: 'FPO Board Members', onClick: handleBoardMembers },
                            { label: 'FPO Farm Services', onClick: handleFarmServices },
                            { label: 'FPO Turnover', onClick: handleTurnover },
                            { label: 'FPO Crop Entries', onClick: handleCropEntries },
                            { label: 'FPO Input Shop', onClick: handleInputShop },
                            { label: 'FPO Product Categories', onClick: handleProductCategories },
                            { label: 'FPO Products', onClick: handleProducts },
                            { label: 'FPO Users', onClick: handleFpoUsers }
                            // Note: No Delete action for Employee
                          ]}
                        />
                        </div>
                      </>
                  ) : (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPODetailsView
                        fpo={viewingFPO || detailFPO}
                        onClose={() => { setViewingFPO(null); setDetailFPO(null); setShowFPODetail(false); }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="superadmin-overview-section">
                  <div className="superadmin-overview-header">
                    <div className="header-left">
                      <h2 className="superadmin-overview-title">
                      {editingFPO ? 'Edit FPO' : 'Add New FPO'}
                    </h2>
                    <p className="overview-description">
                      {editingFPO ? 'Update FPO information.' : 'Register a new FPO in the system.'}
                    </p>
                    </div>
                    <div className="header-right">
                    <div className="overview-actions">
                      <button 
                        onClick={() => {
                          setShowFPOCreationForm(false);
                          setEditingFPO(null);
                        }}
                          className="action-btn secondary"
                      >
                        <i className="fas fa-arrow-left"></i>
                        Back to FPO List
                      </button>
                      </div>
                    </div>
                  </div>
                  
                  {showFPOEditForm && editingFPO ? (
                    <FPOEditForm
                      fpo={editingFPO}
                      onCancel={() => { 
                        setShowFPOEditForm(false);
                        setShowFPOCreationForm(false); 
                        setEditingFPO(null);
                      }}
                      onUpdated={async (updatedFPO) => {
                        // Reload FPOs from server to ensure data persistence
                        await loadFPOs();
                        setShowFPOEditForm(false);
                        setShowFPOCreationForm(false);
                        setEditingFPO(null);
                        setToast({ type: 'success', message: 'FPO updated successfully!' });
                      }}
                    />
                  ) : (
                    <FPOCreationForm
                      isOpen={showFPOCreationForm}
                      onClose={() => {
                        setShowFPOCreationForm(false);
                        setEditingFPO(null);
                      }}
                      onSubmit={handleFPOCreated}
                      onToast={(type, message) => setToast({ type, message })}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="superadmin-overview-section">
              <div className="superadmin-overview-header">
                <div className="header-left">
                  <h2 className="superadmin-overview-title">My Profile</h2>
                  <p className="overview-description">View and manage your personal information and details.</p>
                </div>
              </div>
              <div className="section-card">
                <div className="data-sections-grid">
                  <div className="section-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16 }}>Personal Information</h3>
                    <div className="details-grid">
                      <div>
                        <div className="detail-label">Full Name:</div>
                        <div className="detail-value">{employeeProfile?.name || user?.name || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Email:</div>
                        <div className="detail-value">{employeeProfile?.email || user?.email || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Phone:</div>
                        <div className="detail-value">{employeeProfile?.phoneNumber || user?.phoneNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Date of Birth:</div>
                        <div className="detail-value">{employeeProfile?.dateOfBirth || employeeProfile?.dob || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Gender:</div>
                        <div className="detail-value">{employeeProfile?.gender || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Father's Name:</div>
                        <div className="detail-value">{employeeProfile?.fatherName || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Marital Status:</div>
                        <div className="detail-value">{employeeProfile?.maritalStatus || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Nationality:</div>
                        <div className="detail-value">{employeeProfile?.nationality || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16 }}>Address Information</h3>
                    <div className="details-grid">
                      <div>
                        <div className="detail-label">Country:</div>
                        <div className="detail-value">{employeeProfile?.country || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">State:</div>
                        <div className="detail-value">{employeeProfile?.state || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">District:</div>
                        <div className="detail-value">{employeeProfile?.district || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Block:</div>
                        <div className="detail-value">{employeeProfile?.block || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Village/City:</div>
                        <div className="detail-value">{employeeProfile?.village || employeeProfile?.city || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Pincode:</div>
                        <div className="detail-value">{employeeProfile?.pincode || employeeProfile?.postalCode || '—'}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="detail-label">Address:</div>
                        <div className="detail-value">{employeeProfile?.address || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16 }}>Work Information</h3>
                    <div className="details-grid">
                      <div>
                        <div className="detail-label">Employee ID:</div>
                        <div className="detail-value">{employeeCardId || (() => { try { const cache = localStorage.getItem('employeeUniqueIds'); return cache ? JSON.parse(cache)[String(employeeId)] : '—'; } catch { return '—'; } })()}</div>
                      </div>
                      <div>
                        <div className="detail-label">Designation:</div>
                        <div className="detail-value">{employeeProfile?.designation || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Department:</div>
                        <div className="detail-value">{employeeProfile?.department || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Join Date:</div>
                        <div className="detail-value">{employeeProfile?.joinDate || employeeProfile?.dateOfJoining || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Experience (years):</div>
                        <div className="detail-value">{employeeProfile?.experience || employeeProfile?.experienceYears || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Reporting Manager:</div>
                        <div className="detail-value">{employeeProfile?.managerName || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Office Location:</div>
                        <div className="detail-value">{employeeProfile?.officeLocation || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Employment Type:</div>
                        <div className="detail-value">{employeeProfile?.employmentType || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16 }}>Identity Details</h3>
                    <div className="details-grid">
                      <div>
                        <div className="detail-label">Aadhaar Number:</div>
                        <div className="detail-value">{employeeProfile?.aadhaarNumber || employeeProfile?.aadharNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">PAN Number:</div>
                        <div className="detail-value">{employeeProfile?.panNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">KYC Status:</div>
                        <div className="detail-value">{employeeProfile?.kycStatus || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 16 }}>Bank Details</h3>
                    <div className="details-grid">
                      <div>
                        <div className="detail-label">Bank Name:</div>
                        <div className="detail-value">{employeeProfile?.bankName || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">Account Number:</div>
                        <div className="detail-value">{employeeProfile?.accountNumber || '—'}</div>
                      </div>
                      <div>
                        <div className="detail-label">IFSC Code:</div>
                        <div className="detail-value">{employeeProfile?.ifscCode || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Removed FarmerForm modal; using inline FarmerRegistrationForm above */}

      {showKYCModal && selectedFarmer && (
        <KYCModal
          farmer={selectedFarmer}
          onClose={() => {
            setShowKYCModal(false);
            setSelectedFarmer(null);
          }}
          onApprove={(farmerId, documents) => handleKYCUpdate(farmerId, 'APPROVED', '', documents)}
          onReject={(farmerId, reason) => handleKYCUpdate(farmerId, 'REJECTED', reason)}
          onReferBack={(farmerId, reason) => handleKYCUpdate(farmerId, 'REFER_BACK', reason)}
        />
      )}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="icon">{toast.type === 'success' ? '✔' : '!'}</span>
            <span>{toast.message}</span>
            <button 
              className="toast-close" 
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showFarmerDetails && selectedFarmerData && (
        <ViewFarmerRegistrationDetails
          farmerData={selectedFarmerData}
          onClose={handleCloseFarmerDetails}
          onSave={handleSaveFarmer}
        />
      )}

      {showEmployeeDetails && selectedEmployeeData && (
        <ViewEditEmployeeDetails
          employee={selectedEmployeeData}
          onClose={handleCloseEmployeeDetails}
          onUpdate={handleUpdateEmployee}
        />
      )}

      {/* FPO Modals */}

      {showFPOEdit && editingFPO && (
        <FPOEditModal
          isOpen={showFPOEdit}
          onClose={() => { setShowFPOEdit(false); setEditingFPO(null); }}
          fpo={editingFPO}
          onUpdate={(updatedFPO) => {
            setFpos(prev => prev.map(fpo => fpo.id === updatedFPO.id ? updatedFPO : fpo));
            setShowFPOEdit(false);
            setEditingFPO(null);
          }}
        />
      )}

      


      {showTurnover && selectedFPOForTurnover && (
        null
      )}

      {showCropEntries && selectedFPOForCropEntries && (
        null
      )}

      {showInputShop && selectedFPOForInputShop && (
        null
      )}

      {showProductCategories && selectedFPOForProductCategories && (
        null
      )}

      {showProducts && selectedFPOForProducts && (
        null
      )}

      {showFpoUsers && selectedFPOForUsers && (
        null
      )}
    </div>
  );
};

export default EmployeeDashboard; 