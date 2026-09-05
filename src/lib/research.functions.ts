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
};

export type Briefing = {
  executiveSummary: string[];
  keyDevelopments: { title: string; analysis: string; businessImplication: string }[];
  industryImpact: { shortTerm: string; mediumTerm: string; strategic: string };
  leadershipQuestions: string[];
  foodForThought: { idea: string; why: string }[];
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

function publisherFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
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

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You judge whether a research topic plausibly belongs to a selected industry. Be permissive: only flag clear mismatches. Available industries: " +
                INDUSTRY_LIST.join(", ") +
                '. Return JSON {"related": boolean, "suggestedIndustry": string|null, "message": string}. suggestedIndustry must be one of the listed industries or null. message is one short sentence for an executive user.',
            },
            { role: "user", content: `Industry: ${data.industry}\nTopic: ${topic}` },
          ],
        }),
      });
      if (!res.ok) return { related: true, suggestedIndustry: null, message: "" };
      const json: any = await res.json();
      const parsed = JSON.parse(
        (json?.choices?.[0]?.message?.content ?? "{}").replace(/^```json\s*|```$/g, "").trim(),
      );
      const suggested =
        typeof parsed.suggestedIndustry === "string" && INDUSTRY_LIST.includes(parsed.suggestedIndustry)
          ? parsed.suggestedIndustry
          : null;
      return {
        related: parsed.related !== false,
        suggestedIndustry: suggested,
        message: typeof parsed.message === "string" ? parsed.message : "",
      };
    } catch {
      return { related: true, suggestedIndustry: null, message: "" };
    }
  });


export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<Briefing> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
    if (!lovableKey || !firecrawlKey) {
      throw new Error(
        "Unable to perform live research. Please verify that web search and retrieval tools are configured.",
      );
    }

    const label =
      data.timeframe === "7" ? "last 7 days" : data.timeframe === "30" ? "last 30 days" : "last 90 days";
    const topic = data.topic.trim();
    const isGeneral = data.industry === "All Industries / General";
    const scope = isGeneral ? "Global cross-industry business" : `${data.industry} industry`;
    const query = topic
      ? `${scope}: ${topic} — news, developments and data (${label})`
      : `${scope}: most important trends, news, developments and data (${label})`;


    let searchJson: any;
    try {
      const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": firecrawlKey,
        },
        body: JSON.stringify({
          query,
          limit: 8,
          tbs: TBS[data.timeframe],
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`Firecrawl search failed [${res.status}]: ${body}`);
        throw new Error("search_failed");
      }
      searchJson = await res.json();
    } catch (err) {
      console.error("Live retrieval error", err);
      throw new Error(
        "Unable to perform live research. Please verify that web search and retrieval tools are configured.",
      );
    }

    const rawResults: any[] = searchJson?.data?.web ?? searchJson?.data ?? searchJson?.results ?? [];
    const docs = (Array.isArray(rawResults) ? rawResults : [])
      .filter((r) => r && typeof r.url === "string")
      .slice(0, 8);

    if (docs.length === 0) {
      throw new Error(
        "Unable to perform live research. Please verify that web search and retrieval tools are configured.",
      );
    }

    const sources: ResearchSource[] = docs.map((d) => ({
      title: d.title || d.metadata?.title || d.url,
      publisher: d.metadata?.siteName || publisherFromUrl(d.url),
      publishedDate: d.metadata?.publishedTime || d.publishedDate || d.date || null,
      url: d.url,
    }));

    const corpus = docs
      .map((d, i) => {
        const text: string = d.markdown || d.description || "";
        const s = sources[i]!;
        return `### SOURCE ${i + 1}\nTitle: ${s.title}\nPublisher: ${s.publisher}\nDate: ${s.publishedDate ?? "unknown"}\nURL: ${d.url}\n\n${text.slice(0, 6000)}`;
      })
      .join("\n\n---\n\n");

    const system =
      "You are a senior research analyst producing executive briefings in the style of Bloomberg Intelligence and McKinsey. Use ONLY the retrieved source material provided. Never invent facts, statistics, organisations or sources. Reference sources inline as [S1], [S2] matching the SOURCE numbers. Return valid JSON only.";

    const prompt = `Industry: ${isGeneral ? "All industries (cross-industry overview)" : data.industry}
Topic: ${topic || "Broad industry trends (no specific topic given — cover the most consequential developments)"}
Timeframe: ${label}

Retrieved sources:

${corpus}

Produce JSON with exactly this shape:
{
  "executiveSummary": [3-5 paragraph strings written for C-level readers: what happened, why it matters, what leaders should watch],
  "keyDevelopments": [4-6 objects: {"title": string, "analysis": string, "businessImplication": string}],
  "industryImpact": {"shortTerm": string, "mediumTerm": string, "strategic": string},
  "leadershipQuestions": [5-8 sharp executive questions],
  "foodForThought": [3-5 objects: {"idea": string, "why": string}] — provocative ideas, contrarian takes, or unexpected connections drawn from the sources. Each "idea" is one bold thought worth debating (not a question), and "why" explains in one sentence why it deserves attention now. Ground every idea in the sources; label speculation as speculation.
}
Include concrete statistics and named entities only when they appear in the sources, each followed by its [S#] marker.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const body = await aiRes.text();
      console.error(`AI gateway failed [${aiRes.status}]: ${body}`);
      throw new Error(
        "Unable to perform live research. Please verify that web search and retrieval tools are configured.",
      );
    }

    const aiJson: any = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(content.replace(/^```json\s*|```$/g, "").trim());
    } catch {
      console.error("Failed to parse model output", content.slice(0, 500));
      throw new Error(
        "Unable to perform live research. Please verify that web search and retrieval tools are configured.",
      );
    }

    return {
      executiveSummary: parsed.executiveSummary ?? [],
      keyDevelopments: parsed.keyDevelopments ?? [],
      industryImpact: parsed.industryImpact ?? { shortTerm: "", mediumTerm: "", strategic: "" },
      leadershipQuestions: parsed.leadershipQuestions ?? [],
      foodForThought: Array.isArray(parsed.foodForThought) ? parsed.foodForThought : [],
      sources,
    };
  });
