export default function SkeletonLoader({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ compact = false }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="w-20 h-4 rounded"><SkeletonLoader className="w-full h-full" /></div>
        <div className="w-8 h-8 rounded-lg"><SkeletonLoader className="w-full h-full" /></div>
      </div>
      <div className="w-3/4 h-6 rounded"><SkeletonLoader className="w-full h-full" /></div>
      {!compact && (
        <>
          <div className="w-full h-3 rounded"><SkeletonLoader className="w-full h-full" /></div>
          <div className="w-2/3 h-3 rounded"><SkeletonLoader className="w-full h-full" /></div>
        </>
      )}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}