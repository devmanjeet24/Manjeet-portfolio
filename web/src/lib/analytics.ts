/**
 * Analytics hook-up point. Right now `trackEvent` does nothing.
 *
 * To connect a real tool later (Plausible, GA4, PostHog...), either call
 * `setAnalyticsHandler((name, props) => ...)` once at startup, or put the call straight
 * into `trackEvent`. Every place on the site that records something already calls it.
 */

export type AnalyticsEvent = "resume_download" | "resume_view";

export type AnalyticsProps = Record<string, string | number | boolean>;

type Handler = (name: AnalyticsEvent, props?: AnalyticsProps) => void;

let handler: Handler | null = null;

/** Plug in the real analytics sender. Pass `null` to unplug it. */
export function setAnalyticsHandler(next: Handler | null): void {
  handler = next;
}

/** Record something that happened. A no-op until a handler is set. */
export function trackEvent(name: AnalyticsEvent, props?: AnalyticsProps): void {
  handler?.(name, props);
}
