# AgriStack Farmer Management System

A comprehensive React.js frontend application for managing agricultural farmers with role-based access control, KYC processing, and real-time dashboard features.

## 🌾 Features

### 🔒 Admin Dashboard
- **Full visibility** into data and assignment (no delete access)
- **View All Farmer & Employee Profiles** with separate tables/tabs
- **Advanced Filters**: State, District, Region, KYC Status, Assignment Status
- **Add Farmer / Add Employee** with embedded forms
- **Assign Farmers to Employees** with multi-select functionality
- **Track KYC Progress by Employee** with detailed breakdowns
- **Admin To-Do List Panel** showing unassigned farmers and overdue cases
- **Filter by Employee** with dropdown selection

### 🔥 SuperAdmin Dashboard
- **Inherits all Admin features** plus additional capabilities
- **Delete Access** for farmer profiles, employee profiles, and user accounts
- **Confirm delete modal** with optional reason logging
- **Audit Trail View** showing deleted records with filters
- **Role-based access control** using ROLE_SUPERADMIN

### 🧑‍💼 Employee Dashboard
- **Focused on KYC review** and task tracking
- **View Assigned Farmers** with color-coded status indicators
- **KYC Actions**: Approve, Refer Back, Reject with reasons
- **To-Do Panel** for new assignments and pending reviews
- **Stats Summary** with progress visualization
- **Real-time sync** with admin/superadmin dashboards

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agristack-farmer-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔐 Demo Credentials

### Login Credentials
Demo credentials are available for testing purposes. Please contact your system administrator for access credentials.

**Security Note:** Never commit real credentials to the repository. Use environment variables for sensitive information.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── StatsCard.jsx
│   ├── DataTable.jsx
│   ├── FarmerForm.jsx
│   ├── EmployeeForm.jsx
│   ├── AssignmentModal.jsx
│   ├── KYCModal.jsx
│   ├── DeleteModal.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React Context providers
│   └── AuthContext.js
├── pages/              # Main application pages
│   ├── Login.jsx
│   ├── AdminDashboard.jsx
│   ├── SuperAdminDashboard.jsx
│   └── EmployeeDashboard.jsx
├── styles/             # CSS stylesheets
│   ├── Login.css
│   ├── Dashboard.css
│   └── Forms.css
├── App.js              # Main application component
├── App.css             # Global styles
└── index.js            # Application entry point
```

## 🎨 Features Overview

### Role-Based Access Control
- **ADMIN**: Full visibility, no delete access
- **SUPER_ADMIN**: All admin features + delete capabilities
- **EMPLOYEE**: KYC-focused dashboard with assignment management

### Dashboard Features
- **Real-time Statistics** with animated cards
- **Interactive Data Tables** with sorting and filtering
- **Modal Forms** for adding/editing data
- **Progress Tracking** with visual indicators
- **Responsive Design** for all screen sizes

### KYC Management
- **Status Tracking**: Approved, Pending, Refer Back, Rejected
- **Assignment System**: Farmers assigned to employees
- **Progress Monitoring**: Real-time updates across dashboards
- **Reason Logging**: Detailed notes for status changes

### Data Management
- **Farmer Profiles**: Complete agricultural information
- **Employee Management**: Role-based access and performance tracking
- **Assignment Tracking**: Employee-farmer relationships
- **Audit Trail**: Complete history of changes and deletions

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **React Router 6** - Client-side routing
- **CSS3** - Modern styling with gradients and animations
- **JavaScript ES6+** - Modern JavaScript features
- **Local Storage** - Client-side data persistence

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🔧 Customization

### Adding New Features
1. Create new components in `src/components/`
2. Add corresponding styles in `src/styles/`
3. Update routing in `App.js`
4. Add role-based access control in `ProtectedRoute.jsx`

### Styling
- All styles use modern CSS with gradients and animations
- Color scheme can be customized in CSS variables
- Responsive breakpoints are defined for mobile-first design

### Data Integration
- Replace mock data with actual API calls
- Update authentication logic in `AuthContext.js`
- Modify form validation schemas as needed

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The build folder can be deployed to:
- Netlify
- Vercel
- AWS S3
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with complete dashboard functionality
- Role-based access control
- KYC management system
- Real-time statistics
- Responsive design

---

**Built with ❤️ for Agricultural Excellence**