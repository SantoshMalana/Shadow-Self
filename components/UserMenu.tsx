'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default function UserMenu({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full mt-4 pt-4 border-t border-border" ref={menuRef}>
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="p-3 border-b border-border/50 bg-surface/30">
            <p className="text-[13px] font-semibold text-text-primary truncate">{name || 'Account Settings'}</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            <Link href="/profile" className="text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-surface/80 px-3 py-2.5 rounded-lg transition-colors text-left flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Profile
            </Link>
            <Link href="/settings" className="text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-surface/80 px-3 py-2.5 rounded-lg transition-colors text-left flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Settings
            </Link>
            <div className="h-px bg-border/50 my-1 mx-2" />
            <form action={logout} className="w-full">
              <button type="submit" className="w-full text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 px-3 py-2.5 rounded-lg transition-colors text-left flex items-center gap-3 cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface/80 transition-colors border cursor-pointer text-left group ${open ? 'bg-surface/80 border-border' : 'border-transparent'}`}
      >
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
        <span className="text-sm font-semibold text-text-primary flex-1 truncate">{name || 'Settings'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`text-text-faint transition-transform group-hover:text-text-primary ${open ? 'rotate-180 text-text-primary' : ''}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}
