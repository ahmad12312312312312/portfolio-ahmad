import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Admin from "./components/Admin";
import Login from "./components/Login";
import Mains from "./components/Mains";
import { auth } from "./firebase";

function AdminRouteGuard({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const adminEmail = "admin@gmail.com";
      setIsAdmin(user?.email?.toLowerCase() === adminEmail);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Pages */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <Admin />
          </AdminRouteGuard>
        }
      />
      <Route path="/mains" element={<Mains />} />

      {/* Fallback */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
