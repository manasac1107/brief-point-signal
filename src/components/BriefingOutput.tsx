import { useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronDown, ShieldAlert, ShieldCheck } from "lucide-react";

import type { Briefing, SignalStrength } from "@/lib/research.functions";
import { Button } from "@/components/ui/button";

export function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <p className="rule-label">{label}</p>
      <h2 className="font-display mt-2 text-2xl text-foreground">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const SIGNAL_STYLES: Record<SignalStrength, string> = {
  High: "border-signal-high/40 bg-signal-high/10 text-signal-high",
  Medium: "border-signal-medium/40 bg-signal-medium/10 text-signal-medium",
  Low: "border-border bg-secondary text-muted-foreground",
};

function SignalBadge({ strength, sources }: { strength: SignalStrength; sources: number }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${SIGNAL_STYLES[strength]}`}
    >
      {strength} signal
      <span className="opacity-70">
        · {sources} {sources === 1 ? "source" : "independent sources"}
      </span>
    </span>
  );
}

function SourceRefs({ indices }: { indices: number[] }) {
  if (indices.length === 0) return null;
  return (
    <span className="rule-label ml-2 text-muted-foreground">
      {indices.map((i) => `S${i}`).join(" · ")}
    </span>
  );
}

export function BriefingOutput({ briefing }: { briefing: Briefing }) {
  const [resolved, setResolved] = useState<Record<string, "confirmed" | "rejected">>({});
  const [traceOpen, setTraceOpen] = useState(false);

  const flagged = briefing.flaggedClaims;
  const allResolved = flagged.every((f) => resolved[f.id]);
  const isFinal = allResolved && briefing.trace.verification.status !== "skipped";
  const rejected = flagged.filter((f) => resolved[f.id] === "rejected").map((f) => f.id);

  return (
    <article className="space-y-12 pb-24 pt-4">
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <span
          className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${
            isFinal
              ? "border-signal-high/40 bg-signal-high/10 text-signal-high"
              : "border-signal-medium/40 bg-signal-medium/10 text-signal-medium"
          }`}
        >
          {isFinal ? <ShieldCheck className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
          {isFinal ? "Final briefing" : "Draft — awaiting your review"}
        </span>
        <span className="text-xs text-muted-foreground">
          {briefing.trace.verification.status === "skipped"
            ? "Verification skipped: tool unavailable."
            : `Verification ${briefing.trace.verification.status} · ${briefing.trace.verification.claimsChecked} claims checked · ${briefing.trace.sourcesUsed} of ${briefing.trace.sourcesConsidered} sources used`}
        </span>
      </div>

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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-display text-lg text-foreground">{d.title}</h3>
                  <SignalBadge strength={d.signalStrength} sources={d.independentSources} />
                </div>
                <p className="mt-2 text-sm leading-7 text-foreground/85">
                  {d.analysis}
                  <SourceRefs indices={d.sourceIndices} />
                </p>
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
        <div className="space-y-px bg-border">
          {briefing.industryImpact.map((t) => (
            <div key={t.theme} className="bg-card p-6">
              <p className="font-display text-base text-foreground">{t.theme}</p>
              <div className="mt-4 grid gap-6 md:grid-cols-3">
                {[
                  ["Short term", t.shortTerm],
                  ["Medium term", t.mediumTerm],
                  ["Strategic significance", t.strategic],
                ].map(([label, body]) => (
                  <div key={label}>
                    <p className="rule-label">{label}</p>
                    <p className="mt-2 text-sm leading-7 text-foreground/85">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="04" title="Confidence & Uncertainty">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="rule-label">Corroborated — higher confidence</p>
            <div className="mt-4 space-y-5">
              {briefing.confidentClaims.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  The verification pass did not identify multi-source claims in this briefing.
                </p>
              )}
              {briefing.confidentClaims.map((c, i) => (
                <div key={i} className="border-l-2 border-signal-high/50 pl-4">
                  <p className="text-sm leading-7 text-foreground">
                    {c.claim}
                    <SourceRefs indices={c.sourceIndices} />
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">{c.basis}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="rule-label">Flagged for your confirmation</p>
            <div className="mt-4 space-y-5">
              {flagged.length === 0 && (
                <p className="text-sm text-muted-foreground">No low-confidence claims flagged.</p>
              )}
              {flagged.map((f) => {
                const state = resolved[f.id];
                return (
                  <div key={f.id} className="border-l-2 border-signal-medium/60 pl-4">
                    <p className="text-sm leading-7 text-foreground">
                      {f.claim}
                      <SourceRefs indices={f.sourceIndices} />
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      <span className="rule-label mr-2">Why uncertain</span>
                      {f.reason}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      <span className="rule-label mr-2">Would raise confidence</span>
                      {f.whatWouldIncreaseConfidence}
                    </p>
                    {state ? (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="size-3.5 text-signal-high" />
                        {state === "confirmed"
                          ? "Confirmed — retained in the final briefing"
                          : "Rejected — excluded from the final briefing"}
                      </p>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none"
                          onClick={() =>
                            setResolved((r) => ({ ...r, [f.id]: "confirmed" }))
                          }
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-none"
                          onClick={() => setResolved((r) => ({ ...r, [f.id]: "rejected" }))}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {flagged.length > 0 && !allResolved && (
              <p className="mt-5 text-xs text-muted-foreground">
                Confirm or reject each flagged claim to mark this briefing final.
              </p>
            )}
            {rejected.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {rejected.length} claim(s) rejected — read the summary above with those excluded.
              </p>
            )}
          </div>
        </div>

        {briefing.trace.broadened.length > 0 && (
          <div className="mt-8 border border-border bg-secondary/40 p-5">
            <p className="rule-label">Search was broadened</p>
            {briefing.trace.broadened.map((b, i) => (
              <p key={i} className="mt-2 text-sm leading-7 text-muted-foreground">
                {b}
              </p>
            ))}
          </div>
        )}
      </Section>

      <Section label="05" title="Leadership Questions">
        <ol className="max-w-3xl space-y-4">
          {briefing.leadershipQuestions.map((q, i) => (
            <li key={i} className="flex gap-4 text-sm leading-7 text-foreground/90">
              <span className="rule-label pt-1">{String(i + 1).padStart(2, "0")}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="06" title="Reasoning Trace">
        <button
          type="button"
          onClick={() => setTraceOpen((o) => !o)}
          className="flex w-full items-center justify-between border border-border px-5 py-4 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
        >
          <span>
            {traceOpen ? "Hide" : "Show"} how the agent worked — plan, searches, verification
          </span>
          <ChevronDown
            className={`size-4 transition-transform ${traceOpen ? "rotate-180" : ""}`}
          />
        </button>

        {traceOpen && (
          <div className="mt-6 space-y-8">
            <div>
              <p className="rule-label">Plan</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/85">
                {briefing.trace.planRationale}
              </p>
            </div>

            <div>
              <p className="rule-label">Searches run</p>
              <div className="mt-3 divide-y divide-border border-y border-border">
                {briefing.trace.queries.map((q, i) => (
                  <div key={i} className="py-4">
                    <p className="text-sm text-foreground">“{q.query}”</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {q.why} · {q.resultCount} result{q.resultCount === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="rule-label">Sources considered vs used</p>
              <p className="mt-2 text-sm leading-7 text-foreground/85">
                {briefing.trace.sourcesConsidered} retrieved · {briefing.trace.sourcesUsed} drawn on
                in the briefing.
              </p>
              <ul className="mt-3 space-y-1.5">
                {briefing.sources.map((s, i) => (
                  <li key={s.url} className="text-xs text-muted-foreground">
                    <span className="rule-label mr-2">S{i + 1}</span>
                    {s.publisher} — {s.used ? "used" : "considered, not cited"}
                    {s.credibilityTier === "high" ? " · high-credibility for this industry" : ""}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="rule-label">Verification pass</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/85">
                {briefing.trace.verification.note}
              </p>
              {briefing.trace.verification.issues.length > 0 && (
                <div className="mt-3 divide-y divide-border border-y border-border">
                  {briefing.trace.verification.issues.map((issue, i) => (
                    <div key={i} className="py-4">
                      <p className="text-sm text-foreground">{issue.claim}</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {issue.finding} · <span className="uppercase tracking-wide">{issue.action}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section label="07" title="Sources">
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
  );
}
