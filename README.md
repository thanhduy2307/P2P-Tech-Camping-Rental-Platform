# ⛺ P2P Tech & Camping Rental Platform 📱

Welcome to the **P2P Tech & Camping Rental Platform**, a comprehensive Sharing Economy ecosystem designed to seamlessly connect owners of technology gadgets and camping equipment (Lenders) with individuals looking to rent (Renters). The platform is built from the ground up to ensure convenience, safety, transparency, and to maximize the lifecycle value of premium assets.

---

## 📖 Project Overview

In the era of the sharing economy, the need for expensive technology devices (like DSLR cameras, drones, projectors) or outdoor gear (tents, survival kits) often occurs only for short-term periods (e.g., a weekend trip, a specific event). Instead of spending a massive amount of money to purchase these items outright, users can easily and securely rent them from peers who aren't using them frequently.

This project directly addresses the biggest pain points in the current P2P rental market:
1. **Fear of Theft / Item Switching:** Solved through a strict eKYC identity verification system and a dual-layer OTP physical handover process.
2. **Damage Disputes:** Solved via a built-in Dispute Resolution system based on transparent evidence and mutual handover checklists.
3. **Quality Assurance:** Solved by utilizing AI auto-approval for low-value consumer items, and deploying a fleet of professional Inspectors to physically verify high-value assets (>= 20M VND) on-site.
4. **Deposit & Cash Flow Management:** An integrated e-wallet system supporting two deposit methods: Online Escrow (100% protected by the platform) and Offline Cash (handled directly between users but strictly monitored).

---

## 🎯 Roles & Permissions

The system operates around 4 primary roles, each equipped with a dedicated dashboard and specialized workflows:

- **1. Renter**: Can search, filter, and book available equipment. Renters are required to complete eKYC verification to rent premium items. They have the ability to request rental extensions, rate the item quality, and raise disputes if the received item does not match the description.
- **2. Lender**: Can list assets on the marketplace, manage inventory, approve or reject extension requests, and track revenue via the built-in E-wallet. Lenders must also sign a digital security commitment and pass eKYC verification.
- **3. Inspector**: Field agents working for the platform. When a Lender lists a high-value asset ($\ge$ 20M VND), the AI system automatically assigns the nearest Inspector to conduct an on-site physical inspection to prevent fraud before the asset goes live on the marketplace.
- **4. Admin**: The supreme manager of the system. Admins are responsible for manually reviewing flagged eKYC applications, processing withdrawal requests, managing user bans, and—most importantly—acting as the judge in **Dispute Resolutions** based on the evidence provided by both Lenders and Renters.

---

## ⚙️ Core Modules & Workflows

### 🤖 1. Multi-tier Asset Verification Workflow
- **Standard Assets (< 20,000,000 VND)**: Utilizes AI heuristics to automatically detect duplicate or internet-sourced images. If the images are deemed valid, the asset is instantly approved (`Verified`).
- **Premium Assets (>= 20,000,000 VND)**: Automatically routed to a `Pending Inspector` status. Approval requires a digital signature and on-site physical proof submitted by a verified Inspector.

### 🔐 2. Secure Handover Protocol
To guarantee there are no post-rental disputes, the physical handover is tightly controlled:
- **Handover (Start)**: When the Renter meets the Lender, the Renter must physically inspect the item and complete a mandatory 3-point checklist in the app (Description Match, Physical Condition, Included Accessories). Only after checking all boxes does the app generate an **OTP**. The Renter gives this OTP to the Lender, who inputs it into the system alongside 3 real-time photos to officially start the rental.
- **Return (End)**: When the Lender receives the item back, they can choose "Normal Return" (inputting an OTP from the Renter to release the deposit) or **"Report Damage"** if the item is broken.

### ⚖️ 3. Dispute Management (48h SLA)
- **Renter Dispute**: At handover, if the item is defective, the Renter can hit "Refuse & Dispute". The order is frozen and sent to Admin for a full refund review.
- **Lender Dispute**: At return, the Lender reports damage and inputs a requested compensation amount. The order shifts to the `Disputed` status.
- **Renter Defense**: The Renter is immediately notified and granted a "Defense Right" to submit their side of the story and photographic evidence.
- **Resolution Verdict**: The Admin reviews all handover logs, photos, and testimonies, then determines the final compensation amount for the Lender. The system automatically splits and distributes the remaining deposit to both parties accordingly.

### 🕒 4. Late Return Penalties & Extensions
- **Extensions**: Renters can request additional rental days. The extra cost is automatically deducted from their wallet upon Lender approval.
- **Late Returns**: The system grants a 4-hour grace period. If an item is returned more than 4 hours late, the system automatically imposes a penalty of **150% of the daily rental rate** for each day late, deducted directly from the Renter's deposit.

---

## 🛠 Technology Stack

The platform is built end-to-end using Javascript/Typescript:

- **Frontend**: 
  - React.js (Vite)
  - TailwindCSS (Utility-first styling, highly responsive)
  - SweetAlert2 (Popups/Notifications)
  - React Router (Routing)
- **Backend**: 
  - Node.js with Express.js Framework
  - Robust MVC (Model-View-Controller) Architecture
- **Database**: 
  - MongoDB (Mongoose ORM) with a flexible NoSQL design, perfect for handling complex JSON document structures like dynamic orders and user profiles.
- **Advanced Features**:
  - JWT (JSON Web Tokens) for RBAC (Role-Based Access Control) and secure session management.
  - Base architecture ready for advanced AI module integrations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Server running (Localhost or MongoDB Atlas)
- Git

### Installation Guide

**1. Clone the repository:**
```bash
git clone https://github.com/thanhduy2307/P2P-Tech-Camping-Rental-Platform.git
cd P2P-Tech-Camping-Rental-Platform
```

**2. Start the Backend Server:**
```bash
# Install backend dependencies
npm install

# Copy the environment example file
cp .env.example .env

# Configure your environment variables in the .env file (e.g., PORT=5000, MONGODB_URI=...)
# Start the backend server (Defaults to port 5000)
npm start
```

**3. Start the Frontend App:**
Open a new terminal window:
```bash
cd frontend

# Install frontend dependencies
npm install

# Run the React Vite app (Defaults to port 5173)
npm run dev
```

Once both servers are running, navigate to `http://localhost:5173` in your browser to experience the platform.

---

## 📁 Main Directory Structure

```text
📦 P2P-Tech-Camping-Rental-Platform
 ┣ 📂 frontend/               # React Frontend Source Code
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 components/         # Shared UI components (Navbars, Modals, etc.)
 ┃ ┃ ┣ 📂 configs/            # Axios API configurations
 ┃ ┃ ┣ 📂 Page/               # Main Views (Admin Dashboard, Renter/Lender flows, etc.)
 ┃ ┃ ┗ 📜 App.jsx             # Main Routing Configuration
 ┣ 📂 src/                    # Node.js Backend Source Code
 ┃ ┣ 📂 controllers/          # Business logic controllers (Auth, Orders, Assets)
 ┃ ┣ 📂 middleware/           # Security & RBAC middlewares (verifyToken, isAdmin)
 ┃ ┣ 📂 models/               # MongoDB Database Schemas (Mongoose)
 ┃ ┣ 📂 routes/               # API Endpoints
 ┃ ┗ 📜 index.js              # Server entry point
 ┣ 📜 TEST_PLAN.md            # Quality Assurance and testing guidelines
 ┣ 📜 ROLES_AND_FEATURES.md   # Detailed system requirements
 ┗ 📜 README.md               # Project overview (You are reading this)
```

---
*Developed with ❤️ by the P2P Platform Team.*
