import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ward" | "guardian">("ward");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: replace with real API call
    setTimeout(() => {
      localStorage.setItem("token", "demo-token");
      localStorage.setItem("role", role);
      localStorage.setItem("userName", name);
      navigate(role === "guardian" ? "/guardian/dashboard" : "/ward/home");
      setLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-center text-[var(--color-text)]">
        Create Account
      </h2>

      <Input
        label="Full Name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
      />

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
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      {/* Role selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text)]">I am a...</label>
        <div className="flex gap-3">
          {(["ward", "guardian"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={[
                "flex-1 py-3 rounded-[var(--radius-sm)] border text-center font-medium transition-all",
                role === r
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text)]/60 hover:border-[var(--color-primary)]/50",
              ].join(" ")}
            >
              {r === "ward" ? "Senior / Ward" : "Family / Guardian"}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>

      <p className="text-center text-sm text-[var(--color-text)]/60">
        Already have an account?{" "}
        <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
};

export default RegisterPage;
