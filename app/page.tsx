"use client"

import LexileChart from "../lexile-chart"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="flex justify-end mb-4">
        <Link href="/lexile-test">
          <Button className="bg-green-600 hover:bg-green-700 text-white">렉사일 테스트</Button>
        </Link>
      </div>
      <LexileChart />
    </main>
  )
}
