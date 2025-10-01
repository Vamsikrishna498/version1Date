import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../api/apiService';
import '../styles/BulkOperations.css';

const BulkOperations = ({ userRole, hideHeader = false }) => {
  const [activeTab, setActiveTab] = useState('import');
  const [importType, setImportType] = useState('FARMER');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    format: 'EXCEL',
    assignedEmployeeEmail: '',
    location: '',
    kycStatus: '',
    fromDate: '',
    toDate: ''
  });
  const [assignmentData, setAssignmentData] = useState({
    location: '',
    employeeEmail: ''
  });
  const [employees, setEmployees] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const fileInputRef = useRef();

  // Load employees and districts on component mount
  useEffect(() => {
    loadEmployees();
    loadDistricts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmployeeDropdown && !event.target.closest('.custom-dropdown-container')) {
        setShowEmployeeDropdown(false);
      }
      if (showDistrictDropdown && !event.target.closest('.custom-dropdown-container')) {
        setShowDistrictDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmployeeDropdown, showDistrictDropdown]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      const employeeData = response?.data || response || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const getFilteredEmployees = () => {
    if (!exportFilters.assignedEmployeeEmail) return employees;
    const searchValue = exportFilters.assignedEmployeeEmail.toLowerCase();
    return employees.filter(emp => 
      (emp.email || '').toLowerCase().includes(searchValue) ||
      (emp.firstName || '').toLowerCase().includes(searchValue) ||
      (emp.lastName || '').toLowerCase().includes(searchValue) ||
      (emp.employeeId || '').toLowerCase().includes(searchValue)
    );
  };

  const selectEmployee = (email) => {
    setExportFilters(prev => ({ ...prev, assignedEmployeeEmail: email }));
    setShowEmployeeDropdown(false);
  };

  const loadDistricts = async () => {
    try {
      const response = await apiService.getAllFarmers();
      const farmerData = response?.data || response || [];
      
      // Extract unique districts from farmers
      const uniqueDistricts = [...new Set(
        (Array.isArray(farmerData) ? farmerData : [])
          .map(farmer => farmer.district)
          .filter(district => district && district.trim() !== '')
      )].sort();
      
      setDistricts(uniqueDistricts);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    }
  };

  const getFilteredDistricts = () => {
    if (!exportFilters.location) return districts;
    const searchValue = exportFilters.location.toLowerCase();
    return districts.filter(district => 
      district.toLowerCase().includes(searchValue)
    );
  };

  const selectDistrict = (district) => {
    setExportFilters(prev => ({ ...prev, location: district }));
    setShowDistrictDropdown(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid Excel (.xlsx, .xls) or CSV file.');
        event.target.value = '';
      }
    }
  };

  const toPathType = (t) => (t && t.toLowerCase().startsWith('farmer') ? 'farmers' : 'employees');

  const downloadTemplate = async (type) => {
    try {
      const response = await apiService.downloadTemplate(toPathType(type));
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.toLowerCase()}_import_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('autoAssign', false);
      formData.append('assignmentStrategy', 'MANUAL');

      const response = await apiService.bulkImport(toPathType(importType), formData);
      setImportStatus(response);
      
      if (response.status === 'PROCESSING') {
        // Poll for status updates
        pollImportStatus(response.importId);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const pollImportStatus = async (importId) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await apiService.getImportStatus(importId);
        setImportStatus(status);

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling import status:', error);
      }
    };

    setTimeout(poll, 10000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiService.bulkExport(toPathType(importType), exportFilters);
      
      const isExcel = exportFilters.format === 'EXCEL';
      const blob = new Blob([response], { 
        type: isExcel
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = isExcel ? 'xlsx' : 'csv';
      a.download = `${importType.toLowerCase()}_export_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkAssignment = async () => {
    try {
        if (!assignmentData.location?.trim()) {
          alert('Enter a district (location).');
          return;
        }
      
      if (!assignmentData.employeeEmail?.trim()) {
        alert('Enter employee email.');
          return;
        }

      const response = await apiService.bulkAssignFarmersByLocation(assignmentData.location.trim(), assignmentData.employeeEmail.trim());
      alert('Bulk assignment completed successfully');
    } catch (error) {
      console.error('Bulk assignment error:', error);
      alert('Bulk assignment failed: ' + (error.response?.data || error.message));
    }
  };

  return (
    <div className="bulk-operations">
      {!hideHeader && (
        <div className="bulk-header">
          <h2>Bulk Operations</h2>
          <p>Import and export large datasets efficiently</p>
        </div>
      )}

      <div className="bulk-tabs">
        <button 
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 Bulk Import
        </button>
        <button 
          className={`tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📤 Bulk Export
        </button>
        <button 
          className={`tab ${activeTab === 'assignment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignment')}
        >
          👥 Bulk Assignment
        </button>
      </div>

      <div className="bulk-content">
        {activeTab === 'import' && (
          <div className="import-section">
            <div className="section-header">
              <h3>Bulk Import</h3>
              <div className="template-downloads">
                <button 
                  className="template-btn"
                  onClick={() => downloadTemplate('FARMER')}
                >
                  📄 Download Farmer Template
                </button>
              </div>
            </div>

            <div className="import-form">
              <div className="form-group">
                <label>Import Type:</label>
                <select 
                  value={importType} 
                  onChange={(e) => setImportType(e.target.value)}
                >
                  <option value="FARMER">Farmer Data</option>
                </select>
              </div>

              <div className="form-group">
                <label>Select File:</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="file-input"
                />
                {selectedFile && (
                  <p className="file-info">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <button 
                className="import-btn"
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? '🔄 Importing...' : '📥 Start Import'}
              </button>
            </div>

            {importStatus && (
              <div className={`import-status ${importStatus.status.toLowerCase()}`}>
                <h4>Import Status: {importStatus.status}</h4>
                <div className="status-details">
                  <p><strong>Total Records:</strong> {importStatus.totalRecords || 0}</p>
                  <p><strong>Successful:</strong> {importStatus.successfulImports || 0}</p>
                  <p><strong>Failed:</strong> {importStatus.failedImports || 0}</p>
                  <p><strong>Skipped:</strong> {importStatus.skippedRecords || 0}</p>
                  {importStatus.message && (
                    <p><strong>Message:</strong> {importStatus.message}</p>
                  )}
                </div>
                
                {importStatus.errors && importStatus.errors.length > 0 && (
                  <div className="import-errors">
                    <h5>Errors ({importStatus.errors.length}):</h5>
                    <div className="error-list">
                      {importStatus.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="error-item">
                          <span>Row {error.rowNumber}: {error.fieldName}</span>
                          <span>{error.errorMessage}</span>
                        </div>
                      ))}
                      {importStatus.errors.length > 10 && (
                        <p>... and {importStatus.errors.length - 10} more errors</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="export-section">
            <div className="section-header">
              <h3>Bulk Export</h3>
            </div>

            <div className="export-form">
              <div className="form-group">
                <label>Export Type:</label>
                <select 
                  value={importType} 
                  onChange={(e) => setImportType(e.target.value)}
                >
                  <option value="FARMER">Farmer Data</option>
                  {userRole === 'SUPER_ADMIN' && (
                    <option value="EMPLOYEE">Employee Data</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Format:</label>
                <select 
                  value={exportFilters.format} 
                  onChange={(e) => setExportFilters({
                    ...exportFilters, 
                    format: e.target.value
                  })}
                >
                  <option value="EXCEL">Excel (.xlsx)</option>
                  <option value="CSV">CSV (.csv)</option>
                </select>
              </div>

              <div className="form-group">
                <label>ASSIGNED EMPLOYEE EMAIL:</label>
                <div className="custom-dropdown-container">
                  <input
                    type="text"
                    value={exportFilters.assignedEmployeeEmail}
                    onChange={(e) => {
                      setExportFilters({
                        ...exportFilters, 
                        assignedEmployeeEmail: e.target.value
                      });
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="Filter by assigned employee"
                    autoComplete="off"
                  />
                  <button 
                    type="button"
                    className="dropdown-arrow"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                  >
                    <i className={`fas fa-chevron-${showEmployeeDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  {showEmployeeDropdown && (
                    <div className="custom-dropdown-menu">
                      {getFilteredEmployees().length > 0 ? (
                        getFilteredEmployees().map(employee => (
                          <div 
                            key={employee.id || employee.email}
                            className="custom-dropdown-item"
                            onClick={() => selectEmployee(employee.email)}
                          >
                            <div className="employee-dropdown-info">
                              <span className="employee-name">
                                {employee.firstName} {employee.lastName}
                              </span>
                              <span className="employee-email">{employee.email}</span>
                              {employee.employeeId && (
                                <span className="employee-id">ID: {employee.employeeId}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="custom-dropdown-item no-results">
                          No matching employees
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>LOCATION (DISTRICT):</label>
                <div className="custom-dropdown-container">
                  <input
                    type="text"
                    value={exportFilters.location}
                    onChange={(e) => {
                      setExportFilters({
                        ...exportFilters, 
                        location: e.target.value
                      });
                      setShowDistrictDropdown(true);
                    }}
                    onFocus={() => setShowDistrictDropdown(true)}
                    placeholder="Filter by district"
                    autoComplete="off"
                  />
                  <button 
                    type="button"
                    className="dropdown-arrow"
                    onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                  >
                    <i className={`fas fa-chevron-${showDistrictDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  {showDistrictDropdown && (
                    <div className="custom-dropdown-menu">
                      {getFilteredDistricts().length > 0 ? (
                        getFilteredDistricts().map((district, index) => (
                          <div 
                            key={index}
                            className="custom-dropdown-item"
                            onClick={() => selectDistrict(district)}
                          >
                            {district}
                          </div>
                        ))
                      ) : (
                        <div className="custom-dropdown-item no-results">
                          No matching districts
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>KYC Status:</label>
                <select 
                  value={exportFilters.kycStatus} 
                  onChange={(e) => setExportFilters({
                    ...exportFilters, 
                    kycStatus: e.target.value
                  })}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="REFER_BACK">Refer Back</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>From Date:</label>
                  <input
                    type="date"
                    value={exportFilters.fromDate}
                    onChange={(e) => setExportFilters({
                      ...exportFilters, 
                      fromDate: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>To Date:</label>
                  <input
                    type="date"
                    value={exportFilters.toDate}
                    onChange={(e) => setExportFilters({
                      ...exportFilters, 
                      toDate: e.target.value
                    })}
                  />
                </div>
              </div>

              <button 
                className="export-btn"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? '🔄 Exporting...' : '📤 Export Data'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="assignment-section">
            <div className="section-header">
              <h3>Bulk Assignment</h3>
            </div>

            <div className="assignment-form">
                  <div className="form-group">
                    <label>LOCATION (DISTRICT):</label>
                    <div className="custom-dropdown-container">
                      <input
                        type="text"
                        value={assignmentData.location}
                        onChange={(e) => {
                          setAssignmentData({
                            ...assignmentData, 
                            location: e.target.value
                          });
                          setShowDistrictDropdown(true);
                        }}
                        onFocus={() => setShowDistrictDropdown(true)}
                        placeholder="Select district"
                        autoComplete="off"
                      />
                      <button 
                        type="button"
                        className="dropdown-arrow"
                        onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                      >
                        <i className={`fas fa-chevron-${showDistrictDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showDistrictDropdown && (
                        <div className="custom-dropdown-menu">
                          {districts.length > 0 ? (
                            districts.filter(district => 
                              !assignmentData.location || 
                              district.toLowerCase().includes(assignmentData.location.toLowerCase())
                            ).map((district, index) => (
                              <div 
                                key={index}
                                className="custom-dropdown-item"
                                onClick={() => {
                                  setAssignmentData({ ...assignmentData, location: district });
                                  setShowDistrictDropdown(false);
                                }}
                              >
                                {district}
                              </div>
                            ))
                          ) : (
                            <div className="custom-dropdown-item no-results">
                              No districts available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>EMPLOYEE EMAIL:</label>
                    <div className="custom-dropdown-container">
                      <input
                        type="text"
                        value={assignmentData.employeeEmail}
                        onChange={(e) => {
                          setAssignmentData({
                            ...assignmentData, 
                            employeeEmail: e.target.value
                          });
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder="Select employee email"
                        autoComplete="off"
                      />
                      <button 
                        type="button"
                        className="dropdown-arrow"
                        onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                      >
                        <i className={`fas fa-chevron-${showEmployeeDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showEmployeeDropdown && (
                        <div className="custom-dropdown-menu">
                          {employees.filter(emp => 
                            !assignmentData.employeeEmail || 
                            (emp.email || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase()) ||
                            (emp.firstName || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase()) ||
                            (emp.lastName || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase())
                          ).length > 0 ? (
                            employees.filter(emp => 
                              !assignmentData.employeeEmail || 
                              (emp.email || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase()) ||
                              (emp.firstName || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase()) ||
                              (emp.lastName || '').toLowerCase().includes(assignmentData.employeeEmail.toLowerCase())
                            ).map(employee => (
                              <div 
                                key={employee.id || employee.email}
                                className="custom-dropdown-item"
                                onClick={() => {
                                  setAssignmentData({ ...assignmentData, employeeEmail: employee.email });
                                  setShowEmployeeDropdown(false);
                                }}
                              >
                                <div className="employee-dropdown-info">
                                  <span className="employee-name">
                                    {employee.firstName} {employee.lastName}
                                  </span>
                                  <span className="employee-email">{employee.email}</span>
                                  {employee.employeeId && (
                                    <span className="employee-id">ID: {employee.employeeId}</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="custom-dropdown-item no-results">
                              No matching employees
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

              <button 
                className="assignment-btn"
                onClick={handleBulkAssignment}
              >
                👥 Assign Farmers by Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOperations;
