"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, SUPABASE_CONFIG_ERROR } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      setMessage(
        data.session
          ? "Your account has been created. You can now log in."
          : "Your account has been created. Check your email to confirm it.",
      );
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to sign up.",
      );
    } finally {
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    boxSizing: "border-box",
    color: "#000",
    border: "1px solid #ccc",
    borderRadius: 6,
  };

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "60px auto",
        padding: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h1>Sign up</h1>
      <form onSubmit={handleSignup}>
        <input
          style={input}
          type="email"
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          style={input}
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px" }}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {message && <p role="status">{message}</p>}
      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
