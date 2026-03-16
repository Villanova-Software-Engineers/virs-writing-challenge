import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: "/messages",
    label: "Messages",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: integrate with Firebase auth logout
    console.log("Logout clicked");
  };

  return (
    <nav className="h-screen bg-primary flex flex-col flex-shrink-0 w-48">
      {/* Logo / Brand */}
      <div className="flex items-center h-14 px-4 border-b border-background/10">
        <span className="text-background font-bold text-lg whitespace-nowrap">
          VIRS
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-3 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-background/20 text-background"
                  : "text-background/60 hover:text-background hover:bg-background/10"
              }`
            }
          >
            {item.icon}
            <span className="text-sm font-medium ">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-background/10 py-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg text-background/60 hover:text-background hover:bg-background/10 transition-colors whitespace-nowrap w-[calc(100%-0.5rem)] cursor-pointer"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium ">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
