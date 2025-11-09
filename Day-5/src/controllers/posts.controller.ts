import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listPosts = async (req: Request, res: Response) => {
  const categoryParam = req.query.category as string | undefined;
  const postIdParam = req.query.id ? Number(req.query.id) : undefined;

  let where: any = {};

  if (postIdParam) {
    // Filter by post ID
    where = { id: postIdParam };
  } else if (categoryParam) {
    // Filter by category slug or id
    const byId = Number(categoryParam);
    if (!Number.isNaN(byId)) {
      where = { categories: { some: { id: byId } } };
    } else {
      where = { categories: { some: { slug: categoryParam } } };
    }
  }

  const data = await prisma.post.findMany({
    where,
    orderBy: { id: "asc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      categories: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true } },
    },
  });

  return res.ok(data, "Post listed successfully");
};

export const getPost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      categories: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true } },
    },
  });
  if (!data) return res.status(404).json({ error: "Post not found" });
  return res.ok(data, "Post showed successfully");
};

export const createPost = async (req: Request, res: Response) => {
  const { title, body, authorId, categoryIds = [], categorySlugs = [] } = req.body ?? {};
  if (!title || !body || !authorId) return res.status(400).json({ error: "title, body, authorId are required" });

  try {
    const catsConnect =
      Array.isArray(categoryIds) && categoryIds.length
        ? { connect: categoryIds.map((id: number) => ({ id: Number(id) })) }
        : Array.isArray(categorySlugs) && categorySlugs.length
          ? { connect: categorySlugs.map((slug: string) => ({ slug })) }
          : undefined;

    const data = await prisma.post.create({
      data: {
        title,
        body,
        authorId: Number(authorId),
        ...(catsConnect ? { categories: catsConnect } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        categories: { select: { id: true, name: true, slug: true } },
      },
    });
    return res.created(data, "Post created successfully");
  } catch (e: any) {
    const msg = e.code === "P2003" ? "authorId or category not found" : "failed to create post";
    res.status(400).json({ error: msg });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, body, authorId, categoryIds, categorySlugs } = req.body ?? {};
  try {
    const data = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(authorId !== undefined ? { authorId: Number(authorId) } : {}),
        ...(Array.isArray(categoryIds)
          ? { categories: { set: [], connect: categoryIds.map((n: number) => ({ id: Number(n) })) } }
          : Array.isArray(categorySlugs)
            ? { categories: { set: [], connect: categorySlugs.map((s: string) => ({ slug: s })) } }
            : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        categories: { select: { id: true, name: true, slug: true } },
      },
    });
    return res.updated(data, "Post updated successfully");
  } catch (e: any) {
    const msg = e.code === "P2025" ? "Post not found" : "failed to update post";
    res.status(e.code === "P2025" ? 404 : 400).json({ error: msg });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.post.delete({ where: { id } });
    return res.deleted(data, "Post deleted successfully");
  } catch {
    res.status(404).json({ error: "Post not found" });
  }
};

export const listPostComments = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const skip = Number(req.query.skip ?? 0);
  const take = Number(req.query.take ?? 10);

  // ensure post exists
  const exists = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ error: "Post not found" });

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: id },
      orderBy: { id: "asc" },
      skip,
      take,
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.comment.count({ where: { postId: id } }),
  ]);

  return res.paginated(
    items,
    { skip, take, total },
    "Comment fetched successfully"
  );  
};

export const commentsSummary = async (req: Request, res: Response) => {
  const min = Number(req.query.min) || 0;

  // group by postId and count rows
  const grouped = await prisma.comment.groupBy({
    by: ["postId"],
    _count: { _all: true },
    orderBy: { postId: "asc" }, // keeps Prisma happy for certain shapes
  });

  // normalize counts safely, then filter & sort
  const normalized = grouped
    .map((g) => ({
      postId: g.postId,
      count:
        typeof g._count === "object" && g._count?._all != null ? g._count._all : 0,
    }))
    .filter((n) => n.count > min)
    .sort((a, b) => b.count - a.count);

  // fetch titles for the involved posts
  const posts = await prisma.post.findMany({
    where: { id: { in: normalized.map((n) => n.postId) } },
    select: { id: true, title: true },
  });
  const titleMap = new Map(posts.map((p) => [p.id, p.title]));

  // payload
  const payload = normalized.map((n) => ({
    postId: n.postId,
    title: titleMap.get(n.postId) ?? null,
    comments: n.count,
  }));

  return res.paginated(
    payload,
    {},
    "Comment fetched successfully"
  );
};

export const createPostComment = async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  const { authorId, content } = req.body ?? {};
  if (!authorId || !content) {
    return res.status(400).json({ error: "authorId and content are required" });
  }
  try {
    const data = await prisma.comment.create({
      data: { postId, authorId: Number(authorId), content },
      include: { author: { select: { id: true, name: true } } },
    });
    return res.created(data, "Comment created successfully");
  } catch (e: any) {
    const msg = e.code === "P2003" ? "postId or authorId not found" : "failed to create comment";
    res.status(400).json({ error: msg });
  }
};