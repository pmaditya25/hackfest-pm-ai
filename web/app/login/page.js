"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, SUPABASE_CONFIG_ERROR } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (!supabase) {
        setError(SUPABASE_CONFIG_ERROR);
        setCheckingSession(false);
        return;
      }

      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (isMounted) setUser(data.user);
      } catch (authError) {
        if (isMounted) {
          setError(
            authError instanceof Error
              ? authError.message
              : "Unable to check the current session.",
          );
        }
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!supabase) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      setUser(data.user);
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to log in.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!supabase) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setUser(null);
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to log out.",
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
      {checkingSession ? (
        <p>Checking your session...</p>
      ) : user ? (
        <div>
          <h1>You are logged in</h1>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{ padding: "10px 20px" }}
          >
            {loading ? "Logging out..." : "Log out"}
          </button>
        </div>
      ) : (
        <div>
          <h1>Log in</h1>
          <form onSubmit={handleLogin}>
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
              autoComplete="current-password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
          <p>
            No account yet? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      )}
    </main>
  );
}
