import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Admin from "./components/Admin";
import Mains from "./components/Mains";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/mains" element={<Mains />} />

      {/* Fallback */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
