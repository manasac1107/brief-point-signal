import { ArrowUpRight } from "lucide-react";

import type { Briefing } from "@/lib/research.functions";

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

export function BriefingOutput({ briefing }: { briefing: Briefing }) {
  return (
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
              <p className="font-display text-[1.05rem] leading-7 text-foreground">{f.idea}</p>
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
  );
}
