import { useEffect, useState } from "react";
import "./Login.css";

import { FiEye, FiEyeOff } from "react-icons/fi";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (email, password) => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        createdAt: new Date(),
      });

      setMode("login");
    } catch (err) {
      alert(err.message);
    }
  };
  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      navigate("/mains");
    } catch (err) {
      alert("Invalid credentials");
    }
  };
  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }, [mode]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "admin" && "Admin Login"}
          </h2>
          <p>
            {mode === "login" && "Sign in to your account"}
            {mode === "register" && "Register a new account"}
            {mode === "admin" && "Restricted administrator access"}
          </p>
        </div>

        <form className="auth-form">
          {mode === "login" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </>
          )}

          {mode === "admin" && (
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          )}

          <button
            className="auth-btn"
            onClick={(e) => {
              e.preventDefault();

              if (!email && mode !== "admin") {
                alert("Email is required");
                return;
              }

              if (!password) {
                alert("Password is required");
                return;
              }

              if (mode === "register") {
                if (password !== confirmPassword) {
                  alert("Passwords do not match");
                  return;
                }
                handleRegister(email, password);
              }

              if (mode === "login") {
                handleLogin(email, password);
              }

              if (mode === "admin") {
                if (password === "admin123") {
                  navigate("/admin");
                } else {
                  alert("Invalid admin password");
                }
              }
            }}
          >
            {mode === "login" && "Login"}
            {mode === "register" && "Register"}
            {mode === "admin" && "Admin Login"}
          </button>
        </form>

        <div className="auth-switch">
          {mode !== "login" && (
            <button onClick={() => setMode("login")}>User Login</button>
          )}
          {mode !== "register" && (
            <button onClick={() => setMode("register")}>Register</button>
          )}
          {mode !== "admin" && (
            <button onClick={() => setMode("admin")}>Admin</button>
          )}
        </div>
      </div>
    </div>
  );
}
