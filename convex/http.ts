import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/scrape",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      creatorHandles: string[];
      brand: string;
      keywords?: string[];
      posts?: number;
    };
    const result = await ctx.runAction(api.actions.scrape.scrape, {
      creatorHandles: body.creatorHandles ?? [],
      brand: body.brand ?? "",
      keywords: body.keywords ?? [],
      posts: body.posts,
    });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/find-creators",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = (await request.json()) as {
      campaignId: string;
      limit?: number;
      seedHandles?: string[];
      topCandidates?: number;
    };
    if (!body.campaignId) {
      return new Response(JSON.stringify({ error: "campaignId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await ctx.runAction(api.actions.findCreators.findCreators, {
      campaignId: body.campaignId as Id<"campaigns">,
      limit: body.limit,
    });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
