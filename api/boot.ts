import "dotenv/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { isEmailConfigured } from "./lib/email";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { saveUploadedFile, isValidImageType, isValidImageSize } from "./lib/upload";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// File upload endpoint
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return c.json({ error: "No files uploaded" }, 400);
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!isValidImageType(file)) {
        return c.json({ error: `Invalid file type: ${file.name}. Only JPEG, PNG, WebP allowed.` }, 400);
      }
      if (!isValidImageSize(file, 10)) {
        return c.json({ error: `File too large: ${file.name}. Max 10MB.` }, 400);
      }
      const url = await saveUploadedFile(file, "product");
      urls.push(url);
    }

    return c.json({ urls });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Health check endpoint for container orchestration
app.get("/api/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[Email] SMTP ${isEmailConfigured() ? "configured" : "NOT configured — order emails will not send"}`);
  });
}
