import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, subtitle, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-8">
      {Icon && (
        <div className="p-4 rounded-2xl bg-accent mb-4">
          <Icon size={36} className="text-muted-foreground" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mb-4 max-w-xs">{subtitle}</p>}
      {action && actionLabel && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}