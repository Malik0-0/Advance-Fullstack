import { Post } from "../models/post.model";

export const posts: Post[] = [
  { id: 1, title: "Hello TS", body: "First post", author: "Zero", createdAt: new Date().toISOString() },
  { id: 2, title: "Express FTW", body: "Second post", createdAt: new Date().toISOString() }
];
