import { z } from "zod";
import { eq, like, and, desc, asc, sql, inArray } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { products, reviews } from "@db/schema";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
        featured: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { category, search, sort, page = 1, limit = 20, featured } = input || {};
      
      const conditions = [];
      if (category && category !== "all") {
        conditions.push(eq(products.category, category as "dresses" | "shirts" | "puletasi" | "kids"));
      }
      if (search) {
        conditions.push(like(products.name, `%${search}%`));
      }
      if (featured !== undefined) {
        conditions.push(eq(products.featured, featured));
      }
      conditions.push(eq(products.isActive, true));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      let orderBy;
      switch (sort) {
        case "price-asc":
          orderBy = asc(products.price);
          break;
        case "price-desc":
          orderBy = desc(products.price);
          break;
        case "name":
          orderBy = asc(products.name);
          break;
        case "newest":
        default:
          orderBy = desc(products.createdAt);
      }

      const items = await db
        .select()
        .from(products)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      return {
        products: items,
        total: countResult[0]?.count ?? 0,
        page,
      };
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .where(eq(products.slug, input.slug))
        .limit(1);

      if (!product[0]) return null;

      const productReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, product[0].id))
        .orderBy(desc(reviews.createdAt));

      const avgRating = productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        : 0;

      return {
        ...product[0],
        reviews: productReviews,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["dresses", "shirts", "puletasi", "kids"]),
        price: z.number().positive(),
        salePrice: z.number().positive().optional(),
        images: z.array(z.string()),
        sizes: z.array(z.string()),
        colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
        stockQuantity: z.number().int().min(0).default(0),
        sizeStock: z.string().optional(),
        sku: z.string().optional(),
        weightGrams: z.number().int().default(500),
        badge: z.enum(["new", "bestseller", "limited"]).optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        relatedProductIds: z.array(z.number()).optional(),
        videoUrls: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(products).values({
        ...input,
        salePrice: input.salePrice ?? null,
        colors: input.colors ?? null,
        sku: input.sku ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        relatedProductIds: input.relatedProductIds ?? null,
        videoUrls: input.videoUrls ?? null,
      });
      const inserted = await db.select().from(products).where(eq(products.id, Number(result.lastInsertRowid))).limit(1);
      return inserted[0];
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["dresses", "shirts", "puletasi", "kids"]).optional(),
        price: z.number().positive().optional(),
        salePrice: z.number().positive().optional(),
        images: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
        stockQuantity: z.number().int().min(0).optional(),
        sizeStock: z.string().optional(),
        sku: z.string().optional(),
        isActive: z.boolean().optional(),
        featured: z.boolean().optional(),
        badge: z.enum(["new", "bestseller", "limited"]).optional(),
        weightGrams: z.number().int().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        relatedProductIds: z.array(z.number()).optional(),
        videoUrls: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(products).set(data).where(eq(products.id, id));
      const updated = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return updated[0];
    }),

  duplicate: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const original = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (!original[0]) throw new Error("Product not found");

      const p = original[0];
      const newSlug = `${p.slug}-copy-${Date.now().toString(36)}`;
      const newName = `${p.name} (Copy)`;

      const result = await db.insert(products).values({
        name: newName,
        slug: newSlug,
        description: p.description,
        category: p.category,
        price: p.price,
        salePrice: p.salePrice,
        images: p.images,
        sizes: p.sizes,
        colors: p.colors,
        stockQuantity: p.stockQuantity,
        sku: p.sku ? `${p.sku}-COPY` : null,
        isActive: false,
        featured: false,
        badge: p.badge,
        weightGrams: p.weightGrams,
      });

      const inserted = await db.select().from(products).where(eq(products.id, Number(result.lastInsertRowid))).limit(1);
      return inserted[0];
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  bulkDelete: publicQuery
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const id of input.ids) {
        await db.delete(products).where(eq(products.id, id));
      }
      return { deleted: input.ids.length };
    }),

  bulkActivate: publicQuery
    .input(z.object({ ids: z.array(z.number()), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const id of input.ids) {
        await db.update(products).set({ isActive: input.isActive }).where(eq(products.id, id));
      }
      return { updated: input.ids.length };
    }),

  bulkSetBadge: publicQuery
    .input(z.object({ ids: z.array(z.number()), badge: z.enum(["new", "bestseller", "limited"]).nullable() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const id of input.ids) {
        await db.update(products).set({ badge: input.badge }).where(eq(products.id, id));
      }
      return { updated: input.ids.length };
    }),

  getRelated: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);

      if (!product[0]) return [];

      const p = product[0];
      const relatedIds = p.relatedProductIds as number[] | null;

      // If curated related products exist, fetch them
      if (relatedIds && relatedIds.length > 0) {
        const related = await db
          .select()
          .from(products)
          .where(inArray(products.id, relatedIds))
          .limit(4);
        return related;
      }

      // Fallback: same category products
      const fallback = await db
        .select()
        .from(products)
        .where(and(eq(products.category, p.category), eq(products.isActive, true)))
        .limit(5);
      return fallback.filter((f) => f.id !== input.id).slice(0, 4);
    }),

  importCSV: adminQuery
    .input(z.object({ rows: z.array(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(["dresses", "shirts", "puletasi", "kids"]),
      price: z.number().positive(),
      salePrice: z.number().positive().optional(),
      images: z.string(),
      sizes: z.string(),
      colors: z.string().optional(),
      stockQuantity: z.number().int().min(0).default(0),
      sku: z.string().optional(),
      weightGrams: z.number().int().default(500),
      featured: z.boolean().default(false),
      isActive: z.boolean().default(true),
      badge: z.enum(["new", "bestseller", "limited"]).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const results: { name: string; success: boolean; error?: string }[] = [];

      for (const row of input.rows) {
        try {
          // Check for duplicate slug
          const existing = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.slug, row.slug))
            .limit(1);

          if ((existing[0]?.count ?? 0) > 0) {
            results.push({ name: row.name, success: false, error: "Slug already exists" });
            continue;
          }

          // Parse images (semicolon-separated)
          const images = row.images ? row.images.split(";").map((s) => s.trim()).filter(Boolean) : [];

          // Parse sizes (semicolon-separated)
          const sizes = row.sizes ? row.sizes.split(";").map((s) => s.trim().toUpperCase()).filter(Boolean) : [];

          // Parse colors (JSON array)
          let colors: { name: string; hex: string }[] | undefined;
          if (row.colors) {
            try {
              const parsed = JSON.parse(row.colors);
              if (Array.isArray(parsed)) colors = parsed;
            } catch {
              // ignore
            }
          }

          await db.insert(products).values({
            name: row.name,
            slug: row.slug,
            description: row.description ?? null,
            category: row.category,
            price: row.price,
            salePrice: row.salePrice ?? null,
            images,
            sizes,
            colors: colors ?? null,
            stockQuantity: row.stockQuantity,
            sku: row.sku ?? null,
            weightGrams: row.weightGrams,
            featured: row.featured,
            isActive: row.isActive,
            badge: row.badge ?? null,
            metaTitle: row.metaTitle ?? null,
            metaDescription: row.metaDescription ?? null,
          });

          results.push({ name: row.name, success: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({ name: row.name, success: false, error: msg });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;
      return { results, successCount, failCount };
    }),
});
