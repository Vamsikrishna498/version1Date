import React, { useState } from 'react';
import '../styles/PasswordInput.css';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter password", 
  className = "", 
  error = false, 
  disabled = false,
  maxLength = 50,
  id = "",
  required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`password-input-wrapper ${className}`}>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`password-input ${error ? 'error' : ''}`}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        tabIndex={-1}
      >
        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  );
};

export default PasswordInput;
