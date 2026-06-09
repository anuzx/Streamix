import { Bell, Menu, Plus, Search } from "lucide-react";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import { useUploadStore } from "../store/uploadStore";


export default function Navbar() {
  const navigate = useNavigate();
  const { openUpload } = useUploadStore();
  const { user, clearAuth } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await axios.post(`${BACKEND_URL}/users/logout`, {}, {
        withCredentials: true,
      });
    } catch (_) {
      // even if backend fails, clear frontend state
    } finally {
      clearAuth();
      setDropdownOpen(false);
      navigate("/signin");
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-zinc-800 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <Menu className="text-white cursor-pointer" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
            ▶
          </div>
          <span className="text-white text-xl font-semibold cursor-pointer" onClick={() => navigate("/")}>Streamix</span>
        </div>
      </div>

      <div className="hidden md:flex w-[40%] items-center">
        <input
          type="text"
          placeholder="Search"
          className="flex-1 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-l-full text-white outline-none"
        />
        <button className="bg-zinc-800 border border-zinc-700 px-5 py-2 rounded-r-full">
          <Search className="text-white" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <Button variant="secondary" onClick={openUpload} className="cursor-pointer">
            <Plus size={20} />
            <span className="cursor-pointer">Create</span>
          </Button>
        )}

        <Bell className="text-white cursor-pointer" />

        {user ? (
          // Avatar + dropdown
          <div className="relative" ref={dropdownRef}>
            <img
              src={user.avatar}
              alt={user.username}
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full object-cover cursor-pointer ring-2 ring-transparent hover:ring-red-500 transition-all"
            />

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-zinc-800">
                  <p className="text-white text-sm font-semibold truncate">{user.fullName}</p>
                  <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(`/channel/${user.username}`);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Your Channel
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="ghost" onClick={() => navigate("/signin")}>
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}
