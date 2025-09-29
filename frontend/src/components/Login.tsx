import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const { state, login, register, clearError } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
        } catch (error) {
            console.error("Auth error:", error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>{isLogin ? "Welcome back!" : "Create account"}</h1>

                {state.error && (
                    <div className="error-message">{state.error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" disabled={state.loading}>
                        {state.loading
                            ? "Loading..."
                            : isLogin
                              ? "Login"
                              : "Register"}
                    </button>
                </form>

                <p>
                    {isLogin
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        type="button"
                        className="link-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
