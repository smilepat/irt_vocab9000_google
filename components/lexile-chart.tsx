"use client"

import { useState, useEffect } from "react"
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from "recharts"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import {
  gradeOptions,
  gradeToIndex,
  benchmarkData,
  getStudentColor,
  type Student,
} from "@/data/chart-data"
import { calculateTrajectory } from "@/lib/scoring"
import { loadStudents, saveStudents, loadTestResult, clearTestResult } from "@/lib/storage"

export default function LexileChart() {
  const [students, setStudents] = useState<Student[]>([
    { id: "student-1", name: "Student A", grade: "중1", currentLevel: 450, targetLevel: 890 },
    { id: "student-2", name: "Student B", grade: "중3", currentLevel: 650, targetLevel: 1000 },
  ])
  const [showStudents, setShowStudents] = useState<boolean>(true)
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true)

  // Load persisted students on mount & check for new test result
  useEffect(() => {
    const saved = loadStudents()
    if (saved && saved.length > 0) {
      setStudents(saved)
    }

    const testResult = loadTestResult()
    if (testResult) {
      const resultLevel = testResult.level === "BR" ? 50 : Number(testResult.level)
      setStudents((prev) => {
        const updated = [
          ...prev,
          {
            id: `student-${Date.now()}`,
            name: `Test Result (${testResult.date})`,
            grade: "중1",
            currentLevel: resultLevel,
            targetLevel: 1000,
          },
        ]
        saveStudents(updated)
        return updated
      })
      clearTestResult()
    }
  }, [])

  // Persist students on change
  useEffect(() => {
    saveStudents(students)
  }, [students])

  const handleStudentChange = (id: string, field: keyof Student, value: string | number) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              [field]:
                field === "currentLevel" || field === "targetLevel" ? Number(value) : value,
            }
          : student,
      ),
    )
  }

  const addStudent = () => {
    const newId = `student-${Date.now()}`
    setStudents((prev) => [
      ...prev,
      { id: newId, name: `Student ${prev.length + 1}`, grade: "중1", currentLevel: 400, targetLevel: 900 },
    ])
  }

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  // Merge benchmark data with student data points
  const enhancedData = benchmarkData.map((item, index) => {
    const enhancedItem: Record<string, string | number | null> = { ...item }

    students.forEach((student) => {
      const studentGradeIndex = gradeToIndex[student.grade]
      if (studentGradeIndex === index) {
        enhancedItem[student.id] = student.currentLevel
        enhancedItem[`${student.id}-target`] = student.targetLevel
      }
    })

    return enhancedItem
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-3 border border-border rounded-md shadow-md">
          <p className="font-bold">{label} 학년</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.includes("student-")) {
              const studentId = entry.dataKey.replace(/-target$/, "").replace(/-trajectory$/, "")
              const student = students.find((s) => s.id === studentId)

              if (student && !entry.dataKey.includes("-target") && !entry.dataKey.includes("-trajectory")) {
                return (
                  <p key={index} style={{ color: entry.color }}>
                    {student.name} 현재 레벨: {entry.value}
                  </p>
                )
              } else if (student && entry.dataKey.includes("-target")) {
                return (
                  <p key={index} style={{ color: entry.color }}>
                    {student.name} 목표 레벨: {entry.value}
                  </p>
                )
              } else if (student && entry.dataKey.includes("-trajectory")) {
                return (
                  <p key={index} style={{ color: entry.color }}>
                    {student.name} 예상 레벨: {Math.round(entry.value)}
                  </p>
                )
              }
            } else {
              return (
                <p key={index} style={{ color: entry.color }}>
                  {entry.name === "target" && "목표 궤적: "}
                  {entry.name === "top5" && "상위 5% 학생: "}
                  {entry.name === "average" && "평균 학생: "}
                  {entry.name === "bottom25" && "하위 25% 학생: "}
                  {entry.value}
                </p>
              )
            }
            return null
          })}
          {label === "중1" && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p>목표 궤적: (1095-410)/2 = 890</p>
              <p>상위 25% 학생: 550</p>
              <p>평균 학생: 410(교과서 수준)</p>
              <p>하위 25% 학생: 250</p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full p-4 bg-card text-card-foreground rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-1">Lexile 지수 기준</h2>
      <p className="text-center mb-1">수능 지문 1200L vs 교과서 1000L</p>
      <p className="text-center mb-4 text-sm text-muted-foreground">
        2023년 고3 43%가 1000L 미달 (출처: MetaMetrics, 2023)
      </p>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => {
            setShowStudents(!showStudents)
            setShowTrajectory(!showTrajectory)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showStudents ? "Hide" : "Show"} Students Levels on the Chart
        </button>
      </div>

      {/* Student data input table */}
      <div className="mb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>학생</TableHead>
              <TableHead>학년</TableHead>
              <TableHead>현재 Lexile 레벨</TableHead>
              <TableHead>수능 시점 목표 개인별 Lexile 레벨</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Input
                    type="text"
                    value={student.name}
                    onChange={(e) => handleStudentChange(student.id, "name", e.target.value)}
                    className="w-36"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={student.grade}
                    onValueChange={(value) => handleStudentChange(student.id, "grade", value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={student.currentLevel}
                    onChange={(e) => handleStudentChange(student.id, "currentLevel", e.target.value)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={student.targetLevel}
                    onChange={(e) => handleStudentChange(student.id, "targetLevel", e.target.value)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStudent(student.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={addStudent}>
            <Plus className="h-4 w-4 mr-1" />
            학생 추가
          </Button>
        </div>
      </div>

      <div className="h-[600px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={enhancedData}
            margin={{ top: 20, right: 20, left: 40, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="grade"
              label={{ value: "학년", position: "insideBottom", offset: -10 }}
              tick={{ fontSize: 12 }}
              tickMargin={5}
              axisLine={{ strokeWidth: 1.5 }}
              type="category"
              allowDuplicatedCategory={false}
            />
            <YAxis domain={[0, 1400]} label={{ value: "Lexile 지수", angle: -90, position: "insideLeft" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              payload={[
                { value: "목표 궤적", type: "line", color: "#8b5cf6" },
                { value: "상위 5% 학생", type: "line", color: "#10b981" },
                { value: "평균 학생", type: "line", color: "#f97316" },
                { value: "하위 25% 학생", type: "line", color: "#ec4899" },
                ...students.map((student, idx) => ({
                  value: `${student.name} 현재`,
                  type: "circle" as const,
                  color: getStudentColor(idx).current,
                })),
                ...students.map((student, idx) => ({
                  value: `${student.name} 목표`,
                  type: "diamond" as const,
                  color: getStudentColor(idx).target,
                })),
                ...students.map((student, idx) => ({
                  value: `${student.name} 예상 궤적`,
                  type: "line" as const,
                  color: getStudentColor(idx).trajectory,
                })),
              ]}
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 20 }}
            />
            {/* Benchmark lines */}
            <Line type="monotone" dataKey="target" name="target" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="top5" name="top5" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />
            <Line type="monotone" dataKey="average" name="average" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />
            <Line type="monotone" dataKey="bottom25" name="bottom25" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />

            {/* Student current level scatter points */}
            {showStudents &&
              students.map((student, idx) => (
                <Scatter
                  key={`${student.id}-current`}
                  name={student.id}
                  dataKey={student.id}
                  fill={getStudentColor(idx).current}
                  shape="circle"
                  legendType="circle"
                />
              ))}

            {/* Student target level scatter points */}
            {showStudents &&
              students.map((student, idx) => (
                <Scatter
                  key={`${student.id}-target`}
                  name={`${student.id}-target`}
                  dataKey={`${student.id}-target`}
                  fill={getStudentColor(idx).target}
                  shape="diamond"
                  legendType="diamond"
                />
              ))}

            {/* Student trajectory lines */}
            {showTrajectory &&
              students.map((student, idx) => {
                const trajectory = calculateTrajectory(
                  student.currentLevel,
                  student.targetLevel,
                  student.grade,
                )

                const trajectoryData = benchmarkData.map((point, index) => ({
                  ...point,
                  [`${student.id}-trajectory`]: trajectory[index],
                }))

                return (
                  <Line
                    key={`${student.id}-trajectory`}
                    type="monotone"
                    dataKey={`${student.id}-trajectory`}
                    data={trajectoryData}
                    stroke={getStudentColor(idx).trajectory}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    connectNulls={true}
                  />
                )
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>* 목표 궤적: 수능 지문 수준(1200L)에 도달하기 위한 이상적인 성장 경로</p>
        <p>* 상위 5% 학생: 각 학년에서 상위 5%에 해당하는 학생들의 평균 Lexile 지수</p>
        <p>* 평균 학생: 각 학년 학생들의 평균 Lexile 지수</p>
        <p>* 하위 25% 학생: 각 학년에서 하위 25%에 해당하는 학생들의 평균 Lexile 지수</p>
        <p className="mt-2">* 원형 마커: 학생의 현재 Lexile 레벨</p>
        <p>* 다이아몬드 마커: 학생의 목표 Lexile 레벨</p>
        <p>
          * 점선: 학생의 현재 레벨에서 목표 레벨까지의 맞춤형 예상 성장 궤적 (학생의 현재 성취도, 학년별 난이도, 비선형
          성장 패턴 반영)
        </p>
      </div>
    </div>
  )
}
