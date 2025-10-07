# 🚀 Code Review Quick Reference Card

## 🔴 Top 5 Critical Fixes (DO FIRST!)

### 1. Remove Duplicate AuthContext ⚠️
```bash
rm src/AuthContext.js
```

### 2. Secure Hardcoded Credentials 🔐
```bash
# Delete or move to private location
rm HARDCODED_CREDENTIALS.md
```

### 3. Fix JWT Secret 🔑
```javascript
// backend-example/server.js
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set!');
}
```

### 4. Add Error Boundary 🛡️
```javascript
// Wrap your app in App.js
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 5. Create Logger Utility 📝
```javascript
// src/utils/logger.js
export const logger = {
  log: (...args) => 
    process.env.NODE_ENV === 'development' && console.log(...args)
};

// Replace: console.log() → logger.log()
```

---

## 📋 Daily Checklist for New Code

```
Before committing code, ask yourself:

Security:
□ No hardcoded credentials?
□ Input validated?
□ Error messages safe?

Code Quality:
□ No console.log in production?
□ DRY principle followed?
□ Functions < 50 lines?
□ Components < 300 lines?

Testing:
□ Unit tests written?
□ Edge cases covered?
□ Tests passing?

Performance:
□ No unnecessary re-renders?
□ Loading states added?
□ Errors handled gracefully?
```

---

## 🎯 Code Review Priorities

| Priority | Issue | Time to Fix |
|----------|-------|-------------|
| 🔴 P0 | Hardcoded credentials | 15 min |
| 🔴 P0 | Duplicate AuthContext | 5 min |
| 🔴 P0 | Weak JWT secret | 10 min |
| 🟡 P1 | Console.log statements | 2 hours |
| 🟡 P1 | Error boundaries | 30 min |
| 🟡 P1 | Input validation | 3 hours |
| 🟢 P2 | Unit tests | 1 week |
| 🟢 P2 | Refactor large components | 2 weeks |

---

## 💻 Useful Commands

### Development
```bash
# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Git Operations
```bash
# Stage files
git add .

# Commit with message
git commit -m "fix: remove hardcoded credentials"

# Push changes
git push origin main

# Create new branch
git checkout -b fix/security-issues
```

### Finding Issues
```bash
# Find all console.log
grep -r "console\.log" src/

# Find all TODO comments
grep -r "TODO" src/

# Find all hardcoded passwords
grep -ri "password.*=.*['\"]" src/

# Count lines of code
find src -name '*.js' -o -name '*.jsx' | xargs wc -l
```

---

## 🔧 Quick Fixes

### Replace console.log
```javascript
// BEFORE
console.log('User logged in:', user);
console.error('Error:', error);

// AFTER
import logger from './utils/logger';
logger.log('User logged in:', user);
logger.error('Error:', error);
```

### Add Input Validation
```javascript
// BEFORE
const handleSubmit = (email) => {
  api.register(email);
};

// AFTER
const handleSubmit = (email) => {
  if (!validateEmail(email)) {
    setError('Invalid email address');
    return;
  }
  api.register(email);
};
```

### Add Loading State
```javascript
// BEFORE
const fetchData = async () => {
  const data = await api.getData();
  setData(data);
};

// AFTER
const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await api.getData();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Add Error Handling
```javascript
// BEFORE
const handleClick = () => {
  api.deleteUser(userId);
};

// AFTER
const handleClick = async () => {
  try {
    await api.deleteUser(userId);
    toast.success('User deleted successfully');
  } catch (err) {
    toast.error(err.message || 'Failed to delete user');
  }
};
```

---

## 🧪 Testing Examples

### Test a Component
```javascript
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Test User Interaction
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';

