'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from './SignOutButton'

export default function UserMenu({
  name,
  email,
  showIdentity = true
}: { name?: string | null, email?: string | null, showIdentity?: boolean }) {
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
    }
  ]

  const displayName = name && !name.includes('Error') ? name : 'User'

  return (
    <div className="w-full flex flex-col gap-1">
      {showIdentity && (
        <div
          className="px-2 py-2 mb-2 flex items-center gap-3 min-w-0 rounded-[14px]"
        >
          <div
            className="w-9 h-9 rounded-full flex-shrink-0"
            style={{
              background: 'radial-gradient(circle at 32% 28%, #ffffff, #c084fc 35%, var(--color-accent) 78%)',
              boxShadow: '0 0 15px -3px rgba(131,40,249,0.4)'
            }}
          />
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[13px] font-semibold text-text-primary truncate">{displayName}</span>
            {email && <span className="text-[11px] text-text-faint truncate">{email}</span>}
          </div>
        </div>
      )}

      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[13px] font-medium px-3 py-2.5 rounded-[14px] transition-all duration-200 text-left flex items-center gap-3 active:scale-[0.98] ${
              isActive
                ? 'bg-surface text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface/60'
            }`}
          >
            <div className={isActive ? 'text-text-primary' : 'text-text-muted'}>
              {item.icon}
            </div>
            {item.label}
          </Link>
        )
      })}

      <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
        <SignOutButton />
      </div>
    </div>
  )
}
