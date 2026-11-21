import type { Project } from "@/data/projects";
import { cn } from "@/lib/cn";
import { hashString, seededRandom } from "@/lib/hash";

export type MockVariant =
  "dashboard" | "storefront" | "workspace" | "feed" | "chat" | "generic";

export function mockVariantFor({
  category,
  kinds,
}: Pick<Project, "category" | "kinds">): MockVariant {
  if (kinds.includes("ai")) return "chat";
  switch (category) {
    case "Dashboard":
      return "dashboard";
    case "E-commerce":
      return "storefront";
    case "SaaS":
      return "workspace";
    case "Social":
      return "feed";
    default:
      return "generic";
  }
}

const line = "rounded-full bg-white/15";

/**
 * Generated stand-in for a project screenshot: a gradient (hue from the slug) with a mock
 * browser window whose layout depends on the kind of project. Purely decorative.
 * Used until a real `image` is set on the project.
 */
export function ProjectMock({
  project,
  variant: variantOverride,
  seedKey = "",
  className,
}: {
  project: Pick<Project, "slug" | "category" | "kinds">;
  /** Draw a different layout than the project's own (used for the gallery). */
  variant?: MockVariant;
  /** Changes the colours without changing the project (gallery images differ). */
  seedKey?: string;
  className?: string;
}) {
  const seed = hashString(project.slug + seedKey);
  const rand = seededRandom(seed);
  const hue1 = seed % 360;
  const hue2 = (hue1 + 45 + Math.floor(rand() * 50)) % 360;
  const accent = `hsl(${hue1} 85% 68%)`;
  const variant = variantOverride ?? mockVariantFor(project);

  const points = Array.from(
    { length: 9 },
    (_, i) => `${i * 12.5},${70 - rand() * 55}`,
  ).join(" ");

  return (
    <div
      aria-hidden
      className={cn("relative aspect-[16/10] w-full overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at 20% 0%, hsl(${hue1} 60% 30%), transparent 60%), linear-gradient(135deg, hsl(${hue1} 50% 16%), hsl(${hue2} 55% 9%))`,
      }}
    >
      <div className="absolute inset-[7%] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
        {/* Browser bar */}
        <div className="flex h-[9%] shrink-0 items-center gap-1.5 border-b border-white/10 px-3">
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className={`${line} ml-3 h-1.5 w-1/3`} />
        </div>

        <div className="relative flex-1 p-[4%]">
          {variant === "dashboard" ? (
            <div className="flex size-full gap-[4%]">
              <div className="flex w-[16%] flex-col gap-2.5 pt-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`${line} h-1.5 ${i === 1 ? "w-full" : "w-2/3"}`}
                    style={i === 1 ? { background: accent } : undefined}
                  />
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-[5%]">
                <div className="grid grid-cols-3 gap-[4%]">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/10 bg-white/5 p-[8%]"
                    >
                      <span className={`${line} block h-1 w-1/2`} />
                      <span
                        className="mt-2 block h-2.5 w-3/4 rounded-sm"
                        style={{ background: i === 0 ? accent : "rgba(255,255,255,.35)" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-[4%]">
                  <svg
                    viewBox="0 0 100 75"
                    preserveAspectRatio="none"
                    className="size-full"
                  >
                    <polyline
                      points={points}
                      fill="none"
                      stroke={accent}
                      strokeWidth="1.6"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      points={`0,75 ${points} 100,75`}
                      fill={accent}
                      opacity="0.12"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : null}

          {variant === "storefront" ? (
            <div className="flex size-full flex-col gap-[5%]">
              <div
                className="h-[34%] rounded-lg"
                style={{
                  background: `linear-gradient(100deg, ${accent}, hsl(${hue2} 70% 45%))`,
                  opacity: 0.85,
                }}
              />
              <div className="grid flex-1 grid-cols-4 gap-[3%]">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/5 p-[8%]"
                  >
                    <span className="flex-1 rounded-md bg-white/10" />
                    <span className={`${line} h-1 w-4/5`} />
                    <span
                      className="h-1.5 w-1/3 rounded-full"
                      style={{ background: accent }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {variant === "workspace" ? (
            <div className="grid size-full grid-cols-3 gap-[3%]">
              {[3, 2, 4].map((n, col) => (
                <div
                  key={col}
                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-[6%]"
                >
                  <span className={`${line} h-1 w-1/2`} />
                  {Array.from({ length: n }, (_, i) => (
                    <span
                      key={i}
                      className="block rounded-md border border-white/10 bg-white/10 p-1.5"
                    >
                      <span className={`${line} block h-1 w-5/6`} />
                      {i === 0 ? (
                        <span
                          className="mt-1.5 block h-1 w-1/4 rounded-full"
                          style={{ background: accent }}
                        />
                      ) : null}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {variant === "feed" ? (
            <div className="flex size-full gap-[4%]">
              <div className="w-[26%] rounded-lg border border-white/10 bg-white/5 p-[6%]">
                <span
                  className="mx-auto block size-6 rounded-full"
                  style={{ background: accent }}
                />
                <span className={`${line} mx-auto mt-3 block h-1 w-2/3`} />
                <span className={`${line} mx-auto mt-2 block h-1 w-1/2`} />
              </div>
              <div className="flex flex-1 flex-col gap-[5%]">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-[4%]"
                  >
                    <span className="size-4 shrink-0 rounded-full bg-white/25" />
                    <span className="flex flex-1 flex-col gap-1.5">
                      <span className={`${line} h-1 w-1/3`} />
                      <span className={`${line} h-1 w-full`} />
                      <span className={`${line} h-1 w-4/5`} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {variant === "chat" ? (
            <div className="flex size-full flex-col justify-end gap-2.5">
              <span
                className="block h-[14%] w-1/2 self-end rounded-xl rounded-br-sm"
                style={{ background: accent, opacity: 0.85 }}
              />
              <span className="block h-[22%] w-3/4 rounded-xl rounded-bl-sm bg-white/10 p-2">
                <span className={`${line} block h-1 w-full`} />
                <span className={`${line} mt-1.5 block h-1 w-5/6`} />
                <span
                  className="mt-2 block h-1.5 w-1/4 rounded-full"
                  style={{ background: accent }}
                />
              </span>
              <span
                className="block h-[14%] w-2/5 self-end rounded-xl rounded-br-sm"
                style={{ background: accent, opacity: 0.85 }}
              />
              <span className="mt-1 block h-[13%] rounded-full border border-white/15 bg-white/5" />
            </div>
          ) : null}

          {variant === "generic" ? (
            <div className="flex size-full flex-col gap-[5%]">
              <span className={`${line} h-1.5 w-1/3`} />
              <div
                className="flex-1 rounded-lg"
                style={{
                  background: `linear-gradient(120deg, ${accent}, transparent)`,
                  opacity: 0.4,
                }}
              />
              <div className="grid grid-cols-3 gap-[3%]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-6 rounded-md border border-white/10 bg-white/10"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
