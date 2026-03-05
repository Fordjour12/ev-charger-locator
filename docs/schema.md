# `Convex DB Schema`

```txt
packages/convex/
  schema.ts
  lib/
    auth.ts
    geo.ts
    validators.ts
  stations.ts
  bookmarks.ts
  suggestions.ts
  reports.ts
  sponsorships.ts
  analytics.ts
```

Below is a **Convex schema + function skeleton** for your EV charger finder (map/list/details, bookmarks, suggestions, reports, sponsored listings, analytics). It’s intentionally production-shaped (indexes, ownership, moderation hooks), but still “skeleton” so you can fill in the details.

---

## `convex/schema.ts`

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // If you use Convex Auth, you may not need this table.
    // Keep it if you want profiles, roles, etc.
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("owner")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["role"])
    .index("by_email", ["email"]),

  stations: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),

    location: v.object({
      lat: v.number(),
      lng: v.number(),
      geohash: v.string(), // store precomputed geohash
    }),

    // Keep connector info embedded for simplicity
    connectors: v.array(
      v.object({
        type: v.string(), // "CCS2" | "Type2" | "CHAdeMO" etc (string for flexibility)
        powerKW: v.optional(v.number()),
        count: v.optional(v.number()),
      })
    ),

    network: v.optional(v.string()), // e.g. "Shell Recharge", "Tesla", ...
    access: v.optional(
      v.object({
        isPublic: v.optional(v.boolean()),
        hours: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),

    pricingNote: v.optional(v.string()),

    verifiedStatus: v.union(
      v.literal("unverified"),
      v.literal("community"),
      v.literal("verified")
    ),

    // basic trust signals
    stats: v.object({
      views: v.number(),
      directionClicks: v.number(),
      saves: v.number(),
      reportOpenCount: v.number(),
    }),

    // Optional: ownership / claim
    ownerOrgId: v.optional(v.id("orgs")),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_city", ["city"])
    .index("by_country", ["country"])
    .index("by_geohash", ["location.geohash"])
    .index("by_verifiedStatus", ["verifiedStatus"])
    .index("by_updatedAt", ["updatedAt"]),

  bookmarks: defineTable({
    userId: v.string(), // auth subject (stable string id)
    stationId: v.id("stations"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_station", ["userId", "stationId"]),

  suggestions: defineTable({
    userId: v.string(),
    // Draft station payload
    payload: v.object({
      name: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      location: v.object({ lat: v.number(), lng: v.number() }),
      connectors: v.array(
        v.object({
          type: v.string(),
          powerKW: v.optional(v.number()),
          count: v.optional(v.number()),
        })
      ),
      network: v.optional(v.string()),
      access: v.optional(
        v.object({
          isPublic: v.optional(v.boolean()),
          hours: v.optional(v.string()),
          notes: v.optional(v.string()),
        })
      ),
      pricingNote: v.optional(v.string()),
    }),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewerUserId: v.optional(v.string()),
    reviewerNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_updatedAt", ["updatedAt"]),

  reports: defineTable({
    userId: v.string(),
    stationId: v.id("stations"),
    kind: v.union(
      v.literal("broken"),
      v.literal("blocked"),
      v.literal("wrong_info"),
      v.literal("closed"),
      v.literal("other")
    ),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("triaged"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    reviewerUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_status", ["status"])
    .index("by_station_status", ["stationId", "status"])
    .index("by_updatedAt", ["updatedAt"]),

  // Minimal org/claims for B2B (optional now, useful later)
  orgs: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  orgMembers: defineTable({
    orgId: v.id("orgs"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    createdAt: v.number(),
  }).index("by_org_user", ["orgId", "userId"]),

  stationClaims: defineTable({
    stationId: v.id("stations"),
    orgId: v.id("orgs"),
    requestedByUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_status", ["status"])
    .index("by_org", ["orgId"]),

  sponsorships: defineTable({
    stationId: v.id("stations"),
    // targeting
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    // scheduling
    startsAt: v.number(),
    endsAt: v.number(),
    tier: v.union(v.literal("basic"), v.literal("pro")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active_window", ["isActive", "startsAt", "endsAt"])
    .index("by_city_active", ["city", "isActive"])
    .index("by_station", ["stationId"]),

  analyticsEvents: defineTable({
    userId: v.optional(v.string()),
    stationId: v.optional(v.id("stations")),
    type: v.union(
      v.literal("station_view"),
      v.literal("direction_click"),
      v.literal("bookmark_add"),
      v.literal("bookmark_remove"),
      v.literal("search")
    ),
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_station_type", ["stationId", "type"])
    .index("by_createdAt", ["createdAt"]),
});
```

---

## `convex/lib/auth.ts`

```ts
import { QueryCtx, MutationCtx } from "convex/server";

/**
 * Replace this with your auth provider integration.
 * For Convex Auth, you typically read identity from ctx.auth.
 */
export function requireUserId(ctx: QueryCtx | MutationCtx): string {
  const identity = ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  // subject is stable string identifier
  return identity.subject;
}

export function requireAdmin(ctx: QueryCtx | MutationCtx): string {
  const userId = requireUserId(ctx);
  // TODO: Implement admin check (e.g. users table role lookup, or custom claim)
  // If you use users table:
  // const user = await ctx.db.query("users").withIndex("by_email"...)
  // For skeleton:
  void userId;
  // throw new Error("Forbidden");
  return userId;
}
```

---

## `convex/lib/geo.ts`

```ts
/**
 * Skeleton geo helpers.
 * In production you can:
 * - store geohash
 * - query by prefix (geohash ranges) or bounding boxes (lat/lng)
 */
export function geohashFromLatLng(lat: number, lng: number): string {
  // TODO: implement (or use a small geohash lib in your app layer)
  // For now, return a placeholder deterministic string:
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

export function boundsFromRadius(
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  // Very rough; replace with proper geo math if needed
  const delta = radiusKm / 111; // ~111km per degree latitude
  return {
    minLat: lat - delta,
    maxLat: lat + delta,
    minLng: lng - delta,
    maxLng: lng + delta,
  };
}

export function withinBounds(
  lat: number,
  lng: number,
  b: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
```

---

## `convex/stations.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { boundsFromRadius, withinBounds } from "./lib/geo";
import { requireAdmin } from "./lib/auth";

// Get station by id
export const byId = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stationId);
  },
});

// Nearby stations (simple bounds filter + optional connector filter)
export const nearby = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.number(),
    // optional filters
    connectorType: v.optional(v.string()),
    minPowerKW: v.optional(v.number()),
    city: v.optional(v.string()),
    includeSponsoredBoost: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const bounds = boundsFromRadius(args.lat, args.lng, args.radiusKm);

    // Simple approach: fetch by city if provided, else scan by updatedAt/country, then filter
    // For production scale: geohash prefix querying strategy.
    let base = ctx.db.query("stations");
    if (args.city) base = base.withIndex("by_city", (q) => q.eq("city", args.city));

    const candidates = await base.take(500);

    const filtered = candidates.filter((s) => {
      const okBounds = withinBounds(s.location.lat, s.location.lng, bounds);
      if (!okBounds) return false;

      if (args.connectorType) {
        if (!s.connectors.some((c) => c.type === args.connectorType)) return false;
      }
      if (args.minPowerKW != null) {
        if (!s.connectors.some((c) => (c.powerKW ?? 0) >= args.minPowerKW!))
          return false;
      }
      return true;
    });

    // TODO: if includeSponsoredBoost: sort with sponsorship priority (see sponsorships.ts)
    return filtered;
  },
});

// Text search skeleton (replace with your own indexing approach)
export const search = query({
  args: {
    text: v.string(),
    city: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    let base = ctx.db.query("stations");
    if (args.city) base = base.withIndex("by_city", (q) => q.eq("city", args.city));

    const items = await base.take(500);

    const t = args.text.toLowerCase();
    return items
      .filter((s) => {
        return (
          s.name.toLowerCase().includes(t) ||
          (s.address?.toLowerCase().includes(t) ?? false) ||
          (s.network?.toLowerCase().includes(t) ?? false)
        );
      })
      .slice(0, limit);
  },
});

// Admin: create/update station (used when approving suggestions or seeding data)
export const upsert = mutation({
  args: {
    stationId: v.optional(v.id("stations")),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    location: v.object({ lat: v.number(), lng: v.number(), geohash: v.string() }),
    connectors: v.array(
      v.object({
        type: v.string(),
        powerKW: v.optional(v.number()),
        count: v.optional(v.number()),
      })
    ),
    network: v.optional(v.string()),
    access: v.optional(
      v.object({
        isPublic: v.optional(v.boolean()),
        hours: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    pricingNote: v.optional(v.string()),
    verifiedStatus: v.optional(
      v.union(v.literal("unverified"), v.literal("community"), v.literal("verified"))
    ),
  },
  handler: async (ctx, args) => {
    requireAdmin(ctx);
    const now = Date.now();

    if (args.stationId) {
      await ctx.db.patch(args.stationId, {
        name: args.name,
        address: args.address,
        city: args.city,
        country: args.country,
        location: args.location,
        connectors: args.connectors,
        network: args.network,
        access: args.access,
        pricingNote: args.pricingNote,
        verifiedStatus: args.verifiedStatus ?? "unverified",
        updatedAt: now,
      });
      return args.stationId;
    }

    const id = await ctx.db.insert("stations", {
      name: args.name,
      address: args.address,
      city: args.city,
      country: args.country,
      location: args.location,
      connectors: args.connectors,
      network: args.network,
      access: args.access,
      pricingNote: args.pricingNote,
      verifiedStatus: args.verifiedStatus ?? "unverified",
      stats: { views: 0, directionClicks: 0, saves: 0, reportOpenCount: 0 },
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});
```

---

## `convex/bookmarks.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = requireUserId(ctx);
    const rows = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);

    // Optionally hydrate stations
    const stations = await Promise.all(rows.map((b) => ctx.db.get(b.stationId)));
    return rows.map((b, i) => ({ ...b, station: stations[i] }));
  },
});

export const add = mutation({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const userId = requireUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_station", (q) =>
        q.eq("userId", userId).eq("stationId", args.stationId)
      )
      .unique();

    if (existing) return existing._id;

    const id = await ctx.db.insert("bookmarks", {
      userId,
      stationId: args.stationId,
      createdAt: now,
    });

    // maintain station save count (best-effort)
    const station = await ctx.db.get(args.stationId);
    if (station) {
      await ctx.db.patch(args.stationId, {
        stats: { ...station.stats, saves: station.stats.saves + 1 },
        updatedAt: now,
      });
    }

    return id;
  },
});

export const remove = mutation({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const userId = requireUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_station", (q) =>
        q.eq("userId", userId).eq("stationId", args.stationId)
      )
      .unique();

    if (!existing) return;

    await ctx.db.delete(existing._id);

    const station = await ctx.db.get(args.stationId);
    if (station) {
      await ctx.db.patch(args.stationId, {
        stats: { ...station.stats, saves: Math.max(0, station.stats.saves - 1) },
        updatedAt: now,
      });
    }
  },
});
```

---

## `convex/suggestions.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUserId } from "./lib/auth";
import { geohashFromLatLng } from "./lib/geo";

export const submit = mutation({
  args: {
    payload: v.object({
      name: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      location: v.object({ lat: v.number(), lng: v.number() }),
      connectors: v.array(
        v.object({
          type: v.string(),
          powerKW: v.optional(v.number()),
          count: v.optional(v.number()),
        })
      ),
      network: v.optional(v.string()),
      access: v.optional(
        v.object({
          isPublic: v.optional(v.boolean()),
          hours: v.optional(v.string()),
          notes: v.optional(v.string()),
        })
      ),
      pricingNote: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = requireUserId(ctx);
    const now = Date.now();

    return await ctx.db.insert("suggestions", {
      userId,
      payload: args.payload,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const mySubmissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = requireUserId(ctx);
    return await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

export const adminListPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    requireAdmin(ctx);
    return await ctx.db
      .query("suggestions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const adminApprove = mutation({
  args: {
    suggestionId: v.id("suggestions"),
    reviewerNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewerUserId = requireAdmin(ctx);
    const now = Date.now();

    const sug = await ctx.db.get(args.suggestionId);
    if (!sug) throw new Error("Suggestion not found");
    if (sug.status !== "pending") throw new Error("Not pending");

    const geohash = geohashFromLatLng(sug.payload.location.lat, sug.payload.location.lng);

    const stationId = await ctx.db.insert("stations", {
      name: sug.payload.name,
      address: sug.payload.address,
      city: sug.payload.city,
      country: sug.payload.country,
      location: { ...sug.payload.location, geohash },
      connectors: sug.payload.connectors,
      network: sug.payload.network,
      access: sug.payload.access,
      pricingNote: sug.payload.pricingNote,
      verifiedStatus: "unverified",
      stats: { views: 0, directionClicks: 0, saves: 0, reportOpenCount: 0 },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.suggestionId, {
      status: "approved",
      reviewerUserId,
      reviewerNote: args.reviewerNote,
      updatedAt: now,
    });

    return stationId;
  },
});

export const adminReject = mutation({
  args: { suggestionId: v.id("suggestions"), reviewerNote: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const reviewerUserId = requireAdmin(ctx);
    const now = Date.now();

    const sug = await ctx.db.get(args.suggestionId);
    if (!sug) throw new Error("Suggestion not found");
    if (sug.status !== "pending") throw new Error("Not pending");

    await ctx.db.patch(args.suggestionId, {
      status: "rejected",
      reviewerUserId,
      reviewerNote: args.reviewerNote,
      updatedAt: now,
    });
  },
});
```

---

## `convex/reports.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUserId } from "./lib/auth";

export const create = mutation({
  args: {
    stationId: v.id("stations"),
    kind: v.union(
      v.literal("broken"),
      v.literal("blocked"),
      v.literal("wrong_info"),
      v.literal("closed"),
      v.literal("other")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = requireUserId(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("reports", {
      userId,
      stationId: args.stationId,
      kind: args.kind,
      note: args.note,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    // increment open report count (best-effort)
    const station = await ctx.db.get(args.stationId);
    if (station) {
      await ctx.db.patch(args.stationId, {
        stats: { ...station.stats, reportOpenCount: station.stats.reportOpenCount + 1 },
        updatedAt: now,
      });
    }

    return id;
  },
});

export const listByStation = query({
  args: { stationId: v.id("stations"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_station", (q) => q.eq("stationId", args.stationId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const adminListOpen = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    requireAdmin(ctx);
    return await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const adminSetStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("open"),
      v.literal("triaged"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const reviewerUserId = requireAdmin(ctx);
    const now = Date.now();

    const r = await ctx.db.get(args.reportId);
    if (!r) throw new Error("Report not found");

    // adjust station open count if moving out of open
    if (r.status === "open" && args.status !== "open") {
      const station = await ctx.db.get(r.stationId);
      if (station) {
        await ctx.db.patch(r.stationId, {
          stats: {
            ...station.stats,
            reportOpenCount: Math.max(0, station.stats.reportOpenCount - 1),
          },
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewerUserId,
      updatedAt: now,
    });
  },
});
```

---

## `convex/sponsorships.ts` (skeleton)

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const activeForCity = query({
  args: { city: v.optional(v.string()), now: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const rows = await ctx.db
      .query("sponsorships")
      .withIndex("by_active_window", (q) => q.eq("isActive", true))
      .take(200);

    return rows.filter((s) => {
      const okWindow = s.startsAt <= now && now <= s.endsAt;
      const okCity = args.city ? s.city === args.city : true;
      return okWindow && okCity;
    });
  },
});

export const adminUpsert = mutation({
  args: {
    sponsorshipId: v.optional(v.id("sponsorships")),
    stationId: v.id("stations"),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.number(),
    tier: v.union(v.literal("basic"), v.literal("pro")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    requireAdmin(ctx);
    const now = Date.now();

    if (args.sponsorshipId) {
      await ctx.db.patch(args.sponsorshipId, {
        stationId: args.stationId,
        city: args.city,
        country: args.country,
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        tier: args.tier,
        isActive: args.isActive,
        updatedAt: now,
      });
      return args.sponsorshipId;
    }

    return await ctx.db.insert("sponsorships", {
      stationId: args.stationId,
      city: args.city,
      country: args.country,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      tier: args.tier,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

---

## `convex/analytics.ts`

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

export const track = mutation({
  args: {
    type: v.union(
      v.literal("station_view"),
      v.literal("direction_click"),
      v.literal("bookmark_add"),
      v.literal("bookmark_remove"),
      v.literal("search")
    ),
    stationId: v.optional(v.id("stations")),
    meta: v.optional(v.any()),
    // allow anonymous tracking if you want (otherwise remove)
    anonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = args.anonymous ? undefined : requireUserId(ctx);

    await ctx.db.insert("analyticsEvents", {
      userId,
      stationId: args.stationId,
      type: args.type,
      meta: args.meta,
      createdAt: now,
    });

    // Optional: update station stats for key events
    if (args.stationId && (args.type === "station_view" || args.type === "direction_click")) {
      const st = await ctx.db.get(args.stationId);
      if (st) {
        const stats = { ...st.stats };
        if (args.type === "station_view") stats.views += 1;
        if (args.type === "direction_click") stats.directionClicks += 1;
        await ctx.db.patch(args.stationId, { stats, updatedAt: now });
      }
    }
  },
});
```

---

### Next (quick + important)

If you tell me which maps provider you’ll use (**Google Maps** vs **Mapbox**) and whether you want **anonymous usage without login**, I’ll adjust:

* the `nearby()` strategy (geohash prefix vs bounds)
* the auth assumptions (required vs optional)
* the analytics + bookmark flow for logged-out users
