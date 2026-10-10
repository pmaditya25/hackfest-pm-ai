"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, SUPABASE_CONFIG_ERROR } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
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
        const { data, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        const currentUser = data.session?.user ?? null;
        if (isMounted) {
          setUser(currentUser);
          if (currentUser) {
            router.replace("/");
            router.refresh();
          }
        }
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
  }, [router]);

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
      if (!data.session || !data.user) {
        throw new Error("Login did not return a valid session.");
      }
      setUser(data.user);
      router.replace("/");
      router.refresh();
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
      router.replace("/");
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to log out.",
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
      {checkingSession ? (
        <p className="mt-8 text-sm text-slate-400">Checking your session...</p>
      ) : user ? (
        <div className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">WELCOME BACK</p>
          <h1 className="mt-2 text-3xl font-bold">You are logged in</h1>
          <p className="mt-3 text-sm text-slate-400">
            Signed in as <strong className="text-slate-200">{user.email}</strong>
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Continue to ProductOS
          </Link>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="ml-3 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Logging out..." : "Log out"}
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">WELCOME BACK</p>
          <h1 className="mt-2 text-3xl font-bold">Log in to ProductOS</h1>
          <p className="mt-3 text-sm text-slate-400">
            Sign in to continue to your AI product workspace.
          </p>
          <form onSubmit={handleLogin} className="mt-7 space-y-4">
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
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <p className="mt-6 text-center text-sm text-slate-400">
            New to ProductOS?{" "}
            <Link href="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Sign up
            </Link>
          </p>
        </div>
      )}
      </section>
    </main>
  );
}