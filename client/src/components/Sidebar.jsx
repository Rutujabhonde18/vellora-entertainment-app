import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import SearchBar from "./SearchBar";
import { House, Clapperboard, Tv, Bookmark, Play, Menu, X } from "lucide-react";

// Sidebar navigation links
const links = [
  { name: "Home", path: "/", Icon: House },
  { name: "Movies", path: "/movies", Icon: Clapperboard },
  { name: "TV Series", path: "/tv-series", Icon: Tv },
  { name: "Bookmarks", path: "/bookmarks", Icon: Bookmark },
];

const Sidebar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Shared sidebar content for mobile and desktop
  const sidebarContent = (
    <>
      <div
        onClick={() => {
          navigate("/");
          setMenuOpen(false);
        }}
        className="mb-5 flex shrink-0 items-center gap-3 cursor-pointer"
      >
        <div className="mx-auto flex w-40 items-center justify-center">
          <img
            src="/Velora Purple Film Logo.png"
            alt="Velora logo"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Render navigation links */}
      <nav className="flex flex-col gap-2">
        {links.map(({ name, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {name}
          </NavLink>
        ))}
      </nav>

      {/* Account and authentication options */}
      <div className="mt-auto shrink-0">
        <AccountMenu />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-60 flex h-16 items-center gap-3 border-b border-slate-700/70 bg-[#101827] px-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>
      </header>

      {/* Dark backdrop when the mobile menu is open */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-70 bg-black/60 md:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-16 z-80 flex h-[calc(100dvh-4rem)] w-72 flex-col overflow-y-auto border-r border-slate-700/70 bg-[#101827] p-4 transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-dvh w-64 flex-col overflow-y-auto border-r border-slate-700/70 bg-[#101827] p-4 md:flex">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
