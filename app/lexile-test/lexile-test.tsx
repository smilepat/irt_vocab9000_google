"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, CheckCircle, Home, Globe } from "lucide-react"
import Link from "next/link"
import passagesKo from "@/data/passages-ko"
import passagesEn from "@/data/passages-en"
import type { Passage } from "@/data/passages-ko"
import { calculateAccuracy, calculateUserLevel } from "@/lib/scoring"
import { saveTestResult } from "@/lib/storage"

type TestPhase = "testing" | "review" | "result"

export default function LexileTest() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [phase, setPhase] = useState<TestPhase>("testing")
  const [userLevel, setUserLevel] = useState("")
  const [progress, setProgress] = useState(0)
  const [language, setLanguage] = useState<"ko" | "en">("ko")
  const [showLanguageConfirm, setShowLanguageConfirm] = useState(false)

  const passages = language === "ko" ? passagesKo : passagesEn
  const currentPassage = passages[currentLevelIndex]

  useEffect(() => {
    if (!answers[currentPassage.level]) {
      setAnswers((prev) => ({
        ...prev,
        [currentPassage.level]: Array(currentPassage.blanks.length).fill(""),
      }))
    }
    setProgress(((currentLevelIndex + 1) / passages.length) * 100)
  }, [currentLevelIndex, currentPassage.level, currentPassage.blanks.length, answers, passages.length])

  const handleAnswerChange = (blankIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentPassage.level]: prev[currentPassage.level].map((ans, idx) =>
        idx === blankIndex ? value : ans,
      ),
    }))
  }

  const handleNext = () => {
    const currentAnswers = answers[currentPassage.level] || []
    const accuracy = calculateAccuracy(currentPassage, currentAnswers)

    // Below 70% accuracy: stop and show review
    if (accuracy < 70) {
      finishTest()
      return
    }

    // Advance to next level
    if (currentLevelIndex < passages.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1)
    } else {
      finishTest()
    }
  }

  const finishTest = () => {
    const level = calculateUserLevel(passages, answers)
    setUserLevel(level)
    setPhase("review")
  }

  const confirmLanguageSwitch = () => {
    const hasAnswers = Object.values(answers).some((a) => a.some((v) => v !== ""))
    if (hasAnswers) {
      setShowLanguageConfirm(true)
    } else {
      doLanguageSwitch()
    }
  }

  const doLanguageSwitch = () => {
    setLanguage((prev) => (prev === "ko" ? "en" : "ko"))
    setCurrentLevelIndex(0)
    setAnswers({})
    setPhase("testing")
    setShowLanguageConfirm(false)
  }

  const resetTest = () => {
    setCurrentLevelIndex(0)
    setPhase("testing")
    setAnswers({})
  }

  /** Render passage text with placeholder tokens replaced by dropdowns */
  const renderPassageWithBlanks = () => {
    const text = currentPassage.text
    // Split on {{0}}, {{1}}, etc. keeping the tokens as separators
    const parts = text.split(/(\{\{\d+\}\})/)

    return (
      <div className="space-y-6">
        <div className="p-4 bg-card rounded-lg border border-border">
          {parts.map((part, partIndex) => {
            const match = part.match(/^\{\{(\d+)\}\}$/)
            if (match) {
              const blankIndex = parseInt(match[1], 10)
              const blank = currentPassage.blanks[blankIndex]
              if (!blank) return null

              return (
                <span key={partIndex} className="inline-block mx-1">
                  <select
                    aria-label={`${language === "ko" ? "빈칸" : "Blank"} ${blankIndex + 1}`}
                    className="border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded text-sm"
                    value={answers[currentPassage.level]?.[blankIndex] || ""}
                    onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
                  >
                    <option value="">{language === "ko" ? "선택..." : "Select..."}</option>
                    {blank.options.map((option, optIndex) => (
                      <option key={optIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </span>
              )
            }

            return (
              <span key={partIndex}>
                {part}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  /** Review screen showing correct/incorrect answers for each completed level */
  const renderReviewPage = () => {
    const completedLevels = Object.entries(answers).filter(
      ([, levelAnswers]) => levelAnswers.some((a) => a !== ""),
    )

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ko" ? "답안 검토" : "Answer Review"}</CardTitle>
            <CardDescription>
              {language === "ko"
                ? "각 레벨의 정답과 오답을 확인하세요"
                : "Review your correct and incorrect answers for each level"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {completedLevels.map(([level, levelAnswers]) => {
              const passage = passages.find((p) => p.level === level)
              if (!passage) return null
              const accuracy = calculateAccuracy(passage, levelAnswers)

              return (
                <div key={level} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      {language === "ko" ? "레벨" : "Level"} {level} - {passage.title}
                    </h3>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        accuracy >= 70
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {passage.blanks.map((blank, idx) => {
                      const userAnswer = levelAnswers[idx]
                      const isCorrect = userAnswer === blank.word
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 text-sm p-2 rounded ${
                            isCorrect
                              ? "bg-green-50 dark:bg-green-950"
                              : "bg-red-50 dark:bg-red-950"
                          }`}
                        >
                          <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                            {isCorrect ? "O" : "X"}
                          </span>
                          <span>
                            {language === "ko" ? "정답" : "Answer"}: <strong>{blank.word}</strong>
                          </span>
                          {!isCorrect && (
                            <span className="text-muted-foreground">
                              ({language === "ko" ? "선택" : "Chosen"}: {userAnswer || "-"})
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => {
              saveTestResult({
                level: userLevel,
                language,
                date: new Date().toLocaleDateString(),
              })
              setPhase("result")
            }}>
              {language === "ko" ? "결과 보기" : "See Result"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const renderResultPage = () => {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-card rounded-lg border border-border text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {language === "ko" ? "테스트 완료!" : "Test Complete!"}
          </h2>
          <p className="text-lg mb-4">
            {language === "ko" ? (
              <>
                귀하의 Lexile 레벨은 <span className="font-bold text-blue-600">{userLevel}</span> 입니다.
              </>
            ) : (
              <>
                Your Lexile level is <span className="font-bold text-blue-600">{userLevel}</span>.
              </>
            )}
          </p>
          <div className="p-4 bg-secondary rounded-lg border border-border text-left mb-6">
            <h3 className="font-medium mb-2">
              {language === "ko" ? `Lexile 레벨 ${userLevel}의 의미:` : `What Lexile level ${userLevel} means:`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "ko"
                ? userLevel === "BR"
                  ? "BR(Beginning Reader) 레벨은 초기 독자 수준으로, 기본적인 단어와 문장을 이해할 수 있습니다. 간단한 그림책이나 초기 독자용 도서가 적합합니다."
                  : `Lexile ${userLevel} 레벨은 ${Number.parseInt(userLevel) < 500 ? "초급" : Number.parseInt(userLevel) < 900 ? "중급" : "고급"} 독자 수준입니다. 이 수준에서는 ${
                      Number.parseInt(userLevel) < 500
                        ? "간단한 문장과 기본 어휘를 이해할 수 있습니다."
                        : Number.parseInt(userLevel) < 900
                          ? "복잡한 문장 구조와 다양한 어휘를 이해할 수 있습니다."
                          : "추상적인 개념과 학술적인 내용을 이해할 수 있는 고급 수준입니다."
                    }`
                : userLevel === "BR"
                  ? "BR (Beginning Reader) level indicates an early reader who can understand basic words and sentences. Simple picture books or early reader books are appropriate."
                  : `Lexile ${userLevel} level indicates a ${Number.parseInt(userLevel) < 500 ? "beginner" : Number.parseInt(userLevel) < 900 ? "intermediate" : "advanced"} reader. At this level, you can understand ${
                      Number.parseInt(userLevel) < 500
                        ? "simple sentences and basic vocabulary."
                        : Number.parseInt(userLevel) < 900
                          ? "complex sentence structures and diverse vocabulary."
                          : "abstract concepts and academic content at an advanced level."
                    }`}
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {language === "ko" ? "홈으로 (차트에서 결과 확인)" : "Home (View on Chart)"}
              </Link>
            </Button>
            <Button variant="outline" onClick={resetTest}>
              {language === "ko" ? "테스트 다시 하기" : "Retake Test"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <Home className="h-4 w-4" />
                <span>{language === "ko" ? "홈으로" : "Home"}</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              Lexile {language === "ko" ? "레벨 테스트" : "Level Test"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 gap-1"
              onClick={confirmLanguageSwitch}
            >
              <Globe className="h-4 w-4" />
              <span>{language === "ko" ? "English Test" : "한국어 테스트"}</span>
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            {language === "ko"
              ? "빈칸 채우기 문제를 통해 귀하의 Lexile 독해 레벨을 측정합니다"
              : "Measure your Lexile reading level through cloze tests"}
          </p>
        </div>
      </header>

      {/* Language switch confirmation dialog */}
      {showLanguageConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold mb-2">
              {language === "ko" ? "언어를 변경하시겠습니까?" : "Switch language?"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ko"
                ? "언어를 변경하면 현재 진행 중인 테스트가 초기화됩니다."
                : "Switching language will reset your current test progress."}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLanguageConfirm(false)}>
                {language === "ko" ? "취소" : "Cancel"}
              </Button>
              <Button size="sm" onClick={doLanguageSwitch}>
                {language === "ko" ? "변경" : "Switch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto py-8">
        {phase === "testing" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {language === "ko" ? "레벨" : "Level"} {currentPassage.level} -{" "}
                    {currentPassage.title}
                  </CardTitle>
                  <CardDescription>
                    {language === "ko"
                      ? "아래 지문의 빈칸에 들어갈 가장 적절한 단어를 선택하세요"
                      : "Select the most appropriate word to fill in the blank in the passage below"}
                  </CardDescription>
                  <div className="mt-4 p-3 bg-secondary rounded-lg border border-border text-sm">
                    <h4 className="font-medium mb-1">
                      {language === "ko" ? "테스트 방법 안내" : "Test Method Guide"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {language === "ko"
                        ? "이 테스트는 다양한 Lexile 레벨(BR부터 1200L까지)의 지문을 제시하고, 각 지문에서 빈칸에 들어갈 적절한 단어를 선택하게 합니다. 각 레벨에서 70% 이상의 정답률을 보인 가장 높은 레벨이 귀하의 Lexile 레벨로 결정됩니다. 정답률이 70% 미만이면 테스트가 종료됩니다."
                        : "This test presents passages at various Lexile levels (from BR to 1200L) and asks you to select appropriate words for the blanks in each passage. Your Lexile level will be determined by the highest level at which you achieve at least 70% accuracy. The test stops when accuracy falls below 70%."}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentLevelIndex + 1} / {passages.length}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Progress value={progress} className="h-2" />
              </div>
              {renderPassageWithBlanks()}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={
                  !answers[currentPassage.level] ||
                  answers[currentPassage.level].some((a) => !a)
                }
              >
                {currentLevelIndex < passages.length - 1 ? (
                  <>
                    {language === "ko" ? "다음" : "Next"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  language === "ko" ? "결과 보기" : "See Result"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {phase === "review" && renderReviewPage()}
        {phase === "result" && renderResultPage()}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              {language === "ko" ? "Lexile 레벨이란?" : "What is a Lexile Level?"}
            </CardTitle>
            <CardDescription>
              {language === "ko"
                ? "Lexile 프레임워크는 독자의 읽기 능력과 텍스트의 난이도를 측정하는 과학적인 접근법입니다"
                : "The Lexile Framework is a scientific approach to measuring a reader's ability and text difficulty"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                {language === "ko"
                  ? "Lexile 측정은 BR(Beginning Reader)부터 1600L 이상까지 다양한 레벨로 구성되어 있습니다. 숫자가 높을수록 더 높은 읽기 능력이나 더 어려운 텍스트를 나타냅니다."
                  : "Lexile measures range from BR (Beginning Reader) to 1600L and above. Higher numbers indicate higher reading ability or more difficult texts."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <h3 className="font-medium mb-1">
                    {language === "ko" ? "초급 독자 (BR-500L)" : "Beginning Reader (BR-500L)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko"
                      ? "기본적인 어휘와 간단한 문장 구조를 이해할 수 있습니다. 그림책, 초기 독자용 도서에 적합합니다."
                      : "Can understand basic vocabulary and simple sentence structures. Suitable for picture books and early reader books."}
                  </p>
                </div>

                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <h3 className="font-medium mb-1">
                    {language === "ko" ? "중급 독자 (500L-900L)" : "Intermediate Reader (500L-900L)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko"
                      ? "더 복잡한 문장과 다양한 어휘를 이해할 수 있습니다. 청소년 소설, 일반 잡지 기사에 적합합니다."
                      : "Can understand more complex sentences and diverse vocabulary. Suitable for young adult novels and general magazine articles."}
                  </p>
                </div>

                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <h3 className="font-medium mb-1">
                    {language === "ko" ? "고급 독자 (900L-1200L)" : "Advanced Reader (900L-1200L)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko"
                      ? "복잡한 아이디어와 추상적인 개념을 이해할 수 있습니다. 고등학교 교과서, 대학 입시 자료에 적합합니다."
                      : "Can understand complex ideas and abstract concepts. Suitable for high school textbooks and college entrance materials."}
                  </p>
                </div>

                <div className="p-3 bg-secondary rounded-lg border border-border">
                  <h3 className="font-medium mb-1">
                    {language === "ko" ? "전문 독자 (1200L+)" : "Expert Reader (1200L+)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === "ko"
                      ? "학술적이고 전문적인 텍스트를 이해할 수 있습니다. 대학 교재, 학술 논문, 전문 서적에 적합합니다."
                      : "Can understand academic and professional texts. Suitable for college textbooks, academic papers, and specialized books."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-card border-t border-border py-6 mt-8">
        <div className="container mx-auto">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              &copy; 2025{" "}
              {language === "ko"
                ? "대한민국 영어교육 개선 시스템"
                : "Korean English Education Improvement System"}
              . All rights reserved.
            </p>
            <p className="mt-1">
              {language === "ko"
                ? '출처: MetaMetrics Inc., "The Lexile Framework for Reading", 2023'
                : 'Source: MetaMetrics Inc., "The Lexile Framework for Reading", 2023'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
