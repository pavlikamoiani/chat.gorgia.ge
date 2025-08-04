import React, { useState } from "react";
import styles from "../../../assets/css/Login.module.css";
import logo from "../../../assets/images/logo.png";

const formatGeorgianNumber = (value) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 9);
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 7);
    if (digits.length > 7) formatted += " " + digits.slice(7, 9);
    return formatted;
};

const Registration = () => {
    const [number, setNumber] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleNumberChange = (e) => {
        setNumber(formatGeorgianNumber(e.target.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Simple validation
        if (!username || !email || !password || !number) {
            setError("All fields are required");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    number: number.replace(/\s/g, ""),
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Save token to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setSuccess(true);
            // Redirect to login or dashboard
            setTimeout(() => {
                window.location.href = "/login";
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginBg}>
            <div className={styles.loginContainer}>
                <img src={logo} alt="Gorgia Logo" className={styles.logo} />

                {success && (
                    <div className={styles.successMessage}>
                        Registration successful! Redirecting...
                    </div>
                )}

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputIcon}></span>
                        <input
                            type="text"
                            placeholder="Username"
                            className={styles.input}
                            autoComplete="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup} style={{ gap: 0 }}>
                        <span style={{
                            display: "flex",
                            alignItems: "center",
                            marginRight: 10,
                            background: "#e3f0fc",
                            borderRadius: "16px",
                            padding: "7px",
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            color: "#1976d2",
                            boxShadow: "0 2px 8px #1976d211"
                        }}>
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#dbeafe",
                                color: "#1976d2",
                                fontWeight: 700,
                                fontSize: 15,
                                marginRight: 6,
                                letterSpacing: "1px"
                            }}>GE</span>
                            <span style={{
                                color: "#1976d2",
                                fontWeight: 700,
                                fontSize: "1.08rem"
                            }}>+995</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Number"
                            className={styles.input}
                            autoComplete="off"
                            inputMode="numeric"
                            pattern="[0-9 ]*"
                            maxLength={12}
                            value={number}
                            onChange={handleNumberChange}
                            style={{
                                letterSpacing: "2px",
                                fontWeight: 600,
                                fontSize: "1.13rem",
                                background: "transparent"
                            }}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputIcon}></span>
                        <input
                            type="email"
                            placeholder="Email"
                            className={styles.input}
                            autoComplete="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputIcon}></span>
                        <input
                            type="password"
                            placeholder="Password"
                            className={styles.input}
                            autoComplete="new-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
                <div className={styles.footerText}>
                    <span>Already have an account?</span>
                    <a href="/login" className={styles.link}>Log In</a>
                </div>
            </div>
        </div>
    );
};

export default Registration;