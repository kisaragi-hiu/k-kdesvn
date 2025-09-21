import { hash } from "node:crypto";
import { cwd } from "node:process";

import * as z from "npm:zod";
import { $ } from "npm:zx";
import { XMLParser } from "npm:fast-xml-parser";
import { cached } from "npm:@kisaragi-hiu/cached-fetch";

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
  const output = await cached(
    `k-gitsvn-${hash("md5", JSON.stringify({ dir: cwd(), ...opts }))}`,
    () =>
      $`svn log --xml ${[
        ...(opts?.limit ? ["--limit", opts.limit] : []),
        ...(opts?.revision ? ["--revision", opts.revision] : []),
      ]}`,
  );

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
