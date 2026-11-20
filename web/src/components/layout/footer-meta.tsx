"use client";

import { useSyncExternalStore } from "react";

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

const getTime = () => clock.format(new Date());
const getYear = () => String(new Date().getFullYear());
const noop = () => () => {};

/** Copyright + live IST clock. Server snapshots keep SSR/hydration identical. */
export function FooterMeta({ name }: { name: string }) {
  const time = useSyncExternalStore(subscribe, getTime, () => "--:--:--");
  const year = useSyncExternalStore(noop, getYear, () => "");

  return (
    <div className="text-muted space-y-1 font-mono text-[11px] tracking-[0.14em] uppercase">
      <p>
        &copy; {year} {name}
      </p>
      <p>
        <time suppressHydrationWarning>{time}</time> IST
      </p>
    </div>
  );
}
