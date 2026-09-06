export type IndustryProfile = {
  slug: string;
  /** Must match an entry in INDUSTRY_LIST (except "All Industries / General"). */
  name: string;
  headline: string;
  description: string;
  suggestedTopics: string[];
};

export const GENERAL_TOPICS = [
  "Enterprise AI agents and workforce impact",
  "Supply chain resilience",
  "Cost of capital and investment outlook",
];

export const INDUSTRIES: IndustryProfile[] = [
  {
    slug: "manufacturing",
    name: "Manufacturing",
    headline: "Manufacturing industry briefings from live sources",
    description:
      "Track factory automation, reshoring, capacity investment, and industrial AI as they happen. SignalBrief researches the live web and distills the most consequential manufacturing developments into an executive-ready briefing with cited sources.",
    suggestedTopics: ["Factory automation and robotics", "Reshoring and capacity investment", "Industrial AI and predictive maintenance"],
  },
  {
    slug: "pharma",
    name: "Pharma",
    headline: "Pharma industry briefings from live sources",
    description:
      "Follow PBM reform, GLP-1 market dynamics, clinical trial technology, and drug-pricing policy without reading dozens of articles. SignalBrief retrieves current reporting and synthesizes it into a source-backed pharma briefing for leadership teams.",
    suggestedTopics: ["Pharmacy benefit managers (PBM) reform", "GLP-1 market dynamics", "Clinical trial AI and drug discovery"],
  },
  {
    slug: "finance",
    name: "Finance",
    headline: "Financial services briefings from live sources",
    description:
      "Stay ahead of capital rules, AI in risk and compliance, and private credit growth. SignalBrief searches live sources and delivers an executive briefing on the financial-services developments that matter, with every claim traceable to a source.",
    suggestedTopics: ["Basel III endgame and capital rules", "AI in risk and compliance", "Private credit growth"],
  },
  {
    slug: "retail",
    name: "Retail",
    headline: "Retail industry briefings from live sources",
    description:
      "Consumer spending shifts, retail media networks, and AI-driven personalisation — researched from live web sources and condensed into a briefing retail leaders can read in minutes, with citations for every major claim.",
    suggestedTopics: ["Consumer spending shifts", "Retail media networks", "AI-driven personalisation"],
  },
  {
    slug: "public-sector",
    name: "Public Sector",
    headline: "Public sector briefings from live sources",
    description:
      "Government AI procurement, digital public infrastructure, and public healthcare funding are moving fast. SignalBrief retrieves current reporting and delivers a source-backed briefing written for public-sector leadership.",
    suggestedTopics: ["Government AI procurement", "Digital public infrastructure", "Public healthcare funding"],
  },
  {
    slug: "energy",
    name: "Energy",
    headline: "Energy industry briefings from live sources",
    description:
      "Grid capacity, data-centre demand, LNG markets, and renewables economics — SignalBrief researches the live web and synthesizes an executive briefing on the energy developments leaders need to watch, with cited sources.",
    suggestedTopics: ["Grid capacity and data centre demand", "LNG market dynamics", "Renewables project economics"],
  },
  {
    slug: "automotive",
    name: "Automotive",
    headline: "Automotive industry briefings from live sources",
    description:
      "EV demand and pricing pressure, software-defined vehicles, and battery supply chains, researched from live sources and delivered as an executive-ready briefing. Every major claim links back to the original reporting.",
    suggestedTopics: ["EV demand and pricing pressure", "Software-defined vehicles", "Battery supply chain"],
  },
  {
    slug: "it",
    name: "IT",
    headline: "IT industry briefings from live sources",
    description:
      "Enterprise AI agents, cloud cost optimisation, and the cybersecurity threat landscape change weekly. SignalBrief searches the live web and produces a source-cited IT briefing written for technology leadership.",
    suggestedTopics: ["Enterprise AI agents and workforce impact", "Cloud cost optimisation", "Cybersecurity threat landscape"],
  },
  {
    slug: "logistics",
    name: "Logistics",
    headline: "Logistics industry briefings from live sources",
    description:
      "Freight rates, warehouse automation, and shipping-route disruption, distilled from live reporting into an executive briefing. SignalBrief does the reading so logistics leaders can go straight to the implications.",
    suggestedTopics: ["Freight rates and capacity", "Warehouse automation", "Shipping route disruption"],
  },
  {
    slug: "sustainability",
    name: "Sustainability",
    headline: "Sustainability briefings from live sources",
    description:
      "CSRD reporting requirements, carbon markets, and Scope 3 emissions in supply chains — SignalBrief retrieves current sources and synthesizes a briefing that keeps sustainability leaders current without the reading pile.",
    suggestedTopics: ["CSRD and reporting requirements", "Carbon markets", "Scope 3 emissions in supply chains"],
  },
];

export function industryBySlug(slug: string): IndustryProfile | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
