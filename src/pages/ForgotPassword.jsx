import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { authAPI } from "../api/apiService";
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/rightlogo.png";
import "../styles/Login.css";
 
// ✅ Schema validation (email only)
const schema = Yup.object().shape({
  userInput: Yup.string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid Email (with '@' and '.')"),
});
 
const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
 
  const [showPopup, setShowPopup] = useState(false);
  const [target, setTarget] = useState("");
 
   const navigate = useNavigate();
  const onSubmit = async (data) => {
    try {
      const value = (data.userInput || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setError('userInput', { type: 'manual', message: "Enter a valid Email (with '@' and '.')" });
        return;
      }
      // If it's an email, first verify it exists in the system
      if (emailRegex.test(value)) {
        try {
          const availability = await authAPI.checkEmailAvailability(value);
          // API returns available=false when email is registered
          if (availability?.available !== false) {
            setError('userInput', { type: 'server', message: 'Email not found' });
            return;
          }
        } catch (_) {
          // If the availability check fails, continue to backend which should validate again
        }
      }

      await authAPI.forgotPassword(value);
 
      setTarget(value);
      setShowPopup(true); // Show popup on success
    } catch (error) {
      console.error("Error sending reset request:", error);
      const status = error?.response?.status;
      const body = JSON.stringify(error?.response?.data || '').toLowerCase();
      const msg = (error?.response?.data && (error.response.data.message || error.response.data.error)) || '';
      const looksNotFound = status === 404 || body.includes('not found') || body.includes('user not found') || body.includes('email not found');
      if (looksNotFound) {
        setError('userInput', { type: 'server', message: 'Email not found' });
      } else {
        alert(msg || "Failed to send reset link. Please try again.");
      }
    }
  };
 
     const handlePopupClose = () => {
  setShowPopup(false);
  try {
    // Persist OTP flow details so refresh/direct navigation still works
    sessionStorage.setItem('otpFlow', JSON.stringify({ target, type: 'password', otpVerified: false }));
  } catch (_) {}
  navigate('/otp-verification', { state: { target, type: 'password' } });
};
 
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Reset access securely</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">🔐</span><div><div className="agri-point">Encrypted reset links</div><div className="agri-sub">Your account security is our priority</div></div></li>
            <li><span className="agri-emoji">📨</span><div><div className="agri-point">Email delivery tracking</div><div className="agri-sub">We confirm when your link is sent</div></div></li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="auth-field">
              <label>Email<span className="required">*</span></label>
              <input {...register('userInput')} placeholder="Enter your Email" className={errors.userInput ? 'error' : ''} />
              {errors.userInput && <div className="error">{errors.userInput.message}</div>}
            </div>
            <div className="auth-actions">
              <button type="submit" className="auth-submit">Reset password</button>
            </div>
          </form>

          <div className="auth-field" style={{ textAlign: 'center', marginTop: 10 }}>
            <h4>Remembered your credentials? <Link to="/login">Back to Login</Link></h4>
          </div>

          {showPopup && (
            <div className="popup">
              <div className="popup-content">
                <h3>Success!</h3>
                <h4>A reset link has been sent to <strong>{target}</strong></h4>
                <button onClick={handlePopupClose}>OK</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default ForgotPassword; 