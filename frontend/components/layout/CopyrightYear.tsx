import { cacheLife } from "next/cache";

/** Current year for the footer, cached so pages can still prerender. */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
