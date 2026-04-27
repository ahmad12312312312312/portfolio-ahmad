import { useState } from "react";
import "./Login.css";

import { FiEye, FiEyeOff } from "react-icons/fi";
import SoftAurora from "./SoftAurora";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { useToast } from "./Toast";

export default function Login() {
  const ADMIN_EMAIL = "admin@gmail.com";
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (email, password) => {
    if (email.toLowerCase() === ADMIN_EMAIL) {
      pushToast("Admin account cannot be created from public registration", {
        type: "error",
        title: "Not allowed",
      });
      return;
    }

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
      pushToast("Account created. You can log in now.", {
        type: "success",
        title: "Registered",
      });
    } catch {
      pushToast("Registration failed. Please try again.", {
        type: "error",
        title: "Registration",
      });
    }
  };
  const handleLogin = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      pushToast("Welcome back!", { type: "success", title: "Logged in" });
      navigate(
        userCred.user.email?.toLowerCase() === ADMIN_EMAIL ? "/admin" : "/mains",
      );
    } catch {
      pushToast("Invalid email or password.", {
        type: "error",
        title: "Login failed",
      });
    }
  };

  const handleAdminLogin = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (userCred.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOut(auth);
        pushToast("Only admin@gmail.com can access the admin dashboard.", {
          type: "error",
          title: "Restricted",
        });
        return;
      }

      pushToast("Admin access granted.", { type: "success", title: "Welcome" });
      navigate("/admin");
    } catch {
      pushToast("Invalid admin credentials.", {
        type: "error",
        title: "Admin login",
      });
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  return (
    <>
      <div className="page-aurora" aria-hidden="true">
        <SoftAurora
          speed={0.22}
          scale={2.2}
          brightness={0.45}
          color1="#ffffff"
          color2="#bdbdbd"
          noiseFrequency={1.6}
          noiseAmplitude={0.55}
          bandHeight={0.42}
          bandSpread={1}
          octaveDecay={0.12}
          layerOffset={0.12}
          colorSpeed={0.35}
          enableMouseInteraction
          useWindowMouse
          mouseInfluence={0.1}
        />
        <div className="page-aurora-grain" />
        <div className="page-aurora-vignette" />
      </div>

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

          <form className="auth-form" noValidate>
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
              <>
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

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
              </>
            )}

            <button
              type="button"
              className="btn-primary btn-full"
              onClick={() => {
                if (!email && mode !== "admin") {
                  pushToast("Email is required.", { type: "error" });
                  return;
                }

                if (mode === "admin" && !email) {
                  pushToast("Admin email is required.", { type: "error" });
                  return;
                }

                if (!password) {
                  pushToast("Password is required.", { type: "error" });
                  return;
                }

                if (mode === "register") {
                  if (password !== confirmPassword) {
                    pushToast("Passwords do not match.", {
                      type: "error",
                      title: "Register",
                    });
                    return;
                  }
                  handleRegister(email, password);
                }

                if (mode === "login") {
                  handleLogin(email, password);
                }

                if (mode === "admin") {
                  handleAdminLogin(email, password);
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
              <button
                type="button"
                className="btn-outline btn-xs"
                onClick={() => switchMode("login")}
              >
                User Login
              </button>
            )}
            {mode !== "register" && (
              <button
                type="button"
                className="btn-outline btn-xs"
                onClick={() => switchMode("register")}
              >
                Register
              </button>
            )}
            {mode !== "admin" && (
              <button
                type="button"
                className="btn-outline btn-xs"
                onClick={() => switchMode("admin")}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
