import React, { useState, useEffect } from "react";
import { User, LogOut, Menu, X, Coins, Trophy, Clock, ShieldAlert } from "lucide-react";
import { UserProfile } from "../types";

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
  openAuthModal: () => void;
}

export default function Header({
  activePage,
  setActivePage,
  user,
  onLogout,
  openAuthModal,
}: HeaderProps) {
  const [saudiTime, setSaudiTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Saudi clock GMT+3
  useEffect(() => {
    const updateSaudiClock = () => {
      // Create date object and shift to AST (Arabia Standard Time) which is GMT+3
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formatted = new Intl.DateTimeFormat("en-US", options).format(new Date());
      setSaudiTime(formatted);
    };

    updateSaudiClock();
    const timer = setInterval(updateSaudiClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: "home", label: "الرئيسية" },
    { id: "matches", label: "المباريات" },
    { id: "news", label: "الأخبار" },
    { id: "streams", label: "البث المباشر" },
    { id: "prediction", label: "المسابقة المونديالية" },
    { id: "leaderboard", label: "المتصدرون" },
    { id: "profile", label: "حسابي والمحفظة" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0e1a]/95 backdrop-blur-md border-b border-[#1f2940] shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Right Section: Logo & Saudi Clock */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActivePage("home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10b981] to-emerald-950 flex items-center justify-center shadow-lg shadow-[#10b981]/20 group-hover:scale-105 transition-all">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-wide leading-none group-hover:text-[#10b981] transition-colors font-sans">
                GAOLWIN
              </span>
              <span className="text-[10px] text-gray-400 font-extrabold max-md:hidden">البث الحي ومسابقات توقع نتائج المباريات</span>
            </div>
          </div>

          {/* Clock Saudi */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1f293d] rounded-lg">
            <Clock className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs text-gray-300 font-bold font-mono" dir="ltr">
              KSA {saudiTime}
            </span>
          </div>
        </div>

        {/* Center: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-3.5 py-2 text-sm font-extrabold rounded-lg transition-all relative ${
                  isActive
                    ? "text-[#10b981] bg-[#10b981]/10"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 right-1/4 left-1/4 h-0.5 bg-[#10b981] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Left Section: User info / Login buttons */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Stats */}
                <div className="flex flex-col items-end pr-2 border-r border-[#1f293d]">
                  <span className="text-xs text-gray-400 font-semibold">{user.username}</span>
                  <div className="flex items-center gap-1.5 mt-0.5" dir="ltr">
                    <span className="text-[11px] text-[#10b981] font-black mr-2">${user.balance}</span>
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[11px] text-yellow-500 font-black">{user.points} pts</span>
                  </div>
                </div>

                {/* Profile icon */}
                <button
                  onClick={() => setActivePage("profile")}
                  className="w-9 h-9 rounded-full bg-[#111827] border border-gray-700 flex items-center justify-center hover:bg-[#10b981]/15 transition-all text-gray-300 hover:text-[#10b981]"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="w-9 h-9 rounded-full bg-[#111827] border border-gray-700 flex items-center justify-center hover:bg-yellow-500/10 transition-all text-gray-400 hover:text-yellow-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="px-4 py-2 bg-gradient-to-l from-[#10b981] to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-xs font-bold text-white rounded-lg transition-all shadow-md flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                تسجيل الدخول / إنشاء حساب
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet categories navigation row - ALWAYS visible in the header of the site */}
      <div className="md:hidden border-t border-[#1f2940]/50 bg-[#070b14]/75 px-4 py-2.5 flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none no-scrollbar select-none" dir="rtl" style={{ scrollbarWidth: "none" }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMenuOpen(false);
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#10b981] text-white shadow-md shadow-[#10b981]/15"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0a0e1a] border-b border-[#1f293b] px-4 py-4 flex flex-col gap-3 animate-fadeIn">
          {/* Mobile User Panel */}
          {user ? (
            <div className="bg-[#111827] p-3 rounded-lg border border-[#1f293d] mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">{user.username}</span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-500 font-bold">{user.points} نقطة</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#10b981] font-bold">${user.balance} الرصيد</span>
                </div>
              </div>
              {!user.is_verified && (
                <div className="mt-2 flex items-center gap-1 bg-yellow-950/40 p-2 rounded border border-yellow-800/60 text-[10px] text-yellow-400">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  بريد غير مؤكد! أكد حسابك لتتمكن من سحب الأرباح.
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                openAuthModal();
              }}
              className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-600 text-sm font-bold text-white rounded-lg transition-all shadow-md text-center"
            >
              تسجيل الدخول / إنشاء حساب
            </button>
          )}

          {/* Navigation Links */}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 text-right text-sm font-bold rounded-lg transition-all ${
                activePage === item.id
                  ? "text-white bg-[#10b981]"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Clock and Logout under mobile */}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1f2940]">
            <span className="text-xs text-gray-400 font-bold font-mono">KSA {saudiTime}</span>
            {user && (
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
