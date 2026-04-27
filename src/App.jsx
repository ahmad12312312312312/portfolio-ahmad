import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Admin from "./components/Admin";
import Login from "./components/Login";
import Mains from "./components/Mains";
import { auth } from "./firebase";

const ADMIN_EMAIL = "admin@gmail.com";

function AuthGate({ children, allowAdminOnly = false, publicOnly = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  if (isLoading) return null;

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  if (publicOnly) {
    if (user) {
      return <Navigate to={isAdmin ? "/admin" : "/mains"} replace />;
    }
    return children;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowAdminOnly && !isAdmin) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Pages */}
      <Route
        path="/login"
        element={
          <AuthGate publicOnly>
            <Login />
          </AuthGate>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGate allowAdminOnly>
            <Admin />
          </AuthGate>
        }
      />
      <Route
        path="/mains"
        element={
          <AuthGate>
            <Mains />
          </AuthGate>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
