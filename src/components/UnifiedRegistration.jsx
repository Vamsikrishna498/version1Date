import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI } from '../api/apiService';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Registration.css';
import logo from '../assets/rightlogo.png';

// Update Yup schema for password validation
const schema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .matches(/^[A-Za-z]+( [A-Za-z]+)*$/, 'Name must contain only alphabets and spaces'),
  dateOfBirth: yup
    .string()
    .required('Date of Birth is required')
    .test('age-range', 'Age must be between 18 and 90 years', function (value) {
      if (!value) return false;
      const dob = new Date(value);
      const today = new Date();
      const ageDifMs = today - dob;
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      // Age must be between 18 and 90 years
      return age >= 18 && age <= 90;
    }),
  gender: yup.string().required('Gender is required'),
  email: yup.string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must include @ and be valid'),
  phoneNumber: yup
    .string()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit phone number')
    .required('Phone number is required'),
  role: yup.string().required('Role is required'),
  password: yup
    .string()
    .required('Password is required')
    .test(
      'strong-password',
      'Password must be 8+ chars with uppercase, lowercase, number and special character',
      (value) => {
        if (!value) return false;
        const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        return strong.test(value);
      }
    ),
});

const UnifiedRegistration = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
    trigger,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: '' },
    mode: 'onBlur', // Change to onBlur to prevent premature validation
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [formError, setFormError] = useState('');
  const [emailAvailabilityError, setEmailAvailabilityError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Watch the role field to handle validation better
  const selectedRole = watch('role');

  useEffect(() => {
    if (!resendTimer) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Clear role error when a role is selected
  useEffect(() => {
    if (selectedRole && errors.role) {
      clearErrors('role');
    }
  }, [selectedRole, errors.role, clearErrors]);

  // Email availability check function
  const checkEmailAvailability = async (email) => {
    console.log('Checking email availability for:', email);
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.log('Email format invalid or empty');
      setEmailAvailabilityError('');
      return;
    }

    setIsCheckingEmail(true);
    setEmailAvailabilityError('');

    try {
      console.log('Calling checkEmailAvailability API...');
      const result = await authAPI.checkEmailAvailability(email);
      console.log('Email availability result:', result);
      
      if (!result.available) {
        console.log('Email is not available, setting error');
        setEmailAvailabilityError(result.message || 'Email is already registered');
        setError('email', { type: 'manual', message: result.message || 'Email is already registered' });
      } else {
        console.log('Email is available, clearing errors');
        setEmailAvailabilityError('');
        clearErrors('email');
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      // Show error for debugging
      setEmailAvailabilityError(`Error checking email availability: ${error.message}`);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSendOTP = async () => {
    const currentEmail = document.querySelector('input[name="email"]').value;
    
    if (!currentEmail || !currentEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Enter a valid email first');
      return;
    }

    if (emailAvailabilityError) {
      alert('Please use a different email address. This email is already registered.');
      return;
    }
    
    // First check if backend is accessible
    try {
      console.log('Checking backend connectivity...');
      await fetch('http://localhost:8080/api/auth/test', { 
        method: 'GET',
        timeout: 5000 
      });
      console.log('Backend is accessible');
    } catch (connectivityError) {
      console.error('Backend connectivity error:', connectivityError);
      alert('Cannot connect to the server. Please check if the backend is running and try again.');
      return;
    }
    
    try {
      console.log('Sending OTP to:', currentEmail);
      const response = await authAPI.sendOTP(currentEmail);
      console.log('OTP send response:', response);
      setOtpSent(true);
      setResendTimer(30);
      alert('OTP sent successfully! Please check your email.');
    } catch (e) {
      console.error('OTP send error:', e);
      console.error('OTP send error response:', e.response);
      console.error('OTP send error data:', e.response?.data);
      
      // Check if OTP was actually sent despite the error
      if (e.response?.status === 200 || e.response?.data?.message?.includes('sent')) {
        // OTP was sent successfully, just show success
        setOtpSent(true);
        setResendTimer(30);
        alert('OTP sent successfully! Please check your email.');
      } else {
        // Real error occurred
        const errorMessage = e.response?.data?.message || e.message || 'Failed to send OTP';
        alert(`OTP Error: ${errorMessage}`);
      }
    }
  };
   
  // ✅ Handle Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    const currentEmail = document.querySelector('input[name="email"]').value;
    
    try {
      console.log('Verifying OTP for:', currentEmail);
      console.log('OTP entered:', otp);
      const response = await authAPI.verifyOTP({
        email: currentEmail,
        otp: otp,
      });
      console.log('OTP verification response:', response);
      alert("Email verified successfully!");
      setEmailVerified(true);
    } catch (error) {
      console.error('OTP verification error:', error);
      console.error('OTP verification error response:', error.response);
      console.error('OTP verification error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
      alert(`OTP Verification Error: ${errorMessage}`);
    }
  };

  // ✅ Final Registration Submission to backend
  const onSubmit = async (data) => {
    if (!emailVerified) {
      alert('Please verify your email before submitting.');
      return;
    }

    if (emailAvailabilityError) {
      alert('Please use a different email address. This email is already registered.');
      return;
    }

    try {
      console.log('Submitting registration data:', data);
      
      // Use the appropriate registration endpoint based on role
      let response;
      if (data.role === 'ADMIN') {
        // For admin registration, use the standard register endpoint
        response = await authAPI.register(data);
      } else {
        // For employee and farmer, use register-with-role endpoint
        response = await authAPI.registerWithRole(data);
      }
      
      console.log('Registration successful:', response);
      
      // Show success message with approval notice
      alert(`Registration successful! Please wait for admin approval. You will receive an email with login credentials once approved.`);
      
      // Reset form
      reset();
      setEmailVerified(false);
      setOtpSent(false);
      setOtp('');
      setFormError('');
      setEmailAvailabilityError('');
      
      // Navigate back to login page
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      // Try to map server errors to specific fields
      const lower = (message || '').toLowerCase();
      let handled = false;
      if (lower.includes('email')) {
        setError('email', { type: 'server', message });
        handled = true;
      }
      if (lower.includes('phone') || lower.includes('mobile')) {
        setError('phoneNumber', { type: 'server', message });
        handled = true;
      }
      if (!handled) setFormError(message);
    }
  };


  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Register to get started</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">✅</span><div><div className="agri-point">Simple onboarding</div><div className="agri-sub">Verify email with OTP in seconds</div></div></li>
            <li><span className="agri-emoji">🛡️</span><div><div className="agri-point">Secure data</div><div className="agri-sub">Encrypted storage & verification</div></div></li>
            <li><span className="agri-emoji">👥</span><div><div className="agri-point">Choose your role</div><div className="agri-sub">Admin, Employee, or Farmer</div></div></li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>

          <div className="auth-field" style={{ marginTop: 6 }}>
            <h2 style={{ margin: 0 }}>User Registration</h2>
            <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Select your role and enter your details</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            {formError && (
              <div className="error" style={{ marginBottom: 12 }}>{formError}</div>
            )}

            {/* Role Selection */}
            <div className="auth-field">
              <label>Select Your Role <span className="required">*</span></label>
              <select 
                {...register('role', {
                  onChange: (e) => {
                    // Clear any existing role errors when a role is selected
                    if (e.target.value) {
                      clearErrors('role');
                    }
                  }
                })}
                className={errors.role ? 'error' : ''}
                onBlur={() => trigger('role')}
              >
                <option value="">Choose your role</option>
                <option value="ADMIN">Admin</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="FARMER">Farmer</option>
              </select>
              <div className="field-feedback">{errors.role && <div className="error">{errors.role.message}</div>}</div>
            </div>

            <div className="form-grid-2">
              <div className="auth-field">
                <label>Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  {...register('name')} 
                  className={errors.name ? 'error' : ''} 
                  placeholder="Enter your full name"
                  inputMode="text"
                  autoComplete="name"
                  onBlur={() => trigger('name')}
                />
                <div className="field-feedback">{errors.name && <div className="error">{errors.name.message}</div>}</div>
              </div>

              <div className="auth-field">
                <label>Gender <span className="required">*</span></label>
                <select 
                  {...register('gender')} 
                  className={errors.gender ? 'error' : ''}
                  onBlur={() => trigger('gender')}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="field-feedback">{errors.gender && <div className="error">{errors.gender.message}</div>}</div>
              </div>

              <div className="auth-field grid-span-2">
                <label>Date of Birth <span className="required">*</span></label>
                <input 
                  type="date" 
                  {...register('dateOfBirth')} 
                  className={errors.dateOfBirth ? 'error' : ''}
                  onBlur={() => trigger('dateOfBirth')}
                />
                <div className="field-feedback">{errors.dateOfBirth && <div className="error">{errors.dateOfBirth.message}</div>}</div>
              </div>

              <div className="auth-field">
                <label>Phone Number <span className="required">*</span></label>
                <input 
                  type="text" 
                  {...register('phoneNumber')} 
                  className={errors.phoneNumber ? 'error' : ''} 
                  placeholder="Enter 10-digit number"
                  onBlur={() => trigger('phoneNumber')}
                />
                <div className="field-feedback">{errors.phoneNumber && <div className="error">{errors.phoneNumber.message}</div>}</div>
              </div>

              <div className="auth-field">
                <label>Email Address <span className="required">*</span></label>
                <input 
                  type="email" 
                  {...register('email', {
                    onChange: (e) => { 
                      setOtpSent(false); 
                      setEmailVerified(false);
                      setEmailAvailabilityError('');
                    }
                  })} 
                  className={errors.email || emailAvailabilityError ? 'error' : ''} 
                  placeholder="Enter your email"
                  onBlur={(e) => {
                    trigger('email');
                    checkEmailAvailability(e.target.value);
                  }}
                />
                {isCheckingEmail && <div className="checking-inline">Checking email availability...</div>}
                <div className="field-feedback">{(errors.email || emailAvailabilityError) && (
                  <div className="error">{errors.email?.message || emailAvailabilityError}</div>
                )}</div>
              </div>

              <div className="auth-field grid-span-2">
                <label>Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    {...register('password')} 
                    className={errors.password ? 'error' : ''} 
                    placeholder="Enter a strong password" 
                    autoComplete="new-password"
                    onBlur={() => trigger('password')}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#475569',
                      padding: 2,
                      lineHeight: 0
                    }}
                  >
                    {showPassword ? (
                      // Eye-slash SVG
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 3l18 18" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M10.58 10.58A3 3 0 0012 15a3 3 0 001.42-.38M9.88 4.24A10.53 10.53 0 0012 4c5 0 9.27 3.11 10.5 7.5-.43 1.53-1.26 2.9-2.38 4.03M6.11 6.11C4.3 7.33 2.93 9.17 2 11.5c.74 2.11 2.18 3.93 4.01 5.17A11.33 11.33 0 0012 20c1.26 0 2.47-.2 3.59-.58" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      // Eye SVG
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M1 12C2.73 7.61 7.06 4 12 4s9.27 3.61 11 8c-1.73 4.39-6.06 8-11 8S2.73 16.39 1 12z" stroke="#475569" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="#475569" strokeWidth="2" fill="none"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="field-feedback">{errors.password && <div className="error">{errors.password.message}</div>}</div>
              </div>
            </div>

            {/* Email Verification */}
            {!otpSent && !emailVerified && (
              <div className="auth-actions"><button type="button" onClick={handleSendOTP} className="auth-submit">Send OTP</button></div>
            )}
            {(otpSent && !emailVerified) && (
              <div className="auth-field">
                <label>Enter OTP</label>
                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <div className="auth-actions" style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={handleSendOTP} className="auth-secondary" disabled={resendTimer > 0}>
                    {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                  </button>
                  <button type="button" onClick={handleVerifyOTP} className="auth-submit">Verify</button>
                </div>
              </div>
            )}
            {emailVerified && (
              <div className="auth-field" style={{ color: '#166f3e', fontWeight: 700 }}>✓ Email Verified</div>
            )}

            <div className="auth-actions">
              <button type="submit" className="auth-submit">Register Now</button>
            </div>
            <div className="auth-field" style={{ textAlign: 'center' }}>
              <h4>Already have an account? <Link to="/login">Sign In</Link></h4>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRegistration;
