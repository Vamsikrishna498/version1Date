import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOProductsView.css';

const FPOProductsView = ({ fpo, onClose, onToast }) => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showInputShopDropdown, setShowInputShopDropdown] = useState(false);

  // Form state for creating/editing products
  const [formData, setFormData] = useState({
    inputShop: '',
    categoryId: '',
    productName: '',
    quantitySold: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadProducts();
      preloadData();
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
      if (showInputShopDropdown && !event.target.closest('.custom-dropdown-container')) {
        setShowInputShopDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showCategoryDropdown, showInputShopDropdown]);

  const preloadData = async () => {
    try {
      const [shopsRes, categoriesRes] = await Promise.all([
        fpoAPI.getFPOInputShops(fpo.id),
        fpoAPI.getFPOProductCategories(fpo.id)
      ]);
      
      setShops(shopsRes?.data || shopsRes || []);
      setCategories(categoriesRes?.data || categoriesRes || []);
    } catch (error) {
      console.error('Error loading shops and categories:', error);
      setShops([]);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOProducts(fpo.id);
      console.log('Products response:', response);
      
      // Handle different response formats
      const productData = response.data || response || [];
      console.log('Products data:', productData);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.inputShop.trim()) {
      errors.inputShop = 'Input shop is required';
    }
    
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }
    
    if (!formData.productName.trim()) {
      errors.productName = 'Product name is required';
    }
    
    if (!formData.quantitySold || parseFloat(formData.quantitySold) <= 0) {
      errors.quantitySold = 'Valid quantity sold is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productName: formData.productName,
        description: `Sold via ${formData.inputShop}`,
        brand: formData.inputShop || 'N/A',
        unit: 'MT',
        price: 0.01,
        stockQuantity: Math.max(0, Math.floor(parseFloat(formData.quantitySold) || 0)),
        minimumStock: 0,
        supplier: formData.inputShop || 'N/A',
        supplierContact: null,
        supplierAddress: null,
        batchNumber: null,
        expiryDate: null,
        photoFileName: null,
        remarks: null,
        discountPercentage: 0,
        taxPercentage: 0,
      };
      
      console.log('Creating product with data:', payload);
      await fpoAPI.createProduct(fpo.id, payload);
      console.log('Product created successfully');
      
      setShowCreateForm(false);
      setFormData({
        inputShop: '',
        categoryId: '',
        productName: '',
        quantitySold: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadProducts();
      }, 500);
      
      onToast && onToast('success', 'Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      onToast && onToast('error', 'Error creating product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      inputShop: product.brand || product.supplier || '',
      categoryId: (product.categoryId ?? '').toString(),
      productName: product.productName || '',
      quantitySold: (product.stockQuantity ?? '').toString()
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        productName: formData.productName,
        description: `Sold via ${formData.inputShop}`,
        brand: formData.inputShop || 'N/A',
        unit: 'MT',
        price: 0.01,
        stockQuantity: Math.max(0, Math.floor(parseFloat(formData.quantitySold) || 0)),
        minimumStock: 0,
        supplier: formData.inputShop || 'N/A',
        supplierContact: null,
        supplierAddress: null,
        batchNumber: null,
        expiryDate: null,
        photoFileName: null,
        remarks: null,
        discountPercentage: 0,
        taxPercentage: 0,
      };
      
      console.log('Updating product:', editingProduct.id, 'with data:', payload);
      await fpoAPI.updateProduct(fpo.id, editingProduct.id, payload);
      
      setShowCreateForm(false);
      setEditingProduct(null);
      setFormData({
        inputShop: '',
        categoryId: '',
        productName: '',
        quantitySold: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Product updated successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      onToast && onToast('error', 'Error updating product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await fpoAPI.deleteProduct(fpo.id, productId);
        onToast && onToast('success', 'Product deleted successfully!');
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        onToast && onToast('error', 'Error deleting product: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Helper functions for custom dropdowns
  const selectCategory = (categoryId, categoryName) => {
    setFormData(prev => ({ ...prev, categoryId: categoryId.toString() }));
    setShowCategoryDropdown(false);
    if (formErrors.categoryId) {
      setFormErrors(prev => ({ ...prev, categoryId: '' }));
    }
  };

  const selectInputShop = (shopName) => {
    setFormData(prev => ({ ...prev, inputShop: shopName }));
    setShowInputShopDropdown(false);
    if (formErrors.inputShop) {
      setFormErrors(prev => ({ ...prev, inputShop: '' }));
    }
  };

  const getFilteredCategories = () => {
    if (!formData.categoryId) return categories;
    const searchValue = formData.categoryId.toLowerCase();
    return categories.filter(cat => 
      (cat.categoryName || cat.name || '').toLowerCase().includes(searchValue) ||
      cat.id.toString().includes(searchValue)
    );
  };

  const getFilteredShops = () => {
    if (!formData.inputShop) return shops;
    const searchValue = formData.inputShop.toLowerCase();
    return shops.filter(shop => 
      (shop.shopName || shop.name || '').toLowerCase().includes(searchValue)
    );
  };

  const getCategoryDisplayValue = () => {
    if (!formData.categoryId) return '';
    const category = categories.find(c => c.id.toString() === formData.categoryId.toString());
    return category ? (category.categoryName || category.name) : formData.categoryId;
  };

  const filteredProducts = products.filter(product =>
    (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.brand || product.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductIcon = (productName) => {
    const name = productName?.toLowerCase() || '';
    if (name.includes('seed')) return 'fas fa-seeds';
    if (name.includes('fertilizer')) return 'fas fa-seedling';
    if (name.includes('pesticide')) return 'fas fa-shield-alt';
    if (name.includes('bio') || name.includes('organic')) return 'fas fa-leaf';
    if (name.includes('manure')) return 'fas fa-recycle';
    if (name.includes('tool')) return 'fas fa-tools';
    if (name.includes('equipment')) return 'fas fa-cogs';
    if (name.includes('irrigation')) return 'fas fa-tint';
    if (name.includes('machinery')) return 'fas fa-tractor';
    return 'fas fa-box';
  };

  const getProductColor = (productName) => {
    const name = productName?.toLowerCase() || '';
    if (name.includes('seed')) return '#3b82f6';
    if (name.includes('fertilizer')) return '#10b981';
    if (name.includes('pesticide')) return '#f59e0b';
    if (name.includes('bio') || name.includes('organic')) return '#22c55e';
    if (name.includes('manure')) return '#8b5cf6';
    if (name.includes('tool')) return '#6b7280';
    if (name.includes('equipment')) return '#ef4444';
    if (name.includes('irrigation')) return '#06b6d4';
    if (name.includes('machinery')) return '#f97316';
    return '#6366f1';
  };

  const getTotalProducts = () => {
    return products.length;
  };

  const getTotalQuantitySold = () => {
    return products.reduce((total, product) => {
      return total + (parseFloat(product.stockQuantity) || 0);
    }, 0);
  };

  const getProductStats = () => {
    const stats = {
      byCategory: {},
      byShop: {},
      totalValue: 0
    };

    products.forEach(product => {
      const category = product.categoryName || 'Uncategorized';
      const shop = product.brand || product.supplier || 'Unknown';
      const quantity = parseFloat(product.stockQuantity) || 0;
      
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      stats.byShop[shop] = (stats.byShop[shop] || 0) + quantity;
      stats.totalValue += quantity * 0.01; // Assuming price is 0.01 per unit
    });

    return stats;
  };

  const getTopSellingProducts = () => {
    return [...products]
      .sort((a, b) => (parseFloat(b.stockQuantity) || 0) - (parseFloat(a.stockQuantity) || 0))
      .slice(0, 5);
  };

  const getCategoryDistribution = () => {
    const distribution = {};
    products.forEach(product => {
      const category = product.categoryName || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  };

  const stats = getProductStats();
  const topSelling = getTopSellingProducts();
  const categoryDistribution = getCategoryDistribution();

  // Full-page form view (like Turnover form) when creating/editing
  if (showCreateForm) {
    return (
      <div className="fpo-product-form">
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h1>
              <p className="form-subtitle">
                {editingProduct ? 'Update product information' : 'Add a new product for ' + (fpo?.fpoName || 'FPO')}
              </p>
            </div>
            <div className="header-right">
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProduct(null);
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
          <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">INPUT SHOP <span className="required">*</span></label>
                <div className="custom-dropdown-container">
                  <input
                    type="text"
                    value={formData.inputShop}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, inputShop: e.target.value }));
                      setShowInputShopDropdown(true);
                      if (formErrors.inputShop) {
                        setFormErrors(prev => ({ ...prev, inputShop: '' }));
                      }
                    }}
                    onFocus={() => setShowInputShopDropdown(true)}
                    className={`form-input ${formErrors.inputShop ? 'error' : ''}`}
                    placeholder="Select Input Shop"
                    autoComplete="off"
                  />
                  <button 
                    type="button"
                    className="dropdown-arrow"
                    onClick={() => setShowInputShopDropdown(!showInputShopDropdown)}
                  >
                    <i className={`fas fa-chevron-${showInputShopDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  {showInputShopDropdown && (
                    <div className="custom-dropdown-menu">
                      {getFilteredShops().length > 0 ? (
                        getFilteredShops().map(shop => (
                          <div 
                            key={shop.id}
                            className="custom-dropdown-item"
                            onClick={() => selectInputShop(shop.shopName || shop.name || shop.id)}
                          >
                            {shop.shopName || shop.name || shop.id}
                          </div>
                        ))
                      ) : (
                        <div className="custom-dropdown-item no-results">
                          No matching shops
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.inputShop && <span className="error-message">{formErrors.inputShop}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">CATEGORY <span className="required">*</span></label>
                <div className="custom-dropdown-container">
                  <input
                    type="text"
                    value={getCategoryDisplayValue()}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, categoryId: e.target.value }));
                      setShowCategoryDropdown(true);
                      if (formErrors.categoryId) {
                        setFormErrors(prev => ({ ...prev, categoryId: '' }));
                      }
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className={`form-input ${formErrors.categoryId ? 'error' : ''}`}
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
                        getFilteredCategories().map(category => (
                          <div 
                            key={category.id}
                            className="custom-dropdown-item"
                            onClick={() => selectCategory(category.id, category.categoryName || category.name)}
                          >
                            {category.categoryName || category.name}
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
                {formErrors.categoryId && <span className="error-message">{formErrors.categoryId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Product Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className={`form-input ${formErrors.productName ? 'error' : ''}`}
                  placeholder="Enter product name"
                />
                {formErrors.productName && <span className="error-message">{formErrors.productName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Sold (MT) <span className="required">*</span></label>
                <input
                  type="number"
                  value={formData.quantitySold}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantitySold: e.target.value }))}
                  className={`form-input ${formErrors.quantitySold ? 'error' : ''}`}
                  placeholder="Enter quantity sold"
                  min="0"
                  step="0.01"
                />
                {formErrors.quantitySold && <span className="error-message">{formErrors.quantitySold}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProduct(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-box"></i>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fpo-products-view">
      {/* Header Section */}
      <div className="products-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="products-title">Products Management</h1>
            <p className="products-subtitle">Manage products and sales tracking for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="products-content">
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-buttons">
            <button 
              className="create-product-btn"
              onClick={() => {
                setShowCreateForm(true);
                setEditingProduct(null);
                setFormData({
                  inputShop: '',
                  categoryId: '',
                  productName: '',
                  quantitySold: ''
                });
                setFormErrors({});
              }}
            >
              <i className="fas fa-plus-circle"></i>
              Add Product
            </button>
          </div>
          
          <div className="refresh-container">
            <button 
              className="refresh-btn"
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadProducts();
              }}
              title="Refresh products list"
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search products..."
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

        {/* Products Table */}
        <div className="products-table-container">
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Input Shop</th>
                  <th>Category</th>
                  <th>Product Name</th>
                  <th>Quantity Sold (MT)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-box"></i>
                        <p>No products found</p>
                        <span>Try adjusting your search criteria or add a new product</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const productColor = getProductColor(product.productName);
                    const productIcon = getProductIcon(product.productName);
                    
                    return (
                      <tr key={product.id || index} className="product-row">
                        <td className="product-id">{product.id || `P${index + 1}`}</td>
                        <td className="input-shop">
                          <div className="shop-display">
                            <i className="fas fa-store"></i>
                            <span className="shop-text">{product.brand || product.supplier || '-'}</span>
                          </div>
                        </td>
                        <td className="product-category">
                          <span 
                            className="category-badge"
                            style={{ 
                              backgroundColor: `${productColor}20`,
                              color: productColor,
                              border: `1px solid ${productColor}40`
                            }}
                          >
                            {product.categoryName || '-'}
                          </span>
                        </td>
                        <td className="product-name">
                          <div className="product-display">
                            <i className={productIcon} style={{ color: productColor }}></i>
                            <span className="product-text">{product.productName || '-'}</span>
                          </div>
                        </td>
                        <td className="quantity-sold">
                          <div className="quantity-display">
                            <span className="quantity-number">{(parseFloat(product.stockQuantity) || 0).toFixed(2)}</span>
                            <span className="quantity-unit">MT</span>
                          </div>
                        </td>
                        <td className="product-actions">
                          <div className="action-dropdown">
                            <button 
                              className="dropdown-toggle"
                              onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {activeDropdown === product.id && (
                              <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                                <button 
                                  className="dropdown-item-enhanced edit-item"
                                  onClick={() => {
                                    handleEditProduct(product);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </button>
                                <button 
                                  className="dropdown-item-enhanced delete-item"
                                  onClick={() => {
                                    handleDeleteProduct(product.id);
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
              <i className="fas fa-box"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getTotalProducts()}</span>
              <span className="stat-label">Total Products</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-weight-hanging"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getTotalQuantitySold().toFixed(1)}</span>
              <span className="stat-label">Total Quantity (MT)</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-store"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{Object.keys(stats.byShop).length}</span>
              <span className="stat-label">Input Shops</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-tags"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{Object.keys(stats.byCategory).length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </div>

        {/* Products Overview */}
        {products.length > 0 && (
          <div className="products-overview">
            <div className="overview-header">
              <h3>Products Analytics</h3>
              <p>Overview of product distribution and sales performance</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Total Sales Volume</span>
                  <span className="overview-value">
                    {getTotalQuantitySold().toFixed(2)} MT
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Top Selling</span>
                  <span className="overview-value">
                    {topSelling[0]?.productName || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-layer-group"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Categories</span>
                  <span className="overview-value">
                    {Object.keys(categoryDistribution).length} Types
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
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProduct(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="inputShop" className="form-label">
                    INPUT SHOP <span className="required">*</span>
                  </label>
                  <div className="custom-dropdown-container">
                    <input
                      type="text"
                      id="inputShop"
                      value={formData.inputShop}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, inputShop: e.target.value }));
                        setShowInputShopDropdown(true);
                        if (formErrors.inputShop) {
                          setFormErrors(prev => ({ ...prev, inputShop: '' }));
                        }
                      }}
                      onFocus={() => setShowInputShopDropdown(true)}
                      className={`form-input ${formErrors.inputShop ? 'error' : ''}`}
                      placeholder="Select Input Shop"
                      autoComplete="off"
                    />
                    <button 
                      type="button"
                      className="dropdown-arrow"
                      onClick={() => setShowInputShopDropdown(!showInputShopDropdown)}
                    >
                      <i className={`fas fa-chevron-${showInputShopDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    {showInputShopDropdown && (
                      <div className="custom-dropdown-menu">
                        {getFilteredShops().length > 0 ? (
                          getFilteredShops().map(shop => (
                            <div 
                              key={shop.id}
                              className="custom-dropdown-item"
                              onClick={() => selectInputShop(shop.shopName || shop.name || shop.id)}
                            >
                              {shop.shopName || shop.name || shop.id}
                            </div>
                          ))
                        ) : (
                          <div className="custom-dropdown-item no-results">
                            No matching shops
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.inputShop && <span className="error-message">{formErrors.inputShop}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="categoryId" className="form-label">
                    CATEGORY <span className="required">*</span>
                  </label>
                  <div className="custom-dropdown-container">
                    <input
                      type="text"
                      id="categoryId"
                      value={getCategoryDisplayValue()}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, categoryId: e.target.value }));
                        setShowCategoryDropdown(true);
                        if (formErrors.categoryId) {
                          setFormErrors(prev => ({ ...prev, categoryId: '' }));
                        }
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      className={`form-input ${formErrors.categoryId ? 'error' : ''}`}
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
                          getFilteredCategories().map(category => (
                            <div 
                              key={category.id}
                              className="custom-dropdown-item"
                              onClick={() => selectCategory(category.id, category.categoryName || category.name)}
                            >
                              {category.categoryName || category.name}
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
                  {formErrors.categoryId && <span className="error-message">{formErrors.categoryId}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="productName" className="form-label">
                    Product Name <span className="required">*</span>
                  </label>
                  <input
                    id="productName"
                    type="text"
                    value={formData.productName}
                    onChange={(e) => updateField('productName', e.target.value)}
                    className={`form-input ${formErrors.productName ? 'error' : ''}`}
                    placeholder="Enter product name"
                  />
                  {formErrors.productName && <span className="error-message">{formErrors.productName}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="quantitySold" className="form-label">
                    Quantity Sold (MT) <span className="required">*</span>
                  </label>
                  <input
                    id="quantitySold"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantitySold}
                    onChange={(e) => updateField('quantitySold', e.target.value)}
                    className={`form-input ${formErrors.quantitySold ? 'error' : ''}`}
                    placeholder="Enter quantity sold"
                  />
                  {formErrors.quantitySold && <span className="error-message">{formErrors.quantitySold}</span>}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProduct(null);
                    setFormErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <i className="fas fa-box"></i>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOProductsView;
