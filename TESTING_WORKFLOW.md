# 1Uptrade-v3 Comprehensive Testing Workflow

## Overview
This document provides a comprehensive testing workflow for the 1Uptrade-v3 compensation plan system, covering all major features and user flows.

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend application running on `http://localhost:3000`
- MongoDB database connected and accessible
- Test user accounts created

## Testing Environment Setup

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 2. Create Test Accounts
- **Admin Account**: For managing the system
- **Primary User**: For testing main features
- **Referral Users**: For testing referral system (at least 3 users)

## Core Feature Testing

### 1. User Registration & Authentication

#### Test Cases:
- [ ] **Registration with Referral Link**
  - Navigate to registration page with referral code
  - Fill out registration form
  - Verify account creation
  - Verify referral relationship is established

- [ ] **Login/Logout Functionality**
  - Test valid credentials
  - Test invalid credentials
  - Test session persistence
  - Test logout functionality

#### Expected Results:
- Users can register successfully with referral links
- Authentication works correctly
- Referral relationships are properly recorded

### 2. Wallet System Testing

#### Test Cases:
- [ ] **Credit Wallet Deposit**
  - Navigate to Wallet page
  - Test deposit functionality
  - Verify balance updates
  - Check transaction history

- [ ] **Wallet Balance Display**
  - Verify Credit Wallet balance
  - Verify Passive Wallet balance
  - Verify Bonus Wallet balance

#### Expected Results:
- All wallet balances display correctly
- Deposits are processed and recorded
- Transaction history is accurate

### 3. Contract Activation System

#### Test Cases:
- [ ] **Minimum Capital Validation**
  - Try activating with less than ₱1,000
  - Verify error message appears
  - Test with exactly ₱1,000
  - Test with amount greater than ₱1,000

- [ ] **Insufficient Balance Validation**
  - Try activating with amount greater than Credit Wallet balance
  - Verify error message appears
  - Test with sufficient balance

- [ ] **Successful Activation**
  - Activate contract with valid amount
  - Verify Credit Wallet deduction
  - Verify contract appears in active contracts
  - Check contract details (start date, maturity date, etc.)

#### Expected Results:
- Validation works correctly
- Credit Wallet is debited upon activation
- Contract is created with correct details
- 15-day contract period is set correctly

### 4. Automated Earnings System

#### Test Cases:
- [ ] **Earnings Cycle Timing**
  - Wait for automated earnings (every 3 days)
  - Verify earnings are processed at correct intervals
  - Check earnings amount (30% of capital)

- [ ] **Passive Wallet Credits**
  - Verify earnings are credited to Passive Wallet
  - Check transaction history for earnings records
  - Verify earnings calculation accuracy

- [ ] **Contract Completion**
  - Wait for 15-day contract completion
  - Verify contract status changes to "completed"
  - Verify final earnings payout

#### Expected Results:
- Earnings are processed every 3 days
- 30% of capital is paid out each cycle
- Total of 150% return over 15 days
- Contract completes automatically

### 5. Referral Commission System

#### Test Cases:
- [ ] **Direct Referral Commission (10%)**
  - Have referred user activate a contract
  - Verify 10% commission is credited to referrer's Bonus Wallet
  - Check transaction history for commission record

- [ ] **Indirect Referral Commissions**
  - Test 2nd level: 5% commission
  - Test 3rd level: 4% commission
  - Test 4th level: 3% commission
  - Test 5th level: 2% commission
  - Test 6th level: 1% commission

- [ ] **Commission Calculation**
  - Verify commission amounts are calculated correctly
  - Check that commissions are credited to Bonus Wallet
  - Verify transaction records are created

#### Expected Results:
- Direct referrals earn 10% commission
- Indirect referrals earn decreasing percentages (5%, 4%, 3%, 2%, 1%)
- All commissions are credited to Bonus Wallet
- Transaction history reflects all commission payments

### 6. Withdrawal System

#### Test Cases:
- [ ] **Time Restriction Validation**
  - Try withdrawing outside 11 AM - 3 PM window
  - Verify error message appears
  - Test withdrawal within allowed hours

- [ ] **Passive Wallet Withdrawal**
  - Test minimum amount validation (₱300)
  - Test withdrawal with sufficient balance
  - Verify payout method selection (GCash, Maya, GoTyme)
  - Check account details requirement

- [ ] **Bonus Wallet Withdrawal**
  - Test day restriction (Tuesday, Thursday, Saturday only)
  - Test minimum amount validation (₱500)
  - Test withdrawal on allowed days
  - Test withdrawal on restricted days

- [ ] **Withdrawal Processing**
  - Submit withdrawal request
  - Verify request appears in withdrawal history
  - Check wallet balance deduction
  - Verify transaction record creation

