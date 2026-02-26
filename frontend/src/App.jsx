import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AppShell } from "./components/layout/AppShell";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import NewOrder from "./pages/NewOrder";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Ledger from "./pages/Ledger";
import EOD from "./pages/EOD";
import Attendance from "./pages/Attendance";
import Employees from "./pages/Employees";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

// ── Protected route wrapper ───────────────────────────────────
function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const home = user?.role === "boss" ? "/dashboard" : "/orders";
    return <Navigate to={home} replace />;
  }
  return children ?? <Outlet />;
}

// ── Default page per role ─────────────────────────────────────
function RoleHome() {
  const { user } = useAuthStore();
  if (user?.role === "boss") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/orders" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleHome />} />

          {/* Boss only */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-order"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <NewOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="ledger"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Ledger />
              </ProtectedRoute>
            }
          />
          <Route
            path="eod"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <EOD />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={["boss"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Boss + Manager */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={["boss", "manager"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute allowedRoles={["boss", "manager"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* All authenticated */}
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="notifications" element={<Notifications />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
