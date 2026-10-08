export interface User {
  id: number;
  username: string;
  display_name: string;
  xp: number;
  weekly_xp: number;
  streak: number;
  hearts: number;
  max_hearts: number;
  next_heart_in: number;
  gems: number;
  daily_goal: number;
  xp_today: number;
  streak_done_today: boolean;
}

export interface SkillNode {
  id: number;
  title: string;
  icon: string;
  state: "completed" | "in_progress" | "available" | "locked";
  lessons_completed: number;
  total_lessons: number;
  next_lesson_id: number;
}

export interface UnitData {
  id: number;
  title: string;
  description: string;
  color: string;
  skills: SkillNode[];
}

export interface PathData {
  course: { language: string; flag: string };
  units: UnitData[];
}

export interface Vault {
  total: number;
  mastered: number;
}
export type ExerciseType = "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer";

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string;
  data: Record<string, unknown>;
}

export interface AnswerResult {
  correct: boolean;
  correct_answer: unknown;
  hearts: number;
}

export interface NewAchievement {
  code: string;
  title: string;
  icon: string;
}

export interface CompleteResult {
  xp_gained: number;
  streak_extended: boolean;
  skill_completed?: boolean;
  new_achievements: NewAchievement[];
  user: User;
}

/** Props shared by every exercise component */
export interface ExProps {
  exercise: Exercise;
  disabled: boolean;
  result: AnswerResult | null;
  onChange: (answer: unknown) => void; // null = nothing answered yet
}
export interface LeaderRow {
  rank: number;
  display_name: string;
  weekly_xp: number;
  is_me: boolean;
}

export interface AchievementInfo {
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface ProfileData {
  user: User;
  lessons_completed: number;
  achievements: AchievementInfo[];
  vault: Vault;
}

export interface VaultItem {
  id: number;
  type: ExerciseType;
  preview: string;
  prompt: string;
  box: number;
  times_wrong: number;
  mastered: boolean;
  due: boolean;
}