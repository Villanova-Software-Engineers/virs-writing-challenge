import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { clearTokenCache, clearUserLocalStorage } from "../../services/apiClient";
import { CalendarDays, Users, Clock, Archive, ArrowLeft, ShieldCheck, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const adminNavItems = [
  {
    id: "access",
    label: "Semester Management",
    icon: <CalendarDays className="w-4 h-4 flex-shrink-0" />,
  },
  {
    id: "users",
    label: "User Management",
    icon: <Users className="w-4 h-4 flex-shrink-0" />,
  },
  {
    id: "admins",
    label: "Admin Management",
    icon: <ShieldCheck className="w-4 h-4 flex-shrink-0" />,
  },
  {
    id: "timelog",
    label: "Writing Sessions",
    icon: <Clock className="w-4 h-4 flex-shrink-0" />,
  },
  {
    id: "archived",
    label: "Archived Semesters",
    icon: <Archive className="w-4 h-4 flex-shrink-0" />,
  },
  {
    id: "back",
    label: "Back to Dashboard",
    icon: <ArrowLeft className="w-4 h-4 flex-shrink-0" />,
  },
];

function AdminNav({ activeId, onSelect }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      clearTokenCache();
      clearUserLocalStorage();
      await signOut(auth);
      navigate("/auth/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavClick = (itemId) => {
    if (itemId === "back") {
      navigate("/dashboard");
    } else {
      onSelect(itemId);
    }
  };

  return (
    <nav className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 w-48">
      {/* Logo / Brand */}
      <div className="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span className="text-blue-700 dark:text-blue-400 font-bold text-lg whitespace-nowrap">
          VIRS Admin
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-3 gap-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = item.id === activeId && item.id !== "back";
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg transition-colors whitespace-nowrap text-left ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Theme Toggle & Logout */}
      <div className="border-t border-slate-200 dark:border-slate-700 py-3 flex-shrink-0 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap w-[calc(100%-0.5rem)] cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap w-[calc(100%-0.5rem)] cursor-pointer"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminNav;
