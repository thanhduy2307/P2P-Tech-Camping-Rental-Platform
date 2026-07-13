# P2P Tech & Camping Rental Platform

A comprehensive Peer-to-Peer (P2P) platform designed for renting technology gadgets and camping equipment. The platform connects Lenders (asset owners) with Renters, providing a secure, transparent, and streamlined rental experience with built-in fraud prevention, deposit management, and dispute resolution mechanisms.

## 🌟 Key Features

### 1. Robust Role System
- **Renter**: Can search, book, and rent items. Must pass eKYC verification to rent high-value items.
- **Lender**: Can list assets, manage inventory, approve extensions, and track revenue. Must pass eKYC and sign a digital contract.
- **Inspector**: Local field agents assigned to physically verify the condition and authenticity of high-value assets (>= 20M VND) before they go live on the platform.
- **Admin**: Platform managers overseeing users, eKYC approvals, withdrawal requests, and dispute resolutions.

### 2. Intelligent Verification Workflow
- **AI-First Auto-Approval**: Assets under 20M VND are automatically verified by the system's image recognition and anti-fraud heuristics, eliminating wait times.
- **Inspector Verification**: Premium assets (>= 20M VND) require mandatory in-person verification by local Inspectors to guarantee authenticity and condition.
- **Renter-Driven Handover Checklist**: At the point of physical handover, Renters must verify 3 critical conditions (Appearance, Accessories, Functionality) before releasing the secure OTP to the Lender.

### 3. Secure Financial & Deposit Management
- **Integrated E-Wallet**: Users can top-up, pay, receive rental income, and withdraw funds seamlessly.
- **Flexible Deposits**: Supports both Online Deposits (held by the platform) and Cash Deposits (held by the Lender directly).
- **Automated Late Return Penalties**: System automatically calculates late fees (150% daily rate) if items are returned more than 4 hours late, deducting directly from deposits.
- **Rental Extensions**: Renters can request extensions which dynamically adjust the rental period and costs upon Lender approval.

### 4. Comprehensive Dispute Resolution (SLA 48h)
- **Renter Refusal**: Renters can refuse items at handover and raise immediate disputes if the item doesn't match the description.
- **Lender Damage Reporting**: Lenders can report damages during the return process, specifying a compensation amount.
- **Renter Defense**: Renters have the right to provide evidence and a defense statement if a Lender claims damages.
- **Admin Verdict**: Admins review all evidence (photos, notes, handover logs) and make a final financial distribution decision. For Cash deposits, Lenders must commit to refunding excess amounts based on the Admin's verdict.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Frontend**: React.js (Vite), TailwindCSS
- **Authentication**: JWT, bcrypt
- **UI Components**: SweetAlert2, Headless UI concepts
- **Payments & Wallets**: Custom ledger system for internal transactions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB instance (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WDP
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. **Run the Application**
   - Start the backend server: `npm start` (from root directory)
   - Start the frontend dev server: `npm run dev` (from `frontend` directory)

## 📁 Project Structure

```
├── frontend/                # React Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── configs/         # Axios and app configurations
│   │   ├── Page/            # View components (Admin, Renter, Lender, etc.)
│   │   └── ...
├── src/                     # Node.js Backend
│   ├── controllers/         # Business logic (Orders, Assets, Users)
│   ├── middleware/          # Authentication & Authorization
│   ├── models/              # Mongoose Schemas (User, Asset, Order)
│   ├── routes/              # Express API Routes
│   └── ...
├── TEST_PLAN.md             # Quality Assurance and testing guidelines
└── ROLES_AND_FEATURES.md    # Detailed feature specifications
```

## 🔒 Security Practices
- eKYC ID Verification for all high-value transactions.
- Secure OTP-based physical asset handover process.
- Role-based Access Control (RBAC) across all APIs.
- Encrypted password storage and stateless JWT authentication.
