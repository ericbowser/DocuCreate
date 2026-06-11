/** Lightweight fallback while lazy routes load. */
export default function PageLoader() {
  return (
    <div className="page-shell flex items-center justify-center min-h-[40vh]">
      <p className="text-muted text-base" role="status" aria-live="polite">
        Loading…
      </p>
    </div>
  )
}
