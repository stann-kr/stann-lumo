'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8" style={{ fontFamily: 'Arial, sans-serif', background: '#000', color: '#fff', minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Something went wrong.</h1>
          <button
            onClick={() => reset()}
            style={{ minHeight: '44px', padding: '0.5rem 1.5rem', border: '1px solid #fff', background: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