#### Expected Results:
- Time restrictions are enforced
- Day restrictions for Bonus Wallet are enforced
- Minimum amounts are validated
- Withdrawal requests are processed correctly
- Balances are updated appropriately

### 7. Transaction History

#### Test Cases:
- [ ] **Transaction Filtering**
  - Test "All Transactions" filter
  - Test "Deposits" filter
  - Test "Activations" filter
  - Test "Earnings" filter
  - Test "Referrals" filter
  - Test "Withdrawals" filter

- [ ] **Transaction Display**
  - Verify all transaction types are displayed correctly
  - Check transaction amounts and signs (+/-)
  - Verify transaction dates and times
  - Check transaction status indicators

- [ ] **Transaction Summary**
  - Verify summary calculations are accurate
  - Check total deposits, activations, earnings, referrals, withdrawals
  - Verify summary updates with new transactions

#### Expected Results:
- All filters work correctly
- Transaction details are accurate
- Summary calculations are correct
- Real-time updates work properly

## Full Compensation Plan Cycle Test

### Complete User Journey Test
1. **User Registration** (Day 0)
   - Register new user with referral link
   - Verify referral relationship

2. **Initial Deposit** (Day 0)
   - Deposit ₱5,000 to Credit Wallet
   - Verify balance update

3. **Contract Activation** (Day 0)
   - Activate ₱3,000 contract
   - Verify Credit Wallet deduction (₱2,000 remaining)
   - Verify contract creation

4. **Referral Commission** (Day 0)
   - Verify referrer receives ₱300 (10%) in Bonus Wallet
   - Check indirect referral commissions up the chain

5. **First Earnings Cycle** (Day 3)
   - Verify ₱900 (30%) credited to Passive Wallet
   - Check transaction history

6. **Second Earnings Cycle** (Day 6)
   - Verify another ₱900 credited to Passive Wallet
   - Total Passive Wallet: ₱1,800

7. **Third Earnings Cycle** (Day 9)
   - Verify ₱900 credited to Passive Wallet
   - Total Passive Wallet: ₱2,700

8. **Fourth Earnings Cycle** (Day 12)
   - Verify ₱900 credited to Passive Wallet
   - Total Passive Wallet: ₱3,600

9. **Final Earnings Cycle** (Day 15)
   - Verify ₱900 credited to Passive Wallet
   - Total Passive Wallet: ₱4,500 (150% of ₱3,000)
   - Verify contract status changes to "completed"

10. **Withdrawal Test** (Day 16)
    - Test Passive Wallet withdrawal during allowed hours
    - Test Bonus Wallet withdrawal on allowed day
    - Verify withdrawal processing

### Expected Final State:
- **Credit Wallet**: ₱2,000 (original ₱5,000 - ₱3,000 activation)
- **Passive Wallet**: ₱4,500 - withdrawal amount
- **Bonus Wallet**: ₱300 + indirect commissions - withdrawal amount
- **Total Return**: 150% of activated amount
- **Contract Status**: Completed

## Performance Testing

### Load Testing
- [ ] Test multiple simultaneous activations
- [ ] Test concurrent withdrawal requests
- [ ] Test system performance during earnings processing

### Data Integrity Testing
- [ ] Verify all calculations are accurate
- [ ] Check for any data inconsistencies
- [ ] Validate referral chain integrity

## Security Testing

### Authentication & Authorization
- [ ] Test unauthorized access attempts
- [ ] Verify user can only access their own data
- [ ] Test admin-only functionality restrictions

### Input Validation
- [ ] Test SQL injection attempts
- [ ] Test XSS vulnerabilities
- [ ] Verify all user inputs are properly sanitized

## Browser Compatibility Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Samsung Internet

### Responsive Design
- [ ] Test on various screen sizes
- [ ] Verify mobile navigation works
- [ ] Check form usability on mobile

## Bug Reporting Template

### Bug Report Format:
```
**Bug Title**: [Brief description]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Browser/Device**: [Browser and version]
**Screenshots**: [If applicable]
**Additional Notes**: [Any other relevant information]
```

## Test Completion Checklist

- [ ] All core features tested
- [ ] Full compensation plan cycle completed
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Browser compatibility verified
- [ ] All bugs documented and reported
- [ ] Test results documented
- [ ] System ready for production

## Notes

- **Test Data**: Use realistic but clearly identifiable test data
- **Documentation**: Document all test results and findings
- **Cleanup**: Clean up test data after testing completion
- **Backup**: Ensure database backups before major testing

---

**Testing Team**: [Names and roles]
**Test Date**: [Date range]
**Version Tested**: [Application version]
**Status**: [Pass/Fail/In Progress]