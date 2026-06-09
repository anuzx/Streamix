import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/users.api";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);



    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);

      // only append if user selected a file
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("coverImage", coverFile);

      await registerUser(formData);
      navigate("/signin");
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}


        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <h1 className="text-white text-2xl font-bold mb-2">Create account</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Join today and start uploading.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:border-red-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

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

            {/* Avatar */}
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">
                Avatar<span className="text-zinc-600">(optional)</span>
              </label>
              <div
                onClick={() => avatarRef.current?.click()}
                className="bg-zinc-800 border border-zinc-700 border-dashed rounded-lg px-4 py-3 text-sm cursor-pointer hover:border-red-500 transition-colors"
              >
                {avatarFile ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-zinc-300">{avatarFile.name}</span>
                  </div>
                ) : (
                  <span className="text-zinc-600">Click to upload avatar</span>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {/* Cover image */}
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">
                Cover Image<span className="text-zinc-600">(optional)</span>
              </label>
              <div
                onClick={() => coverRef.current?.click()}
                className="bg-zinc-800 border border-zinc-700 border-dashed rounded-lg px-4 py-3 text-sm cursor-pointer hover:border-red-500 transition-colors"
              >
                {coverFile ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(coverFile)}
                      className="w-12 h-8 rounded object-cover"
                    />
                    <span className="text-zinc-300">{coverFile.name}</span>
                  </div>
                ) : (
                  <span className="text-zinc-600">Click to upload cover image</span>
                )}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
              </div>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-zinc-500 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="text-red-500 hover:text-red-400">
              Sign in
            </Link>
          </p>
        </div>
      </div >
    </div >
  );
}
