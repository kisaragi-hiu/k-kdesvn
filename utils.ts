import * as z from "npm:zod";
import { $ } from "npm:zx";
import { XMLParser } from "npm:fast-xml-parser";

function ensureArray<T>(val: T) {
  return Array.isArray(val) ? val : [val];
}
const SvnLogEntry = z.object({
  ["@_revision"]: z.string(),
  author: z.string(),
  date: z.string(),
  msg: z.string(),
});
export const SvnLogRaw = z.object({
  log: z.object({
    logentry: z.preprocess(ensureArray, z.array(SvnLogEntry)),
  }),
});

export async function fetchLogEntries(opts?: {
  limit?: string;
  revision?: string;
}) {
  const output = await $`svn log --xml ${[
    ...(opts?.limit ? ["--limit", opts.limit] : []),
    ...(opts?.revision ? ["--revision", opts.revision] : []),
  ]}`.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const raw = parser.parse(output);
  return SvnLogRaw.parse(raw).log.logentry;
}
