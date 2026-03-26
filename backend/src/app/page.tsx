export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 0 Foundation</p>
        <h1>Menu Time Backend</h1>
        <p className="lead">
          Next.js App Router backend skeleton for API, auth, Prisma, logging,
          error handling, storage adapters, and job queue bootstrapping.
        </p>
        <div className="link-row">
          <a href="/api/health">/api/health</a>
          <a href="/api/v1/auth/session">/api/v1/auth/session</a>
        </div>
      </section>
    </main>
  );
}
