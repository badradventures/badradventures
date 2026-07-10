import { serveStatic } from "hono/bun";
import type { ViteDevServer } from "vite";
import { createServer as createViteServer } from "vite";
import { Hono } from "hono";
import { mountRoutes } from "./backend-lib/routes";
import "./backend-lib/db";

type Mode = "development" | "production";
const app = new Hono();

const mode: Mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

mountRoutes(app);

if (mode === "production") {
  configureProduction(app);
} else {
  await configureDevelopment(app);
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default { fetch: app.fetch, port };

function injectRuntimeEnv(html: string): string {
  const runtimeEnv = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "",
    VITE_UMAMI_URL: process.env.VITE_UMAMI_URL || "",
    VITE_UMAMI_WEBSITE_ID: process.env.VITE_UMAMI_WEBSITE_ID || "",
  };
  return html.replace(
    "</head>",
    `<script>window.__ENV__ = ${JSON.stringify(runtimeEnv)}</script></head>`,
  );
}

function configureProduction(app: Hono) {
  app.use("/assets/*", serveStatic({ root: "./dist" }));
  app.get("/favicon.ico", (c) => c.redirect("/favicon.svg", 302));
  app.use(async (c, next) => {
    if (c.req.method !== "GET") return next();
    const path = c.req.path;
    if (path.startsWith("/api/") || path.startsWith("/assets/")) return next();

    // Try exact file first (e.g. /images/logo.png, /robots.txt)
    let file = Bun.file(`./dist${path}`);
    let stat = await file.stat();
    if (stat && !stat.isDirectory()) {
      return new Response(file);
    }

    // If it's a prerendered route directory (e.g. /hikes → dist/hikes/index.html)
    if (stat && stat.isDirectory()) {
      const idx = Bun.file(`./dist${path}/index.html`);
      const idxStat = await idx.stat();
      if (idxStat && !idxStat.isDirectory()) {
        file = idx;
        stat = idxStat;
      }
    }

    if (stat && !stat.isDirectory()) {
      // Serve the prerendered page (or a direct file hit), injecting runtime env
      const html = await file.text();
      const injected = injectRuntimeEnv(html);
      return c.html(injected);
    }

    // SPA fallback for client-side routing (unknown routes/non-prerendered paths)
    const html = await Bun.file("./dist/index.html").text();
    const injected = injectRuntimeEnv(html);
    return c.html(injected);
  });
}

async function configureDevelopment(app: Hono): Promise<ViteDevServer> {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 24678,
      },
    },
    appType: "custom",
  });
  app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api/")) return next();
    if (c.req.path === "/favicon.ico") return c.redirect("/favicon.svg", 302);
    const url = c.req.path;
    try {
      if (url === "/" || url === "/index.html") {
        let template = await Bun.file("./index.html").text();
        template = await vite.transformIndexHtml(url, template);
        return c.html(template, { headers: { "Cache-Control": "no-store, must-revalidate" } });
      }
      const publicFile = Bun.file(`./public${url}`);
      if (await publicFile.exists()) {
        const stat = await publicFile.stat();
        if (stat && !stat.isDirectory()) {
          return new Response(publicFile, { headers: { "Cache-Control": "no-store, must-revalidate" } });
        }
      }
      let result: { code: string } | null = null;
      try { result = await vite.transformRequest(url); } catch { result = null; }
      if (result) {
        return new Response(result.code, {
          headers: { "Content-Type": "application/javascript", "Cache-Control": "no-store, must-revalidate" },
        });
      }
      let template = await Bun.file("./index.html").text();
      template = await vite.transformIndexHtml("/", template);
      return c.html(template, { headers: { "Cache-Control": "no-store, must-revalidate" } });
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      console.error(error);
      return c.text("Internal Server Error", 500);
    }
  });
  return vite;
}
