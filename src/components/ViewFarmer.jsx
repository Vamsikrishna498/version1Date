import React, { useEffect, useState } from 'react';
import '../styles/ViewFarmerDetails.css';
import { getFarmerDisplayId as getFarmerDisplayIdUtil, getConfiguredFarmerPrefix as getConfiguredFarmerPrefixUtil } from '../utils/farmerIdUtils';

const ViewFarmer = ({ farmerData, onBack, onSave, farmerUniqueIds, codeFormats }) => {
	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState({});

	// Initialize form data when farmerData changes
	useEffect(() => {
		if (farmerData) {
			console.log('🔍 ViewFarmer received farmerData:', farmerData);
			console.log('🔍 ViewFarmer farmerData keys:', Object.keys(farmerData));
			console.log('🔍 ViewFarmer farmerData values:', Object.values(farmerData));
			
			setFormData({
				firstName: farmerData.firstName || '',
				middleName: farmerData.middleName || '',
				lastName: farmerData.lastName || '',
				name: farmerData.name || farmerData.fullName || '',
				dateOfBirth: farmerData.dateOfBirth || farmerData.dob || '',
				gender: farmerData.gender || '',
				contactNumber: farmerData.contactNumber || farmerData.phoneNumber || farmerData.phone || farmerData.mobileNumber || '',
				email: farmerData.email || farmerData.emailId || farmerData.emailAddress || '',
				fatherName: farmerData.fatherName || farmerData.relationName || farmerData.father || '',
				nationality: farmerData.nationality || '',
				alternativeContactNumber: farmerData.alternativeContactNumber || farmerData.altNumber || farmerData.alternateContact || farmerData.alternativeNumber || '',
				alternativeRelationType: farmerData.alternativeRelationType || farmerData.altRelationType || farmerData.alternativeType || '',
				state: farmerData.state || '',
				district: farmerData.district || '',
				country: farmerData.country || '',
				block: farmerData.block || '',
				village: farmerData.village || '',
				pincode: farmerData.pincode || '',
				kycStatus: farmerData.kycStatus || 'PENDING'
			});
		}
	}, [farmerData]);

	const formatDate = (dateString) => {
		if (!dateString) return 'Not provided';
		try {
			// Handle different date formats
			let date;
			if (typeof dateString === 'string') {
				// Try parsing as ISO date first
				if (dateString.includes('T') || dateString.includes('Z')) {
					date = new Date(dateString);
				} else {
					// Try parsing as local date (YYYY-MM-DD)
					date = new Date(dateString + 'T00:00:00');
				}
			} else if (dateString instanceof Date) {
				date = dateString;
			} else {
				date = new Date(dateString);
			}
			
			if (isNaN(date.getTime())) {
				console.warn('Invalid date format:', dateString);
				return 'Invalid date';
			}
			
			return date.toLocaleDateString();
		} catch (error) {
			console.warn('Error formatting date:', dateString, error);
			return 'Invalid date';
		}
	};

	// Helper to fetch the first non-empty field from a list of possible keys
	const firstValue = (...keys) => {
		for (const key of keys) {
			const value = farmerData?.[key];
			if (value !== undefined && value !== null && String(value).trim() !== '') {
				return value;
			}
		}
		return undefined;
	};

	// Normalized view-model for inconsistent backend shapes
	const normalized = {
		name: (() => {
			const direct = firstValue('name', 'fullName');
			if (direct) return direct;
			const parts = [firstValue('firstName'), firstValue('middleName'), firstValue('lastName')]
				.filter(Boolean);
			return parts.length ? parts.join(' ') : undefined;
		})(),
		dateOfBirth: firstValue('dateOfBirth', 'dob'),
		gender: firstValue('gender'),
		contactNumber: firstValue('contactNumber', 'phoneNumber', 'phone', 'mobileNumber'),
		email: firstValue('email', 'emailId', 'emailAddress') || 'Not available',
		fatherName: firstValue('fatherName', 'relationName', 'father'),
		nationality: firstValue('nationality'),
		alternativeContactNumber: firstValue('alternativeContactNumber', 'altNumber', 'alternateContact', 'alternativeNumber'),
		alternativeRelationType: firstValue('alternativeRelationType', 'altRelationType', 'alternativeType'),
		state: firstValue('state'),
		district: firstValue('district'),
		country: firstValue('country'),
		block: firstValue('block'),
		village: firstValue('village'),
		pincode: firstValue('pincode')
	};

	console.log('🔍 ViewFarmer normalized data:', normalized);

	// Helper function to safely render values
	const safeRender = (value) => {
		if (value === null || value === undefined) {
			return 'Not provided';
		}
		if (typeof value === 'object') {
			console.warn('ViewFarmer: Object found in value:', value);
			return 'Object (see console)';
		}
		const str = String(value);
		
		// Handle invalid phone numbers
		if (str === '9999999999' || str === 'null' || str.trim() === '') {
			return 'Not provided';
		}
		
		return str.trim() === '' ? 'Not provided' : str;
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleSave = async () => {
		try {
			if (onSave) {
				await onSave(formData);
				setIsEditMode(false);
			}
		} catch (error) {
			console.error('Error saving farmer:', error);
			alert('Failed to save farmer data');
		}
	};

	// Generate consistent farmer display ID using shared utility
	const getFarmerDisplayId = (farmer) => {
		return getFarmerDisplayIdUtil(farmer, {
			farmerUniqueIds,
			getConfiguredFarmerPrefix: () => getConfiguredFarmerPrefixUtil(codeFormats)
		});
	};

	const handleCancel = () => {
		setIsEditMode(false);
		// Reset form data to original values
		if (farmerData) {
			setFormData({
				firstName: farmerData.firstName || '',
				middleName: farmerData.middleName || '',
				lastName: farmerData.lastName || '',
				name: farmerData.name || farmerData.fullName || '',
				dateOfBirth: farmerData.dateOfBirth || farmerData.dob || '',
				gender: farmerData.gender || '',
				contactNumber: farmerData.contactNumber || farmerData.phoneNumber || farmerData.phone || farmerData.mobileNumber || '',
				email: farmerData.email || farmerData.emailId || farmerData.emailAddress || '',
				fatherName: farmerData.fatherName || farmerData.relationName || farmerData.father || '',
				nationality: farmerData.nationality || '',
				alternativeContactNumber: farmerData.alternativeContactNumber || farmerData.altNumber || farmerData.alternateContact || farmerData.alternativeNumber || '',
				alternativeRelationType: farmerData.alternativeRelationType || farmerData.altRelationType || farmerData.alternativeType || '',
				state: farmerData.state || '',
				district: farmerData.district || '',
				country: farmerData.country || '',
				block: farmerData.block || '',
				village: farmerData.village || '',
				pincode: farmerData.pincode || '',
				kycStatus: farmerData.kycStatus || 'PENDING'
			});
		}
	};


	return (
		<div className="view-farmer-content">
			<div className="view-farmer-header">
				<button className="back-btn" onClick={onBack} style={{
					background: '#f3f4f6',
					border: '1px solid #e5e7eb',
					borderRadius: '6px',
					padding: '6px 10px',
					cursor: 'pointer',
					color: '#111827'
				}}>← Back to Farmers</button>
				<h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Farmer Details</h2>
				<div style={{ display: 'flex', gap: '8px' }}>
					{!isEditMode ? (
						<button 
							onClick={() => setIsEditMode(true)}
							style={{
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								padding: '6px 12px',
								cursor: 'pointer',
								fontSize: '14px'
							}}
						>
							Edit
						</button>
					) : (
						<>
							<button 
								onClick={handleSave}
								style={{
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									padding: '6px 12px',
									cursor: 'pointer',
									fontSize: '14px'
								}}
							>
								Save
							</button>
							<button 
								onClick={handleCancel}
								style={{
									background: '#6b7280',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									padding: '6px 12px',
									cursor: 'pointer',
									fontSize: '14px'
								}}
							>
								Cancel
							</button>
						</>
					)}
				</div>
			</div>
			
			{/* Middle Section with ID Card */}
			<div className="farmer-middle-section">
				<div className="middle-section-content">
					<div className="middle-section-left">
						{/* Empty space for future content if needed */}
					</div>
					<div className="middle-section-right">
						<div className="farmer-id-card">
							<div className="farmer-id-photo">
								{farmerData?.photoFileName || farmerData?.photo ? (
									<img 
										src={farmerData.photoFileName || farmerData.photo} 
										alt="Farmer" 
										className="farmer-id-photo-img"
									/>
								) : (
									<div className="farmer-id-photo-placeholder">
										<i className="fas fa-user"></i>
									</div>
								)}
							</div>
							<div className="farmer-id-info">
								<div className="farmer-id-number">
									ID: {(() => {
										// Use the same ID generation logic as SuperAdminDashboard
										return getFarmerDisplayId(farmerData);
									})()}
								</div>
								<div className="farmer-id-name">
									{formData.name || (formData.firstName ? 
										`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim() :
										'Farmer Name')
									}
								</div>
								<div className="farmer-id-status">
									<span className={`farmer-status-badge ${farmerData?.kycStatus?.toLowerCase() || 'pending'}`}>
										{safeRender(farmerData?.kycStatus) || 'PENDING'}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="view-farmer-body">
				<div className="farmer-details-container">
					{(!farmerData || typeof farmerData !== 'object') && (
						<div className="detail-section">
							<h3>Personal Information</h3>
							<div className="detail-grid">
								<div className="detail-item full-width">
									<label>Notice:</label>
									<span> No farmer data available or invalid data format.</span>
								</div>
							</div>
						</div>
					)}
					
					{/* Personal Information */}
					<div className="detail-section">
						<h3>Personal Information</h3>
						<div className="detail-grid">
							<div className="detail-item">
								<label>Name:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.name || ''}
										onChange={(e) => handleInputChange('name', e.target.value)}
										className="edit-input"
										placeholder="Enter full name"
									/>
								) : (
									<span>{safeRender(normalized.name)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Date of Birth:</label>
								{isEditMode ? (
									<input
										type="date"
										value={formData.dateOfBirth || ''}
										onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
										className="edit-input"
									/>
								) : (
									<span>{formatDate(normalized.dateOfBirth)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Gender:</label>
								{isEditMode ? (
									<select
										value={formData.gender || ''}
										onChange={(e) => handleInputChange('gender', e.target.value)}
										className="edit-input"
									>
										<option value="">Select Gender</option>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
										<option value="Other">Other</option>
									</select>
								) : (
									<span>{safeRender(normalized.gender)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Contact Number:</label>
								{isEditMode ? (
									<input
										type="tel"
										value={formData.contactNumber || ''}
										onChange={(e) => handleInputChange('contactNumber', e.target.value)}
										className="edit-input"
										placeholder="Enter contact number"
									/>
								) : (
									<span>{safeRender(normalized.contactNumber)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Email:</label>
								{isEditMode ? (
									<input
										type="email"
										value={formData.email || ''}
										onChange={(e) => handleInputChange('email', e.target.value)}
										className="edit-input"
										placeholder="Enter email address"
									/>
								) : (
									<span>{safeRender(normalized.email)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Father's Name:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.fatherName || ''}
										onChange={(e) => handleInputChange('fatherName', e.target.value)}
										className="edit-input"
										placeholder="Enter father's name"
									/>
								) : (
									<span>{safeRender(normalized.fatherName)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Nationality:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.nationality || ''}
										onChange={(e) => handleInputChange('nationality', e.target.value)}
										className="edit-input"
										placeholder="Enter nationality"
									/>
								) : (
									<span>{safeRender(normalized.nationality)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Alternative Contact:</label>
								{isEditMode ? (
									<input
										type="tel"
										value={formData.alternativeContactNumber || ''}
										onChange={(e) => handleInputChange('alternativeContactNumber', e.target.value)}
										className="edit-input"
										placeholder="Enter alternative contact"
									/>
								) : (
									<span>{safeRender(normalized.alternativeContactNumber)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Alternative Relation:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.alternativeRelationType || ''}
										onChange={(e) => handleInputChange('alternativeRelationType', e.target.value)}
										className="edit-input"
										placeholder="Enter alternative relation"
									/>
								) : (
									<span>{safeRender(normalized.alternativeRelationType)}</span>
								)}
							</div>
						</div>
					</div>

					{/* Address Information */}
					<div className="detail-section">
						<h3>Address Information</h3>
						<div className="detail-grid">
							<div className="detail-item">
								<label>State:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.state || ''}
										onChange={(e) => handleInputChange('state', e.target.value)}
										className="edit-input"
										placeholder="Enter state"
									/>
								) : (
									<span>{safeRender(normalized.state)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>District:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.district || ''}
										onChange={(e) => handleInputChange('district', e.target.value)}
										className="edit-input"
										placeholder="Enter district"
									/>
								) : (
									<span>{safeRender(normalized.district)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Block:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.block || ''}
										onChange={(e) => handleInputChange('block', e.target.value)}
										className="edit-input"
										placeholder="Enter block"
									/>
								) : (
									<span>{safeRender(normalized.block)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Village:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.village || ''}
										onChange={(e) => handleInputChange('village', e.target.value)}
										className="edit-input"
										placeholder="Enter village"
									/>
								) : (
									<span>{safeRender(normalized.village)}</span>
								)}
							</div>
							<div className="detail-item">
								<label>Pincode:</label>
								{isEditMode ? (
									<input
										type="text"
										value={formData.pincode || ''}
										onChange={(e) => handleInputChange('pincode', e.target.value)}
										className="edit-input"
										placeholder="Enter pincode"
									/>
								) : (
									<span>{safeRender(normalized.pincode)}</span>
								)}
							</div>
							<div className="detail-item full-width">
								<label>Complete Address:</label>
								<span>{[
									safeRender(normalized.village),
									safeRender(normalized.block),
									safeRender(normalized.district),
									safeRender(normalized.state),
									safeRender(normalized.pincode)
								].filter(val => val !== 'Not provided').join(', ')}</span>
							</div>
						</div>
					</div>

					{/* Assignment Information */}
					<div className="detail-section">
						<h3>Assignment Information</h3>
						<div className="detail-grid">
							<div className="detail-item">
								<label>KYC Status:</label>
								{isEditMode ? (
									<select
										value={formData.kycStatus || 'PENDING'}
										onChange={(e) => handleInputChange('kycStatus', e.target.value)}
										className="edit-input"
									>
										<option value="PENDING">Pending</option>
										<option value="APPROVED">Approved</option>
										<option value="REJECTED">Rejected</option>
										<option value="REFER_BACK">Refer Back</option>
									</select>
								) : (
									<span className={`kyc-status-badge ${safeRender(farmerData.kycStatus)?.toLowerCase()}`}>
										{safeRender(farmerData.kycStatus) || 'PENDING'}
									</span>
								)}
							</div>
							{farmerData.assignedEmployee && (
								<div className="detail-item">
									<label>Assigned Employee:</label>
									<span>{typeof farmerData.assignedEmployee === 'object' ? 
										`${safeRender(farmerData.assignedEmployee.firstName)} ${safeRender(farmerData.assignedEmployee.lastName)}` : 
										safeRender(farmerData.assignedEmployee)}</span>
								</div>
							)}
							{farmerData.assignedEmployeeId && (
								<div className="detail-item">
									<label>Assigned Employee ID:</label>
									<span>{safeRender(farmerData.assignedEmployeeId)}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ViewFarmer;
