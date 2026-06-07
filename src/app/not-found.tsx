import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <p className="text-micro uppercase tracking-wide text-muted">404</p>
      <h1 className="text-stat font-semibold tracking-tight text-foreground">
        That page does not exist
      </h1>
      <p className="max-w-md text-body text-muted">
        The page or vault you are looking for is not here. The live vaults are on the home page.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-body font-medium text-on-accent transition-colors hover:bg-accent-strong"
      >
        Back to vaults
      </Link>
    </div>
  );
}
