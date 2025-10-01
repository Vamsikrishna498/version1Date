import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOProductCategoriesView.css';

const FPOProductCategoriesView = ({ fpo, onClose, onToast }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Predefined category options
  const CATEGORY_OPTIONS = [
    'Urea',
    'Fertilizers',
    'Pesticides',
    'Bio-stimulants',
    'Manure - FYM/Poultry manure'
  ];

  // Form state for creating/editing product categories
  const [formData, setFormData] = useState({
    categoryName: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadCategories();
    }
  }, [fpo?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
      if (showCategoryDropdown && !event.target.closest('.custom-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showCategoryDropdown]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('Loading product categories for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOProductCategories(fpo.id);
      console.log('Product categories response:', response);
      
      // Handle different response formats
      const categoryData = response.data || response || [];
      console.log('Product categories data:', categoryData);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      console.error('Error loading product categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.categoryName.trim()) {
      errors.categoryName = 'Category name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        categoryName: formData.categoryName
      };
      
      console.log('Creating product category with data:', payload);
      await fpoAPI.createProductCategory(fpo.id, payload);
      console.log('Product category created successfully');
      
      setShowCreateForm(false);
      setFormData({
        categoryName: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadCategories();
      }, 500);
      
      onToast && onToast('success', 'Product Category created successfully!');
    } catch (error) {
      console.error('Error creating product category:', error);
      onToast && onToast('error', 'Error creating category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName || ''
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        categoryName: formData.categoryName
      };
      
      console.log('Updating product category:', editingCategory.id, 'with data:', payload);
      await fpoAPI.updateProductCategory(fpo.id, editingCategory.id, payload);
      
      setShowCreateForm(false);
      setEditingCategory(null);
      setFormData({
        categoryName: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Product Category updated successfully!');
      loadCategories();
    } catch (error) {
      console.error('Error updating product category:', error);
      onToast && onToast('error', 'Error updating category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this product category?')) {
      try {
        await fpoAPI.deleteProductCategory(fpo.id, categoryId);
        onToast && onToast('success', 'Product Category deleted successfully!');
        loadCategories();
      } catch (error) {
        console.error('Error deleting product category:', error);
        onToast && onToast('error', 'Error deleting category: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Show dropdown when typing in category field
    if (field === 'categoryName') {
      setShowCategoryDropdown(true);
    }
  };

  const selectCategory = (category) => {
    setFormData(prev => ({ ...prev, categoryName: category }));
    setShowCategoryDropdown(false);
    if (formErrors.categoryName) {
      setFormErrors(prev => ({ ...prev, categoryName: '' }));
    }
  };

  const getFilteredCategories = () => {
    if (!formData.categoryName) return CATEGORY_OPTIONS;
    return CATEGORY_OPTIONS.filter(cat => 
      cat.toLowerCase().includes(formData.categoryName.toLowerCase())
    );
  };

  const filteredCategories = categories.filter(category =>
    (category.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('fertilizer')) return 'fas fa-seedling';
    if (name.includes('pesticide')) return 'fas fa-shield-alt';
    if (name.includes('bio') || name.includes('organic')) return 'fas fa-leaf';
    if (name.includes('manure')) return 'fas fa-recycle';
    if (name.includes('seed')) return 'fas fa-seeds';
    if (name.includes('irrigation')) return 'fas fa-tint';
    if (name.includes('tool') || name.includes('equipment')) return 'fas fa-tools';
    if (name.includes('machinery')) return 'fas fa-cogs';
    if (name.includes('soil')) return 'fas fa-mountain';
    return 'fas fa-tags';
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('fertilizer')) return '#10b981';
    if (name.includes('pesticide')) return '#f59e0b';
    if (name.includes('bio') || name.includes('organic')) return '#22c55e';
    if (name.includes('manure')) return '#8b5cf6';
    if (name.includes('seed')) return '#3b82f6';
    if (name.includes('irrigation')) return '#06b6d4';
    if (name.includes('tool') || name.includes('equipment')) return '#6b7280';
    if (name.includes('machinery')) return '#ef4444';
    if (name.includes('soil')) return '#92400e';
    return '#6366f1';
  };

  // Full-page form view (like Turnover form) when creating/editing
  if (showCreateForm) {
    return (
      <div className="fpo-product-category-form">
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">{editingCategory ? 'Edit Product Category' : 'Add New Product Category'}</h1>
              <p className="form-subtitle">
                {editingCategory ? 'Update product category information' : 'Add a new category for Food Product'}
              </p>
            </div>
            <div className="header-right">
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  setFormErrors({});
                }}
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="form-content">
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="category-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="categoryName" className="form-label">CATEGORY NAME <span className="required">*</span></label>
                <div className="custom-dropdown-container">
                  <input
                    type="text"
                    id="categoryName"
                    value={formData.categoryName}
                    onChange={(e) => updateField('categoryName', e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className={`form-input ${formErrors.categoryName ? 'error' : ''}`}
                    placeholder="Select Category"
                    autoComplete="off"
                  />
                  <button 
                    type="button"
                    className="dropdown-arrow"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <i className={`fas fa-chevron-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  {showCategoryDropdown && (
                    <div className="custom-dropdown-menu">
                      {getFilteredCategories().length > 0 ? (
                        getFilteredCategories().map(option => (
                          <div 
                            key={option}
                            className="custom-dropdown-item"
                            onClick={() => selectCategory(option)}
                          >
                            {option}
                          </div>
                        ))
                      ) : (
                        <div className="custom-dropdown-item no-results">
                          No matching categories
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.categoryName && <span className="error-message">{formErrors.categoryName}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-plus"></i>
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const getTotalCategories = () => {
    return categories.length;
  };

  const getPopularCategories = () => {
    // This would typically be based on actual product counts
    // For now, return the first 3 categories as "popular"
    return categories.slice(0, 3);
  };

  const getCategoryStats = () => {
    const stats = {
      fertilizers: 0,
      pesticides: 0,
      organic: 0,
      others: 0
    };

    categories.forEach(category => {
      const name = category.categoryName?.toLowerCase() || '';
      if (name.includes('fertilizer')) stats.fertilizers++;
      else if (name.includes('pesticide')) stats.pesticides++;
      else if (name.includes('organic') || name.includes('bio')) stats.organic++;
      else stats.others++;
    });

    return stats;
  };

  return (
    <div className="fpo-product-categories-view">
      {/* Header Section */}
      <div className="product-categories-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="product-categories-title">Product Categories Management</h1>
            <p className="product-categories-subtitle">Manage product categories and classifications for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="product-categories-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button 
            className="create-category-btn"
            onClick={() => {
              setShowCreateForm(true);
              setEditingCategory(null);
              setFormData({
                categoryName: ''
              });
              setFormErrors({});
            }}
          >
            <i className="fas fa-tags"></i>
            Add Category
          </button>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="date-filter-container">
              <i className="fas fa-calendar-alt calendar-icon"></i>
              <input
                type="text"
                placeholder="Date range filter"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="date-filter-input"
              />
            </div>
          </div>
        </div>

        {/* Product Categories Table */}
        <div className="product-categories-table-container">
          <div className="table-wrapper">
            <table className="product-categories-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading categories...
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-tags"></i>
                        <p>No product categories found</p>
                        <span>Try adjusting your search criteria or add a new category</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category, index) => {
                    const categoryColor = getCategoryColor(category.categoryName);
                    const categoryIcon = getCategoryIcon(category.categoryName);
                    
                    return (
                      <tr key={category.id || index} className="category-row">
                        <td className="category-id">{category.id || `C${index + 1}`}</td>
                        <td className="category-name">
                          <div className="category-display">
                            <i className={categoryIcon} style={{ color: categoryColor }}></i>
                            <span className="category-text">{category.categoryName || '-'}</span>
                          </div>
                        </td>
                        <td className="category-type">
                          <span 
                            className="category-type-badge"
                            style={{ 
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor,
                              border: `1px solid ${categoryColor}40`
                            }}
                          >
                            {category.categoryName?.includes('Organic') || category.categoryName?.includes('Bio') ? 'Organic' : 
                             category.categoryName?.includes('Fertilizer') ? 'Fertilizer' :
                             category.categoryName?.includes('Pesticide') ? 'Pesticide' :
                             category.categoryName?.includes('Seed') ? 'Seed' :
                             category.categoryName?.includes('Tool') || category.categoryName?.includes('Equipment') ? 'Equipment' :
                             'Other'}
                          </span>
                        </td>
                        <td className="category-actions">
                          <div className="action-dropdown">
                            <button 
                              className="dropdown-toggle"
                              onClick={() => setActiveDropdown(activeDropdown === category.id ? null : category.id)}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {activeDropdown === category.id && (
                              <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                                <button 
                                  className="dropdown-item-enhanced edit-item"
                                  onClick={() => {
                                    handleEditCategory(category);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </button>
                                <button 
                                  className="dropdown-item-enhanced delete-item"
                                  onClick={() => {
                                    handleDeleteCategory(category.id);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-tags"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getTotalCategories()}</span>
              <span className="stat-label">Total Categories</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getCategoryStats().fertilizers}</span>
              <span className="stat-label">Fertilizers</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getCategoryStats().pesticides}</span>
              <span className="stat-label">Pesticides</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getCategoryStats().organic}</span>
              <span className="stat-label">Organic</span>
            </div>
          </div>
        </div>

        {/* Category Overview */}
        {categories.length > 0 && (
          <div className="category-overview">
            <div className="overview-header">
              <h3>Category Distribution</h3>
              <p>Overview of product category distribution and classification</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Category Diversity</span>
                  <span className="overview-value">
                    {categories.length} Different Types
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Popular Categories</span>
                  <span className="overview-value">
                    {getPopularCategories().length} Active
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Expandable</span>
                  <span className="overview-value">
                    {CATEGORY_OPTIONS.length - categories.length} Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingCategory ? 'Edit Product Category' : 'Add New Product Category'}</h3>
              <button 
                className="close-button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="form-modal-body">
              {!editingCategory && <p className="form-subtitle">Add a new category for Food Product</p>}
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="product-category-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="categoryName" className="form-label">
                      CATEGORY NAME <span className="required">*</span>
                    </label>
                    <div className="custom-dropdown-container">
                      <input
                        type="text"
                        id="categoryName"
                        value={formData.categoryName}
                        onChange={(e) => updateField('categoryName', e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        className={`form-input ${formErrors.categoryName ? 'error' : ''}`}
                        placeholder="Select Category"
                        autoComplete="off"
                      />
                      <button 
                        type="button"
                        className="dropdown-arrow"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      >
                        <i className={`fas fa-chevron-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showCategoryDropdown && (
                        <div className="custom-dropdown-menu">
                          {getFilteredCategories().length > 0 ? (
                            getFilteredCategories().map(option => (
                              <div 
                                key={option}
                                className="custom-dropdown-item"
                                onClick={() => selectCategory(option)}
                              >
                                {option}
                              </div>
                            ))
                          ) : (
                            <div className="custom-dropdown-item no-results">
                              No matching categories
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.categoryName && <span className="error-message">{formErrors.categoryName}</span>}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCategory(null);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOProductCategoriesView;
