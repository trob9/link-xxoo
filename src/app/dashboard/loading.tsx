/**
 * Shown while a dashboard route's data is in flight. It mirrors the real
 * layout — a heading block, then stacked rows — so the page doesn't visibly
 * jump when the content lands.
 */
export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 rounded border-2 border-border-strong bg-surface" />
        <div className="h-4 w-64 rounded bg-surface" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-md border-2 border-border-strong bg-surface"
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
