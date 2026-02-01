import type { Passage } from "@/data/passages-ko"
import { benchmarkData, gradeToIndex } from "@/data/chart-data"

/**
 * Calculate the accuracy for a set of answers against a passage.
 * Returns a number between 0 and 100.
 */
export function calculateAccuracy(passage: Passage, answers: string[]): number {
  if (!answers || answers.length === 0) return 0
  const correctCount = answers.reduce((count, answer, index) => {
    return answer === passage.blanks[index]?.word ? count + 1 : count
  }, 0)
  return (correctCount / passage.blanks.length) * 100
}

/**
 * Determine the highest Lexile level where the user achieved >= 70% accuracy.
 */
export function calculateUserLevel(
  passages: Passage[],
  allAnswers: Record<string, string[]>,
): string {
  let highestCorrectLevel = "BR"
  let highestCorrectIndex = 0

  Object.entries(allAnswers).forEach(([level, levelAnswers]) => {
    const passageIndex = passages.findIndex((p) => p.level === level)
    if (passageIndex === -1) return

    const passage = passages[passageIndex]
    const accuracy = calculateAccuracy(passage, levelAnswers)

    if (accuracy >= 70 && passageIndex >= highestCorrectIndex) {
      highestCorrectLevel = level
      highestCorrectIndex = passageIndex
    }
  })

  return highestCorrectLevel
}

/**
 * Calculate a student's expected trajectory from their current grade to 고3.
 * Returns an array of expected levels aligned with benchmarkData indices.
 */
export function calculateTrajectory(
  currentLevel: number,
  targetLevel: number,
  grade: string,
): (number | null)[] {
  const startGradeIndex = gradeToIndex[grade] ?? 0
  const currentGradeAverage = benchmarkData[startGradeIndex].average
  const performanceRatio = currentLevel / currentGradeAverage

  return benchmarkData.map((_, index) => {
    if (index < startGradeIndex) return null

    const remainingGrades = 9 - startGradeIndex
    if (remainingGrades === 0) return currentLevel

    const currentProgress = index - startGradeIndex
    const progressRatio = currentProgress / remainingGrades
    const easedProgress = progressRatio * (2 - progressRatio)

    const totalGrowth = targetLevel - currentLevel
    const difficultyFactor = 1 - (index / 10) * 0.3
    const performanceAdjustment = performanceRatio > 1 ? 1.1 : 0.9

    let expectedLevel =
      currentLevel + totalGrowth * easedProgress * difficultyFactor * performanceAdjustment

    if (index === 9) {
      expectedLevel = targetLevel
    }

    return Math.max(expectedLevel, currentLevel)
  })
}
