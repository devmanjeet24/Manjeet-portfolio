import type { Metadata } from "next";
import { PortraitTestView } from "@/components/hero/portrait-test-view";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Portrait test",
  robots: { index: false, follow: false },
};

export default function PortraitTestPage() {
  return (
    <main id="main">
      <PortraitTestView alt={`Particle portrait of ${profile.name}`} />
    </main>
  );
}
