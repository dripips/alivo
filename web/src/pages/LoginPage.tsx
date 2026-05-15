import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: replace with real API call
    setTimeout(() => {
      localStorage.setItem("token", "demo-token");
      // Default to ward for demo; set role from API response
      const role = email.includes("guardian") ? "guardian" : "ward";
      localStorage.setItem("role", role);
      navigate(role === "guardian" ? "/guardian/dashboard" : "/ward/home");
      setLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-center text-[var(--color-text)]">
        Sign In
      </h2>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
        required
        autoComplete="current-password"
      />

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-[var(--color-text)]/60">
        Don't have an account?{" "}
        <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
};

export default LoginPage;
