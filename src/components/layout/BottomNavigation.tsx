import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Bell, User } from "lucide-react";

const navItems = [
  { label: "الرئيسية", icon: <Home size={20} />, path: "/dashboard" },
  { label: "العملاء", icon: <Users size={20} />, path: "/clients" },
  { label: "الإشعارات", icon: <Bell size={20} />, path: "/notifications" },
  { label: "الحساب", icon: <User size={20} />, path: "/profile" },
];

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed z-40 bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around items-center h-16 md:hidden animate-fade-in-up">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 focus:outline-none transition-all duration-200 ${isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-500"}`}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {isActive && <span className="block w-1 h-1 rounded-full bg-blue-600 mt-1" />}
          </button>
        );
      })}
    </nav>
  );
}
