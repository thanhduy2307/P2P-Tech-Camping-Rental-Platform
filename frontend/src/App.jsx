import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Layout Templates
import HomeTemplate from './components/home-template';
import AuthenTemplate from './components/authen-template';
import DashboardLayout from './components/dashboard';

// Protected Route Guard
import ProtectedRoute from './protected-route';

// Pages
import Home from './Page/home';
import BrowseAssets from './Page/browse-assets';
import AssetDetail from './Page/asset-detail';
import Orders from './Page/orders';
import Profile from './Page/profile';
import LenderOnboarding from './Page/lender-onboarding';
import RenterEkyc from './Page/renter-ekyc';
import PostAsset from './Page/post-asset';
import LenderInventory from './Page/lender-inventory';
import LenderOrders from './Page/lender-orders';
import Reviews from './Page/reviews';
import Blogs from './Page/blogs';
import Notifications from './Page/notifications';
import DashboardLender from './Page/dashboard-lender';
import DashboardInspector from './Page/dashboard-inspector';
import DashboardAdmin from './Page/dashboard-admin';
import Login from './Page/login';
import Register from './Page/register';
import Chat from './Page/chat';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Home Template */}
        <Route element={<HomeTemplate><Outlet /></HomeTemplate>}>
          <Route path="/" element={<Home />} />
          <Route path="/assets" element={<BrowseAssets />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/blogs" element={<Blogs />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected General User Routes */}
        <Route element={<ProtectedRoute allowedRoles={['renter', 'lender', 'inspector', 'admin']} />}>
          <Route element={<HomeTemplate><Outlet /></HomeTemplate>}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/lender-onboarding" element={<LenderOnboarding />} />
            <Route path="/renter-ekyc" element={<RenterEkyc />} />
          </Route>
        </Route>

        {/* Protected Lender Routes */}
        <Route element={<ProtectedRoute allowedRoles={['lender']} />}>
          <Route element={<DashboardLayout role="lender"><Outlet /></DashboardLayout>}>
            <Route path="/dashboard-lender" element={<DashboardLender />} />
            <Route path="/lender-inventory" element={<LenderInventory />} />
            <Route path="/lender-orders" element={<LenderOrders />} />
            <Route path="/lender-chat" element={<Chat />} />
            <Route path="/post-asset" element={<PostAsset />} />
          </Route>
        </Route>

        {/* Protected Inspector Routes */}
        <Route element={<ProtectedRoute allowedRoles={['inspector']} />}>
          <Route element={<DashboardLayout role="inspector"><Outlet /></DashboardLayout>}>
            <Route path="/dashboard-inspector" element={<DashboardInspector />} />
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout role="admin"><Outlet /></DashboardLayout>}>
            <Route path="/dashboard-admin" element={<DashboardAdmin />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
