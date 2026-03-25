import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { clearTokenCache } from "../../services/apiClient";
import { Shield, Users, Clock, Archive, ArrowLeft, UserCog } from "lucide-react";

const adminNavItems = [
  {
    id: "back",
    label: "Back to Dashboard",
    icon: <ArrowLeft className="w-5 h-5" />,
  },
  {
    id: "access",
    label: "Semester & Access Codes",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "users",
    label: "User Management",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "admins",
    label: "Admin Management",
    icon: <UserCog className="w-5 h-5" />,
  },
  {
    id: "timelog",
    label: "Writing Sessions",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "archived",
    label: "Archived Semesters",
    icon: <Archive className="w-5 h-5" />,
  },
];

function AdminNav({ activeId, onSelect }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      clearTokenCache();
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
    <nav className="h-screen bg-primary flex flex-col flex-shrink-0 w-48">
      {/* Logo / Brand */}
      <div className="flex items-center h-14 px-4 border-b border-background/10">
        <span className="text-background font-bold text-lg whitespace-nowrap">
          VIRS Admin
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col py-3 gap-1">
        {adminNavItems.map((item) => {
          const isActive = item.id === activeId && item.id !== "back";
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-colors whitespace-nowrap text-left ${
                isActive
                  ? "bg-background/20 text-background"
                  : "text-background/60 hover:text-background hover:bg-background/10"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
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
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminNav;
