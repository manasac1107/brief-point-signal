import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  industry: z.string().min(1),
  topic: z.string().default(""),
  timeframe: z.enum(["7", "30", "90"]),
});

export type ResearchSource = {
  title: string;
  publisher: string;
  publishedDate: string | null;
  url: string;
  used: boolean;
  credibilityTier: "high" | "standard";
};

export type SignalStrength = "High" | "Medium" | "Low";

export type Development = {
  title: string;
  analysis: string;
  businessImplication: string;
  sourceIndices: number[];
  independentSources: number;
  signalStrength: SignalStrength;
};

export type ImpactTheme = {
  theme: string;
  shortTerm: string;
  mediumTerm: string;
  strategic: string;
};

export type ConfidentClaim = {
  claim: string;
  basis: string;
  sourceIndices: number[];
};

export type FlaggedClaim = {
  id: string;
  claim: string;
  reason: string;
  whatWouldIncreaseConfidence: string;
  sourceIndices: number[];
};

export type VerificationReport = {
  status: "passed" | "corrected" | "skipped";
  note: string;
  claimsChecked: number;
  issues: { claim: string; finding: string; action: string }[];
};

export type ReasoningTrace = {
  planRationale: string;
  queries: { query: string; why: string; resultCount: number }[];
  broadened: string[];
  sourcesConsidered: number;
  sourcesUsed: number;
  verification: VerificationReport;
};

export type Briefing = {
  executiveSummary: string[];
  keyDevelopments: Development[];
  industryImpact: ImpactTheme[];
  confidentClaims: ConfidentClaim[];
  flaggedClaims: FlaggedClaim[];
  leadershipQuestions: string[];
  trace: ReasoningTrace;
  sources: ResearchSource[];
};

export type TopicFit = {
  related: boolean;
  suggestedIndustry: string | null;
  message: string;
};

export const INDUSTRY_LIST = [
  "All Industries / General",
  "Manufacturing",
  "Pharma",
  "Finance",
  "Retail",
  "Public Sector",
  "Energy",
  "Automotive",
  "IT",
  "Logistics",
  "Sustainability",
];

const TBS: Record<string, string> = { "7": "qdr:w", "30": "qdr:m", "90": "qdr:m" };

const RETRIEVAL_ERROR =
  "Unable to perform live research. Please verify that web search and retrieval tools are configured.";

const MODEL = "google/gemini-3-flash-preview";

function publisherFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

function stripFences(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

async function callModel(
  key: string,
  system: string,
  user: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`AI gateway failed [${res.status}]: ${await res.text()}`);
      return null;
    }
    const json = (await res.json()) as any;
    return JSON.parse(stripFences(json?.choices?.[0]?.message?.content ?? "{}"));
  } catch (err) {
    console.error("Model call error", err);
    return null;
  }
}

export const checkTopicFit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ industry: z.string().min(1), topic: z.string() }).parse(data),
  )
  .handler(async ({ data }): Promise<TopicFit> => {
    const topic = data.topic.trim();
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!topic || data.industry === "All Industries / General" || !lovableKey) {
      return { related: true, suggestedIndustry: null, message: "" };
    }

    const parsed = await callModel(
      lovableKey,
      "You judge whether a research topic plausibly belongs to a selected industry. Be permissive: only flag clear mismatches. Available industries: " +
        INDUSTRY_LIST.join(", ") +
        '. Return JSON {"related": boolean, "suggestedIndustry": string|null, "message": string}. suggestedIndustry must be one of the listed industries or null. message is one short sentence for an executive user.',
      `Industry: ${data.industry}\nTopic: ${topic}`,
    );
    if (!parsed) return { related: true, suggestedIndustry: null, message: "" };

    const suggested =
      typeof parsed["suggestedIndustry"] === "string" &&
      INDUSTRY_LIST.includes(parsed["suggestedIndustry"] as string)
        ? (parsed["suggestedIndustry"] as string)
        : null;
    return {
      related: parsed["related"] !== false,
      suggestedIndustry: suggested,
      message: typeof parsed["message"] === "string" ? (parsed["message"] as string) : "",
    };
  });

type RawDoc = {
  url: string;
  title?: string;
  markdown?: string;
  description?: string;
  metadata?: Record<string, any>;
  publishedDate?: string;
  date?: string;
};

