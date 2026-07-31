import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { users } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import type { InferSelectModel } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers) as User;
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
