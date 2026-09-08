export const ANALYTICS_OPT_OUT_KEY = "graphlms.analytics.optout";

/** Product telemetry stays local when a learner has explicitly opted out. */
export function isAnalyticsOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}