async function firecrawlSearch(
  lovableKey: string,
  firecrawlKey: string,
  query: string,
  tbs: string | undefined,
): Promise<RawDoc[]> {
  const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({
      query,
      limit: 6,
      ...(tbs ? { tbs } : {}),
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!res.ok) {
    console.error(`Firecrawl search failed [${res.status}]: ${await res.text()}`);
    throw new Error("search_failed");
  }
  const json = (await res.json()) as any;
  const raw = json?.data?.web ?? json?.data ?? json?.results ?? [];
  return (Array.isArray(raw) ? raw : []).filter(
    (r: RawDoc) => r && typeof r.url === "string",
  ) as RawDoc[];
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 86_400_000;
}

function scoreSignal(sourceCount: number, freshestDays: number | null): SignalStrength {
  let score = sourceCount >= 3 ? 2 : sourceCount === 2 ? 1 : 0;
  if (freshestDays !== null && freshestDays <= 14) score += 1;
  if (freshestDays !== null && freshestDays > 120) score -= 1;
  if (score >= 3) return "High";
  if (score >= 1) return "Medium";
  return "Low";
}

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<Briefing> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
    if (!lovableKey || !firecrawlKey) throw new Error(RETRIEVAL_ERROR);

    const label =
      data.timeframe === "7"
        ? "last 7 days"
        : data.timeframe === "30"
          ? "last 30 days"
          : "last 90 days";
    const topic = data.topic.trim();
    const isGeneral = data.industry === "All Industries / General";
    const scope = isGeneral ? "Global cross-industry business" : `${data.industry} industry`;

    // ---------- 1. PLAN ----------
    const planRaw = await callModel(
      lovableKey,
      "You are a research planner for executive intelligence briefings. Decide what evidence is actually needed to answer the user's question well, then write web search queries that will surface it. Prefer queries that will pull high-credibility outlets, regulators, trade bodies and primary filings for the given industry. Return JSON only.",
      `Industry: ${isGeneral ? "All industries" : data.industry}
Topic: ${topic || "(none given — cover the most consequential developments)"}
Timeframe: ${label}

Return JSON:
{
  "rationale": "2-3 sentences on what evidence this specific question requires and why",
  "queries": [3 objects: {"query": "a web search query string", "why": "what this query is meant to establish"}],
  "credibleDomains": [5-10 domain strings that are high-credibility for this industry, e.g. "reuters.com"]
}`,
    );

    const planRationale =
      typeof planRaw?.["rationale"] === "string"
        ? (planRaw["rationale"] as string)
        : "Planner unavailable — fell back to a single broad query for the selected industry, topic and timeframe.";

    const plannedQueries: { query: string; why: string }[] = Array.isArray(planRaw?.["queries"])
      ? (planRaw!["queries"] as any[])
          .filter((q) => q && typeof q.query === "string")
          .slice(0, 3)
          .map((q) => ({ query: q.query as string, why: String(q.why ?? "") }))
      : [];

    if (plannedQueries.length === 0) {
      plannedQueries.push({
        query: topic
          ? `${scope}: ${topic} — news, developments and data (${label})`
          : `${scope}: most important trends, news, developments and data (${label})`,
        why: "Fallback broad query covering the selected industry, topic and timeframe.",
      });
    }

    const credibleDomains: string[] = Array.isArray(planRaw?.["credibleDomains"])
      ? (planRaw!["credibleDomains"] as any[]).filter((d) => typeof d === "string").map(String)
      : [];

    // ---------- 2. SEARCH ----------
    const queryLog: { query: string; why: string; resultCount: number }[] = [];
    const broadened: string[] = [];
    const byUrl = new Map<string, RawDoc>();

    async function runQueries(
      qs: { query: string; why: string }[],
      tbs: string | undefined,
    ): Promise<void> {
      const results = await Promise.all(
        qs.map(async (q) => {
          try {
            return await firecrawlSearch(lovableKey!, firecrawlKey!, q.query, tbs);
          } catch {
            return null;
          }
        }),
      );
      let anySuccess = false;
      results.forEach((docs, i) => {
        if (docs === null) {
          queryLog.push({ ...qs[i]!, resultCount: 0 });
          return;
        }
        anySuccess = true;
        queryLog.push({ ...qs[i]!, resultCount: docs.length });
        for (const d of docs) if (!byUrl.has(d.url)) byUrl.set(d.url, d);
      });
      if (!anySuccess) throw new Error(RETRIEVAL_ERROR);
    }

    await runQueries(plannedQueries, TBS[data.timeframe]);

    // ---------- 2b. ADAPTIVE BROADENING ----------
    if (byUrl.size < 4) {
      broadened.push(
        `Initial search returned only ${byUrl.size} source(s). The agent broadened the query wording and removed the ${label} recency filter, then searched again.`,
      );
      await runQueries(
        [
          {
            query: topic
              ? `${scope} ${topic} analysis outlook data`
              : `${scope} key trends analysis outlook data`,
            why: "Broadened fallback after thin initial evidence.",
          },
        ],
        undefined,
      );
    }

    const docs = [...byUrl.values()].slice(0, 12);
    if (docs.length === 0) throw new Error(RETRIEVAL_ERROR);

    const sources: ResearchSource[] = docs.map((d) => {
      const publisher = d.metadata?.["siteName"] || publisherFromUrl(d.url);
      const host = publisherFromUrl(d.url);
      return {
        title: d.title || d.metadata?.["title"] || d.url,
        publisher,
        publishedDate: d.metadata?.["publishedTime"] || d.publishedDate || d.date || null,
        url: d.url,
        used: false,
        credibilityTier: credibleDomains.some((dom) => host.includes(dom.replace(/^www\./, "")))
          ? "high"
          : "standard",
      };
    });

    const corpus = docs
      .map((d, i) => {
        const s = sources[i]!;
        const text = d.markdown || d.description || "";
        return `### SOURCE ${i + 1}\nTitle: ${s.title}\nPublisher: ${s.publisher}\nDate: ${
          s.publishedDate ?? "unknown"
        }\nURL: ${d.url}\n\n${text.slice(0, 6000)}`;
      })
      .join("\n\n---\n\n");

    // ---------- 3. DRAFT ----------
    const draft = await callModel(
      lovableKey,
      "You are a senior research analyst producing executive briefings in the style of Bloomberg Intelligence and McKinsey. Use ONLY the retrieved source material provided. Never invent facts, statistics, organisations or sources. Cite inline as [S1], [S2] matching the SOURCE numbers, and also list source numbers structurally. Where evidence is thin, single-source or conflicting, say so plainly rather than writing a confident paragraph. Return valid JSON only.",
      `Industry: ${isGeneral ? "All industries (cross-industry overview)" : data.industry}
Topic: ${topic || "Broad industry trends (no specific topic given)"}
Timeframe: ${label}

Retrieved sources:

${corpus}

Return JSON with exactly this shape:
{
  "executiveSummary": [3-5 paragraph strings for C-level readers: what happened, why it matters, what to watch],
  "keyDevelopments": [4-6 objects: {"title": string, "analysis": string, "businessImplication": string, "sourceIndices": [1-based SOURCE numbers that independently report this]}],
  "industryImpact": [2-4 objects: {"theme": string, "shortTerm": string, "mediumTerm": string, "strategic": string}],
  "leadershipQuestions": [5-8 sharp questions grounded in these specific findings],
  "usedSourceIndices": [every SOURCE number you actually drew on]
}
Include statistics and named entities only when they appear in the sources, each followed by its [S#] marker.`,
    );

    if (!draft) throw new Error(RETRIEVAL_ERROR);

    const rawDevs: any[] = Array.isArray(draft["keyDevelopments"]) ? draft["keyDevelopments"] : [];
    const keyDevelopments: Development[] = rawDevs.map((d) => {
      const idxs: number[] = Array.isArray(d?.sourceIndices)
        ? [
            ...new Set<number>(
              (d.sourceIndices as any[])
                .filter((n: any) => Number.isInteger(n) && n >= 1 && n <= sources.length)
                .map(Number),
            ),
          ]
        : [];
      const publishers = new Set(idxs.map((i) => sources[i - 1]!.publisher));
      const independent = publishers.size;
      const freshest = idxs
        .map((i) => daysSince(sources[i - 1]!.publishedDate))
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)[0];
      return {
        title: String(d?.title ?? "Untitled development"),
        analysis: String(d?.analysis ?? ""),
        businessImplication: String(d?.businessImplication ?? ""),
        sourceIndices: idxs,
        independentSources: independent,
        signalStrength: scoreSignal(independent, freshest ?? null),
      };
    });

    const usedIdx = new Set<number>(
      (Array.isArray(draft["usedSourceIndices"]) ? (draft["usedSourceIndices"] as any[]) : [])
        .filter((n) => Number.isInteger(n))
        .map(Number),
    );
    keyDevelopments.forEach((d) => d.sourceIndices.forEach((i) => usedIdx.add(i)));
    usedIdx.forEach((i) => {
      if (sources[i - 1]) sources[i - 1]!.used = true;
    });

    const industryImpact: ImpactTheme[] = (
      Array.isArray(draft["industryImpact"]) ? (draft["industryImpact"] as any[]) : []
    ).map((t) => ({
      theme: String(t?.theme ?? "Overall"),
      shortTerm: String(t?.shortTerm ?? ""),
      mediumTerm: String(t?.mediumTerm ?? ""),
      strategic: String(t?.strategic ?? ""),
    }));

    // ---------- 4. VERIFICATION (separate pass) ----------
    const verifyInput = JSON.stringify({
      executiveSummary: draft["executiveSummary"],
      keyDevelopments: keyDevelopments.map((d) => ({
        title: d.title,
        analysis: d.analysis,
        businessImplication: d.businessImplication,
        sourceIndices: d.sourceIndices,
      })),
      industryImpact,
    });

    const verification = await callModel(
      lovableKey,
      "You are a fact-checker auditing a colleague's draft briefing. You did not write it. Re-read every statistic, named entity and causal claim in the draft against the retrieved sources below. A claim only passes if the source text actually supports it. Correct unsupported wording, and flag the claims that are weakest. Never add new facts. Return valid JSON only.",
      `Retrieved sources:

${corpus}

Draft to audit:

${verifyInput}

Return JSON:
{
  "claimsChecked": integer,
  "issues": [objects: {"claim": string, "finding": string, "action": "corrected" | "removed" | "softened" | "left as is"}],
  "correctedExecutiveSummary": [the executive summary paragraphs, corrected where the draft overstated the sources; keep unchanged text identical],
  "confidentClaims": [3-5 objects: {"claim": string, "basis": string, "sourceIndices": [numbers]} — claims corroborated by multiple independent sources],
  "flaggedClaims": [exactly 2-3 objects: {"claim": string, "reason": string, "whatWouldIncreaseConfidence": string, "sourceIndices": [numbers]} — the claims you are least confident about: single-source, contested, or speculative]
}`,
    );

    const issues = (
      Array.isArray(verification?.["issues"]) ? (verification!["issues"] as any[]) : []
    )
      .filter((i) => i && typeof i.claim === "string")
      .map((i) => ({
        claim: String(i.claim),
        finding: String(i.finding ?? ""),
        action: String(i.action ?? "left as is"),
      }));

    const correctedSummary = Array.isArray(verification?.["correctedExecutiveSummary"])
      ? (verification!["correctedExecutiveSummary"] as any[]).map(String).filter(Boolean)
      : [];

    const executiveSummary =
      correctedSummary.length > 0
        ? correctedSummary
        : Array.isArray(draft["executiveSummary"])
          ? (draft["executiveSummary"] as any[]).map(String)
          : [];

    const flaggedClaims: FlaggedClaim[] = (
      Array.isArray(verification?.["flaggedClaims"]) ? (verification!["flaggedClaims"] as any[]) : []
    )
      .filter((f) => f && typeof f.claim === "string")
      .slice(0, 3)
      .map((f, i) => ({
        id: `flag-${i}`,
        claim: String(f.claim),
        reason: String(f.reason ?? ""),
        whatWouldIncreaseConfidence: String(f.whatWouldIncreaseConfidence ?? ""),
        sourceIndices: Array.isArray(f.sourceIndices)
          ? f.sourceIndices.filter((n: any) => Number.isInteger(n))
          : [],
      }));

    const confidentClaims: ConfidentClaim[] = (
      Array.isArray(verification?.["confidentClaims"])
        ? (verification!["confidentClaims"] as any[])
        : []
    )
      .filter((c) => c && typeof c.claim === "string")
      .map((c) => ({
        claim: String(c.claim),
        basis: String(c.basis ?? ""),
        sourceIndices: Array.isArray(c.sourceIndices)
          ? c.sourceIndices.filter((n: any) => Number.isInteger(n))
          : [],
      }));

    const verificationReport: VerificationReport = verification
      ? {
          status: issues.some((i) => i.action !== "left as is") ? "corrected" : "passed",
          note: issues.some((i) => i.action !== "left as is")
            ? "A separate verification pass re-read the draft against the retrieved sources and adjusted claims the sources did not fully support."
            : "A separate verification pass re-read the draft against the retrieved sources and found no unsupported claims.",
          claimsChecked: Number.isInteger(verification["claimsChecked"])
            ? (verification["claimsChecked"] as number)
            : issues.length,
          issues,
        }
      : {
          status: "skipped",
          note: "Verification skipped: the verification tool was unavailable. Treat every claim below as unverified draft output.",
          claimsChecked: 0,
          issues: [],
        };

    return {
      executiveSummary,
      keyDevelopments,
      industryImpact,
      confidentClaims,
      flaggedClaims,
      leadershipQuestions: Array.isArray(draft["leadershipQuestions"])
        ? (draft["leadershipQuestions"] as any[]).map(String)
        : [],
      trace: {
        planRationale,
        queries: queryLog,
        broadened,
        sourcesConsidered: byUrl.size,
        sourcesUsed: sources.filter((s) => s.used).length,
        verification: verificationReport,
      },
      sources,
    };
  });
