import type { Student } from "@/data/chart-data"

const STUDENTS_KEY = "lexile-students"
const TEST_RESULT_KEY = "lexile-test-result"

export type TestResult = {
  level: string
  language: "ko" | "en"
  date: string
}

export function loadStudents(): Student[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STUDENTS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Student[]
  } catch {
    return null
  }
}

export function saveStudents(students: Student[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
}

export function loadTestResult(): TestResult | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(TEST_RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TestResult
  } catch {
    return null
  }
}

export function saveTestResult(result: TestResult) {
  if (typeof window === "undefined") return
  localStorage.setItem(TEST_RESULT_KEY, JSON.stringify(result))
}

export function clearTestResult() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TEST_RESULT_KEY)
}
