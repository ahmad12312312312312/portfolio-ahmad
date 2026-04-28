import { Navigate, Route, Routes } from "react-router-dom";

import Admin from "./components/Admin";
import Mains from "./components/Mains";

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/mains" />} />

      {/* Pages */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/mains" element={<Mains />} />

      {/* Fallback */}
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
