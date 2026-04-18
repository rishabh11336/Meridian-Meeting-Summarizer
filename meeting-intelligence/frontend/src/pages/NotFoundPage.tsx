import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-4xl font-bold text-text-muted">404</p>
      <p className="text-sm text-text-secondary">Page not found.</p>
      <Link to="/" className="text-sm text-accent hover:underline">
        Go home
      </Link>
    </div>
  );
}
