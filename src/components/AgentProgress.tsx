import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Searching live web",
  "Reading sources",
  "Extracting evidence",
  "Consolidating themes",
  "Generating executive briefing",
  "Attaching citations",
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
    }, 4200);
    return () => clearInterval(id);
  }, [done]);

  return (
    <ol className="space-y-3">
      {STEPS.map((step, i) => {
        const complete = i < active;
        const current = i === active;
        return (
          <li
            key={step}
            className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${
              complete || current ? "opacity-100" : "opacity-40"
            }`}
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-border bg-card">
              {complete ? (
                <Check className="size-3.5 text-primary" />
              ) : current ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </span>
            <span className={complete || current ? "text-foreground" : "text-muted-foreground"}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
