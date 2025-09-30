import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AddressForm from './AddressForm';
import { validateAge, validateAgeSync } from '../utils/ageValidation';
import { configAPI } from '../api/apiService';
import { useConfiguration } from '../contexts/ConfigurationContext';
import '../styles/EmployeeRegistration.css';

const EmployeeRegistrationForm = ({ isInDashboard = false, editData = null, onClose, onSubmit: onSubmitProp }) => {
  const navigate = useNavigate();
  const { ageSettings, getEducationTypesForUser, validateAge: validateAgeFromContext } = useConfiguration();
  const [currentStep, setCurrentStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [ageValidationError, setAgeValidationError] = useState('');
  const [emailAvailabilityError, setEmailAvailabilityError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);


  const totalSteps = 8;

  // Configuration data is now loaded automatically by ConfigurationContext

  // Age validation function
  const handleAgeValidation = async (dateOfBirth) => {
    if (!dateOfBirth) {
      setAgeValidationError('');
      return;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const validation = validateAgeSync(age, 'EMPLOYEE', ageSettings);
    setAgeValidationError(validation.isValid ? '' : validation.message);
  };

  // Email availability check function
  const checkEmailAvailability = async (email) => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailAvailabilityError('');
      return;
    }

    setIsCheckingEmail(true);
    setEmailAvailabilityError('');

    try {
      const result = await configAPI.checkEmailAvailability(email);
      if (!result.available) {
        setEmailAvailabilityError(result.message || 'Email is already registered');
      } else {
        setEmailAvailabilityError('');
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      // Don't show error for network issues, just log it
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const methods = useForm({
    defaultValues: {
      // Step 0 - Personal Details
      salutation: editData?.salutation || '',
      firstName: editData?.firstName || '',
      middleName: editData?.middleName || '',
      lastName: editData?.lastName || '',
      gender: editData?.gender || '',
      nationality: editData?.nationality || '',
      dob: editData?.dob || '',
      photo: editData?.photo || null,

      // Step 1 - Contact Details
      contactNumber: editData?.contactNumber || '',
      email: editData?.email || '',

      // Step 2 - Relation Details
      relationType: editData?.relationType || '',
      relationName: editData?.relationName || '',
      altNumber: editData?.altNumber || '',
      altNumberType: editData?.altNumberType || '',

      // Step 3 - Address Details
      country: editData?.country || '',
      state: editData?.state || '',
      district: editData?.district || '',
      block: editData?.block || '',
      village: editData?.village || '',
      zipcode: editData?.zipcode || '',

      // Step 4 - Professional Details
      professional: {
        education: editData?.professional?.education || '',
        experience: editData?.professional?.experience || ''
      },

      // Step 5 - Bank Details
      bank: {
        bankName: editData?.bank?.bankName || '',
        accountNumber: editData?.bank?.accountNumber || '',
        branchName: editData?.bank?.branchName || '',
        ifscCode: editData?.bank?.ifscCode || '',
        passbook: editData?.bank?.passbook || null
      },

      // Step 6 - Documents
      documentType: editData?.documentType || '',
      voterId: editData?.voterId || '',
      voterFile: editData?.voterFile || null,
      aadharNumber: editData?.aadharNumber || '',
      aadharFile: editData?.aadharFile || null,
      panNumber: editData?.panNumber || '',
      panFile: editData?.panFile || null,
      ppbNumber: editData?.ppbNumber || '',
      ppbFile: editData?.ppbFile || null,

      // Step 7 - Role & Access
      role: editData?.role || '',
      accessStatus: editData?.accessStatus || ''
    }
  });

  const { register, handleSubmit, watch, setValue, trigger, clearErrors, formState: { errors } } = methods;

  // Validators: names alphabet-only, DOB age >=18 and <19
  const alphaOnly = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  const validateAlpha = (v) => !v || alphaOnly.test(v) || 'Only alphabets and spaces allowed';
  const validateDob = (v) => {
    if (!v) return 'Date of Birth is required';
    
    const today = new Date();
    const birthDate = new Date(v);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const validation = validateAgeSync(age, 'EMPLOYEE', ageSettings);
    return validation.isValid || validation.message;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setValue("photo", file, { shouldValidate: true });
      clearErrors("photo");
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('Employee form submitted with data:', data);
      
      // Call the onSubmit prop if provided (for dashboard mode)
      if (onSubmitProp) {
        await onSubmitProp(data);
      } else {
        // Default behavior for standalone mode
        if (isInDashboard) {
          onClose && onClose();
        } else {
          navigate('/admin/dashboard');
        }
        alert('Employee registration completed successfully!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  return (
    <div className={isInDashboard ? "employee-wrapper dashboard-mode" : "employee-wrapper"}>
      <div className="form-full">
        {/* Form Header with Close Button */}
        <div className="form-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          padding: '0 20px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a202c' }}>
              {editData ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
              {editData ? 'Update employee information' : 'Register a new employee in the system'}
            </p>
          </div>
          {isInDashboard && onClose && (
            <button 
              className="close-btn"
              onClick={onClose}
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
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
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
              title="Close Form"
            >
              <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
            </button>
          )}
        </div>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="employee-form">
            {currentStep === 0 && (
              <div className="employeeform-grid">
                {/* 1. Photo */}
                <div className="frame-photo">
                  <label className="label">
                    Photo <span className="optional">(Optional)</span>
                  </label>
                  <div className="photo-box">
                    {photoPreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={photoPreview} alt="" className="photo-preview" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setValue("photo", null);
                          }}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 18,
                            lineHeight: '28px',
                            textAlign: 'center',
                            zIndex: 2
                          }}
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : editData && editData.photoFileName ? (
                      <img
                        src={`http://localhost:8080/uploads/${editData.photoFileName}`}
                        className="photo-preview"
                        alt=""
                        onError={e => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
                        }}
                      />
                    ) : (
                      <span className="photo-placeholder">No photo selected</span>
                    )}
                  </div>
                  {/* Show file name if selected or from backend */}
                  <div style={{ marginTop: "6px", fontSize: "0.95em", color: "#444" }}>
                    {photoPreview && watch('photo') && watch('photo')[0] && watch('photo')[0].name
                      ? `Selected: ${watch('photo')[0].name}`
                      : editData && editData.photoFileName
                        ? `Current: ${editData.photoFileName}`
                        : null}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      {...register("photo")}
                      onChange={handlePhotoChange}
                    />
                    {errors.photo && <p className="error">{errors.photo.message}</p>}
                  </div>
                </div>

                {/* Left Column - Name Fields */}
                <div className="form-column-left">
                  {/* 1. Salutation */}
                  <div>
                    <label className="label">
                      Salutation<span className="required">*</span>
                    </label>
                    <select
                      className="input"
                      {...register("salutation", { required: "Salutation is required" })}
                    >
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Miss.">Miss.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                    {errors.salutation && <p className="error">{errors.salutation.message}</p>}
                  </div>

                  {/* 2. First Name */}
                  <div>
                    <label className="label">
                      First Name<span className="required">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="First Name"
                      {...register("firstName", { required: "First Name is required", validate: validateAlpha })}
                    />
                    {errors.firstName && <p className="error">{errors.firstName.message}</p>}
                  </div>

                  {/* 3. Middle Name */}
                  <div>
                    <label className="label">
                      Middle Name<span className="required">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Middle Name"
                      {...register("middleName", { required: "Middle Name is required", validate: validateAlpha })}
                    />
                    {errors.middleName && <p className="error">{errors.middleName.message}</p>}
                  </div>

                  {/* 4. Last Name */}
                  <div>
                    <label className="label">
                      Last Name<span className="required">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Last Name"
                      {...register("lastName", { required: "Last Name is required", validate: validateAlpha })}
                    />
                    {errors.lastName && <p className="error">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* Right Column - Other Fields */}
                <div className="form-column-right">
                  {/* 5. Gender */}
                  <div>
                    <label className="label">
                      Gender<span className="required">*</span>
                    </label>
                    <select
                      className="input"
                      {...register("gender", { required: "Gender is required" })}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                    </select>
                    {errors.gender && <p className="error">{errors.gender.message}</p>}
                  </div>

                  {/* 6. DOB */}
                  <div>
                    <label className="label">
                      DOB<span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="input"
                      {...register("dob", { 
                        validate: validateDob,
                        onChange: (e) => handleAgeValidation(e.target.value)
                      })}
                    />
                    {errors.dob && <p className="error">{errors.dob.message}</p>}
                    {ageValidationError && <p className="error">{ageValidationError}</p>}
                  </div>

                  {/* 7. Nationality */}
                  <div>
                    <label className="label">
                      Nationality<span className="required">*</span>
                    </label>
                    <select
                      className="input"
                      {...register("nationality", { required: "Nationality is required" })}
                    >
                      <option value="">Select</option>
                      <option value="Indian">Indian</option>
                    </select>
                    {errors.nationality && <p className="error">{errors.nationality.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="emp-form-one">
                <div>
                  <label className="label">Contact Number
                    <span className="required">*</span></label>
                  <input
                    type="text"
                    className="input"
                    {...register("contactNumber", {
                      required: "Contact Number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter a valid 10-digit number",
                      },
                    })}
                    placeholder=""
                  />
                  <p className="error">{errors.contactNumber?.message}</p>
                </div>

                <div>
                  <label className="label"> Email
                    <span className="required">*</span></label>
                  <input
                    type="email"
                    className="input"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder=""
                  />
                  <p className="error">{errors.email?.message}</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="emp-form-two">
                {/* Relation */}
                <div>
                  <label className="label" htmlFor="relationType">
                    Select <span className="required">*</span>
                  </label>
                  <select
                    id="relationType"
                    className="input"
                    {...register("relationType", { required: "Please select a relation" })}
                  >
                    <option value="">-- Select --</option>
                    <option value="do">D/O</option>
                    <option value="so">S/O</option>
                    <option value="wo">W/O</option>
                  </select>
                  {errors.relationType && <p className="error">{errors.relationType.message}</p>}
                </div>

                {/* Relation Name */}
                <div>
                  <label className="label">Relation Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Krishna Kumar"
                    className="input"
                    {...register("relationName", { required: "Relation Name is required" })}
                  />
                  {errors.relationName && <p className="error">{errors.relationName.message}</p>}
                </div>

                {/* Alternative Number */}
                <div>
                  <label className="label">Alternative Number</label>
                  <input
                    type="text"
                    placeholder="91-987xxxxxx16"
                    className="input"
                    {...register("altNumber", {
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Must be 10 digits",
                      },
                    })}
                  />
                  {errors.altNumber && <p className="error">{errors.altNumber.message}</p>}
                </div>

                {/* Alternative Type */}
                <div>
                  <label className="label" htmlFor="altNumberType">
                    Alternative Type <span className="required">*</span>
                  </label>
                  <select
                    id="altNumberType"
                    className="input"
                    {...register("altNumberType", { required: "Please select an alternative type" })}
                  >
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.altNumberType && <p className="error">{errors.altNumberType.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="emp-form-three">
                <AddressForm
                  formData={{
                    country: watch('country') || '',
                    state: watch('state') || '',
                    district: watch('district') || '',
                    block: watch('block') || '',
                    village: watch('village') || '',
                    zipcode: watch('zipcode') || ''
                  }}
                  onFormDataChange={(data) => {
                    setValue('country', data.country);
                    setValue('state', data.state);
                    setValue('district', data.district);
                    setValue('block', data.block);
                    setValue('village', data.village);
                    setValue('zipcode', data.zipcode);
                    // Clear any existing errors
                    clearErrors(['country', 'state', 'district', 'block', 'village', 'zipcode']);
                  }}
                  showTitle={false}
                  errors={{
                    country: errors.country,
                    state: errors.state,
                    district: errors.district,
                    block: errors.block,
                    village: errors.village,
                    zipcode: errors.zipcode
                  }}
                />
                
                {/* Hidden inputs for form validation */}
                <input type="hidden" {...register("country", { required: "Country is required" })} />
                <input type="hidden" {...register("state", { required: "State is required" })} />
                <input type="hidden" {...register("district", { required: "District is required" })} />
                <input type="hidden" {...register("block", { required: "Block is required" })} />
                <input type="hidden" {...register("village", { required: "Village is required" })} />
                <input type="hidden" {...register("zipcode", { required: "Zipcode is required" })} />
                
                {/* Field-level errors are shown inline by AddressForm */}
              </div>
            )}

            {currentStep === 4 && (
              <div className="emp-form-four">
                {/* Education Field */}
                <div>
                  <label className="label">Education <span className="required">*</span></label>
                  <select className="input" {...register("professional.education")}>
                    <option value="">Select</option>
                    {getEducationTypesForUser('employee').map((edu) => (
                      <option key={edu} value={edu}>
                        {edu}
                      </option>
                    ))}
                  </select>
                                     {!isInDashboard && errors.professional?.education && (
                     <p className="error">{errors.education?.message}</p>
                   )}
                </div>

                {/* Experience Field */}
                <div>
                  <label className="label">Experience <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="15 Years"
                    className="input"
                    {...register("professional.experience")}
                  />
                                     {!isInDashboard && errors.professional?.experience && (
                     <p className="error">{errors.experience?.message}</p>
                   )}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="emp-form-five">
                {/* Bank Name */}
                <div>
                  <label className="label">Bank Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    className="input"
                    {...register("bank.bankName")}
                  />
                                     {!isInDashboard && errors.bank?.bankName && <p className="error">{errors.bankName?.message}</p>}
                </div>

                {/* Account Number */}
                <div>
                  <label className="label">Account Number <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="281398301653"
                    className="input"
                    {...register("bank.accountNumber")}
                  />
                                     {!isInDashboard && errors.bank?.accountNumber && <p className="error">{errors.accountNumber?.message}</p>}
                </div>

                {/* Branch Name */}
                <div>
                  <label className="label">Branch name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Madhapur"
                    className="input"
                    {...register("bank.branchName")}
                  />
                                     {!isInDashboard && errors.bank?.branchName && <p className="error">{errors.branchName?.message}</p>}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="label">IFSC Code <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="HDFC0001234"
                    className="input"
                    {...register("bank.ifscCode")}
                  />
                                     {!isInDashboard && errors.bank?.ifscCode && <p className="error">{errors.ifscCode?.message}</p>}
                </div>

                {/* Passbook */}
                <div>
                  <label className="label">Passbook <span className="required">*</span></label>
                  <input
                    type="file"
                    className="input"
                    {...register("bank.passbook")}
                  />
                                     {!isInDashboard && errors.bank?.passbook && <p className="error">{errors.passbook?.message}</p>}
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="emp-form-six">
                <label className="label">
                  Add Document <span className="optional"></span>
                </label>

                <select
                  className="docinput"
                  {...register("documentType", { required: "Document Type is required" })}
                  onChange={(e) => {
                    setSelectedDoc(e.target.value);
                    setValue("documentType", e.target.value);
                  }}
                >
                  <option value="">Select</option>
                  <option value="voterId">ID/ Voter Card</option>
                  <option value="aadharNumber">Aadhar Number</option>
                  <option value="panNumber">Pan Number</option>
                  <option value="ppbNumber">PPB Number</option>
                </select>
                                 {!isInDashboard && <p className="error-text">{errors.documentType?.message}</p>}

                {/* Voter ID */}
                {selectedDoc === "voterId" && (
                  <>
                    <input
                      type="text"
                      placeholder="Voter ID"
                      className="input"
                      {...register("voterId", { required: "Voter ID is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.voterId?.message}</p>}

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      {...register("voterFile", { required: "Voter ID File is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.voterFile?.message}</p>}
                  </>
                )}

                {/* Aadhar */}
                {selectedDoc === "aadharNumber" && (
                  <>
                    <input
                      type="text"
                      placeholder="Aadhar Number"
                      className="input"
                      {...register("aadharNumber", { required: "Aadhar Number is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.aadharNumber?.message}</p>}

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      {...register("aadharFile", { required: "Aadhar File is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.aadharFile?.message}</p>}
                  </>
                )}

                {/* PAN */}
                {selectedDoc === "panNumber" && (
                  <>
                    <input
                      type="text"
                      placeholder="PAN Number"
                      className="input"
                      {...register("panNumber", { required: "PAN Number is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.panNumber?.message}</p>}

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      {...register("panFile", { required: "PAN File is required" })}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.panFile?.message}</p>}
                  </>
                )}

                {/* PPB (Optional) */}
                {selectedDoc === "ppbNumber" && (
                  <>
                    <input
                      type="text"
                      placeholder="PPB Number"
                      className="input"
                      {...register("ppbNumber")}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.ppbNumber?.message}</p>}

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      {...register("ppbFile")}
                    />
                                         {!isInDashboard && <p className="error-text">{errors.ppbFile?.message}</p>}
                  </>
                )}
              </div>
            )}

            {currentStep === 7 && (
              <div className="emp-form-seven">
                <div>
                  <label className="label">
                    Role/Designation <span className="required">*</span>
                  </label>
                  <select className="input" {...register("role", { required: "Role is required" })}>
                    <option value="">Select</option>
                    <option value="employee">Employee</option>
                  </select>
                                     {!isInDashboard && errors.role && (
                     <p className="error">{errors.role.message}</p>
                   )}
                </div>

                <div>
                  <label className="label">
                    Access <span className="required">*</span>
                  </label>
                  <select className="input" {...register("accessStatus", { required: "Access is required" })}>
                    <option value="">Select</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                                     {!isInDashboard && errors.accessStatus && (
                     <p className="error">{errors.accessStatus.message}</p>
                   )}
                </div>
              </div>
            )}

            <div className="employee-btn">
              {currentStep === 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    const isValid = await trigger();
                    if (isValid) setCurrentStep(currentStep + 1);
                  }}
                >
                  Next
                </button>
              ) : currentStep === totalSteps - 1 ? (
                <>
                  <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
                    Previous
                  </button>
                  <button type="submit">Submit</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const isValid = await trigger();
                      if (isValid) setCurrentStep(currentStep + 1);
                    }}
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
      {!isInDashboard && (
        <div className="form-right" style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              if (isInDashboard) {
                // If in admin dashboard, don't navigate away
              } else {
                navigate('/dashboard');
              }
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '32px',
              textAlign: 'center',
              zIndex: 2
            }}
            aria-label="Close and go back"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeRegistrationForm; 