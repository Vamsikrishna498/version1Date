import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import '../styles/ViewEditEmployeeDetails.css';

// Accept both `employeeData` and `employee` (dashboards pass `employee`)
const ViewEditEmployeeDetails = ({ employeeData, employee, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Normalize incoming data from different callers/endpoints
  const src = employeeData || employee || {};
  const firstName = src.firstName || (src.name ? String(src.name).split(' ')[0] : '');
  const lastName = src.lastName || (src.name ? String(src.name).split(' ').slice(1).join(' ') : '');
  const phone = src.contactNumber || src.phone || '';
  const dateOfBirth = src.dateOfBirth || src.dob || '';
  const gender = src.gender || '';
  const address = src.address || '';
  const city = src.city || src.district || '';
  const state = src.state || '';
  const pincode = src.pincode || src.zipcode || '';
  const employeeId = src.employeeId || (src.id ? `EMP${String(src.id).padStart(6, '0')}` : '');
  const department = src.department || '';
  const designation = src.designation || src.role || '';
  const joiningDate = src.joiningDate || '';
  const salary = src.salary || '';
  const supervisor = src.supervisor || '';

  const methods = useForm({
    defaultValues: {
      // Personal Information
      firstName,
      lastName,
      email: src.email || '',
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      
      // Employment Information
      employeeId,
      department,
      designation,
      joiningDate,
      salary,
      supervisor,
      
      // Educational Information
      highestQualification: src.highestQualification || '',
      institution: src.institution || '',
      graduationYear: src.graduationYear || '',
      specialization: src.specialization || '',
      
      // Emergency Contact
      emergencyName: src.emergencyName || '',
      emergencyPhone: src.emergencyPhone || '',
      emergencyRelation: src.emergencyRelation || '',
      
      // Documents
      photo: src.photo || null,
      idProof: src.idProof || null,
      addressProof: src.addressProof || null,
      educationalCertificates: src.educationalCertificates || null,
      
      // Additional Information
      skills: src.skills || '',
      languages: src.languages || '',
      certifications: src.certifications || '',
      workExperience: src.workExperience || '',
      references: src.references || ''
    }
  });

  const { register, handleSubmit, watch, setValue, trigger, clearErrors, formState: { errors } } = methods;

  const steps = [
    {
      title: 'Personal Information',
      fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'city', 'state', 'pincode']
    },
    {
      title: 'Employment Information',
      fields: ['employeeId', 'department', 'designation', 'joiningDate', 'salary', 'supervisor']
    },
    {
      title: 'Educational Information',
      fields: ['highestQualification', 'institution', 'graduationYear', 'specialization']
    },
    {
      title: 'Emergency Contact',
      fields: ['emergencyName', 'emergencyPhone', 'emergencyRelation']
    },
    {
      title: 'Documents',
      fields: ['photo', 'idProof', 'addressProof', 'educationalCertificates']
    },
    {
      title: 'Additional Information',
      fields: ['skills', 'languages', 'certifications', 'workExperience', 'references']
    }
  ];

  const handleNext = async () => {
    const currentFields = steps[currentStep].fields;
    const isValid = await trigger(currentFields);
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (data) => {
    if (onUpdate) {
      await onUpdate(data);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentStep(0);
    methods.reset();
  };

  const renderPersonalInfo = () => (
    <div className="form-section">
      <h3>Personal Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            {...register('firstName', { 
              required: 'First name is required',
              pattern: {
                value: /^[A-Za-z]{2,50}$/,
                message: 'First name must contain only alphabets (2-50 characters)'
              }
            })}
            disabled={!isEditing}
            maxLength={50}
            placeholder="Enter first name (alphabets only)"
          />
          {errors.firstName && <span className="error">{errors.firstName.message}</span>}
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            {...register('lastName', { 
              required: 'Last name is required',
              pattern: {
                value: /^[A-Za-z]{2,50}$/,
                message: 'Last name must contain only alphabets (2-50 characters)'
              }
            })}
            disabled={!isEditing}
            maxLength={50}
            placeholder="Enter last name (alphabets only)"
          />
          {errors.lastName && <span className="error">{errors.lastName.message}</span>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            disabled={!isEditing}
            maxLength={100}
            placeholder="Enter email address"
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>
        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            {...register('phone', { 
              required: 'Phone is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Phone number must be 10 digits'
              }
            })}
            disabled={!isEditing}
            maxLength={10}
            placeholder="Enter 10-digit phone number"
          />
          {errors.phone && <span className="error">{errors.phone.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            disabled={!isEditing}
          />
          {errors.dateOfBirth && <span className="error">{errors.dateOfBirth.message}</span>}
        </div>
        <div className="form-group">
          <label>Gender *</label>
          <select {...register('gender', { required: 'Gender is required' })} disabled={!isEditing}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <span className="error">{errors.gender.message}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Address *</label>
        <textarea
          {...register('address', { required: 'Address is required' })}
          disabled={!isEditing}
        />
        {errors.address && <span className="error">{errors.address.message}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            {...register('city', { required: 'City is required' })}
            disabled={!isEditing}
          />
          {errors.city && <span className="error">{errors.city.message}</span>}
        </div>
        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            {...register('state', { required: 'State is required' })}
            disabled={!isEditing}
          />
          {errors.state && <span className="error">{errors.state.message}</span>}
        </div>
        <div className="form-group">
          <label>Pincode *</label>
          <input
            type="text"
            {...register('pincode', { 
              required: 'Pincode is required',
              pattern: {
                value: /^[0-9]{6}$/,
                message: 'Pincode must be 6 digits'
              }
            })}
            disabled={!isEditing}
          />
          {errors.pincode && <span className="error">{errors.pincode.message}</span>}
        </div>
      </div>
    </div>
  );

  const renderEmploymentInfo = () => (
    <div className="form-section">
      <h3>Employment Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Employee ID *</label>
          <input
            type="text"
            {...register('employeeId', { required: 'Employee ID is required' })}
            disabled={!isEditing}
          />
          {errors.employeeId && <span className="error">{errors.employeeId.message}</span>}
        </div>
        <div className="form-group">
          <label>Department *</label>
          <select {...register('department', { required: 'Department is required' })} disabled={!isEditing}>
            <option value="">Select Department</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
          </select>
          {errors.department && <span className="error">{errors.department.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Designation *</label>
          <input
            type="text"
            {...register('designation', { required: 'Designation is required' })}
            disabled={!isEditing}
          />
          {errors.designation && <span className="error">{errors.designation.message}</span>}
        </div>
        <div className="form-group">
          <label>Joining Date *</label>
          <input
            type="date"
            {...register('joiningDate', { required: 'Joining date is required' })}
            disabled={!isEditing}
          />
          {errors.joiningDate && <span className="error">{errors.joiningDate.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Salary *</label>
          <input
            type="number"
            {...register('salary', { required: 'Salary is required' })}
            disabled={!isEditing}
          />
          {errors.salary && <span className="error">{errors.salary.message}</span>}
        </div>
        <div className="form-group">
          <label>Supervisor</label>
          <input
            type="text"
            {...register('supervisor')}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );

  const renderEducationalInfo = () => (
    <div className="form-section">
      <h3>Educational Information</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Highest Qualification *</label>
          <select {...register('highestQualification', { required: 'Highest qualification is required' })} disabled={!isEditing}>
            <option value="">Select Qualification</option>
            <option value="High School">High School</option>
            <option value="Diploma">Diploma</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="PhD">PhD</option>
          </select>
          {errors.highestQualification && <span className="error">{errors.highestQualification.message}</span>}
        </div>
        <div className="form-group">
          <label>Institution *</label>
          <input
            type="text"
            {...register('institution', { required: 'Institution is required' })}
            disabled={!isEditing}
          />
          {errors.institution && <span className="error">{errors.institution.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Graduation Year *</label>
          <input
            type="number"
            {...register('graduationYear', { 
              required: 'Graduation year is required',
              min: { value: 1950, message: 'Invalid year' },
              max: { value: new Date().getFullYear(), message: 'Year cannot be in future' }
            })}
            disabled={!isEditing}
          />
          {errors.graduationYear && <span className="error">{errors.graduationYear.message}</span>}
        </div>
        <div className="form-group">
          <label>Specialization</label>
          <input
            type="text"
            {...register('specialization')}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="form-section">
      <h3>Emergency Contact</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Emergency Contact Name *</label>
          <input
            type="text"
            {...register('emergencyName', { required: 'Emergency contact name is required' })}
            disabled={!isEditing}
          />
          {errors.emergencyName && <span className="error">{errors.emergencyName.message}</span>}
        </div>
        <div className="form-group">
          <label>Emergency Contact Phone *</label>
          <input
            type="tel"
            {...register('emergencyPhone', { 
              required: 'Emergency contact phone is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Phone number must be 10 digits'
              }
            })}
            disabled={!isEditing}
          />
          {errors.emergencyPhone && <span className="error">{errors.emergencyPhone.message}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Relationship *</label>
        <select {...register('emergencyRelation', { required: 'Relationship is required' })} disabled={!isEditing}>
          <option value="">Select Relationship</option>
          <option value="Spouse">Spouse</option>
          <option value="Parent">Parent</option>
          <option value="Sibling">Sibling</option>
          <option value="Friend">Friend</option>
          <option value="Other">Other</option>
        </select>
        {errors.emergencyRelation && <span className="error">{errors.emergencyRelation.message}</span>}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="form-section">
      <h3>Documents</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setValue('photo', e.target.files[0]);
                clearErrors('photo');
              }
            }}
            disabled={!isEditing}
          />
          {watch('photo') && (
            <div className="file-preview">
              <img src={URL.createObjectURL(watch('photo'))} className="file-preview" alt="" />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>ID Proof (Optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setValue('idProof', e.target.files[0]);
                clearErrors('idProof');
              }
            }}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Address Proof (Optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setValue('addressProof', e.target.files[0]);
                clearErrors('addressProof');
              }
            }}
            disabled={!isEditing}
          />
        </div>
        <div className="form-group">
          <label>Educational Certificates (Optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 0) {
                setValue('educationalCertificates', Array.from(e.target.files));
                clearErrors('educationalCertificates');
              }
            }}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="form-section">
      <h3>Additional Information</h3>
      <div className="form-group">
        <label>Skills</label>
        <textarea
          {...register('skills')}
          placeholder="Enter your skills (comma separated)"
          disabled={!isEditing}
        />
      </div>

      <div className="form-group">
        <label>Languages Known</label>
        <input
          type="text"
          {...register('languages')}
          placeholder="e.g., English, Hindi, Spanish"
          disabled={!isEditing}
        />
      </div>

      <div className="form-group">
        <label>Certifications</label>
        <textarea
          {...register('certifications')}
          placeholder="Enter your certifications"
          disabled={!isEditing}
        />
      </div>

      <div className="form-group">
        <label>Work Experience</label>
        <textarea
          {...register('workExperience')}
          placeholder="Describe your previous work experience"
          disabled={!isEditing}
        />
      </div>

      <div className="form-group">
        <label>References</label>
        <textarea
          {...register('references')}
          placeholder="Enter references with contact details"
          disabled={!isEditing}
        />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderEmploymentInfo();
      case 2:
        return renderEducationalInfo();
      case 3:
        return renderEmergencyContact();
      case 4:
        return renderDocuments();
      case 5:
        return renderAdditionalInfo();
      default:
        return null;
    }
  };

  return (
    <div className="view-edit-employee-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Employee Details' : 'Employee Details'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="step-indicator">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-title">{step.title}</span>
              </div>
            ))}
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleSave)}>
              {renderStepContent()}

              <div className="form-actions">
                {isEditing ? (
                  <>
                    {currentStep > 0 && (
                      <button type="button" className="btn btn-secondary" onClick={handlePrevious}>
                        Previous
                      </button>
                    )}
                    {currentStep < steps.length - 1 ? (
                      <button type="button" className="btn btn-primary" onClick={handleNext}>
                        Next
                      </button>
                    ) : (
                      <button type="submit" className="btn btn-success">
                        Save Changes
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={handleCancel}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default ViewEditEmployeeDetails; 