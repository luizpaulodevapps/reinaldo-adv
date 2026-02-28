'use client'

import { Scale } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#818258] to-[#ffcc00] flex items-center justify-center">
        <Scale className="w-6 h-6 text-white" />
      </div>
    </div>
  )
}
