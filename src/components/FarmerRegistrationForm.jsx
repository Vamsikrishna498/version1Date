import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AddressForm from './AddressForm';
import { validateAge, validateAgeSync } from '../utils/ageValidation';
import { configAPI } from '../api/apiService';
import { useConfiguration } from '../contexts/ConfigurationContext';
import '../styles/FarmerRegistration.css';

const FarmerRegistrationForm = ({ isInDashboard = false, editData = null, onClose, onSubmit: onSubmitProp }) => {
  const navigate = useNavigate();
  const { ageSettings, getEducationTypesForUser, cropNames, cropTypes, validateAge: validateAgeFromContext } = useConfiguration();
  const [currentStep, setCurrentStep] = useState(0);
  const [photoPreviewStep0, setPhotoPreviewStep0] = useState(null);
  const [photoPreviewStep3, setPhotoPreviewStep3] = useState(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('');
  const [cropCategoryStep3, setCropCategoryStep3] = useState('');
  const [cropCategoryStep4, setCropCategoryStep4] = useState('');
  const [selectedIrrigationTab, setSelectedIrrigationTab] = useState('Current');
  const [farmerData] = useState(editData);
  const [photoPreview] = useState(editData?.photo || null);
  const [ageValidationError, setAgeValidationError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  // Initialize photo name if editing
  useEffect(() => {
    if (editData?.photoFileName) {
      setSelectedPhotoName(editData.photoFileName);
    }
  }, [editData]);

  // Configuration data is now loaded automatically by ConfigurationContext
  // Get education types from context
  const educationTypes = getEducationTypesForUser('FARMER');

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

    // Use validation from ConfigurationContext
    const validation = validateAgeFromContext(age, 'FARMER');
    setAgeValidationError(validation.isValid ? '' : validation.message);
  };

  const totalSteps = 8;

  const methods = useForm({
    mode: 'all',
    reValidateMode: 'onChange',
    defaultValues: {
      // Step 0 - Personal Details
      salutation: editData?.salutation || '',
      firstName: editData?.firstName || '',
      middleName: editData?.middleName || '',
      lastName: editData?.lastName || '',
      gender: editData?.gender || '',
      nationality: editData?.nationality || '',
      dateOfBirth: editData?.dateOfBirth || '',
      contactNumber: editData?.contactNumber || '',
      fatherName: editData?.fatherName || '',
      alternativeType: editData?.alternativeType || '',
      alternativeNumber: editData?.alternativeNumber || '',
      email: editData?.email || '',
      photo: editData?.photo || null,

      // Step 1 - Address
      country: editData?.country || '',
      state: editData?.state || '',
      district: editData?.district || '',
      block: editData?.block || '',
      village: editData?.village || '',
      zipcode: editData?.zipcode || editData?.pincode || '',

      // Step 2 - Professional Details
      education: editData?.education || '',
      experience: editData?.experience || '',

      // Step 3 - Current Crop Details
      currentSurveyNumber: editData?.currentSurveyNumber || '',
      currentLandHolding: editData?.currentLandHolding || '',
      currentGeoTag: editData?.currentGeoTag || '',
      currentCrop: editData?.currentCrop || '',
      currentNetIncome: editData?.currentNetIncome || '',
      currentSoilTest: editData?.currentSoilTest || '',
      currentSoilTestCertificateFileName: editData?.currentSoilTestCertificateFileName || null,

      // Step 4 - Proposed Crop Details
      proposedSurveyNumber: editData?.proposedSurveyNumber || '',
      proposedLandHolding: editData?.proposedLandHolding || '',
      proposedGeoTag: editData?.proposedGeoTag || '',
      cropType: editData?.cropType || '',
      netIncome: editData?.netIncome || '',
      proposedSoilTest: editData?.proposedSoilTest || '',
      soilTestCertificate: editData?.soilTestCertificate || null,

      // Step 5 - Irrigation Details
      currentWaterSource: editData?.currentWaterSource || '',
      currentDischargeLPH: editData?.currentDischargeLPH || '',
      currentSummerDischarge: editData?.currentSummerDischarge || '',
      currentBorewellLocation: editData?.currentBorewellLocation || '',
      proposedWaterSource: editData?.proposedWaterSource || '',
      proposedDischargeLPH: editData?.proposedDischargeLPH || '',
      proposedSummerDischarge: editData?.proposedSummerDischarge || '',
      proposedBorewellLocation: editData?.proposedBorewellLocation || '',

      // Step 6 - Bank Details
      bankName: editData?.bankName || '',
      accountNumber: editData?.accountNumber || '',
      branchName: editData?.branchName || '',
      ifscCode: editData?.ifscCode || '',
      passbookFile: editData?.passbookFile || null,

      // Step 7 - Documents
      documentType: editData?.documentType || '',
      documentNumber: editData?.documentNumber || '',
      documentFileName: editData?.documentFileName || null,
    }
  });

  const { register, handleSubmit, watch, setValue, trigger, clearErrors, setError, formState: { errors } } = methods;

  // Dynamic crop options from API
  // Build crop options: Crop Names are categories, Crop Types are varieties under each category
  const cropOptions = cropNames.reduce((acc, crop) => {
    const category = crop.name || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    // Add crop types (varieties) for this crop where parentId matches
    const varieties = cropTypes.filter(type => type.parentId === crop.id || type.cropNameId === crop.id);
    if (varieties && varieties.length > 0) {
      acc[category] = varieties.map(variety => variety.name);
    } else {
      // If no varieties found, add the crop name itself as an option
      acc[category] = [crop.name];
    }
    return acc;
  }, {});

  // If no data from API, provide default crop categories
  const defaultCropOptions = Object.keys(cropOptions).length === 0 ? {
    'Cereals': ['Rice', 'Wheat', 'Maize', 'Jowar', 'Bajra', 'Ragi'],
    'Pulses': ['Red gram', 'Green gram', 'Black gram', 'Bengal gram', 'Lentil'],
    'Cash Crops': ['Cotton', 'Sugarcane', 'Tobacco', 'Jute'],
    'Oilseeds': ['Groundnut', 'Sunflower', 'Soybean', 'Mustard', 'Sesame'],
    'Vegetables': ['Tomato', 'Potato', 'Onion', 'Brinjal', 'Cabbage', 'Cauliflower'],
    'Fruits': ['Mango', 'Banana', 'Grapes', 'Papaya', 'Citrus', 'Pomegranate'],
    'Spices': ['Turmeric', 'Chilli', 'Coriander', 'Cumin', 'Ginger'],
    'Plantation': ['Coconut', 'Arecanut', 'Coffee', 'Tea', 'Rubber']
  } : cropOptions;

  const waterSourceOptions = [
    'Borewell',
    'Open Well',
    'Canal',
    'River',
    'Pond',
    'Rainfed',
    'Drip Irrigation',
    'Sprinkler Irrigation'
  ];

  const onSubmit = async (data) => {
    // Check for age validation error before submitting
    if (ageValidationError) {
      alert('Please fix age validation error before submitting');
      return;
    }
    
    try {
      console.log('Form submitted with data:', data);
      
      // Call the onSubmit prop which should handle API call and state update
      if (onSubmitProp) {
        await onSubmitProp(data);
      } else {
        // Fallback for standalone mode
        if (isInDashboard) {
          onClose && onClose();
        } else {
          navigate('/admin/dashboard');
        }
        alert('Farmer registration completed successfully!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  return (
    <div className={isInDashboard ? "farmer-wrapper dashboard-mode" : "farmer-wrapper"}>
      <div className="form-full">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="farmer">
         
           {currentStep === 0 && (
  <div className="form-grid">
    <div className="field-left">
      {/* Photo Upload */}
     <div className="form-group photo-group">
  <label>
    Photo <span className="optional">(Optional)</span>
  </label>

  {/* Preview box */}
  <div className="photo-box">
    {photoPreviewStep0 ? (
      <img
        src={photoPreviewStep0}
        alt="Preview"
        className="photo-preview"
      />
    ) : photoPreview ? (
      <>
        {console.log("👨‍🌾 Fetched photo URL:", photoPreview)}
                 <img
           src={photoPreview}
           alt="Farmer"
           className="photo-preview"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "block";
            console.log("❌ Failed to load fetched photo:", photoPreview);
          }}
        />
        <span style={{ display: "none", color: "#666" }}>Photo not available</span>
      </>
    ) : (
      <span className="photo-placeholder">No photo selected</span>
    )}
  </div>

  {/* File input */}
  <input
    type="file"
    accept="image/*"
    className="photo-input"
    {...register("photo")}
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        setPhotoPreviewStep0(URL.createObjectURL(file));
        setValue("photo", file, { shouldValidate: true }); // Register value for RHF
        setSelectedPhotoName(file.name); // Track selected file name
        // Clear any existing photo error
        clearErrors("photo");
      }
    }}
  />
  {/* Show file name if selected or from backend */}
  <div style={{ marginTop: "6px", fontSize: "0.95em", color: "#444" }}>
    {selectedPhotoName
      ? `Selected: ${selectedPhotoName}`
      : photoPreview && farmerData && farmerData.photoFileName
        ? `Current: ${farmerData.photoFileName}`
        : null}
  </div>

  {/* Validation error message */}
  {errors.photo && (
    <p className="error-text">{errors.photo.message}</p>
  )}
</div>

 
          <label className="label">Salutation<span className="required">*</span></label>
      <select
        className="input"
        {...register("salutation", { required: "Salutation is required" })}
      >
        <option value="">Select</option>
        <option value="Mr.">Mr.</option>
        <option value="Mrs.">Mrs.</option>
        <option value="Ms.">Ms.</option>
        <option value="Miss.">Miss.</option>
        <option value="Dr.">Dr.</option>
      </select>
      {errors.salutation && <p className="error">{errors.salutation.message}</p>}
   
      <label className="label">First Name<span className="required">*</span></label>
      <input
        className="input"
        placeholder="First Name"
        {...register("firstName", { 
          required: "First Name is required",
          pattern: { value: /^[A-Za-z\s]{2,26}$/, message: "Only letters (2-26) are allowed" }
        })}
        onFocus={() => setFocusedField('firstName')}
        onBlur={() => setFocusedField('')}
      />
      {focusedField === 'firstName' && !watch("firstName") && <p className="field-hint">Please enter first name</p>}
      {errors.firstName && <p className="error">{errors.firstName.message}</p>}
 
     <label className="label">Middle Name<span className="required">*</span></label>
      <input
        className="input"
        placeholder="Middle Name"
        {...register("middleName", { 
          required: "Middle Name is required",
          pattern: { value: /^[A-Za-z\s]{1,26}$/, message: "Only letters are allowed" }
        })}
        onFocus={() => setFocusedField('middleName')}
        onBlur={() => setFocusedField('')}
      />
      {focusedField === 'middleName' && !watch("middleName") && <p className="field-hint">Please enter middle name</p>}
      {errors.middleName && <p className="error">{errors.middleName.message}</p>}
 
      <label className="label">Last Name<span className="required">*</span></label>
      <input
        className="input"
        placeholder="Last Name"
        {...register("lastName", { 
          required: "Last Name is required",
          pattern: { value: /^[A-Za-z\s]{2,26}$/, message: "Only letters (2-26) are allowed" }
        })}
        onFocus={() => setFocusedField('lastName')}
        onBlur={() => setFocusedField('')}
      />
      {focusedField === 'lastName' && !watch("lastName") && <p className="field-hint">Please enter last name</p>}
      {errors.lastName && <p className="error">{errors.lastName.message}</p>}
     </div>
 
    <div className="field-right">
     
       <label className="label">Gender<span className="required">*</span></label>
      <select
        className="input"
        {...register("gender", { required: "Gender is required" })}
        onFocus={() => setFocusedField('gender')}
        onBlur={() => setFocusedField('')}
      >
        <option value="">Select</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Transgender">Transgender</option>
      </select>
      {focusedField === 'gender' && !watch("gender") && <p className="field-hint">Please select gender</p>}
      {errors.gender && <p className="error">{errors.gender.message}</p>}
 
     <label className="label">Nationality<span className="required">*</span></label>
      <select
        className="input"
        {...register("nationality", { required: "Nationality is required" })}
        onFocus={() => setFocusedField('nationality')}
        onBlur={() => setFocusedField('')}
      >
        <option value="">Select</option>
        <option value="Indian">Indian</option>
      </select>
      {focusedField === 'nationality' && !watch("nationality") && <p className="field-hint">Please select nationality</p>}
      {errors.nationality && <p className="error">{errors.nationality.message}</p>}
 
         <label>Date of Birth  <span className="required">*</span></label>
                <input
                  type="date"
                  placeholder="YYYY-MM-DD"
                  {...register("dateOfBirth", {
                    required: "Date of Birth is required",
                    setValueAs: (v) => {
                      if (typeof v === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(v)) {
                        const [dd, mm, yyyy] = v.split('-');
                        return `${yyyy}-${mm}-${dd}`;
                      }
                      return v;
                    },
                    validate: (v) => {
                      if (!v) return 'Date of Birth is required';
                      const birthDate = new Date(v);
                      if (isNaN(birthDate.getTime())) return 'Enter valid date of birth';
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                      return (age >= 18 && age <= 90) || 'Age must be between 18 and 90 years';
                    }
                  })}
                  onFocus={() => setFocusedField('dateOfBirth')}
                  onBlur={() => { setFocusedField(''); trigger('dateOfBirth'); }}
                />
                {focusedField === 'dateOfBirth' && !watch("dateOfBirth") && <p className="field-hint">Please enter date of birth</p>}
                {errors.dateOfBirth?.message && <p className="reg-error">{errors.dateOfBirth.message}</p>}
                {ageValidationError && <p className="reg-error">{ageValidationError}</p>}
 
         <label>
        Contact Number <span className="optional"></span>
        <input type="tel" maxLength={10} {...register("contactNumber")} placeholder="10-digit number"
          onChange={(e) => {
            const v = e.target.value;
            if (v && !/^\d{10}$/.test(v)) {
              setError('contactNumber', { type: 'pattern', message: 'Enter a valid 10-digit number' });
            } else {
              clearErrors('contactNumber');
            }
          }}
          onBlur={() => trigger('contactNumber')}
        />
      </label>
      {errors.contactNumber?.message && <p className="error">{errors.contactNumber.message}</p>}
      
      <label>
        Email Address <span className="required">*</span>
        <input 
          type="email" 
          className="input"
          {...register("email", { 
            required: "Email is required",
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email address" }
          })} 
          placeholder="Enter email address"
          onFocus={() => setFocusedField('email')}
          onBlur={() => { setFocusedField(''); trigger('email'); }}
        />
      </label>
      {focusedField === 'email' && !watch("email") && <p className="field-hint">Please enter email address</p>}
      {errors.email?.message && <p className="error">{errors.email.message}</p>}
      
      <label>

        Father Name <span className="optional"></span>
        <input type="text" {...register("fatherName")} placeholder="Enter father's name"
          onChange={(e)=>{
            const v = e.target.value;
            if (v && !/^[A-Za-z\s]{2,40}$/.test(v)) {
              setError('fatherName', { type: 'pattern', message: 'Only letters are allowed' });
            } else {
              clearErrors('fatherName');
            }
          }}
          onBlur={() => trigger('fatherName')}
        />
      </label>
      {errors.fatherName?.message && <p className="error">{errors.fatherName.message}</p>}
 
      <label>
        Alternative Type <span className="optional"></span>
        <select {...register("alternativeType")}>
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
      </label>
      {errors.alternativeType?.message && <p className="error">{errors.alternativeType.message}</p>}
 
      <label>
        Alternative Number <span className="optional"></span>
        <input type="tel" maxLength={10} {...register("alternativeNumber")} placeholder="10-digit number"
          onChange={(e)=>{
            const v = e.target.value;
            if (v && !/^\d{10}$/.test(v)) {
              setError('alternativeNumber', { type: 'pattern', message: 'Must be 10 digits' });
            } else {
              clearErrors('alternativeNumber');
            }
          }}
          onBlur={() => trigger('alternativeNumber')}
        />
      </label>
      {errors.alternativeNumber?.message && <p className="error">{errors.alternativeNumber.message}</p>}
     
    </div>
  </div>
)}
 
 
      {currentStep === 1 && (
        <div className="address-field">
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
          <input type="hidden" {...register("zipcode", { required: "Zipcode is required",
            pattern: { value: /^\d{5,6}$/, message: 'Enter valid 5-6 digit zipcode' }
          })} />
          
          {/* Error messages now shown inline per field in AddressForm */}
        </div>
      )}
 
 
{currentStep === 2 && (
                <>
              <div className="profes-field">
                <label>Experience <span className="optional"></span></label>
                <input 
                  {...register("experience")} 
                  placeholder="e.g. 15 Years" 
                  className="input-large"
                />
                <p>{errors.experience?.message}</p>

                <label>Education <span className="optional"></span></label>
                <select {...register("education", { required: 'Education is required' })} className="input-large">
                  <option value="">Select</option>
                  {getEducationTypesForUser('farmer').map((edu) => (
                    <option key={edu} value={edu}>
                      {edu}
                    </option>
                  ))}
                 </select>
                <p>{errors.education?.message}</p>
              </div>
              </>
            )}
 
            {currentStep === 3 && (
  <>
    <div className="current-field">
      <div className="currentform-grid">
        <div className="cropform-columnleft">
          <div className="form-group photo-group">
            <label>Photo <span className="optional"></span></label>
            <div className="photo-box-large">
              {photoPreviewStep3 ? (
                <img src={photoPreviewStep3} alt="Preview" className="photo-preview-large" />
              ) : (
                <span className="photo-placeholder-large">No photo selected</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setPhotoPreviewStep3(URL.createObjectURL(file));
                  setValue("photoFileName", file, { shouldValidate: true });
                }
              }}
              className="photo-input-large"
            />
          </div>
          <label>Survey Numbers <span className="optional"></span></label>
            <input 
              {...register("currentSurveyNumber")} 
              className="input-large"
              placeholder="Enter survey numbers"
            />
          <p>{errors.currentSurveyNumber?.message}</p>
          
          <label>Total Land Holding (In Acres Nos) <span className="optional">(Optional)</span></label>
            <input
              type="number"
              step="any"
              {...register("currentLandHolding", { valueAsNumber: true })}
              className="input-large"
              placeholder="Enter land holding in acres"
            />
          <p>{errors.currentLandHolding?.message}</p>
          
          <label>Geo-tag <span className="optional"></span></label>
            <input 
              {...register("currentGeoTag")} 
              className="input-large"
              placeholder="Enter geo-tag coordinates"
            />
          <p>{errors.currentGeoTag?.message}</p>
        </div>
        <div className="cropform-columnright">
          <label>Select Crop Category <span className="optional"></span></label>
            <select
              value={cropCategoryStep3}
              onChange={(e) => {
                setCropCategoryStep3(e.target.value);
                setValue("currentCrop", "");
              }}
              className="input-large"
            >
              <option value="">Select</option>
              {cropTypes.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          
          {cropCategoryStep3 && (
            <>
              <label>Select Crop Name <span className="optional"></span></label>
              <select {...register("currentCrop")} defaultValue="" className="input-large">
                <option value="">Select</option>
                {cropNames.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </>
          )}
          {errors.currentCrop?.message && <p className="error">{errors.currentCrop.message}</p>}
          
          <label>Net Income (As per Current Crop/Yr) <span className="optional"></span></label>
            <input 
              {...register("currentNetIncome")} 
              className="input-large"
              placeholder="Enter net income per year"
            />
          <p>{errors.currentNetIncome?.message}</p>
          
          <label>Soil Test <span className="optional"></span></label>
            <select
              {...register("currentSoilTest")}
              onChange={e => setValue("currentSoilTest", e.target.value === "true")}
              value={typeof watch("currentSoilTest") === "boolean" ? String(watch("currentSoilTest")) : ""}
              className="input-large"
            >
              <option value="">Select</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          <p>{errors.currentSoilTest?.message}</p>
          
          <label>Soil Test Certificate <span className="optional"></span></label>
            <input 
              type="file" 
              {...register("currentSoilTestCertificateFileName")} 
              className="input-large"
            />
            {errors.currentSoilTestCertificateFileName?.message && <p className="error">{errors.currentSoilTestCertificateFileName.message}</p>}
        </div>
      </div>
    </div>
  </>
)}
     {currentStep === 4 && (
              <div className="proposed-field">
                 <div className="proposedform-grid">
                 <div className="proposedform-columnleft">
                <label>Survey Numbers <span className="optional"></span></label>
                 <input 
                   {...register("proposedSurveyNumber")} 
                   className="input-large"
                   placeholder="Enter survey numbers"
                 />
                <p>{errors.proposedSurveyNumber?.message}</p>
 
                <label>Geo-tag <span className="optional">(Optional)</span></label>
                <input
                type="text"
                placeholder="Latitude, Longitude"
                className="input-large"
              {...register("proposedGeoTag", {
                pattern: {
                  value: /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/,
                 message: "Enter valid Latitude, Longitude (e.g., 17.123, 78.456)"
                }
                })}
               />
              {errors.proposedGeoTag?.message && <p className="error">{errors.proposedGeoTag.message}</p>}
 
 
               <label>Select Crop Category <span className="optional"></span></label>
               <select
               value={cropCategoryStep4}
               onChange={(e) => {
               setCropCategoryStep4(e.target.value);
               setValue("cropType", ""); // unique field name
               }}
               className="input-large"
               >
              <option value="">Select</option>
              {cropTypes.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
 
               {cropCategoryStep4 && (
              <>
                <label>Select Crop Name <span className="optional"></span></label>
                <select {...register("cropType")} defaultValue="" className="input-large">
               <option value="">Select</option>
                {cropNames.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
               </select>
              </>
               )}
               {errors.cropType?.message && <p className="error">{errors.cropType.message}</p>}
 
 
                <label>Soil Test <span className="optional"></span></label>
                <select
                  {...register("proposedSoilTest")}
                  onChange={e => setValue("proposedSoilTest", e.target.value === "true")}
                  value={typeof watch("proposedSoilTest") === "boolean" ? String(watch("proposedSoilTest")) : ""}
                  className="input-large"
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                <p>{errors.proposedSoilTest?.message}</p>
                </div>
 
                <div className="proposedform-columnright">
                <label>Total Land Holding (In Acres) <span className="optional"></span></label>
                <input
                     type="number"
                     step="any"
                     className="input-large"
                     placeholder="Enter land holding in acres"
                   {...register("proposedLandHolding", {
                     valueAsNumber: true,
                      })}
                        />
                <p>{errors.proposedLandHolding?.message}</p>
 
                <label>Net Income (Per Crop/Yr) <span className="optional"></span></label>
                <input 
                  type="text" 
                  {...register("netIncome")} 
                  className="input-large"
                  placeholder="Enter net income per year"
                />
                {errors.netIncome?.message && <p className="error">{errors.netIncome.message}</p>}
 
                <label>Soil Test Certificate <span className="optional"></span></label>
                 <input 
                   type="file" 
                   {...register("soilTestCertificate")} 
                   className="input-large"
                 />
                   {errors.soilTestCertificate?.message && <p className="error">{errors.soilTestCertificate.message}</p>}
                 </div>
                </div>
               </div>
      )}
         {currentStep === 5 && (
  <div className="irrigation-field">
    {/* Tabs Header */}
    <div className="tab-header">
      <span
        className={selectedIrrigationTab === "Current" ? "tab active" : "tab"}
        onClick={() => setSelectedIrrigationTab("Current")}
      >
        Current Crop Addition
      </span>
      <span
        className={selectedIrrigationTab === "Proposed" ? "tab active" : "tab"}
        onClick={() => setSelectedIrrigationTab("Proposed")}
      >
        Proposed Crop Addition
      </span>
    </div>
 
    {/* Current Crop Tab */}
    {selectedIrrigationTab === "Current" && (
      <div className="tab-content">
        <label>Water Source <span className="required">*</span></label>
          <select {...register("currentWaterSource")} defaultValue="" className="input-large">
            <option value="">Select</option>
            {waterSourceOptions.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        {errors.currentWaterSource?.message && <p className="error">{errors.currentWaterSource.message}</p>}
        
        <label>Borewell wise Discharge in LPH <span className="optional"></span></label>
          <input 
            {...register("currentDischargeLPH")} 
            className="input-large"
            placeholder="Enter discharge in LPH"
          />
        {errors.currentDischargeLPH?.message && <p className="error">{errors.currentDischargeLPH.message}</p>}
        
        <label>Discharge during summer months <span className="optional"></span></label>
          <input 
            {...register("currentSummerDischarge")} 
            className="input-large"
            placeholder="Enter summer discharge"
          />
        {errors.currentSummerDischarge?.message && <p className="error">{errors.currentSummerDischarge.message}</p>}
        
        <label>Borewell location <span className="optional"></span></label>
          <input 
            {...register("currentBorewellLocation")} 
            className="input-large"
            placeholder="Enter borewell location"
          />
        {errors.currentBorewellLocation?.message && <p className="error">{errors.currentBorewellLocation.message}</p>}
      </div>
    )}
 
    {/* Proposed Crop Tab */}
    {selectedIrrigationTab === "Proposed" && (
      <div className="tab-content">
        <label>Water Source <span className="required">*</span></label>
          <select {...register("proposedWaterSource")} defaultValue="" className="input-large">
            <option value="">Select</option>
            {waterSourceOptions.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        {errors.proposedWaterSource?.message && <p className="error">{errors.proposedWaterSource.message}</p>}
        
        <label>Borewell wise Discharge in LPH <span className="optional"></span></label>
          <input 
            {...register("proposedDischargeLPH")} 
            className="input-large"
            placeholder="Enter discharge in LPH"
          />
        {errors.proposedDischargeLPH?.message && <p className="error">{errors.proposedDischargeLPH.message}</p>}
        
        <label>Discharge during summer months <span className="optional"></span></label>
          <input 
            {...register("proposedSummerDischarge")} 
            className="input-large"
            placeholder="Enter summer discharge"
          />
        {errors.proposedSummerDischarge?.message && <p className="error">{errors.proposedSummerDischarge.message}</p>}
        
        <label>Borewell location <span className="optional"></span></label>
          <input 
            {...register("proposedBorewellLocation")} 
            className="input-large"
            placeholder="Enter borewell location"
          />
        {errors.proposedBorewellLocation?.message && <p className="error">{errors.proposedBorewellLocation.message}</p>}
      </div>
    )}
  </div>
)}
 
    {currentStep === 6 && (
                <div className="other-field">
                 <h3>Bank Details</h3>
 
                 <label>Bank Name <span className="optional"></span></label>
                <input 
                  type="text" 
                  {...register("bankName")} 
                  className="input-large"
                  placeholder="Enter bank name"
                />
                {errors.bankName?.message && <p className="error">{errors.bankName.message}</p>}
 
               <label>Account Number <span className="optional"></span></label>
                <input 
                  type="text" 
                  {...register("accountNumber")} 
                  className="input-large"
                  placeholder="Enter account number"
                />
                {errors.accountNumber?.message && <p className="error">{errors.accountNumber.message}</p>}
 
               <label>Branch Name <span className="optional"></span></label>
                <input 
                  type="text" 
                  {...register("branchName")} 
                  className="input-large"
                  placeholder="Enter branch name"
                />
              {errors.branchName?.message && <p className="error">{errors.branchName.message}</p>}
     
              <label>IFSC Code <span className="optional"></span></label>
               <input 
                 type="text" 
                 {...register("ifscCode")} 
                 className="input-large"
                 placeholder="Enter IFSC code"
               />
               {errors.ifscCode?.message && <p className="error">{errors.ifscCode.message}</p>}
 
              <label>Passbook <span className="optional"></span></label>
             <input
               type="file"
               accept="image/*,application/pdf"
               className="input-large"
               onChange={(e) => {
                 const file = e.target.files[0];
                 setValue("passbookFile", file);
                 trigger("passbookFile");
               }}
             />
             {errors.passbookFile?.message && <p className="error">{errors.passbookFile.message}</p>}
             </div>
  )}
 
        {currentStep === 7 && (
  <div className="other-field">
    <label className="label">
      Add Document <span className="optional"></span>
    </label>

    <select
      className="input-large"
      {...register("documentType", { required: "Document Type is required" })}
      onChange={(e) => {
        setSelectedDoc(e.target.value);
        setValue("documentType", e.target.value); // sync with react-hook-form
      }}
    >
      <option value="">Select</option>
      <option value="voterId">ID/ Voter Card</option>
      <option value="aadharNumber">Aadhar Number</option>
      <option value="panNumber">Pan Number</option>
      <option value="ppbNumber">PPB Number</option>
    </select>
    <p className="error-text">{errors.documentType?.message}</p>
    {/* Document Number and File */}
    {selectedDoc && (
      <>
        <input
          type="text"
          placeholder={selectedDoc === "voterId" ? "Voter ID" : selectedDoc === "aadharNumber" ? "Aadhar Number" : selectedDoc === "panNumber" ? "PAN Number" : "PPB Number"}
          className="input-large"
          {...register("documentNumber", { required: `${selectedDoc === "voterId" ? "Voter ID" : selectedDoc === "aadharNumber" ? "Aadhar Number" : selectedDoc === "panNumber" ? "PAN Number" : "PPB Number"} is required` })}
        />
        <p className="error-text">{errors.documentNumber?.message}</p>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="input-large"
          {...register("documentFileName", { required: `${selectedDoc === "voterId" ? "Voter ID" : selectedDoc === "aadharNumber" ? "Aadhar" : selectedDoc === "panNumber" ? "PAN" : "PPB"} File is required` })}
        />
        <p className="error-text">{errors.documentFileName?.message}</p>
      </>
    )}
  </div>
)}
             <div className="btn-group">
  {currentStep === 0 ? (
    <button
      type="button"
      onClick={async () => {
        // Trigger validation for all fields in current step
        const isValid = await trigger();
        if (isValid && !ageValidationError) {
          setCurrentStep(currentStep + 1);
        }
      }}
    >
      Next
    </button>
  ) : currentStep === totalSteps - 1 ? (
    <>
      <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
        Previous
      </button>
      <button
        type="button"
        onClick={async () => {
          const isValid = await trigger();
          if (isValid && !ageValidationError) {
            await handleSubmit(onSubmit)();
          }
        }}
      >
        Submit
      </button>
    </>
  ) : (
    <>
      <button type="button" onClick={() => setCurrentStep(currentStep - 1)}>
        Previous
      </button>
      <button
        type="button"
        onClick={async () => {
          // For address step (step 1), validate address fields specifically
          if (currentStep === 1) {
            const addressFields = ['country', 'state', 'district', 'block', 'village', 'zipcode'];
            const isValid = await trigger(addressFields);
            if (isValid && !ageValidationError) {
              setCurrentStep(currentStep + 1);
            }
          } else {
            const isValid = await trigger();
            if (isValid && !ageValidationError) {
              setCurrentStep(currentStep + 1);
            }
          }
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
              // Check if we're in the admin dashboard context
              if (isInDashboard) {
                // If in admin dashboard, don't navigate away
                // The dashboard will handle the close action
              } else {
                // Otherwise navigate to dashboard
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

export default FarmerRegistrationForm; 