import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { title: "Planning investigation", detail: "Deciding what evidence this question needs and why" },
  { title: "Searching live web", detail: "Prioritized by source credibility for this industry" },
  { title: "Reading sources", detail: "Retrieving and parsing the article text" },
  { title: "Extracting evidence and corroboration", detail: "Tagging each development with its sources" },
  { title: "Scoring signal strength", detail: "Independent source count weighted by recency" },
  { title: "Drafting executive briefing", detail: "Synthesising findings for a C-level reader" },
  { title: "Verifying claims against sources", detail: "A separate pass re-reads the draft" },
  { title: "Flagging uncertain points for your review", detail: "Weakest claims surfaced for confirmation" },
  { title: "Finalizing briefing with citations", detail: "Attaching the reasoning trace" },
];

export function AgentProgress({ done }: { done: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (done) {
      setActive(STEPS.length);
      return;
    }
    const id = setInterval(() => {
      setActive((a) => (a < STEPS.length - 1 ? a + 1 : a));
    }, 5200);
    return () => clearInterval(id);
  }, [done]);

  return (
    <ol className="space-y-3">
      {STEPS.map((step, i) => {
        const complete = i < active;
        const current = i === active;
        return (
          <li
            key={step.title}
            className={`flex items-start gap-3 text-sm transition-opacity duration-500 ${
              complete || current ? "opacity-100" : "opacity-40"
            }`}
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
              {complete ? (
                <Check className="size-3.5 text-primary" />
              ) : current ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </span>
            <span>
              <span
                className={complete || current ? "text-foreground" : "text-muted-foreground"}
              >
                {step.title}
              </span>
              {current && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{step.detail}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
