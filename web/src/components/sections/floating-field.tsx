import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  id: string;
  label: string;
  /** Error message from validation (shown under the field). */
  error?: string;
  /** Marks the field as optional in its label. */
  optional?: boolean;
}

const base =
  "peer border-border bg-surface-glass text-foreground block w-full rounded-2xl border px-4 pt-6 pb-2 text-base outline-none backdrop-blur-md transition-colors duration-200 placeholder-transparent hover:border-border-strong focus:border-accent";

const labelBase =
  "text-muted pointer-events-none absolute left-4 top-[1.05rem] origin-left font-mono text-[11px] tracking-[0.14em] uppercase transition-all duration-200 " +
  "peer-focus:top-2 peer-focus:text-[9px] peer-focus:text-accent " +
  "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[9px]";

function Label({ id, label, optional }: Pick<FieldProps, "id" | "label" | "optional">) {
  return (
    <label htmlFor={id} className={labelBase}>
      {label}
      {optional ? <span className="opacity-60"> (optional)</span> : null}
    </label>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 px-1 text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

/** Text input with a label that floats up when the field is focused or filled. Pass RHF's `register()` result as props. */
export function FloatingInput({
  id,
  label,
  error,
  optional,
  className,
  ...props
}: FieldProps & ComponentPropsWithRef<"input">) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            base,
            error && "border-red-500/70 focus:border-red-500",
            className,
          )}
          {...props}
        />
        <Label id={id} label={label} optional={optional} />
      </div>
      <ErrorText id={id} error={error} />
    </div>
  );
}

/** Multi-line version of FloatingInput, with an optional character counter. */
export function FloatingTextarea({
  id,
  label,
  error,
  optional,
  count,
  maxCount,
  className,
  ...props
}: FieldProps & {
  count?: number;
  maxCount?: number;
} & ComponentPropsWithRef<"textarea">) {
  return (
    <div>
      <div className="relative">
        <textarea
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            base,
            "min-h-44 resize-y pt-7",
            error && "border-red-500/70 focus:border-red-500",
            className,
          )}
          {...props}
        />
        <Label id={id} label={label} optional={optional} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <ErrorText id={id} error={error} />
        {maxCount !== undefined && count !== undefined ? (
          <p
            aria-hidden
            className={cn(
              "text-muted mt-1.5 ml-auto shrink-0 px-1 font-mono text-[10px] tracking-[0.14em]",
              count > maxCount && "text-red-600 dark:text-red-400",
            )}
          >
            {count} / {maxCount}
          </p>
        ) : null}
      </div>
    </div>
  );
}
