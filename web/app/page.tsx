"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import SearchHistory from "./SearchHistory";

type Persona = { name: string; needs: string };
type Feature = { name: string; priority: string; reason: string };
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
targetPersonas: Persona[];  features: Feature[];
  userStories: UserStory[];
  assumptions: string[];
  testCases: TestCase[];
};
type BuildTask = {
  id: string;
  title: string;
  userStory: string;
  objective: string;
  explanation: string;
  implementationSteps: string[];
  acceptanceCriteria: string[];
  testingPlan: string[];
  dependencies: string[];
  deliverables: string[];
  priority: string;
  status: string;
};
type BuildPlan = {
  productName: string;
  status: string;
  message: string;
  userStories: string[];
  tasks: BuildTask[];
};

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h5 className="text-sm font-semibold text-slate-200">{title}</h5>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function Home() {
  const [product, setProduct] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [isListening, setIsListening] = useState(false);
const [voiceError, setVoiceError] = useState("");

const startVoiceInput = () => {
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
    

  if (!SpeechRecognitionAPI) {
    setVoiceError("Voice input is not supported. Try Chrome or Edge.");
    return;
  }

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = "en-IN";
  recognition.continuous = true;
  recognition.interimResults = true;

  setVoiceError("");
  setIsListening(true);

  recognition.onresult = (event: any) => {
    let transcript = "";

    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + " ";
    }

    setProduct(transcript.trim().slice(0, 5000));
  };

  recognition.onerror = () => {
    setVoiceError("Could not capture your voice. Check microphone permission.");
    setIsListening(false);
  };

  recognition.onend = () => setIsListening(false);

  recognition.start();
};
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeTab, setActiveTab] = useState<"define" | "build" | "test">("define");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buildPlan, setBuildPlan] = useState<BuildPlan | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });
    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) setAuthError("Unable to check your sign-in status. Please refresh.");
        else setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (isMounted) setAuthError("Unable to check your sign-in status. Please refresh.");
      })
      .finally(() => {
        if (isMounted) setCheckingAuth(false);
      });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
  setIsListening(false);
    if (!product.trim()) {
      setError("Please enter your product idea first.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    setBuildPlan(null);
    setBuildError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed. Please try again.");
      setAnalysis(data.analysis);
      if (supabase && user && product.trim()) {
  const { error: historyError } = await supabase
    .from("search_history")
    .insert({
      user_id: (user as { id: string }).id,
      query: product.trim(),
    });

  if (historyError) {
    console.error("Failed to save search history:", historyError.message);
  } else {
    setHistoryRefresh((n) => n + 1);
  }
}
      setActiveTab("define");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function generateBuildPlan() {
    if (!analysis) {
      setBuildError("Generate requirements first in the Define stage.");
      return;
    }
    setBuildLoading(true);
    setBuildError("");
    setBuildPlan(null);
    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: analysis.productName,
          userStories: analysis.userStories.map((story) => story.story),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Build planning failed.");
      setBuildPlan(data.buildPlan as BuildPlan);
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBuildLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <nav className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Product<span className="text-cyan-400">OS</span>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <span className="max-w-48 truncate text-sm text-slate-300">{user.email}</span>
                  <button type="button" onClick={handleLogout} disabled={signingOut}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                    {signingOut ? "Logging out..." : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900">Log in</Link>
                  <Link href="/signup" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Sign up</Link>
                </>
              )}
            </div>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">AI PRODUCT WORKSPACE</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">From idea to testable requirements.</h1>
              <p className="mt-3 max-w-2xl text-slate-400">
                Turn a product idea into structured requirements, implementation tasks, and a traceable test plan.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
              {checkingAuth ? "Checking sign-in..." : user ? "Signed in" : "Welcome to ProductOS"}
            </div>
          </div>
          {authError && <p role="alert" className="mt-4 text-sm text-red-300">{authError}</p>}
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
          <label htmlFor="product" className="mb-3 block text-lg font-semibold">Describe your product idea</label>
          <textarea id="product" value={product} onChange={(event) => setProduct(event.target.value)}
            placeholder="Example: A smart water bottle that reminds people to drink water and tracks daily hydration..."
            rows={4} maxLength={5000}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
            
<div className="mt-3 flex flex-wrap items-center gap-3">
  <button
    type="button"
    onClick={startVoiceInput}
    disabled={isListening}
    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-60"
  >
    {isListening ? "🎙️ Listening..." : "🎙️ Describe with voice"}
  </button>

  {voiceError && (
    <p className="text-sm text-red-400">{voiceError}</p>
  )}
</div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Describe the users, problem, and what the product should do.</p>
            <p className="text-xs text-slate-500">{product.length}/5000</p>
          </div>
          <button onClick={generateRequirements} disabled={loading}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Generating requirements..." : "Generate requirements"}
          </button>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>

        {analysis && (
          <section className="mt-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-cyan-400">YOUR GENERATED PLAN</p>
                <h2 className="mt-1 text-2xl font-bold">{analysis.productName || "Product requirements"}</h2>
              </div>
              <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
                {(["define", "build", "test"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${activeTab === tab ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "define" ? (
              <div className="space-y-5">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-3 text-lg font-semibold">Problem statement</h3>
                  <p className="leading-7 text-slate-300">{analysis.problemStatement}</p>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
               <h3 className="mb-4 text-lg font-semibold">Target users</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysis.targetPersonas?.map((persona, index) => (
                      <div key={`${persona.name}-${index}`} className="rounded-xl border border-slate-700 p-4">
                        <h4 className="font-semibold">{persona.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{persona.needs}</p>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Feature priorities</h3>
                  <div className="space-y-3">
                    {analysis.features?.map((feature, index) => (
                      <div key={`${feature.name}-${index}`} className="rounded-xl border border-slate-700 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold">{feature.name}</h4>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">{feature.priority}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{feature.reason}</p>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">User stories</h3>
                  <div className="space-y-4">
                    {analysis.userStories?.map((story, index) => (
                      <div key={`${story.id}-${index}`} className="rounded-xl border border-slate-700 p-4">
                        <p className="text-xs font-semibold text-cyan-400">{story.id}</p>
                        <p className="mt-2 leading-6 text-slate-200">{story.story}</p>
                        <p className="mt-3 text-sm text-slate-400">Testable: {story.testable ? "Yes" : "Needs improvement"}</p>
                        {!story.testable && story.suggestedRewrite && <p className="mt-2 text-sm text-amber-300">Suggested rewrite: {story.suggestedRewrite}</p>}
                        <div className="mt-3">
                          <p className="text-sm font-semibold">Acceptance criteria</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                            {story.acceptanceCriteria?.map((criterion, index) => <li key={index}>{criterion}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-3 text-lg font-semibold">Assumptions</h3>
                  <ul className="list-disc space-y-2 pl-5 text-slate-300">
                    {analysis.assumptions?.map((assumption, index) => <li key={index}>{assumption}</li>)}
                  </ul>
                </article>
              </div>
            ) : activeTab === "build" ? (
              <div className="space-y-5">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-2 text-lg font-semibold">AI implementation plan</h3>
                  <p className="text-sm leading-6 text-slate-400">
                     Your product blueprint, ready to take shape. Turn user stories into actionable tasks, clear implementation steps, and testable outcomes.
                  </p>
                  <button type="button" onClick={generateBuildPlan} disabled={buildLoading}
                    className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
                    {buildLoading ? "ProductOS is planning..." : buildPlan ? "Regenerate build plan" : "Generate build plan"}
                  </button>
                  {buildLoading && <p className="mt-3 text-sm text-cyan-300">Preparing implementation steps, acceptance criteria, dependencies, and tests...</p>}
                  {buildError && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{buildError}</p>}
                </article>

                {buildPlan && (
                  <>
                    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold">{buildPlan.productName} implementation roadmap</h3>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">{buildPlan.status}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{buildPlan.message}</p>
                      <p className="mt-3 text-xs text-slate-500">Generated from {buildPlan.userStories.length} user stories · {buildPlan.tasks.length} tasks</p>
                    </article>
                    <div className="space-y-4">
                      {buildPlan.tasks.map((task) => (
                        <article key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold tracking-wider text-cyan-400">{task.id}</p>
                              <h3 className="mt-1 text-lg font-semibold">{task.title}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">Priority: {task.priority}</span>
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{task.status}</span>
                            </div>
                          </div>
                          {task.userStory && <p className="mt-3 text-sm leading-6 text-slate-300"><strong>Related story:</strong> {task.userStory}</p>}
                          {task.objective && <p className="mt-3 text-sm leading-6 text-slate-300"><strong>Objective:</strong> {task.objective}</p>}
                          {task.explanation && <p className="mt-2 text-sm leading-6 text-slate-400">{task.explanation}</p>}
                          <DetailList title="Implementation steps" items={task.implementationSteps} />
                          <DetailList title="Acceptance criteria" items={task.acceptanceCriteria} />
                          <DetailList title="Testing plan" items={task.testingPlan} />
                          <DetailList title="Dependencies" items={task.dependencies} />
                          <DetailList title="Deliverables" items={task.deliverables} />
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Acceptance criteria by story</h3>
                  <div className="space-y-4">
                    {analysis.userStories?.map((story, index) => (
                      <div key={`${story.id}-criteria-${index}`} className="rounded-xl border border-slate-700 p-4">
                        <h4 className="font-semibold">{story.id}: {story.story}</h4>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                          {story.acceptanceCriteria?.map((criterion, index) => <li key={index}>{criterion}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="mb-4 text-lg font-semibold">Test cases</h3>
                  <div className="space-y-4">
                    {analysis.testCases?.map((test, index) => (
                      <div key={`${test.id}-${index}`} className="rounded-xl border border-slate-700 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold">{test.id}: {test.title}</h4>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">Story: {test.userStoryId}</span>
                        </div>
                        <p className="mt-3 text-sm font-semibold">Steps</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-400">
                          {test.steps?.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                        <p className="mt-3 text-sm font-semibold">Expected result</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{test.expectedResult}</p>
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
            <p className="text-slate-400">Your Define, Build, and Test outputs will appear here after generating requirements.</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="font-semibold text-cyan-300">ProductOS is analyzing your idea...</p>
            <p className="mt-2 text-sm text-slate-400">Building personas, prioritizing features, and preparing test cases.</p>
          </div>
        )}
        <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
          ProductOS · Define clearly. Build deliberately. Test confidently.
        </footer>
      </div>
      <SearchHistory
  supabase={supabase}
  refreshKey={historyRefresh}
  onSelect={(q) => setProduct(q)}
/>
    </main>
  );
}
