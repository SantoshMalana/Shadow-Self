'use client'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { usePathname } from 'next/navigation'

export default function UserMenu({ name }: { name?: string | null }) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ]

  return (
    <div className="w-full mt-4 pt-4 border-t border-border flex flex-col gap-1">
      <div className="px-3 py-2 mb-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, #8328f9 78%)' }} />
        <div className="flex flex-col overflow-hidden">
          <span className="text-[11px] text-accent-light tracking-wider font-semibold uppercase">Account</span>
          <span className="text-sm font-semibold text-text-primary truncate">{name || 'User'}</span>
        </div>
      </div>

      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`text-[14px] font-medium px-3 py-2.5 rounded-lg transition-colors text-left flex items-center gap-3 ${
              isActive 
                ? 'bg-accent/10 text-accent-light border border-accent/20' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface/80 border border-transparent'
            }`}
          >
            <div className={`${isActive ? 'text-accent-light' : 'text-text-faint'}`}>
              {item.icon}
            </div>
            {item.label}
          </Link>
        )
      })}

      <form action={logout} className="w-full mt-2">
        <button type="submit" className="w-full text-[14px] font-medium text-text-muted hover:text-red-400 hover:bg-red-950/20 px-3 py-2.5 rounded-lg transition-colors text-left flex items-center gap-3 cursor-pointer border border-transparent hover:border-red-900/30">
          <div className="text-text-faint group-hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          Sign out
        </button>
      </form>
    </div>
  )
}
