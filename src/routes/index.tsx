import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";

import {
  runResearch,
  checkTopicFit,
  INDUSTRY_LIST,
  type Briefing,
  type TopicFit,
} from "@/lib/research.functions";
import { INDUSTRIES, GENERAL_TOPICS } from "@/lib/industries";
import { AgentProgress } from "@/components/AgentProgress";
import { BriefingOutput } from "@/components/BriefingOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SignalBrief Research Agent — Executive Briefings from Live Sources" },
      {
        name: "description",
        content:
          "Give the agent an industry, topic, and timeframe. It researches the live web and returns an executive briefing with cited sources.",
      },
      { property: "og:title", content: "SignalBrief Research Agent" },
      {
        property: "og:description",
        content:
          "Live web research synthesized into an executive-ready briefing with traceable sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUGGESTED_TOPICS: Record<string, string[]> = {
  "All Industries / General": GENERAL_TOPICS,
  ...Object.fromEntries(INDUSTRIES.map((i) => [i.name, i.suggestedTopics])),
};

const TIMEFRAMES = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
] as const;

function Index() {
  const [industry, setIndustry] = useState("Manufacturing");
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState<"7" | "30" | "90">("30");
  const [fit, setFit] = useState<TopicFit | null>(null);

  const research = useServerFn(runResearch);
  const checkFit = useServerFn(checkTopicFit);

  const mutation = useMutation<Briefing | null, Error, { skipFitCheck?: boolean } | void>({
    mutationFn: async (opts) => {
      setFit(null);
      const trimmed = topic.trim();
      if (!opts?.skipFitCheck && trimmed) {
        const result = await checkFit({ data: { industry, topic: trimmed } });
        if (!result.related) {
          setFit(result);
          return null;
        }
      }
      return research({ data: { industry, topic: trimmed, timeframe } });
    },
  });

  const briefing = mutation.data ?? null;
  const suggestions = SUGGESTED_TOPICS[industry] ?? [];


  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg tracking-tight">SignalBrief</span>
          <span className="rule-label">Research Agent · V1</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6">
        <section className="py-20">
          <p className="rule-label">Live retrieval · Source-backed synthesis</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.1] tracking-tight text-foreground">
            SignalBrief Research Agent
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Give the agent an industry, topic, and timeframe. The agent researches the web and
            delivers an executive-ready briefing with cited sources.
          </p>
        </section>

        <section className="border-t border-border py-10">
          <div className="grid gap-6 md:grid-cols-[1fr_1.4fr_1fr]">
            <div className="space-y-2">
              <Label className="rule-label">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-full rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="rule-label">Topic — optional</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Leave blank for broad industry trends"
                className="rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label className="rule-label">Timeframe</Label>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as "7" | "30" | "90")}>
                <SelectTrigger className="w-full rounded-none border-x-0 border-t-0 border-b bg-transparent px-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="rule-label mr-1 flex items-center gap-1.5">
                <Lightbulb className="size-3.5" />
                Suggested topics
              </span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Button
              size="lg"
              className="rounded-none px-8"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({})}
            >
              {mutation.isPending
                ? "Researching…"
                : topic.trim().length === 0
                  ? "Run Broad Industry Briefing"
                  : "Run Research Agent"}
            </Button>
            {topic.trim().length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                No topic given — the agent will brief on the most consequential developments in{" "}
                {industry === "All Industries / General" ? "the wider economy" : industry}.
              </p>
            )}
          </div>
        </section>

        {fit && !fit.related && (
          <section className="my-10 border border-accent/40 bg-secondary/40 p-6">
            <p className="rule-label">Relevance check</p>
            <p className="mt-2 text-sm text-foreground">
              {fit.message ||
                `“${topic.trim()}” doesn't look related to ${industry}.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {fit.suggestedIndustry && (
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => {
                    setIndustry(fit.suggestedIndustry!);
                    setFit(null);
                  }}
                >
                  Switch to {fit.suggestedIndustry}
                </Button>
              )}
              <Button
                variant="ghost"
                className="rounded-none"
                onClick={() => mutation.mutate({ skipFitCheck: true })}
              >
                Run anyway
              </Button>
            </div>
          </section>
        )}

        {(mutation.isPending || briefing) && (
          <section className="border-t border-border py-10">
            <p className="rule-label mb-6">Agent workflow</p>
            <AgentProgress done={!mutation.isPending && !!briefing} />
          </section>
        )}


        {mutation.isError && (
          <section className="my-10 flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-6">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Unable to perform live research.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please verify that web search and retrieval tools are configured.
              </p>
            </div>
          </section>
        )}

        {briefing && (
          <article className="space-y-12 pb-24 pt-4">
            <Section label="01" title="Executive Summary">
              <div className="max-w-3xl space-y-4">
                {briefing.executiveSummary.map((p, i) => (
                  <p key={i} className="text-[0.95rem] leading-7 text-foreground/90">
                    {p}
                  </p>
                ))}
              </div>
            </Section>

            <Section label="02" title="Key Developments">
              <div className="divide-y divide-border border-y border-border">
                {briefing.keyDevelopments.map((d, i) => (
                  <div key={i} className="grid gap-4 py-6 md:grid-cols-[auto_1fr]">
                    <span className="rule-label pt-1 md:w-16">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-display text-lg text-foreground">{d.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-foreground/85">{d.analysis}</p>
                      <p className="mt-3 border-l-2 border-accent pl-4 text-sm leading-7 text-muted-foreground">
                        <span className="rule-label mr-2">Business implication</span>
                        {d.businessImplication}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="03" title="Industry Impact">
              <div className="grid gap-px bg-border md:grid-cols-3">
                {[
                  ["Short term", briefing.industryImpact.shortTerm],
                  ["Medium term", briefing.industryImpact.mediumTerm],
                  ["Strategic significance", briefing.industryImpact.strategic],
                ].map(([label, body]) => (
                  <div key={label} className="bg-card p-6">
                    <p className="rule-label">{label}</p>
                    <p className="mt-3 text-sm leading-7 text-foreground/85">{body}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="05" title="Signals to Monitor">
              <div className="max-w-3xl space-y-6">
                {briefing.foodForThought.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No thought pieces were generated for this briefing.
                  </p>
                )}
                {briefing.foodForThought.map((f, i) => (
                  <div key={i} className="border-l-2 border-accent pl-5">
                    <p className="font-display text-[1.05rem] leading-7 text-foreground">
                      {f.idea}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      <span className="rule-label mr-2">Why now</span>
                      {f.why}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="06" title="Sources">
              <div className="divide-y divide-border border-y border-border">
                {briefing.sources.map((s, i) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-6 py-4 transition-colors hover:bg-secondary/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        <span className="rule-label mr-3">S{i + 1}</span>
                        {s.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.publisher}
                        {s.publishedDate ? ` · ${new Date(s.publishedDate).toLocaleDateString()}` : ""}
                        {" · "}
                        {s.url}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                  </a>
                ))}
              </div>
            </Section>
          </article>
        )}
      </div>
    </main>
  );
}
