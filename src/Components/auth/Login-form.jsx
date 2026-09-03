import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase.ts";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Palette } from "lucide-react";
import { useThemeStore, COLOR_TEMPLATES } from "../../stores/ThemeStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, colorTemplate, setColorTemplate, toggleTheme } = useThemeStore();

  useEffect(() => {
    useThemeStore.getState().initTheme();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      toast.success("Logged in successfully!");
      navigate("/home");

    } catch (error) {
      console.log(error);
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-gradient shadow-lg glow-soft flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-bold">T</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-brand-gradient">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to continue to your account</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl p-8 shadow-2xl border border-border bg-card"
        >
          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-5"
          >
            <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-accent text-foreground outline-none placeholder-muted-foreground border border-border focus:border-primary transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-accent text-foreground outline-none placeholder-muted-foreground border border-border focus:border-primary transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Login Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onClick={handleLogin}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-brand-gradient rounded-xl text-primary-foreground font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-soft"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-6 text-muted-foreground text-sm"
        >
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:opacity-80 font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </motion.p>

        {/* Color system picker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Palette size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Pick a color system</span>
            <button
              onClick={toggleTheme}
              className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            {COLOR_TEMPLATES.map((t) => {
              const active = colorTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setColorTemplate(t.id)}
                  title={t.name}
                  className={`w-8 h-8 rounded-full transition-all ${
                    active ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-110"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,
                    boxShadow: active ? `0 0 10px ${t.primary}` : undefined,
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
