import type { HabitCategory, HabitConfig, HabitType } from "@lifeos/contracts";

export interface HabitTemplate {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  icon: string;
  color: string;
  description: string;
  config: HabitConfig;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: "template-water",
    name: "Daily Water Intake",
    type: "water",
    category: "health",
    icon: "💧",
    color: "#3B82F6",
    description: "Stay hydrated with 2,500 ml daily water target and regular presets.",
    config: {
      type: "water",
      dailyGoalMl: 2500,
      sessionPresetsMl: [150, 250, 500],
      reminderIntervalMin: 120,
    },
  },
  {
    id: "template-prayer",
    name: "5 Daily Salah (Prayers)",
    type: "prayer",
    category: "mindfulness",
    icon: "🕌",
    color: "#10B981",
    description: "Track all 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).",
    config: {
      type: "prayer",
      prayers: [
        { name: "Fajr", time: "05:00" },
        { name: "Dhuhr", time: "13:00" },
        { name: "Asr", time: "16:30" },
        { name: "Maghrib", time: "19:00" },
        { name: "Isha", time: "20:30" },
      ],
    },
  },
  {
    id: "template-walking",
    name: "10,000 Daily Steps",
    type: "walking",
    category: "fitness",
    icon: "🚶",
    color: "#F97316",
    description: "Walk 10,000 steps daily to maintain physical cardiovascular health.",
    config: {
      type: "walking",
      dailyGoal: 10000,
      unit: "steps",
    },
  },
  {
    id: "template-reading",
    name: "Quran & Book Reading",
    type: "timed",
    category: "learning",
    icon: "📖",
    color: "#8B5CF6",
    description: "Dedicate 30 minutes every day to reading and gaining knowledge.",
    config: {
      type: "timed",
      dailyGoalMinutes: 30,
    },
  },
  {
    id: "template-dhikr",
    name: "Dhikr & Meditation",
    type: "timed",
    category: "mindfulness",
    icon: "📿",
    color: "#EC4899",
    description: "15 minutes of quiet dhikr, gratitude, and spiritual reflection.",
    config: {
      type: "timed",
      dailyGoalMinutes: 15,
    },
  },
  {
    id: "template-gardening",
    name: "Gardening & Plant Care",
    type: "boolean",
    category: "productivity",
    icon: "🌱",
    color: "#22C55E",
    description: "Water plants, prune garden, or tend to herbs daily.",
    config: {
      type: "boolean",
    },
  },
  {
    id: "template-woodworking",
    name: "Woodworking & Crafting",
    type: "timed",
    category: "learning",
    icon: "🪵",
    color: "#D97706",
    description: "Spend time in workshop crafting, carving, or building.",
    config: {
      type: "timed",
      dailyGoalMinutes: 45,
    },
  },
  {
    id: "template-sleep",
    name: "Consistent 8h Sleep",
    type: "timed",
    category: "health",
    icon: "😴",
    color: "#6366F1",
    description: "Maintain a healthy sleep schedule (480 minutes total).",
    config: {
      type: "timed",
      dailyGoalMinutes: 480,
    },
  },
];
