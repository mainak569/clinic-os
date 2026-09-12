/**
 * The app's signature background: a soft gradient mesh, four slowly pulsing
 * colour orbs and a fine noise grain.
 *
 * This was previously inlined on the home page only, which is why every other
 * route sat on flat white and the glass panels had nothing to refract. It now
 * lives in one place and every route uses it, so the whole product shares one
 * ground.
 */
export function GlassBackground() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      {/* Main gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50" />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-0 -left-4 w-[500px] h-[500px] bg-purple-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
        style={{ boxShadow: "0 0 100px rgba(192, 132, 252, 0.25)" }}
      />
      <div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-fuchsia-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
        style={{
          animationDelay: "2s",
          animationDuration: "7s",
          boxShadow: "0 0 120px rgba(216, 180, 254, 0.25)",
        }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
        style={{
          animationDelay: "4s",
          animationDuration: "9s",
          boxShadow: "0 0 100px rgba(165, 180, 252, 0.25)",
        }}
      />
      <div
        className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-200/25 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
        style={{
          animationDelay: "6s",
          animationDuration: "8s",
          boxShadow: "0 0 80px rgba(192, 132, 252, 0.2)",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30" />
    </div>
  );
}
