"use client"

import { useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Scatter } from "recharts"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// 학년 옵션 매핑
const gradeOptions = [
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

// 학년 인덱스 매핑 (차트 데이터 배열에서의 위치)
const gradeToIndex = {
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

type Student = {
  id: string
  name: string
  grade: string
  currentLevel: number
  targetLevel: number
}

export default function LexileChart() {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([
    { id: "student-a", name: "Student A", grade: "중1", currentLevel: 450, targetLevel: 890 },
    { id: "student-b", name: "Student B", grade: "중3", currentLevel: 650, targetLevel: 1000 },
  ])
  const [showStudents, setShowStudents] = useState<boolean>(true)
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true)

  const [editingStudent, setEditingStudent] = useState<Student>({
    id: "",
    name: "",
    grade: "중1",
    currentLevel: 0,
    targetLevel: 0,
  })

  // 학생 데이터 수정 핸들러
  const handleStudentChange = (id: string, field: keyof Student, value: any) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? { ...student, [field]: field === "currentLevel" || field === "targetLevel" ? Number(value) : value }
          : student,
      ),
    )
  }

  // 차트 데이터 - 중복 제거를 위해 데이터 구조 최적화
  const data = [
    {
      grade: "초3",
      target: 400,
      top5: 300,
      average: 200,
      bottom25: 100,
    },
    {
      grade: "초4",
      target: 550,
      top5: 380,
      average: 270,
      bottom25: 150,
    },
    {
      grade: "초5",
      target: 700,
      top5: 450,
      average: 320,
      bottom25: 180,
    },
    {
      grade: "초6",
      target: 850,
      top5: 500,
      average: 360,
      bottom25: 220,
    },
    {
      grade: "중1",
      target: 890,
      top5: 550,
      average: 410,
      bottom25: 250,
    },
    {
      grade: "중2",
      target: 950,
      top5: 620,
      average: 480,
      bottom25: 300,
    },
    {
      grade: "중3",
      target: 1000,
      top5: 700,
      average: 550,
      bottom25: 350,
    },
    {
      grade: "고1",
      target: 1050,
      top5: 800,
      average: 650,
      bottom25: 400,
    },
    {
      grade: "고2",
      target: 1100,
      top5: 900,
      average: 750,
      bottom25: 450,
    },
    {
      grade: "고3",
      target: 1200,
      top5: 1000,
      average: 850,
      bottom25: 500,
    },
  ]

  // 차트 데이터와 학생 데이터 포인트 병합 - 중복 방지
  const enhancedData = data.map((item, index) => {
    const enhancedItem = { ...item }

    students.forEach((student) => {
      const studentGradeIndex = gradeToIndex[student.grade as keyof typeof gradeToIndex]
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
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-bold">{label} 학년</p>
          {payload.map((entry: any, index: number) => {
            // 학생 데이터인 경우 특별 처리
            if (entry.dataKey.includes("student-")) {
              const studentId = entry.dataKey.split("-target")[0].split("-trajectory")[0]
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
              // 기존 데이터 라인
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
          })}
          {label === "중1" && (
            <div className="mt-2 text-xs text-gray-600">
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
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-1">Lexile 지수 기준</h2>
      <p className="text-center mb-1">수능 지문 1200L vs 교과서 1000L</p>
      <p className="text-center mb-4 text-sm text-gray-600">2023년 고3 43%가 1000L 미달 (출처: MetaMetrics, 2023)</p>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => {
            setShowStudents(!showStudents)
            setShowTrajectory(!showTrajectory)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Show Students Levels on the Chart
        </button>
      </div>

      {/* 학생 데이터 입력 테이블 */}
      <div className="mb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>학생</TableHead>
              <TableHead>학년</TableHead>
              <TableHead>현재 Lexile 레벨</TableHead>
              <TableHead>수능 시점 목표 개인별 Lexile 레벨</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="h-[600px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={enhancedData}
            margin={{ top: 20, right: 20, left: 40, bottom: 60 }}
            onMouseMove={(e) => {
              if (e.activeTooltipIndex !== undefined) {
                setActiveTooltipIndex(e.activeTooltipIndex)
              }
            }}
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
                ...students.map((student) => ({
                  value: `${student.name} 현재`,
                  type: "circle",
                  color: student.id === "student-a" ? "#e11d48" : "#06b6d4",
                })),
                ...students.map((student) => ({
                  value: `${student.name} 목표`,
                  type: "diamond",
                  color: student.id === "student-a" ? "#ef4444" : "#0ea5e9",
                })),
                ...students.map((student) => ({
                  value: `${student.name} 예상 궤적`,
                  type: "line",
                  color: student.id === "student-a" ? "#e11d48" : "#06b6d4",
                })),
              ]}
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 20 }}
            />
            {/* 기본 데이터 라인 */}
            <Line
              type="monotone"
              dataKey="target"
              name="target"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="top5"
              name="top5"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="average"
              name="average"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="bottom25"
              name="bottom25"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
            />

            {/* 학생 데이터 포인트 */}
            {showStudents &&
              students.map((student, index) => (
                <Scatter
                  key={`${student.id}-current`}
                  name={student.id}
                  dataKey={student.id}
                  fill={student.id === "student-a" ? "#e11d48" : "#06b6d4"}
                  shape="circle"
                  legendType="circle"
                />
              ))}

            {/* 학생 목표 데이터 포인트 */}
            {showStudents &&
              students.map((student, index) => (
                <Scatter
                  key={`${student.id}-target`}
                  name={`${student.id}-target`}
                  dataKey={`${student.id}-target`}
                  fill={student.id === "student-a" ? "#ef4444" : "#0ea5e9"}
                  shape="diamond"
                  legendType="diamond"
                />
              ))}
            {/* 학생 궤적 라인 */}
            {showTrajectory &&
              students.map((student) => {
                const startGradeIndex = gradeToIndex[student.grade as keyof typeof gradeToIndex] || 0

                // 학생의 현재 레벨과 목표 레벨 가져오기
                const currentLevel = student.currentLevel
                const targetLevel = student.targetLevel

                // 현재 학년에서의 평균 레벨 가져오기
                const currentGradeAverage = data[startGradeIndex].average

                // 학생의 현재 성취도 계산 (평균 대비)
                const performanceRatio = currentLevel / currentGradeAverage

                // 맞춤형 궤적 데이터 생성
                const trajectoryData = data.map((point, index) => {
                  // 현재 학년 이전의 데이터는 null로 설정하여 라인이 표시되지 않도록 함
                  if (index < startGradeIndex) {
                    return {
                      ...point,
                      [`${student.id}-trajectory`]: null,
                    }
                  }

                  // 현재 학년부터 고3까지의 데이터 계산
                  // 남은 학년 수 계산
                  const remainingGrades = 9 - startGradeIndex
                  const currentProgress = index - startGradeIndex

                  // 비선형 성장 곡선 계산 (초기에는 빠르게, 나중에는 더 천천히 성장)
                  // easeOutQuad 함수 사용: t * (2-t)
                  const progressRatio = currentProgress / remainingGrades
                  const easedProgress = progressRatio * (2 - progressRatio)

                  // 목표까지의 거리
                  const totalGrowth = targetLevel - currentLevel

                  // 학년별 난이도 가중치 (고학년일수록 성장이 더 어려움)
                  const difficultyFactor = 1 - (index / 10) * 0.3 // 0.7 ~ 1.0 범위

                  // 학생의 성취도에 따른 조정 (평균 이상인 경우 더 빠른 성장)
                  const performanceAdjustment = performanceRatio > 1 ? 1.1 : 0.9

                  // 최종 예상 레벨 계산
                  let expectedLevel =
                    currentLevel + totalGrowth * easedProgress * difficultyFactor * performanceAdjustment

                  // 고3에 도달하면 목표 레벨에 도달하도록 조정
                  if (index === 9) {
                    // 고3 인덱스
                    expectedLevel = targetLevel
                  }

                  // 최소값 보장
                  expectedLevel = Math.max(expectedLevel, currentLevel)

                  return {
                    ...point,
                    [`${student.id}-trajectory`]: expectedLevel,
                  }
                })

                return (
                  <Line
                    key={`${student.id}-trajectory`}
                    type="monotone"
                    dataKey={`${student.id}-trajectory`}
                    data={trajectoryData}
                    stroke={student.id === "student-a" ? "#e11d48" : "#06b6d4"}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    connectNulls={true}
                  />
                )
              })}

            {/* 학생 값 라벨 - 직접 SVG 텍스트 렌더링 대신 Recharts 컴포넌트 사용 */}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-600">
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
