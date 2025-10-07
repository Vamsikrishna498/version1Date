const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed!'));
    }
  }
});

// In-memory data storage (replace with database in production)
let users = [
  {
    id: 1,
    userName: 'admin',
    password: bcrypt.hashSync('Admin@123', 10),
    name: 'Admin User',
    email: 'admin@agristack.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    forcePasswordChange: false
  },
  {
    id: 2,
    userName: 'superadmin',
    password: bcrypt.hashSync('SuperAdmin@123', 10),
    name: 'Super Admin User',
    email: 'superadmin@agristack.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    forcePasswordChange: false
  },
  {
    id: 3,
    userName: 'employee',
    password: bcrypt.hashSync('Employee@123', 10),
    name: 'Employee User',
    email: 'employee@agristack.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    forcePasswordChange: false
  },
  {
    id: 4,
    userName: 'farmer',
    password: bcrypt.hashSync('Farmer@123', 10),
    name: 'Farmer User',
    email: 'farmer@agristack.com',
    role: 'FARMER',
    status: 'ACTIVE',
    forcePasswordChange: false
  },
  {
    id: 5,
    userName: 'fpo',
    password: bcrypt.hashSync('FPO@123', 10),
    name: 'FPO User',
    email: 'fpo@agristack.com',
    role: 'FPO',
    status: 'ACTIVE',
    forcePasswordChange: false
  }
];

let farmers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    phone: '9876543210',
    state: 'Maharashtra',
    district: 'Pune',
    region: 'Western',
    kycStatus: 'APPROVED',
    assignmentStatus: 'ASSIGNED',
    assignedEmployee: 'John Doe',
    assignedDate: '2024-01-15'
  },
  {
    id: 2,
    name: 'Suresh Patel',
    phone: '9876543211',
    state: 'Gujarat',
    district: 'Ahmedabad',
    region: 'Western',
    kycStatus: 'PENDING',
    assignmentStatus: 'UNASSIGNED',
    assignedEmployee: null,
    assignedDate: null
  }
];

let employees = [
  {
    id: 1,
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@agri.com',
    phone: '9876543200',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    address: '123 Main Street, City Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    employeeId: 'EMP001',
    department: 'IT',
    designation: 'Software Engineer',
    joiningDate: '2020-03-15',
    salary: '75000',
    supervisor: 'Manager Name',
    highestQualification: 'Bachelor\'s Degree',
    institution: 'Mumbai University',
    graduationYear: '2012',
    specialization: 'Computer Science',
    emergencyName: 'Jane Doe',
    emergencyPhone: '9876543201',
    emergencyRelation: 'Spouse',
    skills: 'JavaScript, React, Node.js, Python',
    languages: 'English, Hindi, Marathi',
    certifications: 'AWS Certified Developer, React Certification',
    workExperience: '8 years in software development',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    aadhaarNumber: '123456789012',
    panNumber: 'ABCDE1234F',
    voterId: 'ABC1234567',
    rationCardNumber: '123456789'
  }
];

let registrations = [
  {
    id: 1,
    registrationNumber: 'FPO123456',
    registrationDate: '2024-01-15',
    applicantName: 'Rajesh Kumar',
    applicantEmail: 'rajesh@example.com',
    applicantPhone: '9876543210',
    role: 'FARMER',
    status: 'PENDING',
    submittedBy: 'Rajesh Kumar',
    submittedDate: '2024-01-15',
    reviewedBy: null,
    reviewedDate: null,
    approvalDate: null,
    rejectionReason: null
  }
];

