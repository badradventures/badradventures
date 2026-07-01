import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router-dom";
import React, { type ReactNode } from "react";
import HikesPage from "@/pages/hikes";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { SiteShell } from "@/components/site-shell";

const Page = HikesPage;

const headComponents = React.createElement("div", {
  "data-prerender-head": "true",
  style: { display: "none" },
});

const pageBody = React.createElement(
  "div",
  { "data-prerender-body": "true" },
  React.createElement(
    Routes as React.ComponentType<{ children: ReactNode }>,
    null,
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "home",
      path: "/",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "blog-slug",
      path: "/blog/:slug",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "hike-id",
      path: "/hikes/:id",
      element: React.createElement(Page, null),
    }),
    React.createElement(Route as React.ComponentType<unknown>, {
      key: "static",
      path: "*",
      element: React.createElement(Page, null),
    }),
  ),
);

const tree = React.createElement(
  StaticRouter,
  { location: "/hikes" },
  React.createElement(
    ThemeProvider as React.ComponentType<{ children: ReactNode }>,
    { defaultTheme: "light" },
    React.createElement(
      CartProvider as React.ComponentType<{ children: ReactNode }>,
      null,
      React.createElement(
        SiteShell as React.ComponentType<{ children: ReactNode }>,
        null,
        headComponents,
        pageBody,
      ),
    ),
  ),
);

const html = renderToString(tree);
console.log("data-prerender-body count:", (html.match(/data-prerender-body/g) || []).length);
console.log("</header> count:", (html.match(/<\/header>/g) || []).length);
console.log("Has 'Six rules':", html.includes("Six rules"));
console.log("Has 'Upcoming Muslim hiking trips':", html.includes("Upcoming Muslim hiking trips"));
console.log("HTML length:", html.length);

// Check for specific markers in the middle
const first = html.indexOf("data-prerender-body");
const second = html.indexOf("data-prerender-body", first + 1);
console.log("First at:", first, "Second at:", second);

if (second > 0) {
  console.log("Between them:");
  console.log(html.slice(second - 400, second + 200));
}
