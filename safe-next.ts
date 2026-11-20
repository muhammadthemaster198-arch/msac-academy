// Only allow redirects to paths inside this site.
export const safeNext = (n: unknown, fallback = "/dashboard") =>
  typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : fallback;
