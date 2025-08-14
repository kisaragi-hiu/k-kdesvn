import { tmpdir } from "node:os";
import * as path from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { hash } from "node:crypto";
import { cwd } from "node:process";

import * as z from "npm:zod";
import { $ } from "npm:zx";
import { XMLParser } from "npm:fast-xml-parser";

function ensureArray<T>(val: T) {
  return Array.isArray(val) ? val : [val];
}
const SvnLogEntry = z.object({
  ["@_revision"]: z.string(),
  author: z.string(),
  date: z.iso.datetime().transform((val) => Date.parse(val)),
  msg: z.string(),
});
export const SvnLogRaw = z.object({
  log: z.object({
    logentry: z.preprocess(ensureArray, z.array(SvnLogEntry)),
  }),
});
export const ArgLogMsgFormat = z.enum(["full", "one-line", "none"]);
export type ArgLogMsgFormat = z.infer<typeof ArgLogMsgFormat>;
export const ArgLogSort = z.enum(["new-first", "old-first", "none"]);
export type ArgLogSort = z.infer<typeof ArgLogSort>;

export async function fetchLogEntries(opts?: {
  limit?: string;
  revision?: string;
  sort: ArgLogSort;
}) {
  // We want it to persist.
  const cacheFile = path.join(
    tmpdir(),
    `k-gitsvn-${hash("md5", JSON.stringify({ dir: cwd(), ...opts }))}`
  );
  const cacheHit = existsSync(cacheFile);
  const output = cacheHit
    ? readFileSync(cacheFile, { encoding: "utf-8" })
    : await $`svn log --xml ${[
        ...(opts?.limit ? ["--limit", opts.limit] : []),
        ...(opts?.revision ? ["--revision", opts.revision] : []),
      ]}`.text();
  if (!cacheHit) {
    mkdirSync(path.dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, output, { encoding: "utf-8" });
  }

  const parser = new XMLParser({ ignoreAttributes: false });
  const raw = parser.parse(output);
  const entries = SvnLogRaw.parse(raw).log.logentry;
  if (opts?.sort === "new-first") {
    entries.sort(({ date: dateA }, { date: dateB }) => {
      return dateB - dateA;
    });
  } else if (opts?.sort === "old-first") {
    entries.sort(({ date: dateA }, { date: dateB }) => {
      return dateA - dateB;
    });
  }
  return entries;
}
