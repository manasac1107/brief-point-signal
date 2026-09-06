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
                  {INDUSTRY_LIST.map((i) => (
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

        {briefing && <BriefingOutput briefing={briefing} />}

        <section className="border-t border-border py-10">
          <p className="rule-label">Briefings by industry</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Explore a dedicated briefing page for the industry you follow.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => (
              <Link
                key={i.slug}
                to="/industries/$slug"
                params={{ slug: i.slug }}
                className="border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
              >
                {i.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
