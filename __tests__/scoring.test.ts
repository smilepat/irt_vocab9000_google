import { describe, it, expect } from "vitest"
import { calculateAccuracy, calculateUserLevel, calculateTrajectory } from "../lib/scoring"
import passagesKo from "../data/passages-ko"
import passagesEn from "../data/passages-en"

describe("calculateAccuracy", () => {
  it("returns 100 when all answers are correct", () => {
    const passage = passagesKo[0] // BR level, 3 blanks
    const answers = passage.blanks.map((b) => b.word)
    expect(calculateAccuracy(passage, answers)).toBe(100)
  })

  it("returns 0 when all answers are wrong", () => {
    const passage = passagesKo[0]
    const answers = passage.blanks.map((b) => b.options[1]) // pick non-correct option
    // First blank correct word is "가족", options[1] is "친구"
    expect(calculateAccuracy(passage, answers)).toBe(0)
  })

  it("returns 0 for empty answers", () => {
    const passage = passagesKo[0]
    expect(calculateAccuracy(passage, [])).toBe(0)
  })

  it("calculates partial accuracy correctly", () => {
    const passage = passagesKo[1] // 100 level, 4 blanks
    const answers = [
      passage.blanks[0].word, // correct
      passage.blanks[1].word, // correct
      "wrong",               // incorrect
      "wrong",               // incorrect
    ]
    expect(calculateAccuracy(passage, answers)).toBe(50)
  })

  it("handles 70% threshold boundary", () => {
    // 5 blanks: 4 correct = 80%, 3 correct = 60%
    const passage = passagesKo[5] // 500 level, 5 blanks
    const allCorrect = passage.blanks.map((b) => b.word)

    // 4 out of 5 correct = 80%
    const fourCorrect = [...allCorrect]
    fourCorrect[4] = "wrong"
    expect(calculateAccuracy(passage, fourCorrect)).toBe(80)

    // 3 out of 5 correct = 60%
    const threeCorrect = [...allCorrect]
    threeCorrect[3] = "wrong"
    threeCorrect[4] = "wrong"
    expect(calculateAccuracy(passage, threeCorrect)).toBe(60)
  })
})

describe("calculateUserLevel", () => {
  it("returns BR when only BR level is answered correctly", () => {
    const answers: Record<string, string[]> = {
      BR: passagesKo[0].blanks.map((b) => b.word),
      "100": passagesKo[1].blanks.map(() => "wrong"),
    }
    expect(calculateUserLevel(passagesKo, answers)).toBe("BR")
  })

  it("returns the highest level with >= 70% accuracy", () => {
    const answers: Record<string, string[]> = {}
    // Make first 5 levels all correct (BR through 400)
    for (let i = 0; i <= 4; i++) {
      answers[passagesKo[i].level] = passagesKo[i].blanks.map((b) => b.word)
    }
    // Level 500: all wrong
    answers["500"] = passagesKo[5].blanks.map(() => "wrong")

    expect(calculateUserLevel(passagesKo, answers)).toBe("400")
  })

  it("returns BR when no answers provided", () => {
    expect(calculateUserLevel(passagesKo, {})).toBe("BR")
  })

  it("works with English passages", () => {
    const answers: Record<string, string[]> = {
      BR: passagesEn[0].blanks.map((b) => b.word),
      "100": passagesEn[1].blanks.map((b) => b.word),
      "200": passagesEn[2].blanks.map(() => "wrong"),
    }
    expect(calculateUserLevel(passagesEn, answers)).toBe("100")
  })
})

describe("calculateTrajectory", () => {
  it("returns null for grades before the student's current grade", () => {
    const trajectory = calculateTrajectory(450, 890, "중1")
    // 중1 is index 4, so indices 0-3 should be null
    expect(trajectory[0]).toBeNull()
    expect(trajectory[1]).toBeNull()
    expect(trajectory[2]).toBeNull()
    expect(trajectory[3]).toBeNull()
  })

  it("starts at the current level", () => {
    const trajectory = calculateTrajectory(450, 890, "중1")
    // Index 4 (중1) should be the starting point
    expect(trajectory[4]).toBe(450)
  })

  it("ends at the target level at grade 고3 (index 9)", () => {
    const trajectory = calculateTrajectory(450, 890, "중1")
    expect(trajectory[9]).toBe(890)
  })

  it("trajectory values are monotonically non-decreasing", () => {
    const trajectory = calculateTrajectory(450, 890, "중1")
    const nonNullValues = trajectory.filter((v): v is number => v !== null)
    for (let i = 1; i < nonNullValues.length; i++) {
      expect(nonNullValues[i]).toBeGreaterThanOrEqual(nonNullValues[i - 1])
    }
  })

  it("never goes below the current level", () => {
    const trajectory = calculateTrajectory(650, 1000, "중3")
    const nonNullValues = trajectory.filter((v): v is number => v !== null)
    for (const v of nonNullValues) {
      expect(v).toBeGreaterThanOrEqual(650)
    }
  })

  it("handles student already at 고3", () => {
    const trajectory = calculateTrajectory(800, 1200, "고3")
    // Only index 9 should be non-null
    for (let i = 0; i < 9; i++) {
      expect(trajectory[i]).toBeNull()
    }
    expect(trajectory[9]).toBe(800)
  })
})
