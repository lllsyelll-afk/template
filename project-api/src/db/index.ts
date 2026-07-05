import { createMongoRepositories } from "./mongo";
import type { Repositories } from "../types";

export interface RepoHandle {
  repos: Repositories;
  close: () => Promise<void>;
}

export async function initRepositories(): Promise<RepoHandle> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("MONGODB_URI is required. Set it in your environment.");
  }

  const { repos, close } = await createMongoRepositories(uri, dbName);
  console.log(`[db] connected to MongoDB (${dbName})`);
  return { repos, close };
}
