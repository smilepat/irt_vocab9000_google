export const gradeOptions = [
  { value: "초3", label: "초3" },
  { value: "초4", label: "초4" },
  { value: "초5", label: "초5" },
  { value: "초6", label: "초6" },
  { value: "중1", label: "중1" },
  { value: "중2", label: "중2" },
  { value: "중3", label: "중3" },
  { value: "고1", label: "고1" },
  { value: "고2", label: "고2" },
  { value: "고3", label: "고3" },
]

export const gradeToIndex: Record<string, number> = {
  초3: 0,
  초4: 1,
  초5: 2,
  초6: 3,
  중1: 4,
  중2: 5,
  중3: 6,
  고1: 7,
  고2: 8,
  고3: 9,
}

export type BenchmarkDataPoint = {
  grade: string
  target: number
  top5: number
  average: number
  bottom25: number
  [key: string]: string | number | null
}

export const benchmarkData: BenchmarkDataPoint[] = [
  { grade: "초3", target: 400, top5: 300, average: 200, bottom25: 100 },
  { grade: "초4", target: 550, top5: 380, average: 270, bottom25: 150 },
  { grade: "초5", target: 700, top5: 450, average: 320, bottom25: 180 },
  { grade: "초6", target: 850, top5: 500, average: 360, bottom25: 220 },
  { grade: "중1", target: 890, top5: 550, average: 410, bottom25: 250 },
  { grade: "중2", target: 950, top5: 620, average: 480, bottom25: 300 },
  { grade: "중3", target: 1000, top5: 700, average: 550, bottom25: 350 },
  { grade: "고1", target: 1050, top5: 800, average: 650, bottom25: 400 },
  { grade: "고2", target: 1100, top5: 900, average: 750, bottom25: 450 },
  { grade: "고3", target: 1200, top5: 1000, average: 850, bottom25: 500 },
]

export type Student = {
  id: string
  name: string
  grade: string
  currentLevel: number
  targetLevel: number
}

/** Color palette that scales to any number of students */
export const studentColors = [
  { current: "#e11d48", target: "#ef4444", trajectory: "#e11d48" },
  { current: "#06b6d4", target: "#0ea5e9", trajectory: "#06b6d4" },
  { current: "#8b5cf6", target: "#a78bfa", trajectory: "#8b5cf6" },
  { current: "#f59e0b", target: "#fbbf24", trajectory: "#f59e0b" },
  { current: "#10b981", target: "#34d399", trajectory: "#10b981" },
  { current: "#ec4899", target: "#f472b6", trajectory: "#ec4899" },
]

export function getStudentColor(index: number) {
  return studentColors[index % studentColors.length]
}
