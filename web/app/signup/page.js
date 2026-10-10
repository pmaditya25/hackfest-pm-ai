"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, SUPABASE_CONFIG_ERROR } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-5 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-9">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Product<span className="text-cyan-400">OS</span>
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">GET STARTED</p>
          <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
          <p className="mt-3 text-sm text-slate-400">
            Start turning product ideas into clear, testable requirements.
          </p>
        </div>
      <form onSubmit={handleSignup} className="mt-7 space-y-4">
        <label htmlFor="email" className="block text-sm font-medium text-slate-200">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <label htmlFor="password" className="block text-sm font-medium text-slate-200">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-200">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Log in
        </Link>
      </p>
      </section>
    </main>
  );
}