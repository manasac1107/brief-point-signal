import { createFileRoute } from "@tanstack/react-router";

import { INDUSTRIES } from "@/lib/industries";

const BASE_URL = "https://brief-point-signal.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = ["/", ...INDUSTRIES.map((i) => `/industries/${i.slug}`)];

        const urls = paths
          .map(
            (p) =>
              [
                `  <url>`,
                `    <loc>${BASE_URL}${p}</loc>`,
                `  </url>`,
              ].join("\n"),
          )
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
