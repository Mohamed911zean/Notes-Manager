import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SideBar from './sidebar.jsx';
import Analytics from "./AnailticsManager_home.jsx";
import DailyTasksView from "./DailyTasksView.jsx";
import DailyNotesView from "./DailyNotesView.jsx";
import { useTasksStore } from "../stores/useTasksStore";
import { useAnalyticsStore, formatTime } from "../stores/AnaliticsStore";
import { useNotesStore } from "../stores/useNotesStore";
import { useCalenderStore } from '../stores/CalenderStore.jsx';

import { 
    Activity, 
    CheckCircle2, 
    StickyNote, 
    Calendar as CalendarIcon,
    Clock
} from 'lucide-react';

export default function Home() {
    const tasks = useTasksStore((state) => state.tasks);
    const plans = useCalenderStore((state) => state.plans);
    const analyticsStore = useAnalyticsStore();
    const getTotalToday = analyticsStore.getTotalToday || (() => 0);
    const { notes } = useNotesStore();
    
    const [greeting, setGreeting] = useState('');

    useEffect(() => {        
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    const today = new Date().toISOString().slice(0, 10);

    // Tasks for today (from tasks store)
    const todayTasks = tasks.filter(t => t.dateISO === today);
    
    // Plans for today (from calendar store)
    const todayPlans = plans.filter(p => p.dateISO === today);
    
    // Merge both tasks and plans
    const allTodayItems = [
        ...todayTasks.map(task => ({
            id: task.id,
            done: task.done,
            completed: task.done,
            source: 'task'
        })),
        ...todayPlans.map(plan => ({
            id: plan.id,
            done: plan.completed,
            completed: plan.completed,
            source: 'plan'
        }))
    ];
    
    // Calculate completion stats
    const completedTasks = allTodayItems.filter(item => item.done || item.completed).length;
    const totalTasksCount = allTodayItems.length;
    const taskProgress = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

    // Notes for today
    const todayNotes = notes.filter(note => {
        if (note.dateISO) return note.dateISO === today;
        const noteDate = new Date(note.id).toLocaleDateString("en-CA");
        return noteDate === today;
    }).length;

    // Stats
    const stats = [
        {
            label: "Focus Time",
            value: formatTime(getTotalToday()),
            icon: Clock,
            trend: "Today",
        },
        {
            label: "Tasks Completed",
            value: `${completedTasks}/${totalTasksCount}`,
            subValue: `${taskProgress}%`,
            icon: CheckCircle2,
            trend: "Progress",
        },
        {
            label: "Notes Created",
            value: todayNotes,
            icon: StickyNote,
            trend: "New",
        }
    ];

    return (
        <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
            <SideBar/>
            
            <main className="pl-0 md:pl-0 transition-all duration-300">
                <div className="max-w-[1600px] mx-auto p-6 md:p-12 space-y-10">
                    {/* Header */}
                    <header className="flex flex-col gap-2 pt-12 md:pt-0">
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='text-3xl font-medium tracking-tight text-white'
                        >
                            {greeting}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2 text-zinc-500 text-sm font-medium"
                        >
                            <CalendarIcon size={14} />
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </motion.div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                                className="group p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-zinc-100 transition-colors">
                                        <stat.icon size={18} />
                                    </div>
                                    {stat.subValue && (
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                                            {stat.subValue}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-zinc-100 tracking-tight">{stat.value}</h3>
                                    <p className="text-sm text-zinc-500 font-medium mt-1">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Analytics */}
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden flex flex-col min-h-[500px]"
                        >
                            <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-zinc-400" />
                                    <h2 className="text-sm font-medium text-zinc-200">Analytics Overview For Today</h2>
                                </div>
                            </div>
                            <div className="flex-1 p-2">
                                <Analytics/>
                            </div>
                        </motion.section>

                        {/* Tasks */}
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden flex flex-col h-auto"
                        >
                            <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-zinc-400" />
                                    <h2 className="text-sm font-medium text-zinc-200">Today's Tasks</h2>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <DailyTasksView 
                                    day={{ dateISO: today }} 
                                    showBack={false} 
                                    onBack={() => {}}
                                    className="h-full bg-transparent"
                                />
                            </div>
                        </motion.section>

                        {/* Notes */}
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="lg:col-span-12 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-2">
                                <StickyNote size={16} className="text-zinc-400" />
                                <h2 className="text-sm font-medium text-zinc-200">Quick Notes</h2>
                            </div>
                            <div className="h-[300px]">
                                <DailyNotesView 
                                    day={{ dateISO: today }} 
                                    className="h-full bg-transparent" 
                                />
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>
        </div>
    );
}