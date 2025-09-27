import React, { useState, useEffect, useRef } from 'react';
import IdCardContentViewer from '../components/IdCardContentViewer';
import { idCardAPI } from '../api/apiService';
import { useAuth } from '../contexts/AuthContext';
import { farmersAPI, employeesAPI, superAdminAPI, adminAPI, fpoAPI, configAPI } from '../api/apiService';
import DataTable from '../components/DataTable';

// import RegistrationApprovalModal from '../components/RegistrationApprovalModal';
import RegistrationDetailsInline from '../components/RegistrationDetailsInline';
import ViewFarmer from '../components/ViewFarmer';
import AssignmentModal from '../components/AssignmentModal';
import AssignmentInline from '../components/AssignmentInline';
import FarmerForm from '../components/FarmerForm';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import ViewEmployee from '../components/ViewEmployee';
import ViewEditEmployeeDetails from '../components/ViewEditEmployeeDetails';
import EmployeeRegistrationForm from '../components/EmployeeRegistrationForm';
import KYCDocumentUpload from '../components/KYCDocumentUpload';
import DeleteModal from '../components/DeleteModal';
import BulkOperations from '../components/BulkOperations';
import FPOCreationForm from '../components/FPOCreationForm';
import FPOEditModal from '../components/FPOEditModal';
import FPODetailModal from '../components/FPODetailModal';
import FPODetailsView from '../components/FPODetailsView';
import FPOEditForm from '../components/FPOEditForm';
import FPOBoardMembersModal from '../components/FPOBoardMembersModal';
import FPOBoardMembersView from '../components/FPOBoardMembersView';
import FPOFarmServicesModal from '../components/FPOFarmServicesModal';
import FPOFarmServicesView from '../components/FPOFarmServicesView';
import FPOTurnoverModal from '../components/FPOTurnoverModal';
import FPOTurnoverView from '../components/FPOTurnoverView';
import FPOCropEntriesModal from '../components/FPOCropEntriesModal';
import FPOCropEntriesView from '../components/FPOCropEntriesView';
import FPOInputShopModal from '../components/FPOInputShopModal';
import FPOInputShopView from '../components/FPOInputShopView';
import FPOProductCategoriesModal from '../components/FPOProductCategoriesModal';
import FPOProductCategoriesView from '../components/FPOProductCategoriesView';
import FPOProductsModal from '../components/FPOProductsModal';
import FPOProductsView from '../components/FPOProductsView';
import FPOUsersModal from '../components/FPOUsersModal';
import FPOUsersView from '../components/FPOUsersView';
import FPODashboard from '../pages/FPODashboard';
import ConfigurationDashboard from '../components/ConfigurationDashboard';
import PersonalizationTab from '../components/config/PersonalizationTab';
import SettingsMasterList from '../components/SettingsMasterList';
import APITest from '../components/APITest';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);
  const [showIdCardContent, setShowIdCardContent] = useState(false);
  
  // Debug logging
  console.log('SuperAdminDashboard - User data:', user);
  console.log('SuperAdminDashboard - User name:', user?.name);
  console.log('SuperAdminDashboard - User role:', user?.role);
  console.log('SuperAdminDashboard - User email:', user?.email);
  console.log('=== SUPER ADMIN DASHBOARD LOADED ===');
  
  // Test if user data is available
  useEffect(() => {
    console.log('=== USER DATA CHECK ===');
    console.log('User in useEffect:', user);
    console.log('User name in useEffect:', user?.name);
    console.log('User role in useEffect:', user?.role);
    console.log('Greeting text:', getGreeting());
  }, [user]);
  

  const [activeTab, setActiveTab] = useState('dashboard');
  const [farmers, setFarmers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [fpos, setFpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codeFormats, setCodeFormats] = useState([]);
  
  // State for unique IDs (persisted to localStorage to avoid flicker)
  const [farmerUniqueIds, setFarmerUniqueIds] = useState(() => {
    try {
      const cached = localStorage.getItem('farmerUniqueIds');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [employeeUniqueIds, setEmployeeUniqueIds] = useState(() => {
    try {
      const cached = localStorage.getItem('employeeUniqueIds');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });

  const mergeAndPersistFarmerIds = (updates) => {
    setFarmerUniqueIds(prev => {
      const merged = { ...prev, ...updates };
      try { localStorage.setItem('farmerUniqueIds', JSON.stringify(merged)); } catch {}
      return merged;
    });
  };

  const mergeAndPersistEmployeeIds = (updates) => {
    setEmployeeUniqueIds(prev => {
      const merged = { ...prev, ...updates };
      try { localStorage.setItem('employeeUniqueIds', JSON.stringify(merged)); } catch {}
      return merged;
    });
  };

  // Helper: robustly compute a display ID for employees
  const getEmployeeDisplayId = (row) => {
    const candidates = [
      row?.employeeId,
      row?.employeeCode,
      row?.employeeUniqueId,
      row?.empId,
      row?.empCode,
      row?.userUniqueId,
      row?.userId,
      row?.uniqueId,
      employeeUniqueIds?.[row?.id],
      row?.cardId
    ];
    const firstNonEmpty = candidates.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (firstNonEmpty) return String(firstNonEmpty);
    // Dynamic fallback using configured EMPLOYEE format
    const fallbackNumeric = row?.id ? String(row.id).padStart(5, '0') : '00000';
    return getConfiguredEmployeePrefix() + '-' + fallbackNumeric;
  };

  // Helper: robustly compute a display ID for farmers
  const getFarmerDisplayId = (row) => {
    const candidates = [
      row?.farmerId,
      row?.farmerCode,
      row?.farmerUniqueId,
      row?.famId,
      row?.famCode,
      row?.userUniqueId,
      row?.userId,
      row?.uniqueId,
      farmerUniqueIds?.[row?.id],
      row?.cardId
    ];
    const firstNonEmpty = candidates.find(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (firstNonEmpty) return String(firstNonEmpty);
    
    // Dynamic fallback using configured format
    const fallbackNumeric = row?.id ? String(row.id).padStart(5, '0') : '00000';
    return getConfiguredFarmerPrefix() + '-' + fallbackNumeric;
  };

  // Get configured farmer prefix from state or default
  const getConfiguredFarmerPrefix = () => {
    // Try to get from codeFormats state if available
    if (codeFormats && codeFormats.length > 0) {
      const farmerFormat = codeFormats.find(f => f.codeType === 'FARMER' && f.isActive);
      if (farmerFormat && farmerFormat.prefix) {
        return farmerFormat.prefix;
      }
    }
    // Fallback to a generic format if not available
    return 'FARMER';
  };

  // Get configured employee prefix from state or default
  const getConfiguredEmployeePrefix = () => {
    if (codeFormats && codeFormats.length > 0) {
      const employeeFormat = codeFormats.find(f => f.codeType === 'EMPLOYEE' && f.isActive);
      if (employeeFormat && employeeFormat.prefix) {
        return employeeFormat.prefix;
      }
    }
    return 'EMP';
  };

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

  // Function to fetch unique IDs for farmers and employees
  const fetchUniqueIds = async (farmersData, employeesData, onlyMissing = false) => {
    try {
      // Fetch unique IDs for farmers
      const farmerIds = {};
      for (const farmer of farmersData || []) {
        if (onlyMissing && farmerUniqueIds[String(farmer.id)]) continue;
        try {
          const idCards = await idCardAPI.getIdCardsByHolder(farmer.id.toString());
          if (idCards && idCards.length > 0) {
            // Prefer FARMER cards only and matching holder
            const farmerCards = idCards.filter(card => (
              (card.cardType === 'FARMER' || (card.cardId || '').startsWith('FAM')) &&
              (String(card.holderId) === String(farmer.id))
            ));
            const byPreference = farmerCards.length > 0 ? farmerCards : idCards;
            const activeCard = byPreference.find(card => card.status === 'ACTIVE') || byPreference[0];
            farmerIds[farmer.id] = activeCard.cardId;
          }
        } catch (error) {
          console.warn(`Could not fetch ID card for farmer ${farmer.id}:`, error);
        }
      }
      if (Object.keys(farmerIds).length) mergeAndPersistFarmerIds(farmerIds);

      // Fetch unique IDs for employees
      const employeeIds = {};
      for (const employee of employeesData || []) {
        if (onlyMissing && employeeUniqueIds[String(employee.id)]) continue;
        try {
          const idCards = await idCardAPI.getIdCardsByHolder(employee.id.toString());
          if (idCards && idCards.length > 0) {
            // Prefer EMPLOYEE cards only and matching holder
            const employeeCards = idCards.filter(card => (
              (card.cardType === 'EMPLOYEE' || (card.cardId || '').startsWith('EMP')) &&
              (String(card.holderId) === String(employee.id))
            ));
            const byPreference = employeeCards.length > 0 ? employeeCards : idCards;
            const activeCard = byPreference.find(card => card.status === 'ACTIVE') || byPreference[0];
            employeeIds[employee.id] = activeCard.cardId;
          }
        } catch (error) {
          console.warn(`Could not fetch ID card for employee ${employee.id}:`, error);
        }
      }
      if (Object.keys(employeeIds).length) mergeAndPersistEmployeeIds(employeeIds);
    } catch (error) {
      console.error('Error fetching unique IDs:', error);
    }
  };

  // Refresh unique IDs whenever data changes (fills DB-xx placeholders)
  React.useEffect(() => {
    if ((farmers?.length || 0) + (employees?.length || 0) === 0) return;
    fetchUniqueIds(farmers, employees, true);
  }, [farmers, employees]);

  // Light polling for a short period to catch freshly-created records gaining IDs
  React.useEffect(() => {
    let runs = 0;
    const maxRuns = 8; // ~2 minutes if 15s interval
    const interval = setInterval(() => {
      runs += 1;
      fetchUniqueIds(farmers, employees, true);
      if (runs >= maxRuns) clearInterval(interval);
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // Random greeting content
  const greetingVariants = [
    { title: '🌞 Good Morning!', subtitle: 'Wishing you a bright and productive day ahead filled with positivity.' },
    { title: '🌸 Hello & Warm Greetings!', subtitle: 'May your day be filled with joy, success, and wonderful moments.' },
    { title: '🙌 Hi There!', subtitle: 'Hope you\'re doing well and everything is going smoothly on your end.' },
    { title: "🌟 Season's Greetings!", subtitle: 'Sending best wishes for peace, happiness, and good health.' },
    { title: '🤝 Greetings of the Day!', subtitle: 'May this day bring you opportunities, growth, and good fortune.' }
  ];

  const [randomGreeting, setRandomGreeting] = useState(greetingVariants[0]);

  // Photo upload state
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const idx = Math.floor(Math.random() * greetingVariants.length);
    setRandomGreeting(greetingVariants[idx]);
  }, []);

  // Load saved photo on component mount
  useEffect(() => {
    const PROFILE_PHOTO_KEY = 'userProfilePhoto:SUPER_ADMIN';
    const savedPhoto = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (savedPhoto) {
      setUserPhoto(savedPhoto);
    }
  }, []);

  // Photo upload handlers
  const handlePhotoUpload = (event) => {
    console.log('Photo upload triggered:', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }

      console.log('File validation passed, reading file...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target.result;
        console.log('Photo data loaded:', photoData.substring(0, 50) + '...');
        setUserPhoto(photoData);
        try { localStorage.setItem('userProfilePhoto:SUPER_ADMIN', photoData); } catch {}
        console.log('Photo saved to localStorage and state');
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Error reading the file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const handlePhotoClick = () => {
    console.log('Photo click triggered');
    console.log('fileInputRef.current:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log('File input clicked');
    } else {
      console.error('File input ref is null');
    }
  };

  const handleRemovePhoto = () => {
    setUserPhoto(null);
    try { localStorage.removeItem('userProfilePhoto:SUPER_ADMIN'); } catch {}
  };
  
  // Modal states

  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignmentInline, setShowAssignmentInline] = useState(false);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editingFPO, setEditingFPO] = useState(null);
  const [showFPOEdit, setShowFPOEdit] = useState(false);
  const [showFPOEditForm, setShowFPOEditForm] = useState(false);
  const [selectedFPOEdit, setSelectedFPOEdit] = useState(null);
  const [showFPOCreationForm, setShowFPOCreationForm] = useState(false);
  const [viewingFPO, setViewingFPO] = useState(null); // page-level view
  const [showFPODetail, setShowFPODetail] = useState(false);
  const [detailFPO, setDetailFPO] = useState(null); // modal view only
  const [showFPODetailsView, setShowFPODetailsView] = useState(false);
  const [selectedFPODetails, setSelectedFPODetails] = useState(null); // full-width view
  const [showBoardMembers, setShowBoardMembers] = useState(false);
  const [selectedFPOForBoard, setSelectedFPOForBoard] = useState(null);
  const [showBoardMembersView, setShowBoardMembersView] = useState(false);
  const [selectedFPOBoardMembers, setSelectedFPOBoardMembers] = useState(null);
  const [showFarmServices, setShowFarmServices] = useState(false);
  const [selectedFPOForServices, setSelectedFPOForServices] = useState(null);
  const [showFarmServicesView, setShowFarmServicesView] = useState(false);
  const [selectedFPOFarmServices, setSelectedFPOFarmServices] = useState(null);
  const [showTurnover, setShowTurnover] = useState(false);
  const [selectedFPOForTurnover, setSelectedFPOForTurnover] = useState(null);
  const [showTurnoverView, setShowTurnoverView] = useState(false);
  const [selectedFPOTurnover, setSelectedFPOTurnover] = useState(null);
  const [showCropEntries, setShowCropEntries] = useState(false);
  const [selectedFPOForCropEntries, setSelectedFPOForCropEntries] = useState(null);
  const [showCropEntriesView, setShowCropEntriesView] = useState(false);
  const [selectedFPOCropEntries, setSelectedFPOCropEntries] = useState(null);
  const [showInputShop, setShowInputShop] = useState(false);
  const [selectedFPOForInputShop, setSelectedFPOForInputShop] = useState(null);
  const [showInputShopView, setShowInputShopView] = useState(false);
  const [selectedFPOInputShop, setSelectedFPOInputShop] = useState(null);
  const [showProductCategories, setShowProductCategories] = useState(false);
  const [selectedFPOForCategories, setSelectedFPOForCategories] = useState(null);
  const [showProductCategoriesView, setShowProductCategoriesView] = useState(false);
  const [selectedFPOProductCategories, setSelectedFPOProductCategories] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedFPOForProducts, setSelectedFPOForProducts] = useState(null);
  const [showProductsView, setShowProductsView] = useState(false);
  const [selectedFPOProducts, setSelectedFPOProducts] = useState(null);
  const [showFpoUsers, setShowFpoUsers] = useState(false);
  const [selectedFPOForUsers, setSelectedFPOForUsers] = useState(null);
  const [showUsersView, setShowUsersView] = useState(false);
  const [selectedFPOUsers, setSelectedFPOUsers] = useState(null);
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
  
  const [employeeFilters, setEmployeeFilters] = useState({
    status: '',
    role: '',
    designation: '',
    state: '',
    district: ''
  });
  
  const [fpoFilters, setFpoFilters] = useState({
    state: '',
    district: '',
    status: '',
    registrationType: ''
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // Selected farmer ids for bulk delete
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'


  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [selectedFPOTab, setSelectedFPOTab] = useState('overview');

  useEffect(() => {
    fetchData();
    
    // Listen for KYC status updates from Employee Dashboard
    const handleKYCUpdate = (event) => {
      console.log('🔄 Super Admin Dashboard: KYC status updated, refreshing data...');
      console.log('📊 KYC Update details:', event.detail);
      // Wait 2 seconds for backend to update, then refresh
      setTimeout(() => {
        console.log('🔄 Refreshing Super Admin data after KYC update...');
        fetchData();
      }, 2000);
    };
    
    window.addEventListener('kycStatusUpdated', handleKYCUpdate);
    
    return () => {
      window.removeEventListener('kycStatusUpdated', handleKYCUpdate);
    };
  }, []);

  // Debug effect to monitor farmers state
  useEffect(() => {
    if (farmers) {
      console.log('Farmers state updated:', farmers);
      console.log('Farmers count:', farmers.length);
    }
  }, [farmers]);

  // Debug effect to monitor employees state
  useEffect(() => {
    console.log('Employees state updated:', employees);
    console.log('Employees count:', employees?.length || 0);
    if (employees && employees.length > 0) {
      console.log('First employee:', employees[0]);
    }
  }, [employees]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data from APIs...');
      
      console.log('Starting API calls...');
      let farmersData, employeesData, registrationsData, fposData;
      
      try {
        console.log('🔄 Making API calls to fetch real data...');
        [farmersData, employeesData, registrationsData] = await Promise.all([
          adminAPI.getFarmersWithKyc(), // Use the same endpoint that works for AdminDashboard
          employeesAPI.getAllEmployees(),
          superAdminAPI.getRegistrationList()
        ]);
        
        // Fetch FPO data
        fposData = [];
        try {
          fposData = await fpoAPI.getAllFPOs();
          console.log('📊 FPOs data received:', fposData?.length || 0, 'records');
        } catch (fpoError) {
          console.error('❌ FPO API call failed:', fpoError);
          fposData = [];
        }
              console.log('✅ API calls completed successfully');
      console.log('📊 Farmers data received:', farmersData?.length || 0, 'records');
      console.log('📊 Employees data received:', employeesData?.length || 0, 'records');
      console.log('📊 Registrations data received:', registrationsData?.length || 0, 'records');
      
      // Log first farmer data structure to debug field mapping
      if (farmersData && farmersData.length > 0) {
        console.log('🔍 First farmer data structure:', farmersData[0]);
        console.log('🔍 Available fields:', Object.keys(farmersData[0]));
      }
      
      // Log employee data structure to debug dropdown
      if (employeesData && employeesData.length > 0) {
        console.log('🔍 First employee data structure:', employeesData[0]);
        console.log('🔍 Available employee fields:', Object.keys(employeesData[0]));
        console.log('🔍 Employee names in dropdown:', employeesData.map(emp => emp.name));
      }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        console.error('❌ API Error details:', apiError.response?.data || apiError.message);
        // Set empty arrays if API fails
        farmersData = [];
        employeesData = [];
        registrationsData = [];
      }

      console.log('Raw API responses:');
      console.log('Farmers data:', farmersData);
      console.log('Farmers data length:', farmersData?.length || 0);
      console.log('First farmer structure:', farmersData?.[0]);
      console.log('Employees data:', employeesData);
      console.log('Employees data length:', employeesData?.length || 0);
      console.log('First employee structure:', employeesData?.[0]);
      console.log('Registrations data:', registrationsData);

             // Use real API data only
       let finalRegistrationsData = registrationsData || [];

             // Use real API data only
       let finalFarmersData = farmersData || [];

      console.log('Setting farmers data:', finalFarmersData);
      console.log('Sample farmer structure:', finalFarmersData[0]);
      // Normalize employees from backend instead of forcing mock data
      let finalEmployeesData = (employeesData || []).map(e => ({
        id: e.id,
        name: e.name || `${[e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ')}`.trim(),
        contactNumber: e.contactNumber,
        email: e.email,
        status: e.status || e.accessStatus || 'ACTIVE',
        role: (e.role && typeof e.role === 'string') ? e.role : (e.role?.name || 'employee'),
        designation: e.designation || 'KYC Officer',
        district: e.district,
        state: e.state
      }));
      // If backend returned nothing, keep empty array (do not override with mocks)

      setFarmers(finalFarmersData);
      setEmployees(finalEmployeesData);
      setRegistrations(finalRegistrationsData);
      const fpoList = Array.isArray(fposData) ? fposData : (fposData?.content || fposData?.items || fposData?.data || []);
      setFpos(fpoList || []);

      // Load code formats for dynamic prefix
      try {
        const codeFormatsData = await configAPI.getAllCodeFormats();
        setCodeFormats(codeFormatsData || []);
        console.log('📊 Code formats loaded:', codeFormatsData?.length || 0, 'formats');
      } catch (codeFormatError) {
        console.error('❌ Failed to load code formats:', codeFormatError);
        setCodeFormats([]);
      }
      
      console.log('Fetched data:', { farmersData, employeesData, registrationsData });
      console.log('Final employees data:', finalEmployeesData);
      console.log('Final employees count:', finalEmployeesData?.length || 0);
      
      // Fetch unique IDs after data is loaded
      setTimeout(() => {
        fetchUniqueIds(finalFarmersData, finalEmployeesData);
      }, 1000);
      
      // Test if employees are being set correctly
      console.log('=== SETTING EMPLOYEES ===');
      console.log('About to set employees:', finalEmployeesData);
      
      // Test if employees are being set correctly
      setTimeout(() => {
        console.log('=== EMPLOYEES STATE TEST ===');
        console.log('Employees state after 1 second:', finalEmployeesData);
        console.log('Employees count after 1 second:', finalEmployeesData?.length || 0);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFarmers = () => {
    return (farmers || []).filter(farmer => {
      const matchesState = !filters.state || farmer.state === filters.state;
      const matchesDistrict = !filters.district || farmer.district === filters.district;
      const matchesKycStatus = !filters.kycStatus || farmer.kycStatus === filters.kycStatus;
      
      // Debug employee filter
      if (filters.employeeFilter) {
        console.log('🔍 Employee filter active:', filters.employeeFilter);
        console.log('🔍 Farmer assignedEmployee field:', farmer.assignedEmployee);
        console.log('🔍 Available farmer fields:', Object.keys(farmer));
      }
      
      // More robust employee filter matching
      const matchesEmployee = !filters.employeeFilter || 
        (farmer.assignedEmployee && 
         (farmer.assignedEmployee === filters.employeeFilter || 
          farmer.assignedEmployee.toLowerCase().includes(filters.employeeFilter.toLowerCase()) ||
          filters.employeeFilter.toLowerCase().includes(farmer.assignedEmployee.toLowerCase())
         ));
      
      // Debug: Log all farmers and their assigned employees when filter is active
      if (filters.employeeFilter) {
        console.log('🔍 All farmers and their assigned employees:');
        (farmers || []).forEach((f, index) => {
          console.log(`  Farmer ${index + 1}: ${f.name} -> Assigned to: "${f.assignedEmployee}"`);
        });
      }
      
      return matchesState && matchesDistrict && matchesKycStatus && matchesEmployee;
    });
  };

  const getFilteredEmployees = () => {
    return (employees || []).filter(employee => {
      const matchesStatus = !employeeFilters.status || employee.status === employeeFilters.status;
      const matchesRole = !employeeFilters.role || employee.role === employeeFilters.role;
      const matchesDesignation = !employeeFilters.designation || employee.designation === employeeFilters.designation;
      const matchesState = !employeeFilters.state || employee.state === employeeFilters.state;
      const matchesDistrict = !employeeFilters.district || employee.district === employeeFilters.district;
      
      return matchesStatus && matchesRole && matchesDesignation && matchesState && matchesDistrict;
    });
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

  const getFilteredRegistrations = () => {
    console.log('All registrations:', registrations);
    // Apply filters
    const filtered = registrations.filter(registration => {
      const roleMatch = !registrationFilters.role || registration.role === registrationFilters.role;
      const statusMatch = !registrationFilters.status || registration.status === registrationFilters.status;
      return roleMatch && statusMatch;
    });
    console.log('Filtered registrations:', filtered);
    return filtered;
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
    const filteredFarmers = farmers.filter(farmer => {
      const createdDate = farmer.createdAt || farmer.created_at || farmer.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const filteredEmployees = employees.filter(employee => {
      const createdDate = employee.createdAt || employee.created_at || employee.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const filteredRegistrations = registrations.filter(registration => {
      const createdDate = registration.createdAt || registration.created_at || registration.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const fpoList = Array.isArray(fpos) ? fpos : [];
    const filteredFPOs = fpoList.filter(fpo => {
      const createdDate = fpo.createdAt || fpo.created_at || fpo.joinDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const totalFarmers = timeFilter === 'all' ? farmers.length : filteredFarmers.length;
    const totalEmployees = timeFilter === 'all' ? employees.length : filteredEmployees.length;
    const pendingRegistrations = filteredRegistrations.filter(r => {
      const status = r.status || r.userStatus || r.accessStatus;
      return status === 'PENDING' || status === 'pending' || status === 'Pending';
    }).length;
    const unassignedFarmers = filteredFarmers.filter(f => f.accessStatus === 'PENDING').length;
    const activeEmployees = filteredEmployees.filter(e => e.status === 'ACTIVE').length;
    const totalFPO = timeFilter === 'all' ? fpoList.length : filteredFPOs.length;

    return {
      totalFarmers,
      totalEmployees,
      pendingRegistrations,
      unassignedFarmers,
      activeEmployees,
      totalFPO,
      timeFilter
    };
  };

  const handleViewRegistration = (registration) => {
    setViewingRegistration(registration);
  };



  const handleRegistrationUpdate = () => {
    // Refresh the registration data
    fetchData();
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      console.log('🔄 Approving registration for user ID:', registrationId);
      
      // Find the registration to get the role
      const registration = registrations.find(reg => reg.id === registrationId);
      const role = registration?.role || 'FARMER'; // Default to FARMER if role not found
      
      console.log('🔄 Approving with role:', role);
      const result = await superAdminAPI.approveUser(registrationId, role);
      console.log('✅ Approval result:', result);
      
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'APPROVED' } : reg
      ));
      alert('Registration approved successfully!');
    } catch (error) {
      console.error('❌ Error approving registration:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        alert('Access denied. You may not have permission to approve this registration.');
      } else if (error.response?.status === 404) {
        alert('Registration not found. The user may have been deleted.');
      } else if (error.code === 'ERR_NETWORK') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to approve registration: ${error.message}`);
      }
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    try {
      console.log('🔄 Rejecting registration for user ID:', registrationId);
      const result = await superAdminAPI.rejectUser(registrationId);
      console.log('✅ Rejection result:', result);
      
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'REJECTED' } : reg
      ));
      alert('Registration rejected successfully!');
    } catch (error) {
      console.error('❌ Error rejecting registration:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        alert('Access denied. You may not have permission to reject this registration.');
      } else if (error.response?.status === 404) {
        alert('Registration not found. The user may have been deleted.');
      } else if (error.code === 'ERR_NETWORK') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to reject registration: ${error.message}`);
      }
    }
  };

  const handleViewFarmer = async (farmer) => {
    try {
      const full = await farmersAPI.getFarmerById(farmer.id);
      setViewingFarmer(full || farmer);
    } catch (e) {
      console.warn('Falling back to row farmer data:', e);
      setViewingFarmer(farmer);
    }
  };

  const handleEditFarmer = (farmer) => {
    const farmerData = {
      id: farmer.id,
      firstName: farmer.firstName || '',
      lastName: farmer.lastName || '',
      middleName: farmer.middleName || '',
      salutation: farmer.salutation || '',
      contactNumber: farmer.contactNumber || '',
      email: farmer.email || '',
      dob: farmer.dob || '',
      gender: farmer.gender || '',
      nationality: farmer.nationality || '',
      relationType: farmer.relationType || '',
      relationName: farmer.relationName || '',
      altNumber: farmer.altNumber || '',
      altNumberType: farmer.altNumberType || '',
      country: farmer.country || '',
      state: farmer.state || '',
      district: farmer.district || '',
      block: farmer.block || '',
      village: farmer.village || '',
      zipcode: farmer.zipcode || '',
      sector: farmer.sector || '',
      education: farmer.education || '',
      experience: farmer.experience || '',
      bankName: farmer.bankName || '',
      accountNumber: farmer.accountNumber || '',
      branchName: farmer.branchName || '',
      ifscCode: farmer.ifscCode || '',
      passbookFileName: farmer.passbookFileName || '',
      documentType: farmer.documentType || '',
      documentNumber: farmer.documentNumber || '',
      documentFileName: farmer.documentFileName || '',
      photoFileName: farmer.photoFileName || '',
      role: farmer.role || 'FARMER',
      accessStatus: farmer.accessStatus || 'PENDING',
      kycStatus: farmer.kycStatus || 'PENDING'
    };
    console.log('Farmer data for edit:', farmerData);
    setEditingFarmer(farmerData);
    setShowFarmerForm(true);
  };

  const handleViewEmployee = async (employee) => {
    try {
      // Fetch complete employee details from backend
      const completeEmployeeData = await superAdminAPI.getEmployeeById(employee.id);
      setViewingEmployee(completeEmployeeData);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      // Fallback to basic employee data if API call fails
      setViewingEmployee(employee);
    }
  };


  const handleAddEmployee = () => {
    setShowEmployeeRegistration(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetails(true);
  };

  const handleSaveEmployee = async (updatedData) => {
    try {
      // Update employee data in backend
      const updatedEmployee = await superAdminAPI.updateEmployee(selectedEmployee.id, updatedData);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee.id ? updatedEmployee : emp
      ));
      
      // Update selected employee
      setSelectedEmployee(updatedEmployee);
      
      alert('Employee updated successfully!');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  const handleSaveFarmer = async (updatedData) => {
    try {
      // Update farmer data in backend
      const updatedFarmer = await farmersAPI.updateFarmer(viewingFarmer.id, updatedData);
      
      // Update local state
      setFarmers(prev => prev.map(farmer => 
        farmer.id === viewingFarmer.id ? updatedFarmer : farmer
      ));
      
      // Update viewing farmer
      setViewingFarmer(updatedFarmer);
      
      alert('Farmer updated successfully!');
    } catch (error) {
      console.error('Error updating farmer:', error);
      alert('Failed to update farmer. Please try again.');
    }
  };

  const handleViewFPO = async (fpo) => {
    try {
      const fullFpo = await fpoAPI.getFPOById(fpo.id);
      setViewingFPO(fullFpo || fpo);
    } catch (e) {
      console.warn('Falling back to row FPO data:', e);
      setViewingFPO(fpo);
    }
  };

  const handleEditFPO = (fpo) => {
    setEditingFPO(fpo);
    setShowFPOEdit(true);
  };

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered...');
    try {
      console.log('🔄 Calling adminAPI.getFarmersWithKyc()...');
      const refreshedFarmers = await adminAPI.getFarmersWithKyc();
      console.log('✅ Manual refresh - farmers data:', refreshedFarmers);
      console.log('🔍 Manual refresh - first farmer assignedEmployee:', refreshedFarmers[0]?.assignedEmployee);
      setFarmers(refreshedFarmers);
      
      // Also refresh code formats
      try {
        const codeFormatsData = await configAPI.getAllCodeFormats();
        setCodeFormats(codeFormatsData || []);
        console.log('📊 Code formats refreshed:', codeFormatsData?.length || 0, 'formats');
      } catch (codeFormatError) {
        console.error('❌ Failed to refresh code formats:', codeFormatError);
      }
      
      alert('Data refreshed successfully!');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      alert('Failed to refresh data: ' + error.message);
    }
  };

  // Toggle single farmer selection
  const toggleFarmerSelection = (farmerId) => {
    setSelectedFarmerIds(prev => (
      prev.includes(farmerId) ? prev.filter(id => id !== farmerId) : [...prev, farmerId]
    ));
  };

  // Delete all selected farmers
  const handleDeleteSelectedFarmers = async () => {
    if (!selectedFarmerIds.length) {
      alert('Please select at least one farmer to delete.');
      return;
    }
    if (!window.confirm(`Delete ${selectedFarmerIds.length} selected farmer(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      // Delete sequentially to keep it simple and reliable
      for (const id of selectedFarmerIds) {
        try {
          await farmersAPI.deleteFarmer(id);
          setFarmers(prev => prev.filter(f => f.id !== id));
        } catch (e) {
          console.error(`Failed to delete farmer ${id}:`, e);
        }
      }
      setSelectedFarmerIds([]);
      alert('Selected farmers deleted successfully');
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete selected farmers.');
    }
  };

  const handleAssignFarmers = async (assignments) => {
    try {
      // Extract farmer IDs and employee ID from assignments
      const farmerIds = assignments.map(a => a.farmerId);
      const employeeId = assignments[0]?.employeeId;
      
      if (!employeeId || farmerIds.length === 0) {
        alert('Please select an employee and at least one farmer');
        return;
      }
      
      console.log('🔍 Starting farmer assignment...');
      console.log('🔍 Farmer IDs:', farmerIds);
      console.log('🔍 Employee ID:', employeeId);
      console.log('🔍 Assignments object:', assignments);
      
      // Try multiple assignment strategies
      let assignmentSuccessful = false;
      
      // Strategy 1: Try superAdminAPI.bulkAssignFarmers
      try {
        console.log('🔄 Strategy 1: Calling superAdminAPI.bulkAssignFarmers...');
        const response = await superAdminAPI.bulkAssignFarmers(farmerIds, employeeId);
        console.log('✅ Bulk assignment response:', response);
        assignmentSuccessful = true;
      } catch (bulkError) {
        console.log('❌ Strategy 1 failed:', bulkError);
        
        // Strategy 2: Try adminAPI.bulkAssignFarmers
        try {
          console.log('🔄 Strategy 2: Calling adminAPI.bulkAssignFarmers...');
          const response = await adminAPI.bulkAssignFarmers(farmerIds, employeeId);
          console.log('✅ Admin bulk assignment response:', response);
          assignmentSuccessful = true;
        } catch (adminBulkError) {
          console.log('❌ Strategy 2 failed:', adminBulkError);
          
          // Strategy 3: Try individual assignments via superAdminAPI
          try {
            console.log('🔄 Strategy 3: Trying individual assignments via superAdminAPI...');
            for (const farmerId of farmerIds) {
              console.log('🔄 Assigning individual farmer:', farmerId);
              await superAdminAPI.assignFarmer(farmerId, employeeId);
              console.log('✅ Individual assignment successful for farmer:', farmerId);
            }
            assignmentSuccessful = true;
          } catch (individualError) {
            console.log('❌ Strategy 3 failed:', individualError);
            
            // Strategy 4: Try individual assignments via adminAPI
            try {
              console.log('🔄 Strategy 4: Trying individual assignments via adminAPI...');
              for (const farmerId of farmerIds) {
                console.log('🔄 Assigning individual farmer:', farmerId);
                await adminAPI.assignFarmer(farmerId, employeeId);
                console.log('✅ Individual assignment successful for farmer:', farmerId);
              }
              assignmentSuccessful = true;
            } catch (adminIndividualError) {
              console.error('❌ All assignment strategies failed:', adminIndividualError);
              throw new Error('All assignment methods failed. Please check backend connectivity.');
            }
          }
        }
      }
      
             if (!assignmentSuccessful) {
         throw new Error('All assignment methods failed. Please check backend connectivity.');
       }
      
      // Refresh farmers data from backend to get the real assignment status
      console.log('🔄 Refreshing farmers data from backend...');
      try {
        // Add a small delay to ensure backend has processed the assignment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const refreshedFarmers = await adminAPI.getFarmersWithKyc();
        console.log('✅ Refreshed farmers data:', refreshedFarmers);
        console.log('🔍 First farmer assignedEmployee:', refreshedFarmers[0]?.assignedEmployee);
        console.log('🔍 assignedEmployee type:', typeof refreshedFarmers[0]?.assignedEmployee);
        if (refreshedFarmers[0]?.assignedEmployee && typeof refreshedFarmers[0].assignedEmployee === 'object') {
          console.log('🔍 assignedEmployee object keys:', Object.keys(refreshedFarmers[0].assignedEmployee));
        }
        setFarmers(refreshedFarmers);
        
        // Show success message and close the assignment interface
        console.log('✅ Assignment completed successfully!');
      } catch (refreshError) {
        console.error('❌ Failed to refresh farmers data:', refreshError);
        // Fallback to local state update if refresh fails
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
      }
      
      setShowAssignmentInline(false);
      alert('Farmers assigned successfully!');
    } catch (error) {
      console.error('❌ Error assigning farmers:', error);
      alert('Failed to assign farmers: ' + error.message);
    }
  };

  const handleApproveKYC = (farmerId) => {
    // Implement KYC approval logic
    alert('KYC approved successfully!');
  };

  const handleRejectKYC = (farmerId) => {
    // Implement KYC rejection logic
    alert('KYC rejected successfully!');
  };

  const handleReferBackKYC = (farmerId) => {
    // Implement KYC refer back logic
    alert('KYC referred back for review!');
  };

  const handleLogout = () => {
    logout();
  };

  const toggleUserDropdown = () => {
    console.log('🔍 Toggle clicked! Current state:', showUserDropdown);
    setShowUserDropdown(!showUserDropdown);
    console.log('🔍 New state will be:', !showUserDropdown);
  };

  const handleChangePassword = () => {
    // Navigate to change password page
    window.location.href = '/change-password';
  };

  const handleDelete = (item, type) => {
    setItemToDelete({ item, type });
    setShowDeleteModal(true);
  };

  const handleAddFPO = () => {
    setEditingFPO(null);
    setShowFPOCreationForm(true);
  };

  const handleBoardMembers = (fpo) => {
    setSelectedFPOBoardMembers(fpo);
    setShowBoardMembersView(true);
  };

  const handleFarmServices = (fpo) => {
    setSelectedFPOFarmServices(fpo);
    setShowFarmServicesView(true);
  };

  const handleTurnover = (fpo) => {
    setSelectedFPOTurnover(fpo);
    setShowTurnoverView(true);
  };

  const handleCropEntries = (fpo) => {
    setSelectedFPOCropEntries(fpo);
    setShowCropEntriesView(true);
  };

  const handleInputShop = (fpo) => {
    setSelectedFPOInputShop(fpo);
    setShowInputShopView(true);
  };

  const handleProductCategories = (fpo) => {
    setSelectedFPOProductCategories(fpo);
    setShowProductCategoriesView(true);
  };

  const handleProducts = (fpo) => {
    setSelectedFPOProducts(fpo);
    setShowProductsView(true);
  };

  const handleFpoUsers = (fpo) => {
    setSelectedFPOUsers(fpo);
    setShowUsersView(true);
  };

  const handleSaveFPO = async (fpoData) => {
    try {
      if (editingFPO) {
        const updatedFPO = await fpoAPI.updateFPO(editingFPO.id, fpoData);
        setFpos(prev => prev.map(fpo => 
          fpo.id === editingFPO.id ? updatedFPO : fpo
        ));
        alert('FPO updated successfully!');
      } else {
        const newFPO = await fpoAPI.createFPO(fpoData);
        setFpos(prev => [...prev, newFPO]);
        alert('FPO created successfully!');
      }
      setShowFPOCreationForm(false);
      setEditingFPO(null);
    } catch (error) {
      console.error('Error saving FPO:', error);
      alert('Failed to save FPO. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { item, type } = itemToDelete;
      console.log(`🔄 Attempting to delete ${type}:`, item);
      
      if (type === 'farmer') {
        console.log(`🔄 Deleting farmer with ID: ${item.id}`);
        await farmersAPI.deleteFarmer(item.id);
        setFarmers(prev => prev.filter(f => f.id !== item.id));
        console.log(`✅ Farmer ${item.id} deleted successfully`);
      } else if (type === 'employee') {
        console.log(`🔄 Deleting employee with ID: ${item.id}`);
        await employeesAPI.deleteEmployee(item.id);
        setEmployees(prev => prev.filter(e => e.id !== item.id));
        console.log(`✅ Employee ${item.id} deleted successfully`);
      } else if (type === 'registration') {
        console.log(`🔄 Deleting registration with ID: ${item.id}`);
        await superAdminAPI.deleteUser(item.id);
        setRegistrations(prev => prev.filter(r => r.id !== item.id));
        console.log(`✅ Registration ${item.id} deleted successfully`);
      } else if (type === 'fpo') {
        console.log(`🔄 Deleting FPO with ID: ${item.id}`);
        console.log(`🔄 FPO data:`, item);
        
        // Try multiple delete strategies for FPO
        let deleteSuccessful = false;
        
        try {
          // Strategy 1: Try fpoAPI.deleteFPO
          console.log(`🔄 Strategy 1: Calling fpoAPI.deleteFPO(${item.id})`);
          await fpoAPI.deleteFPO(item.id);
          deleteSuccessful = true;
          console.log(`✅ Strategy 1 successful: FPO ${item.id} deleted`);
        } catch (fpoDeleteError) {
          console.error(`❌ Strategy 1 failed:`, fpoDeleteError);
          
          try {
            // Strategy 2: Try superAdminAPI.deleteFPO (if exists)
            console.log(`🔄 Strategy 2: Trying superAdminAPI.deleteFPO(${item.id})`);
            if (superAdminAPI.deleteFPO) {
              await superAdminAPI.deleteFPO(item.id);
              deleteSuccessful = true;
              console.log(`✅ Strategy 2 successful: FPO ${item.id} deleted`);
            } else {
              throw new Error('superAdminAPI.deleteFPO not available');
            }
          } catch (superAdminDeleteError) {
            console.error(`❌ Strategy 2 failed:`, superAdminDeleteError);
            
            // Strategy 3: Try deactivation instead of deletion
            try {
              console.log(`🔄 Strategy 3: Trying to deactivate FPO ${item.id} instead of deleting`);
              await fpoAPI.deactivateFPO(item.id);
              deleteSuccessful = true;
              console.log(`✅ Strategy 3 successful: FPO ${item.id} deactivated`);
              // Update the FPO status in the list instead of removing it
              setFpos(prev => prev.map(f => 
                f.id === item.id ? { ...f, status: 'INACTIVE' } : f
              ));
            } catch (deactivateError) {
              console.error(`❌ Strategy 3 failed:`, deactivateError);
              throw new Error(`All delete strategies failed. Last error: ${deactivateError.message}`);
            }
          }
        }
        
        if (deleteSuccessful && type === 'fpo') {
          // Only remove from list if actual deletion was successful (not deactivation)
          if (item.status !== 'INACTIVE') {
            setFpos(prev => prev.filter(f => f.id !== item.id));
          }
        }
      }
      
      const successMessage = type === 'fpo' && item.status === 'INACTIVE' 
        ? `${type} deactivated successfully!` 
        : `${type} deleted successfully!`;
      alert(successMessage);
      
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete item';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to delete this item.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Item not found. It may have already been deleted.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Cannot delete item. It may have dependent data or relationships.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = `Failed to delete item: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };


  const stats = getStats();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-main">
    <div className="dashboard-content">
            <div className="loading">Loading dashboard...</div>
      </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-main">
    <div className="dashboard-content">
            <div className="error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Top Frame - Modern Professional Header */}
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
                  <img 
                    src={userPhoto} 
                    alt="Profile" 
                    className="user-avatar-photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <div className="user-avatar-initials">{user?.name?.charAt(0) || 'S'}</div>
                )}
                <div className="avatar-upload-overlay">
                  <i className="fas fa-camera"></i>
                </div>
              </div>
              <span className="user-email">{user?.email || 'super@admin.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large user-avatar-with-upload" onClick={handlePhotoClick}>
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt="Profile" 
                      className="user-avatar-photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <div className="user-avatar-initials">{user?.name?.charAt(0) || 'S'}</div>
                  )}
                  <div className="avatar-upload-overlay">
                    <i className="fas fa-camera"></i>
                  </div>
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'Super Admin'}</div>
                  <div className="user-email">{user?.email || 'super@admin.com'}</div>
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
          <div className="sidebar-role">Super Admin</div>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard</span>
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
            className={`nav-item ${activeTab === 'bulk-operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk-operations')}
          >
            <i className="fas fa-tasks"></i>
            <span>Bulk Operations</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'personalization' ? 'active' : ''}`}
            onClick={() => setActiveTab('personalization')}
          >
            <i className="fas fa-palette"></i>
            <span>Personalization</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'configurations' ? 'active' : ''}`}
            onClick={() => setActiveTab('configurations')}
          >
            <i className="fas fa-cogs"></i>
            <span>Configurations</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'api-test' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-test')}
          >
            <i className="fas fa-plug"></i>
            <span>API Test</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'my-account' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-account')}
          >
            <i className="fas fa-user"></i>
            <span>My Account</span>
          </div>

          <div 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
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

              {/* Dashboard Overview */}
              <div className="superadmin-overview-section">
                <div className="superadmin-overview-header">
                  <div className="header-left">
                    <h2 className="superadmin-overview-title">Dashboard Overview</h2>
                    <p className="overview-description">
                      Welcome back! Here's what's happening with your agricultural data.
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
                     <div className="stats-value">{stats.totalFPO}</div>
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

                {/* Bottom Sections */}
                <div className="bottom-sections">
                  {/* Quick Actions */}
                                     <div className="section-card">
                    <div className="superadmin-section-header">
                      <h3 className="superadmin-section-title">Quick Actions</h3>
                      <p className="section-description">
                        Access frequently used functions to manage farmers, employees, and generate reports.
                      </p>
                    </div>
                     <div className="quick-actions-grid">
                       <button 
                         className="quick-action-btn primary"
                         onClick={() => {
                           console.log('🔄 Quick Action: Add New Farmer clicked');
                           setActiveTab('farmers');
                           setEditingFarmer(null);
                           setShowFarmerForm(true);
                         }}
                       >
                         <i className="fas fa-user-plus"></i>
                         Add New Farmer
                       </button>
                       <button 
                         className="quick-action-btn secondary"
                         onClick={() => {
                           console.log('🔄 Quick Action: Add Employee clicked');
                           setActiveTab('employees');
                           setShowEmployeeRegistration(true);
                         }}
                       >
                         <i className="fas fa-user-tie"></i>
                         Add Employee
                       </button>
                       <button 
                         className="quick-action-btn info"
                         onClick={() => {
                           console.log('🔄 Quick Action: Generate Report clicked');
                           alert('Report generation feature coming soon!');
                         }}
                       >
                         <i className="fas fa-chart-bar"></i>
                         Generate Report
                       </button>
                     </div>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'registration' && (
            <div className="superadmin-overview-section">
              {!showDeleteModal ? (
                <>
                  <div className="superadmin-overview-header">
                    <div className="header-left">
                      <h2 className="superadmin-overview-title">Registration Management</h2>
                      <p className="overview-description">
                        Manage pending registrations and approve new users.
                      </p>
                    </div>
                    <div className="header-right">
                      <button 
                        onClick={() => {
                          // Show refresh notification popup
                          alert('🔄 Data refreshed successfully!\n\nRegistration data has been updated with the latest information.');
                          console.log('🔄 Refresh Data button clicked - showing notification');
                        }}
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
                        }}
                      >
                        <i className="fas fa-sync-alt"></i>
                        Refresh Data
                      </button>
                    </div>
                  </div>
              {/* Enhanced Filters */}
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">Role</label>
                  <select 
                    value={registrationFilters.role} 
                    onChange={(e) => setRegistrationFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Roles</option>
                    <option value="FARMER">Farmer</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select 
                    value={registrationFilters.status} 
                    onChange={(e) => setRegistrationFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                
                <div className="filter-actions">
                  <button 
                    className="filter-btn-clear"
                    onClick={() => setRegistrationFilters({
                      role: '',
                      status: ''
                    })}
                  >
                    <i className="fas fa-times"></i>
                    Clear Filters
                  </button>
                </div>
              </div>
                  {!viewingRegistration ? (
                    (() => {
                      const registrationData = getFilteredRegistrations();
                      return (
                        <div className="table-scroll-wrapper">
                          <DataTable
                            data={registrationData}
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
                                className: 'info',
                                onClick: handleViewRegistration
                              },
                              {
                                label: 'Approve',
                                className: 'approve',
                                onClick: (registration) => handleApproveRegistration(registration.id)
                              },
                              {
                                label: 'Reject',
                                className: 'reject',
                                onClick: (registration) => handleRejectRegistration(registration.id)
                              },
                              {
                                label: 'Delete',
                                className: 'danger',
                                onClick: (registration) => handleDelete(registration, 'registration')
                              }
                            ]}
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <RegistrationDetailsInline 
                      registration={viewingRegistration}
                      onBack={() => setViewingRegistration(null)}
                      onUpdate={handleRegistrationUpdate}
                    />
                  )}
                </>
              ) : (
                <DeleteModal
                  item={itemToDelete?.item}
                  type={itemToDelete?.type}
                  onClose={() => setShowDeleteModal(false)}
                  onConfirm={confirmDelete}
                  inlineMode={true}
                />
              )}
            </div>
          )}

          {activeTab === 'farmers' && (
            <>
              {showIdCardContent && currentCardId ? (
                <IdCardContentViewer
                  cardId={currentCardId}
                  onClose={() => {
                    setShowIdCardContent(false);
                    setCurrentCardId(null);
                  }}
                />
              ) : !viewingFarmer && !showAssignmentInline && !showDeleteModal ? (
                <div className="superadmin-overview-section">
                  <div className="superadmin-overview-header">
                    <div className="header-left">
                      <h2 className="superadmin-overview-title">Farmer Management</h2>
                      <p className="overview-description">
                        Manage farmer registrations and assignments.
                      </p>
                    </div>
                    <div className="header-right">
                      <div className="overview-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => {
                          setEditingFarmer(null);
                          setShowFarmerForm(true);
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
                        Add Farmer
                      </button>
                      <button 
                        className="action-btn secondary" 
                        onClick={() => {
                          console.log('🔍 Assign Farmers button clicked');
                          console.log('🔍 Current showAssignmentInline state:', showAssignmentInline);
                          console.log('🔍 Total farmers:', farmers.length);
                          console.log('🔍 Available employees:', employees.length);
                          console.log('🔍 Farmers without assignments:', farmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned' || f.assignedEmployee === null || f.assignedEmployee === undefined || f.assignedEmployee === '').length);
                          
                          // Set the state to show assignment inline
                          setShowAssignmentInline(true);
                          console.log('🔍 Set showAssignmentInline to true');
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
                          transform: 'translateY(0)'
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
                      <button 
                        onClick={() => {
                          console.log('🔍 Refresh Data button clicked!');
                          handleManualRefresh();
                        }}
                                                 style={{
                           background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
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
                           position: 'relative',
                           zIndex: 1
                         }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                        }}
                      >
                        <i className="fas fa-sync-alt"></i>
                        Refresh Data
                                              </button>
                      {activeTab === 'farmers' && (
                        <button 
                          className="action-btn danger"
                          onClick={handleDeleteSelectedFarmers}
                          disabled={!selectedFarmerIds.length}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            cursor: selectedFarmerIds.length ? 'pointer' : 'not-allowed',
                            opacity: selectedFarmerIds.length ? 1 : 0.6,
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transform: 'translateY(0)'
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                          Delete Selected
                        </button>
                      )}
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
                        value={filters.district} 
                        onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
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
                        onChange={(e) => {
                          console.log('🔍 Employee filter changed to:', e.target.value);
                          setFilters(prev => ({ ...prev, employeeFilter: e.target.value }));
                        }}
                        className="filter-select"
                      >
                        <option value="">All Employees</option>
                        {employees.map(emp => {
                          console.log('🔍 Employee in dropdown:', emp);
                          return (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
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

                  {!showFarmerForm ? (
                    <div className="table-scroll-wrapper">
                      <DataTable
                        data={getFilteredFarmers()}
                        columns={[
                          { 
                            key: 'select', 
                            label: '',
                            headerRender: () => (
                              <input
                                type="checkbox"
                                checked={getFilteredFarmers().length > 0 && getFilteredFarmers().every(f => selectedFarmerIds.includes(f.id))}
                                {...(!(getFilteredFarmers().every(f => selectedFarmerIds.includes(f.id))) && selectedFarmerIds.length > 0 ? { indeterminate: true } : {})}
                                onChange={(e) => {
                                  const visible = getFilteredFarmers();
                                  if (e.target.checked) {
                                    // Add all visible ids
                                    const idsToAdd = visible.map(f => f.id).filter(id => !selectedFarmerIds.includes(id));
                                    setSelectedFarmerIds(prev => [...prev, ...idsToAdd]);
                                  } else {
                                    // Remove all visible ids
                                    const visibleIds = new Set(visible.map(f => f.id));
                                    setSelectedFarmerIds(prev => prev.filter(id => !visibleIds.has(id)));
                                  }
                                }}
                              />
                            ),
                            render: (value, row) => (
                              <input 
                                type="checkbox" 
                                checked={selectedFarmerIds.includes(row.id)}
                                onChange={() => toggleFarmerSelection(row.id)}
                              />
                            )
                          },
                          { 
                            key: 'id', 
                            label: 'ID',
                            render: (value, row) => getFarmerDisplayId(row)
                          },
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
                            className: 'info',
                            onClick: handleViewFarmer
                          },
                          {
                            label: 'ID Card',
                            className: 'primary',
                            onClick: async (farmer) => {
                              try {
                                console.log('🔄 Attempting to get ID card for farmer:', farmer.id, farmer.name);
                                
                                // Try to fetch existing cards
                                const list = await idCardAPI.getIdCardsByHolder(farmer.id.toString());
                                console.log('📋 Fetched ID cards list:', list);
                                
                                if (Array.isArray(list) && list.length > 0) {
                                  const activeCard = list.find(card => card.status === 'ACTIVE') || list[0];
                                  console.log('✅ Using existing ID card:', activeCard.cardId);
                                  setCurrentCardId(activeCard.cardId);
                                  setShowIdCardContent(true);
                                  return;
                                }
                                
                                console.log('🔄 No existing cards found, generating new one...');
                                // If none, generate then open
                                const gen = await idCardAPI.generateFarmerIdCard(farmer.id);
                                console.log('🔄 Generated ID card response:', gen);
                                
                                if (gen && gen.cardId) {
                                  console.log('✅ Successfully generated ID card:', gen.cardId);
                                  setCurrentCardId(gen.cardId);
                                  setShowIdCardContent(true);
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
                            label: 'Delete',
                            className: 'danger',
                            onClick: (farmer) => handleDelete(farmer, 'farmer')
                          }
                        ]}
                      />
                    </div>
                  ) : (
                    <div className="employee-registration-section">
                      <div className="overview-header">
                        <h2 className="overview-title">Add New Farmer</h2>
                        <p className="overview-description">
                          Register a new farmer in the system.
                        </p>
                        <div className="overview-actions">
                          <button 
                            className="action-btn secondary" 
                            onClick={() => setShowFarmerForm(false)}
                          >
                            <i className="fas fa-arrow-left"></i>
                            Back to Farmers
                          </button>
                        </div>
                      </div>
                      <FarmerRegistrationForm 
                        isInDashboard={true}
                        onClose={() => setShowFarmerForm(false)}
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
                  )}
                </div>
              ) : null}

                             {showAssignmentInline && (
                 <AssignmentInline 
                   farmers={farmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned' || f.assignedEmployee === null || f.assignedEmployee === undefined || f.assignedEmployee === '')}
                   employees={employees}
                   onBack={() => {
                     console.log('🔍 Back button clicked');
                     setShowAssignmentInline(false);
                   }}
                   onAssign={handleAssignFarmers}
                 />
               )}

              {showDeleteModal && activeTab === 'farmers' && (
                <DeleteModal
                  item={itemToDelete?.item}
                  type={itemToDelete?.type}
                  onClose={() => setShowDeleteModal(false)}
                  onConfirm={confirmDelete}
                  inlineMode={true}
                />
              )}

              {viewingFarmer && (
                <ViewFarmer 
                  farmerData={viewingFarmer}
                  onBack={() => setViewingFarmer(null)}
                  onSave={handleSaveFarmer}
                />
              )}

              {showIdCardModal && currentCardId && (
                <IdCardContentViewer
                  cardId={currentCardId}
                  onClose={() => {
                    setShowIdCardModal(false);
                    setCurrentCardId(null);
                  }}
                />
              )}
            </>
          )}

          {activeTab === 'employees' && (
            <>
              {showIdCardContent && currentCardId ? (
                <IdCardContentViewer
                  cardId={currentCardId}
                  onClose={() => {
                    setShowIdCardContent(false);
                    setCurrentCardId(null);
                  }}
                />
              ) : !showEmployeeRegistration && !showDeleteModal ? (
                <>
                  {!viewingEmployee ? (
                    <>
                      <div className="superadmin-overview-header">
                        <div className="header-left">
                          <h2 className="superadmin-overview-title">Employee Management</h2>
                          <p className="overview-description">
                            Manage employee profiles and assignments.
                          </p>
                        </div>
                        <div className="header-right">
                          <div className="overview-actions">
                          <button 
                            onClick={() => {
                              setShowEmployeeRegistration(true);
                              console.log('🔄 Add Employee button clicked - opening employee form');
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
                            Add Employee
                                                      </button>
                          </div>
                        </div>
                      </div>

                      {/* Employee Filters */}
                      <div className="filters-section">
                        <div className="filter-group">
                          <label className="filter-label">Status</label>
                          <select 
                            value={employeeFilters.status} 
                            onChange={(e) => setEmployeeFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="PENDING">Pending</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Role</label>
                          <select 
                            value={employeeFilters.role} 
                            onChange={(e) => setEmployeeFilters(prev => ({ ...prev, role: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Roles</option>
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Designation</label>
                          <select 
                            value={employeeFilters.designation} 
                            onChange={(e) => setEmployeeFilters(prev => ({ ...prev, designation: e.target.value }))}
                            className="filter-select"
                          >
                            <option value="">All Designations</option>
                            <option value="KYC Officer">KYC Officer</option>
                            <option value="Field Officer">Field Officer</option>
                            <option value="Manager">Manager</option>
                            <option value="Supervisor">Supervisor</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">State</label>
                          <select 
                            value={employeeFilters.state} 
                            onChange={(e) => setEmployeeFilters(prev => ({ ...prev, state: e.target.value }))}
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
                            value={employeeFilters.district} 
                            onChange={(e) => setEmployeeFilters(prev => ({ ...prev, district: e.target.value }))}
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
                        
                        <div className="filter-actions">
                          <button 
                            className="filter-btn-clear"
                            onClick={() => setEmployeeFilters({
                              status: '',
                              role: '',
                              designation: '',
                              state: '',
                              district: ''
                            })}
                          >
                            <i className="fas fa-times"></i>
                            Clear Filters
                          </button>
                        </div>
                      </div>

                      <div className="table-scroll-wrapper">
                        <DataTable
                          data={getFilteredEmployees()}
                          columns={[
                            { 
                              key: 'id', 
                              label: 'ID',
                              render: (value, row) => getEmployeeDisplayId(row)
                            },
                            { key: 'name', label: 'Name' },
                            { key: 'contactNumber', label: 'Phone' },
                            { key: 'email', label: 'Email' },
                            { key: 'status', label: 'Status' },
                            { key: 'role', label: 'Role' }
                          ]}
                          customActions={[
                            {
                              label: 'View',
                              className: 'info',
                              onClick: handleViewEmployee
                            },
                            {
                              label: 'ID Card',
                              className: 'primary',
                              onClick: async (employee) => {
                                try {
                                  console.log('🔄 Attempting to get ID card for employee:', employee.id, employee.name);
                                  
                                  const list = await idCardAPI.getIdCardsByHolder(employee.id.toString());
                                  console.log('📋 Fetched ID cards list:', list);
                                  
                                  if (Array.isArray(list) && list.length > 0) {
                                    const activeCard = list.find(card => card.status === 'ACTIVE') || list[0];
                                    console.log('✅ Using existing ID card:', activeCard.cardId);
                                    setCurrentCardId(activeCard.cardId);
                                    setShowIdCardContent(true);
                                    return;
                                  }
                                  
                                  console.log('🔄 No existing cards found, generating new one...');
                                  const gen = await idCardAPI.generateEmployeeIdCard(employee.id);
                                  console.log('🔄 Generated ID card response:', gen);
                                  
                                  if (gen && gen.cardId) {
                                    console.log('✅ Successfully generated ID card:', gen.cardId);
                                    setCurrentCardId(gen.cardId);
                                    setShowIdCardContent(true);
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
                              label: 'Delete',
                              className: 'danger',
                              onClick: (employee) => handleDelete(employee, 'employee')
                            }
                          ]}
                        />
                      </div>
                    </>
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
                  <div className="overview-header">
                    <h2 className="overview-title">Add New Employee</h2>
                    <p className="overview-description">
                      Register a new employee in the system.
                    </p>
                    <div className="overview-actions">
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
                    onClose={() => setShowEmployeeRegistration(false)}
                    onSubmit={async (employeeData) => {
                      try {
                        const newEmployee = await employeesAPI.createEmployee(employeeData);
                        setEmployees(prev => [...prev, newEmployee]);
                        // Try to ensure the employee unique ID is available immediately
                        try {
                          const gen = await idCardAPI.generateEmployeeIdCard(newEmployee.id);
                          if (gen && gen.cardId) {
                            setEmployeeUniqueIds(prev => ({ ...prev, [newEmployee.id]: gen.cardId }));
                          }
                        } catch (e) {
                          // If generation fails (e.g., permissions), ignore; it will appear later when generated
                          console.warn('Could not generate employee ID card right after creation:', e);
                        }
                        alert('Employee created successfully!');
                        setShowEmployeeRegistration(false);
                      } catch (error) {
                        console.error('Error creating employee:', error);
                        alert('Failed to create employee. Please try again.');
                      }
                    }}
                  />
                </div>
              ) : null}

              {showDeleteModal && activeTab === 'employees' && (
                <DeleteModal
                  item={itemToDelete?.item}
                  type={itemToDelete?.type}
                  onClose={() => setShowDeleteModal(false)}
                  onConfirm={confirmDelete}
                  inlineMode={true}
                />
              )}
            </>
          )}

          {activeTab === 'fpo' && (
            <>
              {showFPODetailsView && selectedFPODetails ? (
                <FPODetailsView
                  fpo={selectedFPODetails}
                  onClose={() => {
                    setShowFPODetailsView(false);
                    setSelectedFPODetails(null);
                  }}
                />
              ) : showFPOEditForm && selectedFPOEdit ? (
                <FPOEditForm
                  fpo={selectedFPOEdit}
                  onClose={() => {
                    setShowFPOEditForm(false);
                    setSelectedFPOEdit(null);
                  }}
                  onUpdated={(updated) => {
                    setFpos(prev => prev.map(fpo => 
                      fpo.id === selectedFPOEdit.id ? updated : fpo
                    ));
                    setShowFPOEditForm(false);
                    setSelectedFPOEdit(null);
                    alert('FPO updated successfully!');
                  }}
                />
              ) : showBoardMembersView && selectedFPOBoardMembers ? (
                <FPOBoardMembersView
                  fpo={selectedFPOBoardMembers}
                  onClose={() => {
                    setShowBoardMembersView(false);
                    setSelectedFPOBoardMembers(null);
                  }}
                />
              ) : showFarmServicesView && selectedFPOFarmServices ? (
                <FPOFarmServicesView
                  fpo={selectedFPOFarmServices}
                  onClose={() => {
                    setShowFarmServicesView(false);
                    setSelectedFPOFarmServices(null);
                  }}
                />
              ) : showTurnoverView && selectedFPOTurnover ? (
                <FPOTurnoverView
                  fpo={selectedFPOTurnover}
                  onClose={() => {
                    setShowTurnoverView(false);
                    setSelectedFPOTurnover(null);
                  }}
                />
              ) : showCropEntriesView && selectedFPOCropEntries ? (
                <FPOCropEntriesView
                  fpo={selectedFPOCropEntries}
                  onClose={() => {
                    setShowCropEntriesView(false);
                    setSelectedFPOCropEntries(null);
                  }}
                />
              ) : showInputShopView && selectedFPOInputShop ? (
                <FPOInputShopView
                  fpo={selectedFPOInputShop}
                  onClose={() => {
                    setShowInputShopView(false);
                    setSelectedFPOInputShop(null);
                  }}
                />
              ) : showProductCategoriesView && selectedFPOProductCategories ? (
                <FPOProductCategoriesView
                  fpo={selectedFPOProductCategories}
                  onClose={() => {
                    setShowProductCategoriesView(false);
                    setSelectedFPOProductCategories(null);
                  }}
                />
              ) : showProductsView && selectedFPOProducts ? (
                <FPOProductsView
                  fpo={selectedFPOProducts}
                  onClose={() => {
                    setShowProductsView(false);
                    setSelectedFPOProducts(null);
                  }}
                />
              ) : showUsersView && selectedFPOUsers ? (
                <FPOUsersView
                  fpo={selectedFPOUsers}
                  onClose={() => {
                    setShowUsersView(false);
                    setSelectedFPOUsers(null);
                  }}
                />
              ) : (
                <div className="superadmin-overview-section">
                  {!showFPOCreationForm ? (
                    <>
                      {!viewingFPO ? (
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
                            { key: 'fpoId', label: 'Id' },
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
                                        await fpoAPI.updateFPOStatus(row.id, newStatus);
                                        setFpos(prev => prev.map(f => f.id === row.id ? { ...f, status: newStatus } : f));
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
                            { label: 'Dashboard', className: 'info', onClick: (fpo) => { setSelectedFPODetails(fpo); setShowFPODetailsView(true); } },
                            { label: 'Edit FPO', className: 'warning', onClick: (fpo) => { setSelectedFPOEdit(fpo); setShowFPOEditForm(true); } },
                            { label: 'FPO Board Members', onClick: handleBoardMembers },
                            { label: 'FPO Farm Services', onClick: handleFarmServices },
                            { label: 'FPO Turnover', onClick: handleTurnover },
                            { label: 'FPO Crop Entries', onClick: handleCropEntries },
                            { label: 'FPO Input Shop', onClick: handleInputShop },
                            { label: 'FPO Product Categories', onClick: handleProductCategories },
                            { label: 'FPO Products', onClick: handleProducts },
                            { label: 'FPO Users', onClick: handleFpoUsers },
                            { label: 'Delete', className: 'danger', onClick: (fpo) => handleDelete(fpo, 'fpo') }
                          ]}
                        />
                      </div>
                    </>
                  ) : (
                    <FPODashboard 
                      fpoId={viewingFPO?.id}
                      initialTab={selectedFPOTab}
                      onBack={() => setViewingFPO(null)}
                    />
                  )}
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
                          transform: 'translateY(0)'
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
                        Back to FPOs
                      </button>
                    </div>
                  </div>

                  <FPOCreationForm 
                    fpoData={editingFPO}
                    onClose={() => {
                      setShowFPOCreationForm(false);
                      setEditingFPO(null);
                    }}
                    onSubmit={handleSaveFPO}
                  />
                </div>
              )}
                </div>
              )}
            </>
          )}


          {/* New Navigation Items Content */}
          {activeTab === 'add-farmer' && (
            <div className="overview-section">
              <div className="overview-header">
                <h2 className="overview-title">Add New Farmer</h2>
                <p className="overview-description">Register a new farmer in the system.</p>
              </div>
              <FarmerRegistrationForm 
                onClose={() => setActiveTab('farmers')}
                onSubmit={(farmerData) => {
                  console.log('New farmer data:', farmerData);
                  // Handle farmer creation
                  setActiveTab('farmers');
                }}
              />
            </div>
          )}

          {activeTab === 'view-farmers' && (
            <div className="overview-section">
              <div className="overview-header">
                <h2 className="overview-title">View Farmers</h2>
                <p className="overview-description">Manage and view all farmers in the system.</p>
              </div>
              <div className="farmers-section">
                <div className="section-header">
                  <h3 className="section-title">Farmers List</h3>
                  <div className="section-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => setActiveTab('add-farmer')}
                    >
                      <i className="fas fa-plus"></i>
                      Add Farmer
                    </button>
                  </div>
                </div>
                <DataTable
                  data={getFilteredFarmers()}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'contactNumber', label: 'Contact' },
                    { key: 'state', label: 'State' },
                    { key: 'district', label: 'District' },
                    { key: 'kycStatus', label: 'KYC Status' }
                  ]}
                  customActions={[
                    { label: 'View', className: 'info', onClick: (farmer) => handleViewFarmer(farmer) },
                    { label: 'Edit', className: 'warning', onClick: (farmer) => handleEditFarmer(farmer) },
                    { label: 'Delete', className: 'danger', onClick: (farmer) => handleDelete(farmer, 'farmer') }
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'bulk-operations' && (
            <BulkOperations userRole="SUPER_ADMIN" hideHeader={false} />
          )}

          {activeTab === 'personalization' && (
            <PersonalizationTab 
              isSuperAdmin={user?.role === 'SUPER_ADMIN'} 
              onFormatsUpdated={() => {
                // Refresh code formats when they are updated
                configAPI.getAllCodeFormats().then(formats => {
                  setCodeFormats(formats || []);
                  console.log('📊 Code formats updated:', formats?.length || 0, 'formats');
                }).catch(error => {
                  console.error('❌ Failed to refresh code formats:', error);
                });
              }}
            />
          )}

          {activeTab === 'configurations' && (
            <ConfigurationDashboard />
          )}

          {activeTab === 'settings' && (
            <SettingsMasterList />
          )}

          {activeTab === 'api-test' && (
            <APITest />
          )}

          {activeTab === 'my-account' && (
            <div className="overview-section">
              <div className="overview-header">
                <h2 className="overview-title">My Account</h2>
                <p className="overview-description">Manage your account information and preferences.</p>
              </div>
              <div className="coming-soon">
                <i className="fas fa-user"></i>
                <h3>Coming Soon</h3>
                <p>Account management features are under development.</p>
              </div>
            </div>
          )}
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
      {showAssignmentModal && (() => {
        console.log('=== RENDERING ASSIGNMENT MODAL ===');
        console.log('showAssignmentModal:', showAssignmentModal);
        console.log('Employees state:', employees);
        console.log('Employees length:', employees?.length || 0);
        return (
          <AssignmentModal 
            farmers={farmers.filter(f => {
              // Check if farmer is unassigned based on backend data structure
              return !f.assignedEmployee || 
                     f.assignedEmployee === 'Not Assigned' || 
                     f.assignedEmployee === null ||
                     f.assignedEmployee === undefined ||
                     f.assignedEmployee === '';
            })}
            employees={(() => {
              console.log('=== PASSING EMPLOYEES TO MODAL ===');
              console.log('Employees array:', employees);
              console.log('Employees type:', typeof employees);
              console.log('Employees length:', employees?.length || 0);
              console.log('Employees is array:', Array.isArray(employees));
              if (employees && employees.length > 0) {
                console.log('First employee:', employees[0]);
                console.log('First employee name:', employees[0]?.name);
                console.log('First employee designation:', employees[0]?.designation);
                console.log('All employee names:', employees.map(emp => emp?.name));
              } else {
                console.log('No employees found or employees is empty/null');
              }
              return employees;
            })()}
            onClose={() => setShowAssignmentModal(false)}
            onAssign={handleAssignFarmers}
          />
        );
      })()}

      {showEmployeeDetails && selectedEmployee && (
        <ViewEditEmployeeDetails
          employee={selectedEmployee}
          onClose={() => setShowEmployeeDetails(false)}
        />
      )}

      {editingFPO && (
        <FPOEditModal
          fpo={editingFPO}
          onClose={() => setEditingFPO(null)}
          onUpdated={(updated) => {
            setFpos(prev => prev.map(f => f.id === updated.id ? updated : f));
            setEditingFPO(null);
          }}
        />
      )}

      {showFPODetail && detailFPO && (
        <FPODetailModal
          fpo={detailFPO}
          onClose={() => { setShowFPODetail(false); setDetailFPO(null); }}
        />
      )}

      {showBoardMembers && selectedFPOForBoard && (
        <FPOBoardMembersModal
          isOpen={showBoardMembers}
          onClose={() => { setShowBoardMembers(false); setSelectedFPOForBoard(null); }}
          fpoId={selectedFPOForBoard.id}
          fpoName={selectedFPOForBoard.fpoName}
        />
      )}

      {showFarmServices && selectedFPOForServices && (
        <FPOFarmServicesModal
          isOpen={showFarmServices}
          onClose={() => { setShowFarmServices(false); setSelectedFPOForServices(null); }}
          fpoId={selectedFPOForServices.id}
          fpoName={selectedFPOForServices.fpoName}
        />
      )}

      {showTurnover && selectedFPOForTurnover && (
        <FPOTurnoverModal
          isOpen={showTurnover}
          onClose={() => { setShowTurnover(false); setSelectedFPOForTurnover(null); }}
          fpoId={selectedFPOForTurnover.id}
          fpoName={selectedFPOForTurnover.fpoName}
        />
      )}

      {showCropEntries && selectedFPOForCropEntries && (
        <FPOCropEntriesModal
          isOpen={showCropEntries}
          onClose={() => { setShowCropEntries(false); setSelectedFPOForCropEntries(null); }}
          fpoId={selectedFPOForCropEntries.id}
          fpoName={selectedFPOForCropEntries.fpoName}
        />
      )}

      {showInputShop && selectedFPOForInputShop && (
        <FPOInputShopModal
          isOpen={showInputShop}
          onClose={() => { setShowInputShop(false); setSelectedFPOForInputShop(null); }}
          fpoId={selectedFPOForInputShop.id}
          fpoName={selectedFPOForInputShop.fpoName}
        />
      )}

      {showProductCategories && selectedFPOForCategories && (
        <FPOProductCategoriesModal
          isOpen={showProductCategories}
          onClose={() => { setShowProductCategories(false); setSelectedFPOForCategories(null); }}
          fpoId={selectedFPOForCategories.id}
        />
      )}

      {showProducts && selectedFPOForProducts && (
        <FPOProductsModal
          isOpen={showProducts}
          onClose={() => { setShowProducts(false); setSelectedFPOForProducts(null); }}
          fpoId={selectedFPOForProducts.id}
        />
      )}

      {showFpoUsers && selectedFPOForUsers && (
        <FPOUsersModal
          isOpen={showFpoUsers}
          onClose={() => { setShowFpoUsers(false); setSelectedFPOForUsers(null); }}
          fpoId={selectedFPOForUsers.id}
        />
      )}
      
      {showKYCModal && (
        <KYCDocumentUpload
          onClose={() => setShowKYCModal(false)}
          onApprove={handleApproveKYC}
          onReject={handleRejectKYC}
          onReferBack={handleReferBackKYC}
        />
      )}


      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default SuperAdminDashboard; 