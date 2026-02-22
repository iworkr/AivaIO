"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { LottieAnimation } from "@/components/ui";
import {
  Plus, CheckSquare, Circle, CheckCircle2, ChevronRight, ChevronDown,
  Calendar as CalendarIcon, Clock, Trash2, GripVertical, X,
  Flag, AlertTriangle, Minus, Filter, ChevronLeft, MoreHorizontal,
} from "lucide-react";

/* ═══════════════════ Types ═══════════════════ */

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  due_date: string | null;
  tags: string[];
  calendar_event_id: string | null;
  created_at: string;
  subtasks: Subtask[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
  task_id: string | null;
  tasks?: { id: string; title: string; status: string; priority: string } | null;
}

type CalendarView = "day" | "week" | "month";

const PRIORITY_CONFIG = {
  high: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "High" },
  medium: { icon: Flag, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Medium" },
  low: { icon: Minus, color: "text-blue-400", bg: "bg-blue-500/10", label: "Low" },
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "todo", label: "To-Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

/* ═══════════════════ Helpers ═══════════════════ */

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

/* ═══════════════════ Main Component ═══════════════════ */

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const newTaskRef = useRef<HTMLInputElement>(null);

  const loadTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
  }, [statusFilter]);

  const loadEvents = useCallback(async () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    if (calendarView === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (calendarView === "week") {
      start.setDate(start.getDate() - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    try {
      const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
  }, [currentDate, calendarView]);

  useEffect(() => {
    Promise.all([loadTasks(), loadEvents()]).then(() => setIsLoading(false));
  }, [loadTasks, loadEvents]);

  useEffect(() => {
    if (showNewTask) newTaskRef.current?.focus();
  }, [showNewTask]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        due_date: newTaskDue || null,
      }),
    });
    setNewTaskTitle("");
    setNewTaskPriority("medium");
    setNewTaskDue("");
    setShowNewTask(false);
    loadTasks();
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: nextStatus }),
    });
    loadTasks();
    loadEvents();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
    loadTasks();
  };

  const handleAddSubtask = async (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    await fetch("/api/tasks/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, title: newSubtaskTitle.trim() }),
    });
    setNewSubtaskTitle("");
    loadTasks();
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await fetch("/api/tasks/subtasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subtaskId, is_completed: !completed }),
    });
    loadTasks();
  };

  const handleCalendarDrop = async (task: Task, date: Date, hour?: number) => {
    const startTime = new Date(date);
    if (hour !== undefined) startTime.setHours(hour, 0, 0, 0);
    else startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        task_id: task.id,
        color: task.priority === "high" ? "red" : task.priority === "medium" ? "yellow" : "blue",
      }),
    });
    setDraggedTask(null);
    loadEvents();
    loadTasks();
  };

  const navigateCalendar = (direction: number) => {
    const next = new Date(currentDate);
    if (calendarView === "day") next.setDate(next.getDate() + direction);
    else if (calendarView === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setCurrentDate(next);
  };

  const filteredTasks = tasks;
  const todoTasks = filteredTasks.filter((t) => t.status !== "done");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background-main)]">
        <LottieAnimation src="/lottie/spinner.json" loop autoplay style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background-main)]">
      {/* ═══ Header ═══ */}
      <div className="h-14 border-b border-[var(--border-subtle)] px-6 flex items-center gap-4 shrink-0">
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">Tasks & Calendar</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === f.key
                  ? "bg-[rgba(255,255,255,0.1)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Split Screen ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel: Task List ── */}
        <div className="w-[360px] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
          {/* Add task button */}
          <div className="p-3 border-b border-[var(--border-subtle)]">
            <AnimatePresence mode="wait">
              {showNewTask ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <input
                    ref={newTaskRef}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); if (e.key === "Escape") setShowNewTask(false); }}
                    placeholder="Task title…"
                    className="w-full bg-transparent border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--aiva-blue-border)] focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(["high", "medium", "low"] as const).map((p) => {
                        const cfg = PRIORITY_CONFIG[p];
                        return (
                          <button
                            key={p}
                            onClick={() => setNewTaskPriority(p)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                              newTaskPriority === p ? `${cfg.bg} ${cfg.color}` : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                            }`}
                          >
                            <cfg.icon size={10} /> {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="bg-transparent border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-[10px] text-[var(--text-tertiary)] focus:outline-none"
                    />
                    <div className="flex-1" />
                    <button onClick={() => setShowNewTask(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-3 py-1 rounded-md bg-[var(--aiva-blue)] text-white text-xs font-medium disabled:opacity-40 hover:brightness-110 transition"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowNewTask(true)}
                  className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[rgba(255,255,255,0.2)] transition-colors"
                >
                  <Plus size={14} /> New Task
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto">
            {todoTasks.length === 0 && doneTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <CheckSquare size={32} className="text-[var(--text-tertiary)] mb-3 opacity-40" />
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No tasks yet</p>
                <p className="text-xs text-[var(--text-tertiary)]">Create your first task to get started.</p>
              </div>
            ) : (
              <>
                {todoTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    expanded={expandedTask === task.id}
                    onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onStatusToggle={() => handleToggleStatus(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onDragStart={() => setDraggedTask(task)}
                    subtaskTitle={newSubtaskTitle}
                    onSubtaskTitleChange={setNewSubtaskTitle}
                    onAddSubtask={() => handleAddSubtask(task.id)}
                    onToggleSubtask={handleToggleSubtask}
                  />
                ))}
                {doneTasks.length > 0 && (
                  <div className="border-t border-[var(--border-subtle)]">
                    <div className="px-4 py-2 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-green-500/60" />
                      <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                        Completed ({doneTasks.length})
                      </span>
                    </div>
                    {doneTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        expanded={expandedTask === task.id}
                        onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        onStatusToggle={() => handleToggleStatus(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onDragStart={() => setDraggedTask(task)}
                        subtaskTitle={newSubtaskTitle}
                        onSubtaskTitleChange={setNewSubtaskTitle}
                        onAddSubtask={() => handleAddSubtask(task.id)}
                        onToggleSubtask={handleToggleSubtask}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Panel: Calendar ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Calendar header */}
          <div className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3 shrink-0">
            <button onClick={() => navigateCalendar(-1)} className="size-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-1 rounded transition-colors">
              Today
            </button>
            <button onClick={() => navigateCalendar(1)} className="size-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors">
              <ChevronRight size={14} />
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {calendarView === "month"
                ? currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
                : calendarView === "week"
                  ? `${formatDateShort(getWeekDays(currentDate)[0])} – ${formatDateShort(getWeekDays(currentDate)[6])}`
                  : currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-0.5 bg-[rgba(255,255,255,0.04)] rounded-lg p-0.5">
              {(["day", "week", "month"] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    calendarView === v
                      ? "bg-[rgba(255,255,255,0.1)] text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar content */}
          <div className="flex-1 overflow-auto">
            {calendarView === "month" ? (
              <MonthView date={currentDate} events={events} draggedTask={draggedTask} onDrop={handleCalendarDrop} />
            ) : (
              <TimeGridView
                view={calendarView}
                date={currentDate}
                events={events}
                draggedTask={draggedTask}
                onDrop={handleCalendarDrop}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Task Row Component ═══════════════════ */

function TaskRow({
  task, expanded, onToggle, onStatusToggle, onDelete, onDragStart,
  subtaskTitle, onSubtaskTitleChange, onAddSubtask, onToggleSubtask,
}: {
  task: Task;
  expanded: boolean;
  onToggle: () => void;
  onStatusToggle: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  subtaskTitle: string;
  onSubtaskTitleChange: (v: string) => void;
  onAddSubtask: () => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
}) {
  const isDone = task.status === "done";
  const cfg = PRIORITY_CONFIG[task.priority];
  const dueLabel = formatRelativeDate(task.due_date);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;
  const completedSubtasks = task.subtasks.filter((s) => s.is_completed).length;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      className="group border-b border-[var(--border-subtle)]"
    >
      <div className="flex items-center h-11 px-3 gap-2 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
        <GripVertical size={12} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-60 shrink-0 cursor-grab" />
        <button onClick={onStatusToggle} className="shrink-0">
          {isDone ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <Circle size={16} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
          )}
        </button>
        <button onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-2 text-left">
          <span className={`text-sm truncate ${isDone ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"}`}>
            {task.title}
          </span>
          {task.subtasks.length > 0 && (
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono shrink-0">
              {completedSubtasks}/{task.subtasks.length}
            </span>
          )}
        </button>
        {dueLabel && (
          <span className={`text-[10px] font-mono shrink-0 ${isOverdue ? "text-red-400" : "text-[var(--text-tertiary)]"}`}>
            {dueLabel}
          </span>
        )}
        <cfg.icon size={12} className={`${cfg.color} shrink-0 opacity-60`} />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="size-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-10 space-y-1.5">
              {task.description && (
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{task.description}</p>
              )}
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 h-7">
                  <button onClick={() => onToggleSubtask(sub.id, sub.is_completed)} className="shrink-0">
                    {sub.is_completed ? (
                      <CheckCircle2 size={13} className="text-green-500/70" />
                    ) : (
                      <Circle size={13} className="text-[var(--text-tertiary)]" />
                    )}
                  </button>
                  <span className={`text-xs ${sub.is_completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]"}`}>
                    {sub.title}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <Plus size={13} className="text-[var(--text-tertiary)] shrink-0" />
                <input
                  value={subtaskTitle}
                  onChange={(e) => onSubtaskTitleChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onAddSubtask(); }}
                  placeholder="Add subtask…"
                  className="flex-1 bg-transparent text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════ Month View ═══════════════════ */

function MonthView({
  date, events, draggedTask, onDrop,
}: {
  date: Date;
  events: CalendarEvent[];
  draggedTask: Task | null;
  onDrop: (task: Task, date: Date) => void;
}) {
  const days = getMonthDays(date);
  const today = new Date();
  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
        {weekDayLabels.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day));

          return (
            <div
              key={i}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-[rgba(59,130,246,0.05)]"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("bg-[rgba(59,130,246,0.05)]"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("bg-[rgba(59,130,246,0.05)]");
                if (draggedTask) onDrop(draggedTask, day);
              }}
              className="min-h-[80px] border-b border-r border-[var(--border-subtle)] p-1 transition-colors"
            >
              <span className={`inline-flex items-center justify-center size-6 rounded-full text-[11px] font-medium mb-0.5 ${
                isToday
                  ? "bg-[var(--aiva-blue)] text-white"
                  : isCurrentMonth ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)] opacity-40"
              }`}>
                {day.getDate()}
              </span>
              {dayEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className={`text-[10px] px-1.5 py-0.5 rounded truncate mb-0.5 ${
                    ev.color === "red" ? "bg-red-500/15 text-red-400"
                    : ev.color === "yellow" ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-blue-500/15 text-blue-400"
                  }`}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[9px] text-[var(--text-tertiary)] px-1">+{dayEvents.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════ Day/Week Time Grid ═══════════════════ */

function TimeGridView({
  view, date, events, draggedTask, onDrop,
}: {
  view: "day" | "week";
  date: Date;
  events: CalendarEvent[];
  draggedTask: Task | null;
  onDrop: (task: Task, date: Date, hour: number) => void;
}) {
  const days = view === "week" ? getWeekDays(date) : [date];
  const hours = getHours();
  const today = new Date();
  const nowHour = today.getHours();
  const nowMinutes = today.getMinutes();

  return (
    <div className="flex h-[1440px]">
      {/* Time gutter */}
      <div className="w-16 shrink-0 border-r border-[var(--border-subtle)]">
        {hours.map((h) => (
          <div key={h} className="h-[60px] flex items-start justify-end pr-2 -mt-2">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{formatHour(h)}</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day, dayIndex) => {
        const isToday = isSameDay(day, today);
        const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day));

        return (
          <div key={dayIndex} className="flex-1 border-r border-[var(--border-subtle)] relative">
            {/* Day header */}
            <div className={`sticky top-0 z-10 h-10 flex flex-col items-center justify-center border-b border-[var(--border-subtle)] ${
              isToday ? "bg-[var(--aiva-blue-glow)]" : "bg-[var(--background-main)]"
            }`}>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className={`text-sm font-medium ${isToday ? "text-[var(--aiva-blue)]" : "text-[var(--text-primary)]"}`}>
                {day.getDate()}
              </span>
            </div>

            {/* Hour slots */}
            {hours.map((h) => (
              <div
                key={h}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-[rgba(59,130,246,0.05)]"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("bg-[rgba(59,130,246,0.05)]"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bg-[rgba(59,130,246,0.05)]");
                  if (draggedTask) onDrop(draggedTask, day, h);
                }}
                className="h-[60px] border-b border-[var(--border-subtle)] transition-colors"
              />
            ))}

            {/* Current time indicator */}
            {isToday && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${40 + nowHour * 60 + nowMinutes}px` }}
              >
                <div className="flex items-center">
                  <div className="size-2 rounded-full bg-red-500 -ml-1" />
                  <div className="h-px flex-1 bg-red-500/60" />
                </div>
              </div>
            )}

            {/* Events overlay */}
            {dayEvents.map((ev) => {
              const start = new Date(ev.start_time);
              const end = new Date(ev.end_time);
              const startMinutes = start.getHours() * 60 + start.getMinutes();
              const duration = Math.max((end.getTime() - start.getTime()) / 60000, 30);
              const top = 40 + startMinutes;
              const height = duration;

              return (
                <div
                  key={ev.id}
                  className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs overflow-hidden z-10 border-l-2 ${
                    ev.color === "red"
                      ? "bg-red-500/10 border-red-500 text-red-300"
                      : ev.color === "yellow"
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-300"
                        : "bg-blue-500/10 border-blue-500 text-blue-300"
                  }`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  <div className="font-medium truncate">{ev.title}</div>
                  <div className="text-[10px] opacity-70">
                    {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} –{" "}
                    {end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
