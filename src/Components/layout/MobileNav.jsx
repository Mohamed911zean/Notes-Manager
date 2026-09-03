import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, CalendarDays, CheckSquare, FileText, BarChart3 } from "lucide-react";

const items = [
  { text: "Home", icon: Home, path: "/home" },
  { text: "Calendar", icon: CalendarDays, path: "/calendar" },
  { text: "Tasks", icon: CheckSquare, path: "/tasks" },
  { text: "Notes", icon: FileText, path: "/notes" },
  { text: "Stats", icon: BarChart3, path: "/analytics" },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 min-w-0 flex-1 py-1.5">
              {active && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute -top-px w-8 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {item.text}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}