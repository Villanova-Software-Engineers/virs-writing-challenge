import { NavLink, useNavigate } from "react-router-dom";

const adminNavItems = [
  {
    to: "/admin",
    label: "Semesters",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

function AdminNavBar() {
  const navigate = useNavigate();

  return (
    <nav className="h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 w-48">
      {/* Logo / Brand */}
      <div className="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700">
        <span className="text-slate-900 dark:text-white font-bold text-lg whitespace-nowrap">
          VIRS Admin
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-3 gap-1">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              }`
            }
          >
            {item.icon}
            <span className="text-base font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Back to app */}
      <div className="border-t border-slate-200 dark:border-slate-700 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap w-[calc(100%-0.5rem)] cursor-pointer"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-base font-medium">Back to App</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminNavBar;