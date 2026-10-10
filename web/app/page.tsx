"use client";

import { useState } from "react";

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
    <main className="min-h-screen bg-[#0b1020] px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              PRODUCTOS
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              From idea to testable requirements.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Turn a product idea into structured requirements, user stories,
              and a traceable test plan.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            AI Product Workspace
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
          <label
            htmlFor="product"
            className="mb-3 block text-lg font-semibold"
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
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Describe the users, problem, and what the product should do.
            </p>
            <p className="text-xs text-slate-500">{product.length}/5000</p>
          </div>

          <button
            onClick={generateRequirements}
            disabled={loading}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating requirements..." : "Generate requirements"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
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

        <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
          ProductOS · Define clearly. Test confidently.
        </footer>
      </div>
    </main>
  );
}