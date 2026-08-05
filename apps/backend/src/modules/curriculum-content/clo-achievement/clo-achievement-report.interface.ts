export interface CloAchievementEntry {
  cloId: string;
  code: string;
  description: string;
  threshold: number;
  isAchieved: boolean;
}

export interface CourseCloAchievementReport {
  courseId: string;
  totalStudents: number;
  achievedStudents: number;
  achievementPercent: number;
  clos: CloAchievementEntry[];
}
