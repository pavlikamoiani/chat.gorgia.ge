import React, { useState } from "react";
import styles from "../../../assets/css/Login.module.css";
import logo from "../../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "../../../store/authSlice";
import { Navigate } from "react-router-dom";
import defaultInstance from "../../../api/defaultInstance";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  if (token) {
    return <Navigate to="/chat" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const response = await defaultInstance.post("/login", { email, password });
      const data = response.data;

      if (!data.token) {
        setError("Login failed: " + (data.error || "Invalid credentials"));
        setLoading(false);
        return;
      }

      dispatch(setAuth({ user: data.user, token: data.token }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginBg}>
      <div className={styles.loginContainer}>
        <img src={logo} alt="Gorgia Logo" className={styles.logo} />
        {/* <h2 className={styles.title}>Welcome to Gorgia Chat</h2> */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}></span>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}></span>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div className={styles.footerText}>
          <span>Don't have an account?</span>
          <a href="/register" className={styles.link}>
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
