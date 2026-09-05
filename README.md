# SignalBrief AI

## Live App

**[brief-point-signal.lovable.app](https://brief-point-signal.lovable.app)**

## Overview

SignalBrief is a research agent, not a report generator. Given an industry, topic, and timeframe, it searches live web sources, extracts key developments and evidence, and synthesizes an executive-ready briefing with cited sources — in under 60 seconds.

**Pipeline:** Industry + Topic + Timeframe → Search web → Collect sources → Read & extract content → Identify developments → Generate briefing → Return citations

## Product Vision

The application prioritizes live retrieval and source-backed synthesis over model memory. It should never claim information came from a source unless that source was actually retrieved, and never fabricate sources or pretend research was performed. If live retrieval fails, it should say so plainly rather than guessing.

## Interface

### Hero Section

**SignalBrief Research Agent**
*Give the agent an industry, topic, and timeframe. The agent researches the web and delivers an executive-ready briefing with cited sources.*

### Inputs

| Field | Details |
|---|---|
| Industry | Manufacturing, Pharma, Finance, Retail, Public Sector, Energy, Automotive, IT, Logistics, Sustainability |
| Topic | Free text (e.g. "Enterprise AI agents and workforce impact") |
| Timeframe | Last 7 Days, Last 30 Days, Last 90 Days |
| Action | **Run Research Agent** button |

### Agent Workflow Display

On submit, animated progress steps show: Searching live web → Reading sources → Extracting evidence → Consolidating themes → Generating executive briefing → Attaching citations.

## Output Format

**Executive Summary** — 3–5 paragraphs written for executives, covering what happened, why it matters, and what leaders should pay attention to.

**Key Developments** — Each entry includes a title, analysis, and business implication.

**Industry Impact** — Short-term impact, medium-term impact, and strategic significance.

**Leadership Questions** — 5–8 executive-level questions (e.g. "How should organizations prepare for AI-enabled workforce redesign?").

**Sources** — Source title, publisher, publication date, and URL for every major claim.

### Local setup

Requires Node.js and npm ([install via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
</content>
</invoke>
