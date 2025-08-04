import React from "react";
import styles from "../../../assets/css/Login.module.css";
import logo from "../../../assets/images/logo.png";

export default function Login() {
  return (
    <div className={styles.loginBg}>
      <div className={styles.loginContainer}>
        <img src={logo} alt="Gorgia Logo" className={styles.logo} />
        {/* <h2 className={styles.title}>Welcome to Gorgia Chat</h2> */}
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}></span>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              autoComplete="email"
            />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}></span>
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={styles.button}>
            Log In
          </button>
        </form>
        <div className={styles.footerText}>
          <span>Don't have an account?</span>
          <a href="/register" className={styles.link}>Sign Up</a>
        </div>
      </div>
    </div>
  );
}
