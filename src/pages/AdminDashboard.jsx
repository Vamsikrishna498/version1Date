import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { farmersAPI, employeesAPI, adminAPI, fpoAPI, idCardAPI } from '../api/apiService';
import api from '../api/apiService';
import IdCardViewer from '../components/IdCardViewer';
import '../styles/Dashboard.css';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import EmployeeRegistrationForm from '../components/EmployeeRegistrationForm';
import AssignmentModal from '../components/AssignmentModal';
import AssignmentInline from '../components/AssignmentInline';
import KYCDocumentUpload from '../components/KYCDocumentUpload';
import ViewFarmerRegistrationDetails from '../components/ViewFarmerRegistrationDetails';
import ViewFarmer from '../components/ViewFarmer';
import ViewEditEmployeeDetails from '../components/ViewEditEmployeeDetails';
import ViewEmployeeDetails from '../components/ViewEmployeeDetails';
import ViewEmployee from '../components/ViewEmployee';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import UserProfileDropdown from '../components/UserProfileDropdown';
import RegistrationApprovalModal from '../components/RegistrationApprovalModal';
import RegistrationDetailModal from '../components/RegistrationDetailModal';
import RegistrationDetailsInline from '../components/RegistrationDetailsInline';
import BulkOperations from '../components/BulkOperations';
import FPOList from '../components/FPOList';
import FPOCreationForm from '../components/FPOCreationForm';
import FPOEditModal from '../components/FPOEditModal';
import FPOEditForm from '../components/FPOEditForm';
import FPODetailModal from '../components/FPODetailModal';
import FPOBoardMembersModal from '../components/FPOBoardMembersModal';
import FPOFarmServicesModal from '../components/FPOFarmServicesModal';
import FPOFarmServicesView from '../components/FPOFarmServicesView';
import FPOTurnoverModal from '../components/FPOTurnoverModal';
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
import FPODetailsView from '../components/FPODetailsView';
import FPOBoardMembersView from '../components/FPOBoardMembersView';
// duplicate import removed

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [farmers, setFarmers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fpos, setFpos] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignmentInline, setShowAssignmentInline] = useState(false);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showFarmerDetails, setShowFarmerDetails] = useState(false);
  const [selectedFarmerData, setSelectedFarmerData] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [showEmployeeView, setShowEmployeeView] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [showKYCDocumentUpload, setShowKYCDocumentUpload] = useState(false);
  const [selectedFarmerForKYC, setSelectedFarmerForKYC] = useState(null);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showFPOCreationForm, setShowFPOCreationForm] = useState(false);
  const [showFPOEdit, setShowFPOEdit] = useState(false);
  const [editingFPO, setEditingFPO] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFPODetail, setShowFPODetail] = useState(false);
  const [detailFPO, setDetailFPO] = useState(null);
  const [showBoardMembers, setShowBoardMembers] = useState(false);
  const [selectedFPOForBoardMembers, setSelectedFPOForBoardMembers] = useState(null);
  const [showBoardMembersView, setShowBoardMembersView] = useState(false);
  const [showFarmServices, setShowFarmServices] = useState(false);
  const [selectedFPOForFarmServices, setSelectedFPOForFarmServices] = useState(null);
  const [showFarmServicesView, setShowFarmServicesView] = useState(false);
  const [showTurnover, setShowTurnover] = useState(false);
  const [selectedFPOForTurnover, setSelectedFPOForTurnover] = useState(null);
  const [showCropEntries, setShowCropEntries] = useState(false);
  const [selectedFPOForCropEntries, setSelectedFPOForCropEntries] = useState(null);
  const [showInputShop, setShowInputShop] = useState(false);
  const [selectedFPOForInputShop, setSelectedFPOForInputShop] = useState(null);
  const [showProductCategories, setShowProductCategories] = useState(false);
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
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showRegistrationDetailModal, setShowRegistrationDetailModal] = useState(false);
  const [selectedRegistrationForDetail, setSelectedRegistrationForDetail] = useState(null);
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);
  const [showFarmerRegistration, setShowFarmerRegistration] = useState(false);
  const [registrationFilters, setRegistrationFilters] = useState({
    role: '',
    status: ''
  });
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    region: '',
    kycStatus: '',
    assignmentStatus: '',
    employeeFilter: ''
  });
  // Dynamic location filters
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);
  // Photo upload state (persisted)
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);
  
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'

  // Load saved photo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userProfilePhoto:ADMIN');
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
      if (typeof data === 'string') { setUserPhoto(data); try { localStorage.setItem('userProfilePhoto:ADMIN', data); } catch {} }
    };
    reader.onerror = () => alert('Error reading file');
    reader.readAsDataURL(file);
  };
  const handlePhotoClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleRemovePhoto = () => { setUserPhoto(null); try { localStorage.removeItem('userProfilePhoto:ADMIN'); } catch {} };

  // Load states and districts for filters
  useEffect(() => {
    (async () => {
      try {
        const data = await adminAPI.getLocations();
        setAvailableStates(Array.isArray(data?.states) ? data.states : []);
        setAvailableDistricts(Array.isArray(data?.districts) ? data.districts : []);
      } catch (e) {
        setAvailableStates([]);
        setAvailableDistricts([]);
      }
    })();
  }, []);

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

  // Load data from API
  useEffect(() => {
    fetchData();
    
    // Listen for KYC status updates from Employee Dashboard
    const handleKYCUpdate = (event) => {
      console.log('🔄 Admin Dashboard: KYC status updated, refreshing data...');
      console.log('📊 KYC Update details:', event.detail);
      // Wait 2 seconds for backend to update, then refresh
      setTimeout(() => {
        console.log('🔄 Refreshing Admin data after KYC update...');
        fetchData();
      }, 2000);
    };
    
    window.addEventListener('kycStatusUpdated', handleKYCUpdate);
    
    return () => {
      window.removeEventListener('kycStatusUpdated', handleKYCUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [registrationsData, farmersData, employeesData, fposData] = await Promise.all([
        adminAPI.getRegistrationList(),
        adminAPI.getFarmersWithKyc(),
        adminAPI.getEmployeesWithStats(),
        fpoAPI.getAllFPOs()
      ]);

      if (farmersData) {
        console.log('🔍 Farmers data loaded from backend:', farmersData);
        console.log('🔍 Sample farmer with assignment:', farmersData[0]);
        setFarmers(farmersData);
      }
      if (employeesData) {
        setEmployees(employeesData);
      }
      if (registrationsData) {
        setRegistrations(registrationsData);
      } else {
        setRegistrations([]);
      }
      
      // Set FPO data (filter to match Super Admin rules)
      let fpoList = Array.isArray(fposData) ? fposData : (fposData?.content || fposData?.items || fposData?.data || []);
      fpoList = (fpoList || []).filter(fpo => {
        const status = fpo.status?.toUpperCase();
        return status === 'ACTIVE' || status === 'APPROVED' || status === 'APPROVED_BY_ADMIN';
      });
      setFpos(fpoList);
      console.log('📊 FPOs data loaded in Admin dashboard (filtered):', fpoList?.length || 0, 'records');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
      
      // Fallback: try to fetch data individually
      try {
        const farmersData = await adminAPI.getFarmersWithKyc();
        if (farmersData) {
          console.log('🔍 Farmers data loaded from backend (fallback):', farmersData);
          console.log('🔍 Sample farmer with assignment (fallback):', farmersData[0]);
          setFarmers(farmersData);
        }
      } catch (e) {
        console.error('Failed to fetch farmers:', e);
      }
      
      try {
        const employeesData = await adminAPI.getEmployeesWithStats();
        if (employeesData) setEmployees(employeesData);
      } catch (e) {
        console.error('Failed to fetch employees:', e);
      }
      
      try {
        const registrationsData = await adminAPI.getRegistrationList();
        if (registrationsData) setRegistrations(registrationsData);
      } catch (e) {
        console.error('Failed to fetch registrations:', e);
        setRegistrations([]);
      }
      
      try {
        const fposData = await fpoAPI.getAllFPOs();
        let fpoList = Array.isArray(fposData) ? fposData : (fposData?.content || fposData?.items || fposData?.data || []);
        fpoList = (fpoList || []).filter(fpo => {
          const status = fpo.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'APPROVED' || status === 'APPROVED_BY_ADMIN';
        });
        setFpos(fpoList);
        console.log('📊 FPOs data loaded in Admin dashboard (fallback, filtered):', fpoList?.length || 0, 'records');
      } catch (e) {
        console.error('Failed to fetch FPOs:', e);
        setFpos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockFarmers = [
      {
        id: 1,
        name: 'Ramu Yadav',
        phone: '9876543210',
        state: 'Telangana',
        district: 'Karimnagar',
        region: 'Southern',
        kycStatus: 'PENDING',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-15'
      },
      {
        id: 2,
        name: 'Krishna Kumar',
        phone: '9983733210',
        state: 'Andhrapradesh',
        district: 'rangareddy',
        region: 'Southern',
        kycStatus: 'PENDING',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-18'
      },
      {
        id: 3,
        name: 'suman kurrapati',
        phone: '9783733210',
        state: 'Andhrapradesh',
        district: 'kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-10'
      },
      {
        id: 4,
        name: 'vamsi krishna',
        phone: '9783733210',
        state: 'Andhrapradesh',
        district: 'kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-20'
      },
      {
        id: 5,
        name: 'hari kumar chowdary',
        phone: '6271979190',
        state: 'Andhrapradesh',
        district: 'Kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-25'
      },
      {
        id: 6,
        name: 'kumar sreenu chowdary',
        phone: '6302949363',
        state: 'Andhrapradesh',
        district: 'kadpaa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'karthik kumar',
        assignedDate: '2024-01-12'
      },
      {
        id: 7,
        name: 'Ainash kumar',
        phone: '9798433210',
        state: 'Andhrapradesh',
        district: 'Kuppam',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-12'
      }
    ];

    const mockEmployees = [
      {
        id: 1,
        name: 'John Doe',
        phone: '9876543201',
        email: 'john.doe@company.com',
        designation: 'KYC Officer',
        state: 'Maharashtra',
        district: 'Pune',
        region: 'Western',
        status: 'ACTIVE',
        assignedFarmersCount: 15,
        kycStats: {
          approved: 8,
          pending: 5,
          referBack: 2,
          rejected: 0
        }
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '9876543202',
        email: 'jane.smith@company.com',
        designation: 'KYC Officer',
        state: 'Gujarat',
        district: 'Ahmedabad',
        region: 'Western',
        status: 'ACTIVE',
        assignedFarmersCount: 12,
        kycStats: {
          approved: 6,
          pending: 4,
          referBack: 1,
          rejected: 1
        }
      },
      {
        id: 3,
        name: 'Mike Johnson',
        phone: '9876543203',
        email: 'mike.johnson@company.com',
        designation: 'KYC Officer',
        state: 'Punjab',
        district: 'Amritsar',
        region: 'Northern',
        status: 'ACTIVE',
        assignedFarmersCount: 8,
        kycStats: {
          approved: 5,
          pending: 2,
          referBack: 1,
          rejected: 0
        }
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        phone: '9876543204',
        email: 'sarah.wilson@company.com',
        designation: 'KYC Officer',
        state: 'Karnataka',
        district: 'Bangalore',
        region: 'Southern',
        status: 'ACTIVE',
        assignedFarmersCount: 0,
        kycStats: {
          approved: 0,
          pending: 0,
          referBack: 0,
          rejected: 0
        }
      }
    ];

    setFarmers(mockFarmers);
    setEmployees(mockEmployees);
  };



  const getFilteredFarmers = () => {
    return (farmers || []).filter(farmer => {
      const matchesState = !filters.state || farmer.state === filters.state;
      const matchesDistrict = !filters.district || farmer.district === filters.district;
      const matchesKycStatus = !filters.kycStatus || farmer.kycStatus === filters.kycStatus;

      // Assignment status: "ASSIGNED" means there is a non-empty assignedEmployee not equal to 'Not Assigned'
      const isAssigned = farmer.assignedEmployee && String(farmer.assignedEmployee).trim() !== '' && String(farmer.assignedEmployee).toLowerCase() !== 'not assigned';
      const matchesAssignmentStatus = !filters.assignmentStatus ||
        (filters.assignmentStatus === 'ASSIGNED' && isAssigned) ||
        (filters.assignmentStatus === 'UNASSIGNED' && !isAssigned);

      // Assigned employee filter: prefer matching by employeeId, fallback to name includes
      const empFilter = (filters.employeeFilter || '').toString().trim();
      const assignedId = farmer.assignedEmployeeId !== undefined && farmer.assignedEmployeeId !== null
        ? String(farmer.assignedEmployeeId)
        : '';
      const assigned = String(farmer.assignedEmployee || '').trim();
      const matchesEmployee = !empFilter ||
        (assignedId && assignedId === empFilter) ||
        assigned === empFilter ||
        assigned.toLowerCase().includes(empFilter.toLowerCase()) ||
        empFilter.toLowerCase().includes(assigned.toLowerCase());
      
      return matchesState && matchesDistrict && matchesKycStatus && matchesAssignmentStatus && matchesEmployee;
    });
  };

  const getFilteredEmployees = () => {
    return (employees || []).filter(employee => {
      const matchesDistrict = !filters.district || employee.district === filters.district;
      return matchesDistrict;
    });
  };

  const getFilteredRegistrations = () => {
    // Apply filters
    const filtered = (registrations || []).filter(registration => {
      // Admins should never appear in the Admin dashboard registration list
      if ((registration.role || '').toUpperCase() === 'ADMIN') {
        return false;
      }
      const roleMatch = !registrationFilters.role || registration.role === registrationFilters.role;
      const statusMatch = !registrationFilters.status || registration.status === registrationFilters.status;
      return roleMatch && statusMatch;
    });
    return filtered;
  };

  const handleViewRegistration = (registration) => {
    setViewingRegistration(registration);
  };

  const handleCloseRegistrationDetailModal = () => {
    setShowRegistrationDetailModal(false);
    setSelectedRegistrationForDetail(null);
  };

  const handleRegistrationUpdate = () => {
    // Refresh the registration data
    fetchData();
  };

  const handleFarmServices = (fpo) => {
    console.log('AdminDashboard: handleFarmServices called with:', fpo);
    setSelectedFPOForFarmServices(fpo);
    setShowFarmServices(true);
  };

  const handleTurnover = (fpo) => {
    console.log('AdminDashboard: handleTurnover called with:', fpo);
    console.log('AdminDashboard: Setting showTurnover to true and selectedFPOForTurnover to:', fpo);
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

  // Additional FPO handlers
  const handleEditFPO = (fpo) => {
    setEditingFPO(fpo);
    setShowFPOEdit(true);
  };

  const handleViewFPO = async (fpo) => {
    try {
      let numericId = fpo?.id;
      if (!numericId && fpo?.fpoId) {
        const full = await fpoAPI.getFPOByFpoId(fpo.fpoId);
        numericId = full?.id;
        if (full) fpo = full;
      }
      setViewingFPO({ ...(fpo || {}), id: numericId || fpo?.id });
      setSelectedFPOTab('overview');
    } catch {
      setViewingFPO(fpo);
      setSelectedFPOTab('overview');
    }
  };

  const handleBoardMembers = (fpo) => {
    console.log('AdminDashboard: handleBoardMembers called with:', fpo);
    setSelectedFPOForBoardMembers(fpo);
    setShowBoardMembers(true);
  };

  const handleFpoUsers = (fpo) => {
    setSelectedFPOForUsers(fpo);
    setShowFpoUsers(true);
  };

  const handleAddFPO = () => {
    setShowFPOCreationForm(true);
  };

  const getFilteredFPOs = () => {
    return fpos.filter(fpo => {
      const matchesState = !fpoFilters.state || fpo.state === fpoFilters.state;
      const matchesDistrict = !fpoFilters.district || fpo.district === fpoFilters.district;
      const matchesStatus = !fpoFilters.status || fpo.status === fpoFilters.status;
      const matchesRegistrationType = !fpoFilters.registrationType || fpo.registrationType === fpoFilters.registrationType;
      
      return matchesState && matchesDistrict && matchesStatus && matchesRegistrationType;
    });
  };

  const handleFPOCreated = async (payload) => {
    try {
      const created = await fpoAPI.createFPO(payload);
      setFpos(prev => [...prev, created]);
      setToast({ type: 'success', message: 'FPO created successfully' });
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Admin Dashboard - Failed to create FPO:', err);
      const msg = err?.response?.data?.message || 'Failed to create FPO';
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setShowFPOCreationForm(false);
    }
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      await adminAPI.approveUser(registrationId, 'FARMER'); // Default role, can be updated
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'APPROVED' } : reg
      ));
      alert('Registration approved successfully!');
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration. Please try again.');
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    try {
      await adminAPI.rejectUser(registrationId, 'Rejected by Admin');
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'REJECTED' } : reg
      ));
      alert('Registration rejected successfully!');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration. Please try again.');
    }
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
    const filteredFarmers = (farmers || []).filter(farmer => {
      const createdDate = farmer.createdAt || farmer.created_at || farmer.registrationDate || farmer.assignedDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const filteredEmployees = (employees || []).filter(employee => {
      const createdDate = employee.createdAt || employee.created_at || employee.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const filteredFPOs = (fpos || []).filter(fpo => {
      const createdDate = fpo.createdAt || fpo.created_at || fpo.registrationDate || fpo.joinDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const totalFarmers = timeFilter === 'all' ? (farmers?.length || 0) : filteredFarmers.length;
    const totalEmployees = timeFilter === 'all' ? (employees?.length || 0) : filteredEmployees.length;
    const totalFPOs = timeFilter === 'all' ? (fpos?.length || 0) : filteredFPOs.length;
    const unassignedFarmers = filteredFarmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned').length;
    
    // Handle different KYC status formats
    const pendingKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
      f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
    ).length;
    
    const approvedKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
    ).length;
    
    const referBackKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
    ).length;
    
    const rejectedKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
    ).length;

    console.log('Admin Stats calculated from real data:');
    console.log('- Total Farmers:', totalFarmers);
    console.log('- Total Employees:', totalEmployees);
    console.log('- Total FPOs:', totalFPOs);
    console.log('- Unassigned Farmers:', unassignedFarmers);
    console.log('- Pending KYC:', pendingKYC);
    console.log('- Approved KYC:', approvedKYC);
    console.log('- Refer Back KYC:', referBackKYC);
    console.log('- Rejected KYC:', rejectedKYC);

    return {
      totalFarmers,
      totalEmployees,
      totalFPOs,
      unassignedFarmers,
      pendingKYC,
      approvedKYC,
      referBackKYC,
      rejectedKYC,
      timeFilter
    };
  };

  const getTodoList = () => {
    const unassignedFarmers = (farmers || []).filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned');
    const overdueKYC = (farmers || []).filter(f => {
      if ((f.kycStatus === 'PENDING' || f.kycStatus === 'NOT_STARTED') && f.assignedEmployee && f.assignedEmployee !== 'Not Assigned') {
        // For now, consider all pending KYC as overdue if assigned
        return true;
      }
      return false;
    });
    const employeesWithLargeQueues = (employees || []).filter(emp => {
      const pendingCount = emp.pendingKyc || 0;
      return pendingCount > 5; // Large queue if more than 5 pending
    });

    console.log('Admin Todo list calculated from real data:');
    console.log('- Unassigned Farmers:', unassignedFarmers.length);
    console.log('- Overdue KYC:', overdueKYC.length);
    console.log('- Employees with Large Queues:', employeesWithLargeQueues.length);

    return {
      unassignedFarmers,
      overdueKYC,
      employeesWithLargeQueues
    };
  };

  const handleLogout = () => {
    logout();
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleChangePassword = () => {
    // Navigate to change password page
    window.location.href = '/change-password';
  };

  const handleViewFarmer = async (farmer) => {
    try {
      const full = await fetch(`/api/admin/farmers/${farmer.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      setViewingEmployee(null); // ensure employee view not active
      setSelectedFarmerData({ ...farmer, ...full });
      setShowFarmerDetails(false);
      // Show inline component instead of modal
      setViewingFarmer({ ...farmer, ...full });
    } catch (e) {
      setViewingFarmer(farmer);
    }
  };

  const handleCloseFarmerDetails = () => {
    setShowFarmerDetails(false);
    setSelectedFarmerData(null);
  };

  const handleViewEmployee = async (employee) => {
    try {
      // Fetch complete employee details from backend
      const completeEmployeeData = await adminAPI.getEmployeeById(employee.id);
      setViewingEmployee(completeEmployeeData);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      // Fallback to basic employee data if API call fails
      setViewingEmployee(employee);
    }
  };

  const handleCloseEmployeeDetails = () => {
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleUpdateEmployee = (updatedData) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === updatedData.id ? updatedData : emp
    ));
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleSaveEmployee = async (updatedData) => {
    try {
      // Update employee data in backend
      const updatedEmployee = await employeesAPI.updateEmployee(selectedEmployeeData.id, updatedData);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployeeData.id ? updatedEmployee : emp
      ));
      
      // Update selected employee data
      setSelectedEmployeeData(updatedEmployee);
      
      alert('Employee updated successfully!');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  const handleSaveFarmer = async (updatedData) => {
    try {
      // Update farmer data in backend
      const updatedFarmer = await farmersAPI.updateFarmer(selectedFarmerData.id, updatedData);
      
      // Update local state
      setFarmers(prev => prev.map(farmer => 
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

  const handleKYCDocumentUpload = (farmer) => {
    setSelectedFarmerForKYC(farmer);
    setShowKYCDocumentUpload(true);
  };

  const handleCloseKYCDocumentUpload = () => {
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCApprove = (farmerId, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'APPROVED' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCReject = (farmerId, reason, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'REJECTED' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCReferBack = (farmerId, reason, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'REFER_BACK' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setShowFarmerForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleAssignFarmers = async (assignments) => {
    try {
      console.log('🔍 handleAssignFarmers called with assignments:', assignments);
      
      // Extract farmer IDs and employee ID from assignments
      const farmerIds = assignments.map(a => a.farmerId);
      const employeeId = assignments[0]?.employeeId;
      
      console.log('🔍 Extracted farmerIds:', farmerIds);
      console.log('🔍 Extracted employeeId:', employeeId);
      
      if (!employeeId || farmerIds.length === 0) {
        alert('Please select an employee and at least one farmer');
        return;
      }
      
      // Try bulk assign first, then fallback to individual assignments
      try {
        console.log('🔄 Attempting bulk assign...');
        // Call admin API to bulk assign farmers
        const response = await api.post('/admin/bulk-assign-farmers', { farmerIds, employeeId });
        console.log('✅ Bulk assign successful:', response.data);
      } catch (bulkError) {
        console.log('❌ Bulk assign failed, trying individual assignments...', bulkError);
        // Fallback to individual assignments
        for (const farmerId of farmerIds) {
          try {
            console.log(`🔄 Assigning farmer ${farmerId} to employee ${employeeId}...`);
            const response = await api.post('/admin/assign-farmer', null, { 
              params: { farmerId, employeeId } 
            });
            console.log(`✅ Farmer ${farmerId} assigned successfully:`, response.data);
          } catch (individualError) {
            console.error(`❌ Failed to assign farmer ${farmerId}:`, individualError);
          }
        }
      }
      
      // Update local state for each assignment
      setFarmers(prev => prev.map(farmer => {
        const assignment = assignments.find(a => a.farmerId === farmer.id);
        if (assignment) {
          return {
            ...farmer,
            assignmentStatus: 'ASSIGNED',
            assignedEmployee: assignment.employeeName,
            assignedDate: new Date().toISOString().split('T')[0]
          };
        }
        return farmer;
      }));
      
      setShowAssignmentInline(false);
      alert('Farmers assigned successfully!');
    } catch (error) {
      console.error('Error assigning farmers:', error);
      alert('Failed to assign farmers');
    }
  };

    const renderOverview = () => {
    const stats = getStats();

    return (
      <div className="overview-section">
        <div className="overview-header">
          <div className="header-left">
            <h2 className="overview-title">Admin Dashboard Overview</h2>
            <p className="overview-description">
              Manage farmers, employees, and assignments efficiently.
            </p>
          </div>
          <div className="header-right">
            <div className="overview-actions">
            <button 
              className={`action-btn refresh ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                console.log('🔄 Refresh clicked - showing all data');
                setTimeFilter('all');
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
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon farmers">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-title">FARMERS</div>
            <div className="stats-value">{stats.totalFarmers}</div>
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
            <div className="stats-icon employees">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="stats-title">EMPLOYEES</div>
            <div className="stats-value">{stats.totalEmployees}</div>
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
            <div className="stats-value">{stats.totalFPOs}</div>
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

        {/* Quick Actions Section */}
        <div className="bottom-sections">
          <div className="section-card">
            <div className="section-header">
              <h3>Quick Actions</h3>
              <p className="section-description">
                Access frequently used functions to manage farmers, employees, and generate reports.
              </p>
            </div>
            <div className="quick-actions-grid">
              <button 
                onClick={() => {
                  setActiveTab('farmers');
                  setEditingFarmer(null); // Clear any existing farmer being edited
                  setShowFarmerRegistration(true); // Show the farmer registration form
                  console.log('🔄 Add New Farmer button clicked - opening farmer form');
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
                  zIndex: 1,
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
                Add New Farmer
              </button>
              <button 
                className="quick-action-btn secondary"
                onClick={() => {
                  setActiveTab('employees');
                  setShowEmployeeRegistration(true); // Show the employee registration form
                }}
              >
                <i className="fas fa-user-tie"></i>
                Add Employee
              </button>
              <button 
                className="quick-action-btn info"
                onClick={() => alert('Generate Report functionality coming soon!')}
              >
                <i className="fas fa-chart-bar"></i>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const renderFarmers = () => {
    const filteredFarmers = getFilteredFarmers();

    return (
      <div className="overview-section">
        {!showFarmerRegistration && !showFarmerForm ? (
          <>
            <div className="overview-header">
              <div className="header-left">
                <h2 className="overview-title">Farmer Management</h2>
                <p className="overview-description">
                  View and manage all farmer profiles with KYC status and assignments.
                </p>
              </div>
              <div className="header-right">
                <div className="overview-actions">
                                  <button 
                    onClick={() => {
                      setShowFarmerRegistration(true);
                    }}
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
                      transform: 'translateY(0)',
                      position: 'relative',
                      zIndex: 1,
                      pointerEvents: 'auto'
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
                  Add Farmer
                </button>
                <button 
                  onClick={() => {
                    setShowAssignmentInline(true);
                  }}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transform: 'translateY(0)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#2563eb';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#3b82f6';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                  }}
                >
                  <i className="fas fa-user-plus"></i>
                  Assign Farmers
                </button>
              </div>
            </div>
        </div>

            {/* Enhanced Filters */}
            <div className="filters-section">
              <div className="filter-group">
                <label className="filter-label">State</label>
                <select 
                  value={filters.state} 
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All States</option>
                  {availableStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">District</label>
                <select 
                  value={filters.district} 
                  onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">KYC Status</label>
                <select 
                  value={filters.kycStatus} 
                  onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All KYC Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="REFER_BACK">Refer Back</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Assignment Status</label>
                <select 
                  value={filters.assignmentStatus} 
                  onChange={(e) => setFilters(prev => ({ ...prev, assignmentStatus: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Assignment Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Assigned Employee</label>
                <select 
                  value={filters.employeeFilter} 
                  onChange={(e) => setFilters(prev => ({ ...prev, employeeFilter: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => {
                    const label = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || `Employee ${emp.id}`;
                    return (
                      <option key={emp.id} value={String(emp.id)}>{label}</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="filter-actions">
                <button 
                  className="filter-btn-clear"
                  onClick={() => setFilters({
                    state: '',
                    district: '',
                    region: '',
                    kycStatus: '',
                    assignmentStatus: '',
                    employeeFilter: ''
                  })}
                >
                  <i className="fas fa-times"></i>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Farmers Table or Inline Assign/View */}
      {!showAssignmentInline && !viewingFarmer ? (
      <DataTable
              data={filteredFarmers}
        columns={[
          { key: 'name', label: 'Name' },
                { key: 'contactNumber', label: 'Phone' },
          { key: 'state', label: 'State' },
          { key: 'district', label: 'District' },
          { 
            key: 'kycStatus', 
            label: 'KYC Status',
            render: (value) => {
              if (!value) return 'NOT_STARTED';
              if (value === 'PENDING' || value === 'pending') return 'PENDING';
              if (value === 'APPROVED' || value === 'approved') return 'APPROVED';
              if (value === 'REFER_BACK' || value === 'refer_back') return 'REFER_BACK';
              if (value === 'REJECTED' || value === 'rejected') return 'REJECTED';
              if (value === 'NOT_STARTED' || value === 'not_started') return 'NOT_STARTED';
              return value.toUpperCase();
            }
          },
          { key: 'assignedEmployee', label: 'Assigned Employee' }
        ]}
        customActions={[
          {
                  label: 'View',
                  className: 'action-btn-small info',
                  onClick: handleViewFarmer
                },
                {
                  label: 'ID Card',
                  className: 'action-btn-small primary',
                  onClick: async (farmer) => {
                    try {
                      console.log('🔄 Attempting to get ID card for farmer:', farmer.id, farmer.name);
                      
                      // First, try to get existing ID cards
                      const list = await idCardAPI.getIdCardsByHolder(farmer.id.toString());
                      console.log('📋 Existing ID cards found:', list);
                      
                      if (Array.isArray(list) && list.length > 0) {
                        const activeCard = list.find(card => card.status === 'ACTIVE') || list[0];
                        console.log('✅ Using existing ID card:', activeCard.cardId);
                        setCurrentCardId(activeCard.cardId);
                        setShowIdCardModal(true);
                        return;
                      }
                      
                      // If no existing cards, generate a new one
                      console.log('🔄 No existing ID cards found, generating new one...');
                      const gen = await idCardAPI.generateFarmerIdCard(farmer.id);
                      console.log('🎯 Generated ID card response:', gen);
                      
                      if (gen && gen.cardId) {
                        console.log('✅ Successfully generated ID card:', gen.cardId);
                        setCurrentCardId(gen.cardId);
                        setShowIdCardModal(true);
                      } else {
                        console.error('❌ Generated ID card response is invalid:', gen);
                        alert('Failed to generate ID card: Invalid response from server');
                      }
                    } catch (e) {
                      console.error('❌ Farmer ID Card action failed:', e);
                      console.error('Error details:', e.response?.data || e.message);
                      alert(`Unable to open or generate ID card: ${e.response?.data?.message || e.message}`);
                    }
                  }
                },
                {
                  label: 'Edit',
                  className: 'action-btn-small primary',
                  onClick: handleEditFarmer
                },
                {
                  label: 'KYC',
                  className: 'action-btn-small warning',
            onClick: handleKYCDocumentUpload
          }
        ]}
      />
      ) : showAssignmentInline ? (
        <AssignmentInline 
          farmers={farmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned' || f.assignedEmployee === null || f.assignedEmployee === undefined || f.assignedEmployee === '')}
          employees={employees}
          onBack={() => setShowAssignmentInline(false)}
          onAssign={handleAssignFarmers}
        />
      ) : (
        <ViewFarmer 
          farmerData={viewingFarmer}
          onBack={() => setViewingFarmer(null)}
          onSave={async (updatedData) => {
            try {
              const updated = await farmersAPI.updateFarmer(viewingFarmer.id, updatedData);
              setFarmers(prev => prev.map(f => f.id === viewingFarmer.id ? updated : f));
              setViewingFarmer(updated);
              alert('Farmer updated successfully!');
            } catch (e) {
              console.error('Error updating farmer:', e);
              alert('Failed to update farmer');
            }
          }}
        />
      )}
          </>
        ) : showFarmerRegistration ? (
          <div className="farmer-registration-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Add New Farmer</h2>
                <p className="section-description">
                  Fill in the farmer details to create a new farmer account.
                </p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={() => {
                    // Go back to Farmers tab and close the registration form
                    setActiveTab('farmers');
                    setShowFarmerRegistration(false);
                    console.log('🔄 Back to Farmers button clicked - returning to farmers list');
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transform: 'translateY(0)',
                                      position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#4b5563';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.25)';
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Farmers
                </button>
              </div>
            </div>

            <FarmerRegistrationForm 
              isInDashboard={true}
              onClose={() => setShowFarmerRegistration(false)}
              onSubmit={async (farmerData) => {
                try {
                  const newFarmer = await farmersAPI.createFarmer(farmerData);
                  setFarmers(prev => [...prev, newFarmer]);
                  alert('Farmer created successfully!');
                  setShowFarmerRegistration(false);
                } catch (error) {
                  console.error('Error creating farmer:', error);
                  const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create farmer. Please try again.';
                  alert(errorMessage);
                }
              }}
            />
          </div>
        ) : showFarmerForm ? (
          <div className="farmer-edit-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Edit Farmer</h2>
                <p className="section-description">
                  Update farmer details and information.
                </p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={() => {
                    setShowFarmerForm(false);
                    setEditingFarmer(null);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transform: 'translateY(0)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#4b5563';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.25)';
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Farmers
                </button>
                <button 
                  onClick={() => {
                    setShowFarmerForm(false);
                    setEditingFarmer(null);
                  }}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                    marginLeft: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ef4444';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                  }}
                  title="Close"
                >
                  <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
                </button>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <FarmerRegistrationForm
                isInDashboard={true}
                editData={editingFarmer}
                onClose={() => {
                  setShowFarmerForm(false);
                  setEditingFarmer(null);
                }}
                onSubmit={async (farmerData) => {
                  try {
                    if (editingFarmer) {
                      const updatedFarmer = await farmersAPI.updateFarmer(editingFarmer.id, farmerData);
                      setFarmers(prev => prev.map(farmer => 
                        farmer.id === editingFarmer.id ? updatedFarmer : farmer
                      ));
                      alert('Farmer updated successfully!');
                    } else {
                      const newFarmer = await farmersAPI.createFarmer(farmerData);
                      setFarmers(prev => [...prev, newFarmer]);
                      alert('Farmer created successfully!');
                    }
                    setShowFarmerForm(false);
                    setEditingFarmer(null);
                  } catch (error) {
                    console.error('Error saving farmer:', error);
                    alert('Failed to save farmer. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderRegistration = () => {
    const filteredRegistrations = getFilteredRegistrations();

    return (
      <div className="registration-section">
        <div className="section-header">
          <div>
            <h2 className="registration-management-title">Registration Management</h2>
            <p className="section-description">
              Review and manage user registration requests.
            </p>
          </div>
          <div className="section-actions">
                          <button 
               onClick={fetchData}
                style={{
                  background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transform: 'translateY(0)',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto'
                }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(21, 128, 61, 0.25)';
                 e.target.style.transform = 'translateY(0)';
              }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Filters */}
      <div className="filters-section">
          <div className="filter-group">
          <select 
              className="filter-select"
              value={registrationFilters.role}
              onChange={(e) => setRegistrationFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="FPO">FPO</option>
              <option value="FARMER">Farmer</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
          <div className="filter-group">
            <select 
              className="filter-select"
              value={registrationFilters.status}
              onChange={(e) => setRegistrationFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

        

        {/* Registration Table or Inline View */}
      {!viewingRegistration ? (
      <DataTable
          data={filteredRegistrations}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
            { key: 'phoneNumber', label: 'Phone' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' }
          ]}
          customActions={[
            {
              label: 'View',
              className: 'action-btn-small info',
              onClick: handleViewRegistration
            },
            {
              label: 'Approve',
              className: 'action-btn-small success',
              onClick: (registration) => handleApproveRegistration(registration.id),
              show: (registration) => registration.status === 'PENDING'
            },
            {
              label: 'Reject',
              className: 'action-btn-small danger',
              onClick: (registration) => handleRejectRegistration(registration.id),
              show: (registration) => registration.status === 'PENDING'
            }
          ]}
      />
      ) : (
        <RegistrationDetailsInline 
          registration={viewingRegistration}
          onBack={() => setViewingRegistration(null)}
          onUpdate={handleRegistrationUpdate}
        />
      )}
    </div>
  );
  };

  const renderEmployees = () => {
    const filteredEmployees = getFilteredEmployees();

  return (
      <div className="overview-section">
        {!showEmployeeRegistration && !showEmployeeForm ? (
          <>
            <div className="overview-header">
              <div className="header-left">
                <h2 className="overview-title">Employee Management</h2>
                <p className="overview-description">
                  View and manage employee profiles with KYC assignment statistics.
                </p>
              </div>
              <div className="header-right">
                <div className="overview-actions">
                <button 
                  onClick={() => setShowEmployeeRegistration(true)}
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
                    transform: 'translateY(0)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'auto'
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
                  Add Employee
                </button>
                </div>
              </div>
      </div>

            {/* Employee Stats */}
            <div className="employee-stats">
              <h3>Employee KYC Progress</h3>
              <p className="section-description">
                Monitor KYC verification progress for each employee and their assigned farmers.
              </p>
              <div className="employee-stats-grid">
                {employees.map(employee => {
                  // Calculate real stats from farmers data
                  const assignedFarmers = (farmers || []).filter(f => 
                    f.assignedEmployee === employee.name || 
                    f.assignedEmployee === employee.contactNumber ||
                    f.assignedEmployeeId === employee.id
                  );
                  
                  const approvedCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
                  ).length;
                  
                  const pendingCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                    f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
                  ).length;
                  
                  const referBackCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
                  ).length;
                  
                  const rejectedCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
                  ).length;
                  
                  return (
                    <div key={employee.id} className="employee-stat-card">
                      <div className="employee-info">
                        <h4>{employee.name}</h4>
                        <p>{employee.designation} - {employee.district}</p>
                      </div>
                      <div className="employee-kyc-stats">
                        <div className="kyc-stat">
                          <span className="stat-number">{assignedFarmers.length}</span>
                          <span className="stat-label">Total Assigned</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number approved">{approvedCount}</span>
                          <span className="stat-label">Approved</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number pending">{pendingCount}</span>
                          <span className="stat-label">Pending</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number refer-back">{referBackCount}</span>
                          <span className="stat-label">Refer Back</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number rejected">{rejectedCount}</span>
                          <span className="stat-label">Rejected</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

            {/* Employees Table */}
          {!viewingEmployee ? (
          <DataTable
            data={filteredEmployees.map(employee => {
              // Calculate real stats from farmers data
              const assignedFarmers = (farmers || []).filter(f => 
                f.assignedEmployee === employee.name || 
                f.assignedEmployee === employee.contactNumber ||
                f.assignedEmployeeId === employee.id
              );
              
              const approvedCount = assignedFarmers.filter(f => 
                f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
              ).length;
              
              const pendingCount = assignedFarmers.filter(f => 
                f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
              ).length;
              
              return {
                ...employee,
                totalAssigned: assignedFarmers.length,
                approvedKyc: approvedCount,
                pendingKyc: pendingCount
              };
            })}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'contactNumber', label: 'Contact' },
              { key: 'email', label: 'Email' },
              { key: 'state', label: 'State' },
              { key: 'district', label: 'District' },
              { key: 'totalAssigned', label: 'Assigned Farmers' },
              { key: 'approvedKyc', label: 'Approved KYC' },
              { key: 'pendingKyc', label: 'Pending KYC' }
            ]}
            customActions={[
              {
                label: 'View',
                className: 'action-btn-small info',
                onClick: handleViewEmployee
              },
              {
                label: 'ID Card',
                className: 'action-btn-small primary',
                onClick: async (employee) => {
                  try {
                    console.log('🔄 Attempting to get ID card for employee:', employee.id, employee.name);
                    
                    // First, try to get existing ID cards
                    const list = await idCardAPI.getIdCardsByHolder(employee.id.toString());
                    console.log('📋 Existing ID cards found:', list);
                    
                    if (Array.isArray(list) && list.length > 0) {
                      const activeCard = list.find(card => card.status === 'ACTIVE') || list[0];
                      console.log('✅ Using existing ID card:', activeCard.cardId);
                      setCurrentCardId(activeCard.cardId);
                      setShowIdCardModal(true);
                      return;
                    }
                    
                    // If no existing cards, generate a new one
                    console.log('🔄 No existing ID cards found, generating new one...');
                    const gen = await idCardAPI.generateEmployeeIdCard(employee.id);
                    console.log('🎯 Generated ID card response:', gen);
                    
                    if (gen && gen.cardId) {
                      console.log('✅ Successfully generated ID card:', gen.cardId);
                      setCurrentCardId(gen.cardId);
                      setShowIdCardModal(true);
                    } else {
                      console.error('❌ Generated ID card response is invalid:', gen);
                      alert('Failed to generate ID card: Invalid response from server');
                    }
                  } catch (e) {
                    console.error('❌ Employee ID Card action failed:', e);
                    console.error('Error details:', e.response?.data || e.message);
                    alert(`Unable to open or generate ID card: ${e.response?.data?.message || e.message}`);
                  }
                }
              },
              {
                label: 'Edit',
                className: 'action-btn-small primary',
                onClick: handleEditEmployee
              }
            ]}
          />
          ) : (
            <ViewEmployee 
              employeeData={viewingEmployee}
              onBack={() => setViewingEmployee(null)}
              onSave={handleSaveEmployee}
            />
          )}
          </>
        ) : showEmployeeRegistration ? (
          <div className="employee-registration-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Add New Employee</h2>
                <p className="section-description">
                  Fill in the employee details to create a new employee account.
                </p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={() => {
                    // Go back to Employees tab and close the registration form
                    setActiveTab('employees');
                    setShowEmployeeRegistration(false);
                    console.log('🔄 Back to Employees button clicked - returning to employees list');
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transform: 'translateY(0)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#4b5563';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.25)';
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Employees
                </button>
              </div>
            </div>

            <EmployeeRegistrationForm 
              isInDashboard={true}
              editData={editingEmployee}
              onClose={() => {
                setShowEmployeeForm(false);
                setEditingEmployee(null);
              }}
              onSubmit={async (employeeData) => {
                try {
                  if (editingEmployee) {
                    const updatedEmployee = await employeesAPI.updateEmployee(editingEmployee.id, employeeData);
                    setEmployees(prev => prev.map(employee => 
                      employee.id === editingEmployee.id ? updatedEmployee : employee
                    ));
                    alert('Employee updated successfully!');
                  } else {
                    const newEmployee = await employeesAPI.createEmployee(employeeData);
                    setEmployees(prev => [...prev, newEmployee]);
                    alert('Employee created successfully!');
                  }
                  setShowEmployeeForm(false);
                  setEditingEmployee(null);
                } catch (error) {
                  console.error('Error saving employee:', error);
                  const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save employee. Please try again.';
                  alert(errorMessage);
                }
              }}
            />
          </div>
        ) : showEmployeeForm ? (
          <div className="employee-edit-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Edit Employee</h2>
                <p className="section-description">
                  Update employee details and information.
                </p>
              </div>
              <div className="section-actions">
                <button 
                  onClick={() => {
                    setShowEmployeeForm(false);
                    setEditingEmployee(null);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transform: 'translateY(0)',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#4b5563';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6b7280';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.25)';
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Employees
                </button>
                <button 
                  onClick={() => {
                    setShowEmployeeForm(false);
                    setEditingEmployee(null);
                  }}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                    marginLeft: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ef4444';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                  }}
                  title="Close"
                >
                  <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
                </button>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <EmployeeRegistrationForm
                isInDashboard={true}
                editData={editingEmployee}
                onClose={() => {
                  setShowEmployeeForm(false);
                  setEditingEmployee(null);
                }}
                onSubmit={async (employeeData) => {
                  try {
                    if (editingEmployee) {
                      const updatedEmployee = await employeesAPI.updateEmployee(editingEmployee.id, employeeData);
                      setEmployees(prev => prev.map(employee => 
                        employee.id === editingEmployee.id ? updatedEmployee : employee
                      ));
                      alert('Employee updated successfully!');
                    } else {
                      const newEmployee = await employeesAPI.createEmployee(employeeData);
                      setEmployees(prev => [...prev, newEmployee]);
                      alert('Employee created successfully!');
                    }
                    setShowEmployeeForm(false);
                    setEditingEmployee(null);
                  } catch (error) {
                    console.error('Error saving employee:', error);
                    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save employee. Please try again.';
                    alert(errorMessage);
                  }
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderKYCOverview = () => {
    const stats = getStats();
    
    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">KYC Overview</h2>
          <p className="overview-description">
            Comprehensive view of KYC status across all farmers and employees.
          </p>
        </div>

        {/* KYC Status Breakdown */}
        <div className="kyc-breakdown">
          <h3 className="kyc-breakdown-title">KYC Status Breakdown</h3>
          <p className="section-description">
            Overview of KYC verification status distribution across all farmers.
          </p>
          <div className="kyc-stats-grid">
            <div className="kyc-stat-card approved">
              <span className="kyc-stat-number">{stats.approvedKYC}</span>
              <span className="kyc-stat-label">Approved</span>
            </div>
            <div className="kyc-stat-card pending">
              <span className="kyc-stat-number">{stats.pendingKYC}</span>
              <span className="kyc-stat-label">Pending</span>
            </div>
            <div className="kyc-stat-card refer-back">
              <span className="kyc-stat-number">{stats.referBackKYC}</span>
              <span className="kyc-stat-label">Refer Back</span>
            </div>
            <div className="kyc-stat-card rejected">
              <span className="kyc-stat-number">{stats.rejectedKYC}</span>
              <span className="kyc-stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* Employee KYC Progress */}
        <div className="employee-stats">
          <h3 className="employee-kyc-progress-title">Employee KYC Progress</h3>
          <p className="section-description">
            Monitor KYC verification progress for each employee and their assigned farmers.
          </p>
          <div className="employee-stats-grid">
            {employees.length > 0 ? (
              employees.map(employee => {
                // Calculate real stats from farmers data
                const assignedFarmers = (farmers || []).filter(f => 
                  f.assignedEmployee === employee.name || 
                  f.assignedEmployee === employee.contactNumber ||
                  f.assignedEmployeeId === employee.id
                );
                
                const approvedCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
                ).length;
                
                const pendingCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                  f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
                ).length;
                
                const referBackCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
                ).length;
                
                const rejectedCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
                ).length;
                
                return (
                  <div key={employee.id} className="employee-stat-card">
                    <div className="employee-info">
                      <h4>{employee.name}</h4>
                      <p>{employee.designation} - {employee.district}</p>
                    </div>
                    <div className="employee-kyc-stats">
                      <div className="kyc-stat">
                        <span className="stat-number">{assignedFarmers.length}</span>
                        <span className="stat-label">Total Assigned</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number approved">{approvedCount}</span>
                        <span className="stat-label">Approved</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number pending">{pendingCount}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number refer-back">{referBackCount}</span>
                        <span className="stat-label">Refer Back</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number rejected">{rejectedCount}</span>
                        <span className="stat-label">Rejected</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback cards when no employees data
              <>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer</h4>
                    <p>KYC Officer - Hyderabad</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer 2</h4>
                    <p>KYC Officer - Bangalore</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer 3</h4>
                    <p>KYC Officer - Mumbai</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KYC Progress Overview */}
        <div className="kyc-progress-section">
          <h3 className="kyc-progress-overview-title">KYC Progress Overview</h3>
          <p className="section-description">
            Visual representation of KYC verification progress with circular indicators.
          </p>
          <div className="kyc-progress-grid">
            <div className="progress-card approved">
              <div className="progress-circle">
                <div className="progress-number">{stats.approvedKYC}</div>
              </div>
              <div className="progress-label">Approved KYC</div>
            </div>
            <div className="progress-card pending">
              <div className="progress-circle">
                <div className="progress-number">{stats.pendingKYC}</div>
              </div>
              <div className="progress-label">Pending KYC</div>
            </div>
            <div className="progress-card refer-back">
              <div className="progress-circle">
                <div className="progress-number">{stats.referBackKYC}</div>
              </div>
              <div className="progress-label">Refer Back</div>
            </div>
            <div className="progress-card rejected">
              <div className="progress-circle">
                <div className="progress-number">{stats.rejectedKYC}</div>
              </div>
              <div className="progress-label">Rejected KYC</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
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
                ) : (
                  <div className="user-avatar-initials">{user?.name?.charAt(0) || 'A'}</div>
                )}
                <div className="avatar-upload-overlay"><i className="fas fa-camera"></i></div>
              </div>
              <span className="user-email">{user?.email || 'admin@example.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large user-avatar-with-upload" onClick={handlePhotoClick}>
                  {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="user-avatar-photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div className="user-avatar-initials">{user?.name?.charAt(0) || 'A'}</div>
                  )}
                  <div className="avatar-upload-overlay"><i className="fas fa-camera"></i></div>
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'Admin'}</div>
                  <div className="user-email">{user?.email || 'admin@example.com'}</div>
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
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <div className="sidebar-role">Admin</div>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard Overview</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            <i className="fas fa-user-plus"></i>
            <span>Registration</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => setActiveTab('farmers')}
          >
            <i className="fas fa-users"></i>
            <span>Farmers</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <i className="fas fa-user-tie"></i>
            <span>Employees</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'fpo' ? 'active' : ''}`}
            onClick={() => setActiveTab('fpo')}
          >
            <i className="fas fa-building"></i>
            <span>FPO</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'kyc-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc-overview')}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>KYC Overview</span>
          </div>


          <div 
            className={`nav-item ${activeTab === 'bulk-operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk-operations')}
          >
            <i className="fas fa-tasks"></i>
            <span>Bulk Operations</span>
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
          {activeTab === 'fpo' && (
            <div className="superadmin-overview-section">
              {!showFPOCreationForm ? (
                <>
                  {/* FPO Action Views - These should show directly when clicked */}
                  {showBoardMembers && selectedFPOForBoardMembers ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOBoardMembersView
                        fpo={selectedFPOForBoardMembers}
                        onClose={() => { setShowBoardMembers(false); setSelectedFPOForBoardMembers(null); }}
                      />
                    </div>
                  ) : showFarmServices && selectedFPOForFarmServices ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOFarmServicesView
                        fpo={selectedFPOForFarmServices}
                        onClose={() => { setShowFarmServices(false); setSelectedFPOForFarmServices(null); }}
                      />
                    </div>
                  ) : (() => {
                    console.log('Checking Turnover state:', { showTurnover, selectedFPOForTurnover });
                    return showTurnover && selectedFPOForTurnover;
                  })() ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOTurnoverView
                        fpo={selectedFPOForTurnover}
                        onClose={() => { setShowTurnover(false); setSelectedFPOForTurnover(null); }}
                      />
                    </div>
                  ) : showCropEntries && selectedFPOForCropEntries ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOCropEntriesView
                        fpo={selectedFPOForCropEntries}
                        onClose={() => { setShowCropEntries(false); setSelectedFPOForCropEntries(null); }}
                      />
                    </div>
                  ) : showInputShop && selectedFPOForInputShop ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOInputShopView
                        fpo={selectedFPOForInputShop}
                        onClose={() => { setShowInputShop(false); setSelectedFPOForInputShop(null); }}
                      />
                    </div>
                  ) : showProductCategories && selectedFPOForProductCategories ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOProductCategoriesView
                        fpo={selectedFPOForProductCategories}
                        onClose={() => { setShowProductCategories(false); setSelectedFPOForProductCategories(null); }}
                      />
                    </div>
                  ) : showProducts && selectedFPOForProducts ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOProductsView
                        fpo={selectedFPOForProducts}
                        onClose={() => { setShowProducts(false); setSelectedFPOForProducts(null); }}
                      />
                    </div>
                  ) : showFpoUsers && selectedFPOForUsers ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPOUsersView
                        fpo={selectedFPOForUsers}
                        onClose={() => { setShowFpoUsers(false); setSelectedFPOForUsers(null); }}
                        onToast={(type, message) => setToast({ type, message })}
                        userRole="ADMIN"
                      />
                    </div>
                  ) : viewingFPO ? (
                    <div className="section-card" style={{ padding: 0 }}>
                      <FPODetailsView
                        fpo={viewingFPO}
                        onClose={() => setViewingFPO(null)}
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
                            { label: 'Dashboard', className: 'info', onClick: (fpo) => { console.log('Dashboard clicked for:', fpo); setViewingFPO(fpo); setSelectedFPOTab('overview'); } },
                            { label: 'Edit FPO', className: 'warning', onClick: (fpo) => { console.log('Edit FPO clicked for:', fpo); setEditingFPO(fpo); setShowFPOCreationForm(true); } },
                            { label: 'FPO Board Members', onClick: (fpo) => { console.log('FPO Board Members clicked for:', fpo); handleBoardMembers(fpo); } },
                            { label: 'FPO Farm Services', onClick: (fpo) => { console.log('FPO Farm Services clicked for:', fpo); handleFarmServices(fpo); } },
                            { label: 'FPO Turnover', onClick: (fpo) => { console.log('FPO Turnover clicked for:', fpo); handleTurnover(fpo); } },
                            { label: 'FPO Crop Entries', onClick: (fpo) => { console.log('FPO Crop Entries clicked for:', fpo); handleCropEntries(fpo); } },
                            { label: 'FPO Input Shop', onClick: (fpo) => { console.log('FPO Input Shop clicked for:', fpo); handleInputShop(fpo); } },
                            { label: 'FPO Product Categories', onClick: (fpo) => { console.log('FPO Product Categories clicked for:', fpo); handleProductCategories(fpo); } },
                            { label: 'FPO Products', onClick: (fpo) => { console.log('FPO Products clicked for:', fpo); handleProducts(fpo); } },
                            { label: 'FPO Users', onClick: (fpo) => { console.log('FPO Users clicked for:', fpo); handleFpoUsers(fpo); } }
                            // Note: No Delete action for Admin
                          ]}
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="fpo-creation-section">
                  <div className="overview-header">
                    <h2 className="overview-title">
                      {editingFPO ? 'Edit FPO' : 'Add New FPO'}
                    </h2>
                    <p className="overview-description">
                      {editingFPO ? 'Update FPO information.' : 'Register a new FPO in the system.'}
                    </p>
                    <div className="overview-actions">
                      <button 
                        onClick={() => {
                          setShowFPOCreationForm(false);
                          setEditingFPO(null);
                        }}
                        className="btn btn-secondary"
                      >
                        <i className="fas fa-arrow-left"></i>
                        Back to FPO List
                      </button>
                    </div>
                  </div>
                  
                  {editingFPO ? (
                    <FPOEditForm
                      fpo={editingFPO}
                      onCancel={() => { setEditingFPO(null); setShowFPOCreationForm(false); }}
                      onUpdated={(updatedFPO) => {
                        console.log('FPO updated successfully:', updatedFPO);
                        setFpos(prev => prev.map(fpo => fpo.id === updatedFPO.id ? updatedFPO : fpo));
                        setEditingFPO(null);
                        setShowFPOCreationForm(false);
                        setToast({ type: 'success', message: 'FPO updated successfully!' });
                        setTimeout(() => setToast(null), 3000);
                      }}
                      onClose={() => { setEditingFPO(null); setShowFPOCreationForm(false); }}
                    />
                  ) : (
                  <FPOCreationForm
                    isOpen={showFPOCreationForm}
                    onClose={() => {
                      setShowFPOCreationForm(false);
                      setEditingFPO(null);
                    }}
                    onSubmit={handleFPOCreated}
                  />
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'kyc-overview' && renderKYCOverview()}
          {activeTab === 'farmers' && renderFarmers()}
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'registration' && renderRegistration()}
          {activeTab === 'bulk-operations' && <BulkOperations userRole="ADMIN" />}
        </div>
      </div>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="icon">{toast.type === 'success' ? '✔' : '!'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modals */}


      {/* Keep modal fallback if needed elsewhere, but use inline by default */}

      {/* Removed Farmer modal view; inline ViewFarmer is used in content */}

      {/* Removed modal ViewEmployeeDetails in favor of inline ViewEmployee */}

      {showEmployeeDetails && selectedEmployeeData && (
        <ViewEditEmployeeDetails
          employee={selectedEmployeeData}
          onClose={handleCloseEmployeeDetails}
          onUpdate={handleUpdateEmployee}
        />
      )}

      {showKYCDocumentUpload && selectedFarmerForKYC && (
                   <KYCDocumentUpload
                     farmer={selectedFarmerForKYC}
                     onClose={handleCloseKYCDocumentUpload}
                     onApprove={handleKYCApprove}
                     onReject={handleKYCReject}
                     onReferBack={handleKYCReferBack}
                   />
                 )}

      {showIdCardModal && currentCardId && (
        <IdCardViewer
          cardId={currentCardId}
          onClose={() => { setShowIdCardModal(false); setCurrentCardId(null); }}
        />
      )}

      {showRegistrationDetailModal && selectedRegistrationForDetail && (
        <RegistrationDetailModal
          registration={selectedRegistrationForDetail}
          onClose={handleCloseRegistrationDetailModal}
          onUpdate={handleRegistrationUpdate}
          onApprove={handleApproveRegistration}
          onReject={handleRejectRegistration}
                   />
                 )}

      {/* Hidden file input for photo upload */}
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
               </div>
             );
};

export default AdminDashboard; 