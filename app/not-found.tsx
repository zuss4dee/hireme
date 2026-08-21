import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-16 max-w-lg p-10 text-center">
      <p className="text-6xl font-black tracking-tighter text-lime">404</p>
      <h1 className="mt-3 text-2xl font-black tracking-tight">Not on the board.</h1>
      <p className="mt-2 text-muted">This person doesn&apos;t exist, or they never bid. Same thing really.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">See the leaderboard</Link>
        <Link href="/join" className="btn btn-ghost">Put myself on it</Link>
      </div>
    </div>
  );
}
