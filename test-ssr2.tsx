import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { SiteShell } from "@/components/site-shell";
import { MetaTags, JsonLd } from "@/lib/seo";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import HikesPage from "@/pages/hikes";

const Page = HikesPage;
const path = "/hikes";

const headComponents = React.createElement(
  "div",
  { "data-prerender-head": "true", style: { display: "none" } },
  React.createElement(MetaTags, { key: "meta", seo: {
    title: "Test",
    description: "Test",
    path: path,
  }}),
  React.createElement(JsonLd, { key: "org", data: organizationJsonLd() }),
  React.createElement(JsonLd, { key: "site", data: websiteJsonLd() }),
);

const pageBody = React.createElement(
  "div",
  { "data-prerender-body": "true" },
  React.createElement(Routes as React.ComponentType<{ children: ReactNode }>, null,
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "home", path: "/",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "blog-slug", path: "/blog/:slug",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "hike-id", path: "/hikes/:id",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "static", path: "*",
      element: React.createElement(Page, null),
    }),
  ),
);

const tree = React.createElement(
  StaticRouter,
  { location: path },
  React.createElement(ThemeProvider as React.ComponentType<{ children: ReactNode }>, { defaultTheme: "light" },
    React.createElement(CartProvider as React.ComponentType<{ children: ReactNode }>, null,
      React.createElement(SiteShell as React.ComponentType<{ children: ReactNode }>, null,
        headComponents,
        pageBody,
      ),
    ),
  ),
);

const html = renderToString(tree);

// Count data-prerender-body
const count = (html.match(/data-prerender-body="true"/g) || []).length;
console.log(`data-prerender-body count: ${count}`);

// Count header closes
const headerCloses = (html.match(/<\/header>/g) || []).length;
console.log(`</header> count: ${headerCloses}`);

// Check for homepage content
for (const s of ['Six rules we hike', 'Voices from the trail', 'Your next weekend']) {
  console.log(`${s}: ${html.includes(s)}`);
}

console.log(`HTML length: ${html.length}`);