// JWT Secret (MUST be set via environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast if JWT_SECRET is not set or is using default value
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key' || JWT_SECRET.length < 32) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set or is insecure!');
  console.error('📝 Please set JWT_SECRET in your .env file to a secure random string (32+ characters)');
  console.error('💡 Example: JWT_SECRET=your_very_long_and_secure_random_string_here_at_least_32_characters');
  process.exit(1);
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = users.find(u => u.userName === userName);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, userName: user.userName, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: user.role,
      userName: user.userName,
      name: user.name,
      email: user.email,
      forcePasswordChange: user.forcePasswordChange,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    userName: user.userName,
    name: user.name,
    email: user.email,
    role: user.role,
    forcePasswordChange: user.forcePasswordChange,
    status: user.status
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, dateOfBirth, gender, email, phoneNumber, role, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.userName === phoneNumber || u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      userName: phoneNumber,
      password: hashedPassword,
      name,
      email,
      role,
      status: 'PENDING',
      forcePasswordChange: false
    };

    users.push(newUser);

    res.json({
      message: 'User registered successfully',
      userId: newUser.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/send-otp', (req, res) => {
  const { email } = req.body;
  
  // In production, send actual OTP via email
  res.json({
    message: 'OTP sent successfully',
    email
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  // In production, verify actual OTP
  if (otp === '123456') {
    res.json({
      message: 'OTP verified successfully',
      verified: true,
      target: email
    });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});

app.post('/api/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  
  res.json({
    message: 'OTP resent successfully',
    target: email
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { emailOrPhone } = req.body;
  
  res.json({
    message: 'Password reset link sent successfully',
    email: emailOrPhone
  });
});

app.post('/api/auth/forgot-user-id', (req, res) => {
  const { emailOrPhone } = req.body;
  
  res.json({
    message: 'User ID sent successfully',
    email: emailOrPhone
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { emailOrPhone, newPassword, confirmPassword } = req.body;
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  res.json({
    message: 'Password changed successfully',
    email: emailOrPhone
  });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/change-user-id', authenticateToken, (req, res) => {
  const { newUserName, password } = req.body;
  
  // In production, verify password and update username
  res.json({ message: 'User ID changed successfully' });
});

app.get('/api/auth/countries', (req, res) => {
  res.json([
    { id: 1, name: 'India' },
    { id: 2, name: 'United States' },
    { id: 3, name: 'United Kingdom' }
  ]);
});

app.post('/api/auth/states', (req, res) => {
  const { countryId } = req.body;
  
  res.json([
    { id: 1, name: 'Maharashtra', countryId: 1 },
    { id: 2, name: 'Karnataka', countryId: 1 },
    { id: 3, name: 'Tamil Nadu', countryId: 1 },
    { id: 4, name: 'Kerala', countryId: 1 },
    { id: 5, name: 'Andhra Pradesh', countryId: 1 }
  ]);
});

// Farmers routes
app.get('/api/farmers', authenticateToken, (req, res) => {
  const { state, district, region, kycStatus, assignmentStatus } = req.query;
  
  let filteredFarmers = farmers;
  
  if (state) {
    filteredFarmers = filteredFarmers.filter(f => f.state === state);
  }
  if (district) {
    filteredFarmers = filteredFarmers.filter(f => f.district === district);
  }
  if (region) {
    filteredFarmers = filteredFarmers.filter(f => f.region === region);
  }
  if (kycStatus) {
    filteredFarmers = filteredFarmers.filter(f => f.kycStatus === kycStatus);
  }
  if (assignmentStatus) {
    filteredFarmers = filteredFarmers.filter(f => f.assignmentStatus === assignmentStatus);
  }
  
  res.json(filteredFarmers);
});

app.get('/api/farmers/:id', authenticateToken, (req, res) => {
  const farmer = farmers.find(f => f.id === parseInt(req.params.id));
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  res.json(farmer);
});

app.post('/api/farmers', authenticateToken, (req, res) => {
  const newFarmer = {
    id: farmers.length + 1,
    ...req.body,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  farmers.push(newFarmer);
  res.json({
    message: 'Farmer created successfully',
    farmerId: newFarmer.id
  });
});

app.put('/api/farmers/:id', authenticateToken, (req, res) => {
  const farmerIndex = farmers.findIndex(f => f.id === parseInt(req.params.id));
  if (farmerIndex === -1) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmers[farmerIndex] = {
    ...farmers[farmerIndex],
    ...req.body,
    updated_at: new Date()
  };
  
  res.json({ message: 'Farmer updated successfully' });
});

app.delete('/api/farmers/:id', authenticateToken, (req, res) => {
  const farmerIndex = farmers.findIndex(f => f.id === parseInt(req.params.id));
  if (farmerIndex === -1) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmers.splice(farmerIndex, 1);
  res.json({ message: 'Farmer deleted successfully' });
});

app.post('/api/farmers/:id/assign', authenticateToken, (req, res) => {
  const { employeeId } = req.body;
  const farmer = farmers.find(f => f.id === parseInt(req.params.id));
  
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmer.assignmentStatus = 'ASSIGNED';
  farmer.assignedEmployee = employeeId;
  farmer.assignedDate = new Date().toISOString().split('T')[0];
  
  res.json({ message: 'Farmer assigned successfully' });
});

app.get('/api/farmers/stats', authenticateToken, (req, res) => {
  const totalFarmers = farmers.length;
  const unassignedFarmers = farmers.filter(f => f.assignmentStatus === 'UNASSIGNED').length;
  const pendingKyc = farmers.filter(f => f.kycStatus === 'PENDING').length;
  const overdueKyc = farmers.filter(f => {
    if (f.assignedDate) {
      const assignedDate = new Date(f.assignedDate);
      const daysDiff = (new Date() - assignedDate) / (1000 * 60 * 60 * 24);
      return daysDiff > 7 && f.kycStatus === 'PENDING';
    }
    return false;
  }).length;

  res.json({
    totalFarmers,
    unassignedFarmers,
    pendingKyc,
    overdueKyc
  });
});

// Employees routes
app.get('/api/employees', authenticateToken, (req, res) => {
  const { department, designation } = req.query;
  
  let filteredEmployees = employees;
  
  if (department) {
    filteredEmployees = filteredEmployees.filter(e => e.department === department);
  }
  if (designation) {
    filteredEmployees = filteredEmployees.filter(e => e.designation === designation);
  }
  
  res.json(filteredEmployees);
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  const employee = employees.find(e => e.id === parseInt(req.params.id));
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  res.json(employee);
});

app.post('/api/employees', authenticateToken, (req, res) => {
  const newEmployee = {
    id: employees.length + 1,
    ...req.body,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  employees.push(newEmployee);
  res.json({
    message: 'Employee created successfully',
    employeeId: newEmployee.id
  });
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  const employeeIndex = employees.findIndex(e => e.id === parseInt(req.params.id));
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  
  employees[employeeIndex] = {
    ...employees[employeeIndex],
    ...req.body,
    updated_at: new Date()
  };
  
  res.json({ message: 'Employee updated successfully' });
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  const employeeIndex = employees.findIndex(e => e.id === parseInt(req.params.id));
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  
  employees.splice(employeeIndex, 1);
  res.json({ message: 'Employee deleted successfully' });
});

app.get('/api/employees/:id/assigned-farmers', authenticateToken, (req, res) => {
  const assignedFarmers = farmers.filter(f => f.assignedEmployee === req.params.id);
  res.json(assignedFarmers);
});

app.get('/api/employees/stats', authenticateToken, (req, res) => {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const assignedEmployees = employees.filter(e => 
    farmers.some(f => f.assignedEmployee === e.name)
  ).length;
  const unassignedEmployees = totalEmployees - assignedEmployees;

  res.json({
    totalEmployees,
    activeEmployees,
    assignedEmployees,
    unassignedEmployees
  });
});

// Registrations routes
app.get('/api/registrations', authenticateToken, (req, res) => {
  const { status, role } = req.query;
  
  let filteredRegistrations = registrations;
  
  if (status) {
    filteredRegistrations = filteredRegistrations.filter(r => r.status === status);
  }
  if (role) {
    filteredRegistrations = filteredRegistrations.filter(r => r.role === role);
  }
  
  res.json(filteredRegistrations);
});

app.get('/api/registrations/:id', authenticateToken, (req, res) => {
  const registration = registrations.find(r => r.id === parseInt(req.params.id));
  if (!registration) {
    return res.status(404).json({ message: 'Registration not found' });
  }
  res.json(registration);
});

app.post('/api/registrations/:id/approve', authenticateToken, (req, res) => {
  const { approvedBy, approvalNotes } = req.body;
  const registration = registrations.find(r => r.id === parseInt(req.params.id));
  
  if (!registration) {
    return res.status(404).json({ message: 'Registration not found' });
  }
  
  registration.status = 'APPROVED';
  registration.reviewedBy = approvedBy;
  registration.reviewedDate = new Date();
  registration.approvalDate = new Date();
  
  res.json({ message: 'Registration approved successfully' });
});

app.post('/api/registrations/:id/reject', authenticateToken, (req, res) => {
  const { rejectedBy, rejectionReason } = req.body;
  const registration = registrations.find(r => r.id === parseInt(req.params.id));
  
  if (!registration) {
    return res.status(404).json({ message: 'Registration not found' });
  }
  
  registration.status = 'REJECTED';
  registration.reviewedBy = rejectedBy;
  registration.reviewedDate = new Date();
  registration.rejectionReason = rejectionReason;
  
  res.json({ message: 'Registration rejected successfully' });
});

app.get('/api/registrations/stats', authenticateToken, (req, res) => {
  const totalRegistrations = registrations.length;
  const pendingRegistrations = registrations.filter(r => r.status === 'PENDING').length;
  const approvedRegistrations = registrations.filter(r => r.status === 'APPROVED').length;
  const rejectedRegistrations = registrations.filter(r => r.status === 'REJECTED').length;

  res.json({
    totalRegistrations,
    pendingRegistrations,
    approvedRegistrations,
    rejectedRegistrations
  });
});

// KYC routes
app.post('/api/kyc/:farmerId/upload', authenticateToken, upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'landDocuments', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
  { name: 'incomeCertificate', maxCount: 1 },
  { name: 'casteCertificate', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 10 }
]), (req, res) => {
  try {
    const uploadedDocuments = {};
    
    Object.keys(req.files).forEach(key => {
      if (req.files[key] && req.files[key][0]) {
        uploadedDocuments[key] = `/uploads/${req.files[key][0].filename}`;
      }
    });
    
    res.json({
      message: 'Documents uploaded successfully',
      uploadedDocuments
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

app.post('/api/kyc/:farmerId/approve', authenticateToken, (req, res) => {
  const { approvedBy, approvalNotes } = req.body;
  const farmer = farmers.find(f => f.id === parseInt(req.params.farmerId));
  
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmer.kycStatus = 'APPROVED';
  
  res.json({ message: 'KYC approved successfully' });
});

app.post('/api/kyc/:farmerId/reject', authenticateToken, (req, res) => {
  const { rejectedBy, rejectionReason } = req.body;
  const farmer = farmers.find(f => f.id === parseInt(req.params.farmerId));
  
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmer.kycStatus = 'REJECTED';
  
  res.json({ message: 'KYC rejected successfully' });
});

app.post('/api/kyc/:farmerId/refer-back', authenticateToken, (req, res) => {
  const { referredBy, referBackReason } = req.body;
  const farmer = farmers.find(f => f.id === parseInt(req.params.farmerId));
  
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  farmer.kycStatus = 'REFER_BACK';
  
  res.json({ message: 'KYC referred back successfully' });
});

app.get('/api/kyc/:farmerId/status', authenticateToken, (req, res) => {
  const farmer = farmers.find(f => f.id === parseInt(req.params.farmerId));
  
  if (!farmer) {
    return res.status(404).json({ message: 'Farmer not found' });
  }
  
  res.json({
    kycStatus: farmer.kycStatus,
    lastUpdated: new Date(),
    updatedBy: req.user.userName
  });
});

app.get('/api/kyc/:farmerId/documents', authenticateToken, (req, res) => {
  // In production, fetch actual documents from database
  res.json({
    documents: {
      aadhaar: '/uploads/sample-aadhaar.pdf',
      pan: '/uploads/sample-pan.pdf',
      landDocuments: '/uploads/sample-land.pdf',
      bankPassbook: '/uploads/sample-bank.pdf',
      incomeCertificate: '/uploads/sample-income.pdf',
      casteCertificate: '/uploads/sample-caste.pdf',
      otherDocuments: []
    },
    uploadDate: new Date(),
    uploadedBy: req.user.userName
  });
});

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalFarmers = farmers.length;
  const totalEmployees = employees.length;
  const totalRegistrations = registrations.length;
  const pendingKyc = farmers.filter(f => f.kycStatus === 'PENDING').length;
  const overdueKyc = farmers.filter(f => {
    if (f.assignedDate) {
      const assignedDate = new Date(f.assignedDate);
      const daysDiff = (new Date() - assignedDate) / (1000 * 60 * 60 * 24);
      return daysDiff > 7 && f.kycStatus === 'PENDING';
    }
    return false;
  }).length;

  res.json({
    totalFarmers,
    totalEmployees,
    totalRegistrations,
    pendingKyc,
    overdueKyc
  });
});

app.get('/api/dashboard/admin', authenticateToken, (req, res) => {
  res.json({
    farmers,
    employees,
    registrations,
    stats: {
      totalFarmers: farmers.length,
      totalEmployees: employees.length,
      totalRegistrations: registrations.length,
      pendingKyc: farmers.filter(f => f.kycStatus === 'PENDING').length
    }
  });
});

app.get('/api/dashboard/super-admin', authenticateToken, (req, res) => {
  res.json({
    farmers,
    employees,
    registrations,
    stats: {
      totalFarmers: farmers.length,
      totalEmployees: employees.length,
      totalRegistrations: registrations.length,
      pendingKyc: farmers.filter(f => f.kycStatus === 'PENDING').length
    }
  });
});

app.get('/api/dashboard/employee/:employeeId', authenticateToken, (req, res) => {
  const assignedFarmers = farmers.filter(f => f.assignedEmployee === req.params.employeeId);
  
  res.json({
    assignedFarmers,
    kycStats: {
      total: assignedFarmers.length,
      approved: assignedFarmers.filter(f => f.kycStatus === 'APPROVED').length,
      pending: assignedFarmers.filter(f => f.kycStatus === 'PENDING').length,
      referBack: assignedFarmers.filter(f => f.kycStatus === 'REFER_BACK').length,
      rejected: assignedFarmers.filter(f => f.kycStatus === 'REJECTED').length
    },
    todoList: assignedFarmers.filter(f => f.kycStatus === 'PENDING')
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
}); 