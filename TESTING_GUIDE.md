# MkulimaLink - Comprehensive Testing Guide

## Testing Infrastructure Setup

### Backend Testing

#### Unit Tests
```bash
npm install --save-dev jest supertest
npm test
```

#### Test Coverage
```bash
npm test -- --coverage
```

### Frontend Testing

#### Component Tests
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm test
```

---

## Manual Testing Checklist

### Phase 1: Authentication Testing

#### Registration Flow
- [ ] Register with valid email and password
- [ ] Verify password validation (min 6 characters)
- [ ] Verify email uniqueness check
- [ ] Verify phone number validation
- [ ] Test 3-step registration process
- [ ] Verify role selection (farmer/buyer/supplier)
- [ ] Verify location selection
- [ ] Verify farm details for farmers
- [ ] Verify business details for buyers

#### Login Flow
- [ ] Login with correct credentials
- [ ] Verify error on wrong password
- [ ] Verify error on non-existent email
- [ ] Verify JWT token generation
- [ ] Verify token storage in localStorage
- [ ] Test token refresh mechanism
- [ ] Test logout functionality
- [ ] Verify session persistence

#### Profile Management
- [ ] Update user profile information
- [ ] Change location
- [ ] Update farm/business details
- [ ] Verify profile changes persist
- [ ] Test notification preferences

---

### Phase 2: Product Management Testing

#### Product Listing
- [ ] Create product with all required fields
- [ ] Upload single image
- [ ] Upload multiple images (up to 5)
- [ ] Verify image size validation (5MB limit)
- [ ] Verify image format validation (JPEG, PNG, WebP)
- [ ] Test product categorization
- [ ] Verify quality level selection
- [ ] Test organic certification checkbox
- [ ] Verify harvest date selection
- [ ] Test location auto-fill from user profile

#### Product Management
- [ ] View own product listings
- [ ] Edit product details
- [ ] Update product price
- [ ] Update product quantity
- [ ] Change product status (active/sold/reserved)
- [ ] Delete product
- [ ] Verify seller can only edit own products

#### Product Browsing
- [ ] View all products
- [ ] View product details
- [ ] See seller information
- [ ] View product images
- [ ] Check product availability
- [ ] Add product to favorites
- [ ] Remove from favorites

---

### Phase 3: Payment Integration Testing

#### Payment Initiation
- [ ] Create order with valid product
- [ ] Select payment method (TigoPesa/HaloPesa/Airtel Money)
- [ ] Enter phone number
- [ ] Verify phone number formatting
- [ ] Initiate payment via Click Pesa
- [ ] Verify transaction ID generation

#### Payment Status
- [ ] Check payment status after initiation
- [ ] Verify pending status
- [ ] Verify success status
- [ ] Verify failed status
- [ ] Test payment callback handling
- [ ] Verify order status updates

#### Refund Processing
- [ ] Initiate refund for completed transaction
- [ ] Verify refund amount
- [ ] Check refund status
- [ ] Verify seller receives notification

---

### Phase 4: Advanced Search Testing

#### Search Functionality
- [ ] Search by product name
- [ ] Verify autocomplete suggestions
- [ ] Test search with special characters
- [ ] Verify search results accuracy

#### Filtering
- [ ] Filter by category
- [ ] Filter by region
- [ ] Filter by price range
- [ ] Filter by quality level
- [ ] Filter organic products only
- [ ] Combine multiple filters
- [ ] Verify filter results accuracy

#### Sorting
- [ ] Sort by newest first
- [ ] Sort by price (low to high)
- [ ] Sort by price (high to low)
- [ ] Sort by most popular
- [ ] Sort by highest rated

#### Pagination
- [ ] Navigate between pages
- [ ] Verify correct number of results per page
- [ ] Test page boundaries
- [ ] Verify total count accuracy

---

## Test Data

### Test Users

#### Farmer Account
```json
{
  "name": "John Farmer",
  "email": "farmer@test.com",
  "phone": "+255712345678",
  "password": "Test@123",
  "role": "farmer",
  "location": {
    "region": "Dar es Salaam",
    "district": "Ilala"
  },
  "farmDetails": {
    "farmSize": 5,
    "crops": ["tomatoes", "onions"],
    "farmingMethod": "organic"
  }
}
```

#### Buyer Account
```json
{
  "name": "Jane Buyer",
  "email": "buyer@test.com",
  "phone": "+255787654321",
  "password": "Test@123",
  "role": "buyer",
  "location": {
    "region": "Morogoro",
    "district": "Morogoro"
  },
  "businessDetails": {
    "businessName": "Fresh Foods Ltd",
    "businessType": "Retailer"
  }
}
```

### Test Products

```json
{
  "name": "Test Tomatoes",
  "category": "vegetables",
  "description": "Fresh organic tomatoes",
  "price": 2500,
  "unit": "kg",
  "quantity": 100,
  "quality": "premium",
  "organic": true,
  "location": {
    "region": "Dar es Salaam",
    "district": "Ilala"
  }
}
```

### Test Payments

```json
{
  "amount": 2500,
  "phoneNumber": "+255712345678",
  "paymentMethod": "tigopesa",
  "orderId": "ORD-001",
  "description": "Test payment for tomatoes"
}
```

---

## API Testing with Postman

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+255712345678",
  "password": "Test@123",
  "role": "farmer",
  "location": {
    "region": "Dar es Salaam"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123"
}
```

#### Get Profile
```
GET /api/auth/me
Authorization: Bearer {token}
```

---

## Performance Testing

### Load Testing
```bash
npm install -g artillery
artillery quick --count 100 --num 10 https://mkulimalink-api-aa384e99a888.herokuapp.com/api/products
```

### Response Time Targets
- Authentication endpoints: <200ms
- Product listing: <500ms
- Search: <1000ms
- Payment: <2000ms

---

## Security Testing

### OWASP Top 10 Checks
- [ ] SQL Injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] Sensitive data exposure
- [ ] Broken access control
- [ ] Security misconfiguration

### Penetration Testing
- [ ] Test JWT token manipulation
- [ ] Test API rate limiting
- [ ] Test input validation
- [ ] Test file upload security
- [ ] Test CORS configuration

---

## Bug Reporting Template

```markdown
## Bug Report

**Title**: [Brief description]

**Severity**: Critical/High/Medium/Low

**Environment**: 
- Browser/Device: 
- OS: 
- Version: 

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:

**Actual Result**:

**Screenshots/Logs**:

**Additional Notes**:
```

---

## Test Results Dashboard

### Current Status
- Authentication: ✅ Ready for testing
- Product Management: ✅ Ready for testing
- Payment Integration: ✅ Ready for testing
- Advanced Search: ✅ Ready for testing
- Analytics: 🔄 In development
- Mobile App: 🔄 In development

### Coverage Goals
- Backend: 80%+ coverage
- Frontend: 70%+ coverage
- Critical paths: 100% coverage

---

## Continuous Integration

### GitHub Actions Setup
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## Deployment Testing

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Code coverage acceptable
- [ ] No security vulnerabilities
- [ ] Performance targets met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Backups created

### Post-deployment Verification
- [ ] Health check endpoint responding
- [ ] All APIs functioning
- [ ] Database connected
- [ ] Payments processing
- [ ] Notifications sending
- [ ] Analytics tracking
- [ ] Error logging working
- [ ] Monitoring alerts active
