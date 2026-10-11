"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Persona = {
  name: string;
  needs: string;
};

type Feature = {
  name: string;
  priority: string;
  reason: string;
};

type UserStory = {
  id: string;
  story: string;
  acceptanceCriteria: string[];
  testable: boolean;
  suggestedRewrite: string;
};

type TestCase = {
  id: string;
  userStoryId: string;
  title: string;
  steps: string[];
  expectedResult: string;
};

type Analysis = {
  productName: string;
  problemStatement: string;
  targetPersonas: Persona[];
  features: Feature[];
  userStories: UserStory[];
  assumptions: string[];
  testCases: TestCase[];
};

export default function Home() {
  const [product, setProduct] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeTab, setActiveTab] = useState<"define" | "test">("define");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error: authError }) => {
        if (!isMounted) return;
        if (authError) {
          setAuthError("Unable to check your sign-in status. Please refresh.");
        } else {
          setUser(data.session?.user ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthError("Unable to check your sign-in status. Please refresh.");
        }
      })
      .finally(() => {
        if (isMounted) setCheckingAuth(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const page = document.querySelector(".product-page");
    if (!page) return;

    page.classList.add("motion-ready");
    const revealItems = page.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  async function handleLogout() {
    if (!supabase) return;

    setAuthError("");
    setSigningOut(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setSigningOut(false);

    if (signOutError) {
      setAuthError(signOutError.message);
      return;
    }
    setUser(null);
  }

  async function generateRequirements() {
    if (!product.trim()) {
      setError("Please enter your product idea first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed. Please try again.");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="product-page">
      <section className="hero-section">
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/" className="brand-mark" aria-label="ProductOS home">
            <span className="brand-icon" aria-hidden="true">P</span>
            <span>Product<span>OS</span></span>
          </Link>
          <div className="nav-links">
            <a href="#principles" className="nav-text-link">Our principles</a>
            <a href="#workspace" className="nav-text-link">Workspace</a>
            <div className="nav-auth-links">
              {user ? (
                <>
                  <span className="nav-user">
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={signingOut}
                    className="nav-button nav-button-secondary"
                  >
                    {signingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="nav-text-link"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="nav-button"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="status-dot" /> A better way to build what matters</p>
            <h1>Think in<br /><span>products.</span></h1>
            <p className="hero-description">
              Turn real user problems into validated solutions—with the clarity
              to know what to build, and the confidence to know why.
            </p>
            <a className="hero-cta" href="#principles">
              Explore the principles <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="blueprint" aria-label="An animated product thinking diagram">
            <div className="blueprint-grid" />
            <div className="blueprint-orbit orbit-one" />
            <div className="blueprint-orbit orbit-two" />
            <svg className="blueprint-connections" viewBox="0 0 560 510" fill="none" aria-hidden="true">
              <path d="M280 255 120 140M280 255 430 115M280 255 465 350M280 255 145 410" />
              <path d="M120 140 430 115M430 115 465 350M465 350 145 410M145 410 120 140" />
              <path className="connection-accent" d="M120 140 280 255 465 350" />
            </svg>
            <div className="blueprint-center">
              <span className="center-mark">P</span>
              <span className="center-label">USER VALUE</span>
              <span className="center-caption">the outcome we design for</span>
            </div>
            <div className="blueprint-node node-problem"><span className="node-number">01</span><span>Problem</span></div>
            <div className="blueprint-node node-insight"><span className="node-number">02</span><span>Insight</span></div>
            <div className="blueprint-node node-solution"><span className="node-number">03</span><span>Solution</span></div>
            <div className="blueprint-node node-evidence"><span className="node-number">04</span><span>Evidence</span></div>
            <span className="blueprint-coordinate coordinate-top">FIG 01 — PRODUCT LOOP</span>
            <span className="blueprint-coordinate coordinate-bottom">DISCOVER / DEFINE / VALIDATE</span>
            <span className="blueprint-crosshair crosshair-one" />
            <span className="blueprint-crosshair crosshair-two" />
          </div>
        </div>
        <div className="hero-bottom">
          <span>Good products start with better questions.</span>
          <span>Scroll to explore <span aria-hidden="true">↓</span></span>
        </div>
      </section>

      <section id="principles" className="principles-section">
        <div className="principles-inner">
          <div className="principles-heading reveal">
            <p className="eyebrow">THE PRODUCTOS POINT OF VIEW</p>
            <h2>The principles behind<br />better products<span>.</span></h2>
            <p className="principles-intro">
              Strong products aren’t accidents. They’re the result of asking
              better questions, making deliberate choices, and learning early.
            </p>
          </div>
          <div className="principles-grid">
            <article className="principle-card reveal">
              <span className="principle-number">01 / LISTEN</span>
              <h3>Start with a real user problem.</h3>
              <p>Begin with the friction people actually feel—not a solution looking for a problem.</p>
              <span className="principle-mark" aria-hidden="true">↗</span>
            </article>
            <article className="principle-card reveal">
              <span className="principle-number">02 / FOCUS</span>
              <h3>Define outcomes before features.</h3>
              <p>Know what better looks like for people before deciding what to build.</p>
              <span className="principle-mark" aria-hidden="true">◎</span>
            </article>
            <article className="principle-card reveal">
              <span className="principle-number">03 / CLARIFY</span>
              <h3>Write clear, testable requirements.</h3>
              <p>Make intent precise enough that teams can build it—and agree when it works.</p>
              <span className="principle-mark" aria-hidden="true">⌘</span>
            </article>
            <article className="principle-card reveal">
              <span className="principle-number">04 / LEARN</span>
              <h3>Validate assumptions with evidence.</h3>
              <p>Replace confident guesses with small, thoughtful tests and real signals.</p>
              <span className="principle-mark" aria-hidden="true">↗</span>
            </article>
          </div>
          <a className="principles-continue" href="#workspace">
            Put the principles into practice <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section id="workspace" className="workspace-section">
        <div className="workspace-inner">
          <div className="workspace-heading reveal">
            <div>
              <p className="eyebrow">THE PRODUCTOS WORKSPACE</p>
              <h2>From clear thinking<br />to a better brief<span>.</span></h2>
              <p>Bring an idea. Leave with a direction your team can define and test.</p>
            </div>
            <div className="workspace-status">
              <span className="status-dot" />
              {checkingAuth
                ? "Checking sign-in..."
                : user
                  ? "Signed in"
                  : "Ready when you are"}
            </div>
          </div>
          {authError && (
            <p role="alert" className="workspace-alert">{authError}</p>
          )}

          <section className="generator-card">
          <label
            htmlFor="product"
            className="generator-label"
          >
            Describe your product idea
          </label>
          <textarea
            id="product"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder="Example: A smart water bottle that reminds people to drink water and tracks daily hydration..."
            rows={4}
            maxLength={5000}
            className="generator-input"
          />
          <div className="generator-meta">
            <p>
              Describe the users, problem, and what the product should do.
            </p>
            <p>{product.length}/5000</p>
          </div>

          <button
            onClick={generateRequirements}
            disabled={loading}
            className="generate-button"
          >
            {loading ? "Generating requirements..." : "Generate requirements"}
            {!loading && <span aria-hidden="true">↗</span>}
          </button>

          {error && (
            <p
              role="alert"
              className="generator-error"
            >
              {error}
            </p>
          )}
          </section>

        {analysis && (
          <section className="mt-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-cyan-400">YOUR GENERATED PLAN</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {analysis.productName || "Product requirements"}
                </h2>
              </div>

              <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
                <button
                  onClick={() => setActiveTab("define")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    activeTab === "define"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Define
                </button>
                <button
                  onClick={() => setActiveTab("test")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    activeTab === "test"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  Test
                </button>
              </div>
            </div>

            {activeTab === "define" ? (
              <div className="space-y-5">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-3 text-lg font-semibold">Problem statement</h3>
                  <p className="leading-7 text-slate-300">
                    {analysis.problemStatement}
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Target personas</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysis.targetPersonas?.map((persona, index) => (
                      <div
                        key={`${persona.name}-${index}`}
                        className="rounded-xl border border-slate-700 p-4"
                      >
                        <h4 className="font-semibold">{persona.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {persona.needs}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">
                    MoSCoW feature priorities
                  </h3>
                  <div className="space-y-3">
                    {analysis.features?.map((feature, index) => (
                      <div
                        key={`${feature.name}-${index}`}
                        className="rounded-xl border border-slate-700 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold">{feature.name}</h4>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">
                            {feature.priority}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {feature.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">User stories</h3>
                  <div className="space-y-4">
                    {analysis.userStories?.map((story, index) => (
                      <div
                        key={`${story.id}-${index}`}
                        className="rounded-xl border border-slate-700 p-4"
                      >
                        <p className="text-xs font-semibold text-cyan-400">
                          {story.id}
                        </p>
                        <p className="mt-2 leading-6 text-slate-200">
                          {story.story}
                        </p>
                        <p className="mt-3 text-sm text-slate-400">
                          Testable: {story.testable ? "Yes" : "Needs improvement"}
                        </p>
                        {!story.testable && story.suggestedRewrite && (
                          <p className="mt-2 text-sm text-amber-300">
                            Suggested rewrite: {story.suggestedRewrite}
                          </p>
                        )}
                        <div className="mt-3">
                          <p className="text-sm font-semibold">Acceptance criteria</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                            {story.acceptanceCriteria?.map((criterion, i) => (
                              <li key={i}>{criterion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-3 text-lg font-semibold">Assumptions</h3>
                  <ul className="list-disc space-y-2 pl-5 text-slate-300">
                    {analysis.assumptions?.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </article>
              </div>
            ) : (
              <div className="space-y-5">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Acceptance criteria by story</h3>
                  <div className="space-y-4">
                    {analysis.userStories?.map((story, index) => (
                      <div
                        key={`${story.id}-criteria-${index}`}
                        className="rounded-xl border border-slate-700 p-4"
                      >
                        <h4 className="font-semibold">
                          {story.id}: {story.story}
                        </h4>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                          {story.acceptanceCriteria?.map((criterion, i) => (
                            <li key={i}>{criterion}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Test cases</h3>
                  <div className="space-y-4">
                    {analysis.testCases?.map((test, index) => (
                      <div
                        key={`${test.id}-${index}`}
                        className="rounded-xl border border-slate-700 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold">
                            {test.id}: {test.title}
                          </h4>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">
                            Story: {test.userStoryId}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold">Steps</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-400">
                          {test.steps?.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <p className="mt-3 text-sm font-semibold">Expected result</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {test.expectedResult}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            )}
          </section>
        )}

        {!analysis && !loading && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-slate-400">
              Your Define and Test outputs will appear here after generation.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="font-semibold text-cyan-300">
              ProductOS is analyzing your idea...
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Building personas, prioritizing features, and preparing test cases.
            </p>
          </div>
        )}

        <footer className="site-footer">
          <Link href="/" className="brand-mark">
            <span className="brand-icon" aria-hidden="true">P</span>
            <span>Product<span>OS</span></span>
          </Link>
          <span>Define clearly. Test confidently.</span>
          <span>© ProductOS</span>
        </footer>
        </div>
      </section>
    </main>
  );
}