import { Home, Calendar, Timer, TrendingUp, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
export default function SideBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const items = [
    { text: "Home", icon: <Home size={20} />, path: "/home" },
    { text: "Calendar", icon: <Calendar size={20} />, path: "/calendar" },
    { text: "Pomodoro", icon: <Timer size={20} />, path: "/pomodoro" },
    { text: "Analytics", icon: <TrendingUp size={20} />, path: "/analytics" },
  ];

  return (
    <>
      {/* Toggle Button (Menu / X) */}
     <button
  onClick={() => setOpen(prev => !prev)}
  className="fixed top-4 left-6 z-50 p-2.5 rounded-lg
  bg-zinc-900/90 border border-zinc-800
  text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800
  transition-all duration-200 backdrop-blur-sm"
>
  {open ? <X size={20} /> : <Menu size={20} />}
</button>


      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 z-40 w-72
        ${open ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
       <div className="flex items-center h-20 px-6 pl-20 border-b border-zinc-800/50">
  <h1 className="font-semibold text-zinc-100 text-xl tracking-tight">
    Tracify
  </h1>
</div>


        {/* Menu */}
        <nav className="p-4 space-y-1">
          {items.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Link key={index} to={item.path} onClick={() => setOpen(false)}>
                <div
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  <span
                    className={
                      isActive
                        ? "text-zinc-100"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200">
                Your Acount 
              </span>
              
             
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