test('submits form with credentials', () => {
  const onSubmit = jest.fn();
  render(<LoginForm onSubmit={onSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByText(/login/i));
  
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### Test API Call
```javascript
import { render, waitFor } from '@testing-library/react';
import UserList from './UserList';
import * as api from './api';

jest.mock('./api');

test('loads and displays users', async () => {
  api.getUsers.mockResolvedValue([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]);
  
  render(<UserList />);
  
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });
});
```

---

## 🎨 Code Style

### Naming Conventions
```javascript
// Components: PascalCase
const UserProfile = () => { };

// Functions: camelCase
const getUserData = () => { };

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Variables: camelCase
const userEmail = 'test@example.com';

// Files: PascalCase for components, camelCase for utils
UserProfile.jsx
apiService.js
```

### File Organization
```
src/
├── components/       # Reusable UI components
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.css
│   │   └── Button.test.js
│   └── ...
├── pages/           # Page-level components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── api/             # API service layer
├── assets/          # Images, fonts, etc.
├── styles/          # Global styles
└── constants/       # App constants
```

### Import Order
```javascript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal dependencies
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

// 3. Utils and helpers
import { formatDate } from '../utils/dateUtils';
import logger from '../utils/logger';

// 4. Styles
import './UserProfile.css';

// 5. Assets
import logo from '../assets/logo.png';
```

---

## 🔐 Security Checklist

```
Authentication & Authorization:
□ JWT tokens stored securely (httpOnly cookies preferred)
□ Protected routes implemented
□ Role-based access control working
□ Session timeout implemented

Input Validation:
□ Email format validated
□ Phone number format validated
□ Password strength enforced
□ File upload size limited
□ File upload type restricted

Output Security:
□ XSS prevention (React handles this)
□ Error messages don't expose internals
□ API responses sanitized
□ No sensitive data in logs

Environment:
□ No credentials in code
□ Environment variables used
□ .env files in .gitignore
□ Secure JWT secret (32+ chars)
```

---

## 📊 Performance Tips

### Optimize Re-renders
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### Code Splitting
```javascript
// Instead of:
import HeavyComponent from './HeavyComponent';

// Use:
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Wrap with Suspense:
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

### Virtual Scrolling
```javascript
// For large lists, use react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>Item {index}</div>
  )}
</FixedSizeList>
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Tests failing | `npm test -- --clearCache` |
| ESLint errors | `npm run lint -- --fix` |
| Git hooks not working | `npx husky install` |
| Module not found | `rm -rf node_modules && npm install` |
| Build failing | Check `.env` variables |
| API 401 errors | Check if token is expired |
| React hydration error | Check for SSR mismatches |
| Performance issues | Use React DevTools Profiler |

---

## 📞 Getting Help

### Before Asking for Help:
1. ✅ Read the error message carefully
2. ✅ Check the browser console
3. ✅ Search in this repository's issues
4. ✅ Google the error message
5. ✅ Check Stack Overflow

### When Asking for Help:
- Describe what you're trying to do
- Share the exact error message
- Include relevant code snippets
- Mention what you've already tried
- Specify your environment (OS, Node version, etc.)

---

## 🎯 Success Metrics

Track these metrics to measure improvement:

```
Before Fixes:
❌ 0% test coverage
❌ 47+ console.log statements
❌ 3 critical security issues
❌ No error boundaries
❌ Hardcoded credentials

After Fixes (Target):
✅ 50%+ test coverage
✅ 0 console.log in production
✅ 0 security issues
✅ Error boundaries implemented
✅ No hardcoded credentials
```

---

## 📚 Learning Path

### Week 1: Security Basics
- [ ] OWASP Top 10
- [ ] JWT Authentication
- [ ] Input Validation

### Week 2: Testing
- [ ] Jest basics
- [ ] React Testing Library
- [ ] Writing good tests

### Week 3: Performance
- [ ] React optimization
- [ ] Bundle analysis
- [ ] Lazy loading

### Week 4: Best Practices
- [ ] Clean code principles
- [ ] Design patterns
- [ ] Code review skills

---

**Print this card and keep it handy! 📌**

*Last updated: October 7, 2025*

