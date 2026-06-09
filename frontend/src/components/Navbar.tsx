import { Bell, Menu, Plus, Search } from "lucide-react";
import Button from "./Button";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-zinc-800 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <Menu className="text-white cursor-pointer" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            ▶
          </div>

          <span className="text-white text-xl font-semibold">
            Streamix
          </span>
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
        <Button variant="secondary" onClick={() => { navigate("/upload") }}>
          <Plus size={20} />
          <span>Create</span>
        </Button>

        <Bell className="text-white cursor-pointer" />

        <Button variant="ghost">Sign In</Button>
      </div>
    </nav>
  );
}
