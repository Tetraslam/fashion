// URL state for the Grailed browser, shared by the client filters and the
// server-rendered results so both parse the URL identically.
import { createLoader, parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const SORT_KEYS = ["relevant", "new", "low", "high"] as const;

export const grailedParams = {
  q: parseAsString.withDefault(""),
  cat: parseAsString,
  mine: parseAsBoolean.withDefault(true),
  sold: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(SORT_KEYS).withDefault("relevant"),
  min: parseAsInteger,
  max: parseAsInteger,
  cond: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(0),
};

export const loadGrailedParams = createLoader(grailedParams);
