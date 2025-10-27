import { hash } from "node:crypto";
import { cwd } from "node:process";

import * as z from "npm:zod";
import { XMLParser } from "npm:fast-xml-parser";
import { cached } from "npm:@kisaragi-hiu/cached-fetch";

import { runcmd } from "./runcmd.ts";

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
    // the async is here to make it a promise
    () =>
      runcmd()(
        "svn log --xml",
        ...(opts?.limit ? ["--limit", opts.limit] : []),
        ...(opts?.revision ? ["--revision", opts.revision] : []),
      ).stdout,
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

// Simplified from formatISO from date-fns
// Differences:
// - addLeadingZeros helper inlined as-is (plus argument types)
// - remove options and only return date+time and with separators
// - reorder some stuff
export function formatISO(moment: number | Date) {
  function addLeadingZeros(number: number, targetLength: number) {
    const sign = number < 0 ? "-" : "";
    const output = Math.abs(number).toString().padStart(targetLength, "0");
    return sign + output;
  }
  const dateObj = moment instanceof Date ? moment : new Date(moment);
  // underlying data
  const day = addLeadingZeros(dateObj.getDate(), 2);
  const month = addLeadingZeros(dateObj.getMonth() + 1, 2);
  const year = addLeadingZeros(dateObj.getFullYear(), 4);
  const hour = addLeadingZeros(dateObj.getHours(), 2);
  const minute = addLeadingZeros(dateObj.getMinutes(), 2);
  const second = addLeadingZeros(dateObj.getSeconds(), 2);
  const offset = dateObj.getTimezoneOffset();

  // final parts
  const date = `${year}-${month}-${day}`;
  const time = `${hour}:${minute}:${second}`;
  const tzOffset =
    offset === 0
      ? "Z"
      : (() => {
          const absoluteOffset = Math.abs(offset);
          const hourOffset = addLeadingZeros(
            Math.trunc(absoluteOffset / 60),
            2,
          );
          const minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
          // If less than 0, the sign is +, because it is ahead of time.
          const sign = offset < 0 ? "+" : "-";
          return `${sign}${hourOffset}:${minuteOffset}`;
        })();

  return `${date}T${time}${tzOffset}`;
}

/**
 * Parse `val` as a comma-separated string.
 * Normalizes string[] and accepts undefined.
 * Return `def` instead if `val` is undefined.
 */
export function parseCommaSeparated(
  val: string | string[] | undefined,
  def: string[] = [],
) {
  // We have to use an explicit check against undefined, because the
  // empty string is falsy.
  // We want an empty string to take the latter case and result in an empty
  // list instead of returning `def`.
  if (val === undefined) return def;
  if (typeof val === "string") return val.split(",");
  return val.flatMap((x) => x.split(","));
}
