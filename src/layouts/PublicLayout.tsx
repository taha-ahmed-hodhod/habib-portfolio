import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { StarfieldBackground } from '@/components/ui/StarfieldBackground'

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#8B5CF6]/30 selection:text-white relative overflow-x-hidden max-w-full w-full">
      {/* Dynamic Starfield Background */}
      <StarfieldBackground
        className="fixed inset-0 pointer-events-none z-0"
        count={380}
        speed={0.4}
        starColor="#ffffff"
        twinkle={true}
        backgroundColor="#050505"
      />
      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden max-w-full w-full">
        <Navbar />
        <main className="flex-1 pt-16 sm:pt-20">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

