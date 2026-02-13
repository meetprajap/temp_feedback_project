# Frontend Wallet Connection Implementation

## Summary of Changes

### Frontend Changes Made:

1. **New Component: `WalletConnectionPage.jsx`**
   - Displays after user registration
   - Shows user's email and role
   - Contains RainbowKit ConnectButton
   - Guides user to connect their wallet

2. **Updated `App.jsx`**
   - Added `useAccount` hook from wagmi to detect connected wallet
   - New states:
     - `pendingUser`: Stores user data before wallet connection
     - `isConnectingWallet`: Tracks wallet connection flow
   - New effect: Automatically calls `handleWalletConnection` when wallet connects
   - Updated `handleLogin`: 
     - Fetches user's registered wallet from backend
     - Compares connected wallet with registered wallet
     - Shows wallet connection page if wallet not linked
   - Updated render logic to show WalletConnectionPage when needed

### Frontend Flow:

1. **Registration** → User submits (email, password, role)
2. **Wallet Connection** → WalletConnectionPage shown with ConnectButton
3. **Wallet Linked** → Backend saves wallet address → Dashboard
4. **Login** → Check if wallet registered → Verify wallet matches → Dashboard/Error

---

## Backend Implementation Required

### 1. New API Endpoint: Link Wallet
**POST** `/api/v1/user/link-wallet`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc1e7595f...",
  "email": "user@example.com",
  "userId": "user_id_from_token"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Wallet linked successfully",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc1e7595f..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to link wallet"
}
```

### 2. New API Endpoint: Get Wallet Info
**GET** `/api/v1/user/wallet-info/:userId`

**Headers:**
- `Authorization: Bearer {token}`

**Response (Success - 200):**
```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc1e7595f...",
  "connectedAt": "2024-02-13T10:30:00Z"
}
```

**Response (No wallet - 200):**
```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "walletAddress": null
}
```

### 3. Database Schema Update

Add to User model:
```javascript
walletAddress: {
  type: String,
  unique: true,
  sparse: true,
  lowercase: true
},
walletLinkedAt: {
  type: Date,
  default: null
}
```

### 4. Modified Registration Flow

Update the registration endpoint to:
- Return `isNewRegistration: true` flag
- Don't auto-login the user
- Return temporary token for wallet linking

### 5. Wallet Verification Middleware

Create middleware to verify wallet signature (optional but recommended):
- Add wallet signature verification
- Ensure wallet owner authorization
- Prevent wallet address spoofing

---

## Frontend-Backend Integration Points

| Action | Frontend | Backend |
|--------|----------|---------|
| User Registers | Submit email, password, role | Save user, return token + isNewRegistration flag |
| Wallet Connects | Capture wallet address | → |
| Link Wallet | Send wallet + token | Save wallet address to user profile |
| User Logs In | Send credentials | Fetch user wallet info |
| Verify Wallet | Compare connected wallet | ← Return registered wallet address |

---

## Notes for Backend Development

1. **Security**: Verify JWT token before updating wallet address
2. **Uniqueness**: Ensure wallet addresses are unique per user
3. **Case Sensitivity**: Always convert wallet addresses to lowercase for comparison
4. **Error Handling**: Clear error messages for wallet mismatch
5. **Testing**: Test with multiple wallet scenarios:
   - First time connection
   - Reconnection with same wallet
   - Connection with different wallet (should fail)

---

## Testing Checklist

- [ ] New user can register and connect wallet
- [ ] Wallet address is saved in database
- [ ] Existing user can log in with same wallet
- [ ] Existing user cannot log in with different wallet
- [ ] Wallet verification happens on each login
- [ ] Error messages are clear and helpful
