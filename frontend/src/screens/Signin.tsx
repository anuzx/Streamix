import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/users.api";
import { useAuthStore } from "../store/authStore";

export default function Signin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const data = await loginUser({ username, email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold">Streamix</span>
        </div>

        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h1 className="text-white text-2xl font-bold mb-2">Sign in</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Welcome back! Enter your details to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:border-red-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:border-red-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:border-red-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-colors mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-zinc-500 text-sm text-center mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-red-500 hover:text-red-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
