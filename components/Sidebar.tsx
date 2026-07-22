'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  {
    label: 'Home',
    href: '/home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    mode: 'home'
  },
  {
    label: 'The Interviewer',
    href: '/train',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
    mode: 'train'
  },
  {
    label: 'The Replica',
    href: '/clone',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>
      </svg>
    ),
    mode: 'clone'
  },
  {
    label: 'Jarvis Mode',
    href: '/jarvis',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    mode: 'jarvis'
  },
]

type ChatSession = { id: string, title: string, updatedAt: string }

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const [chats, setChats] = useState<ChatSession[]>([])
  const [loadingChats, setLoadingChats] = useState(false)

  // Determine active URL segment from pathname
  let activePathSegment = ''
  if (pathname.startsWith('/train')) activePathSegment = 'train'
  else if (pathname.startsWith('/clone')) activePathSegment = 'clone'
  else if (pathname.startsWith('/jarvis')) activePathSegment = 'jarvis'

  // Map URL segment to the DB mode value used when creating ChatSessions
  const pathToMode: Record<string, string> = {
    train: 'onboarding',
    clone: 'clone',
    jarvis: 'jarvis',
  }
  const activeMode = activePathSegment ? pathToMode[activePathSegment] : ''

  const activeChatId = activePathSegment ? pathname.replace(`/${activePathSegment}`, '').replace('/', '') : ''

  useEffect(() => {
    if (!activeMode) {
      setChats([])
      return
    }
    const fetchChats = async () => {
      setLoadingChats(true)
      try {
        const res = await fetch(`/api/chats?mode=${activeMode}`)
        const data = await res.json()
        if (data.chats) setChats(data.chats)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingChats(false)
      }
    }
    fetchChats()
  }, [activeMode, pathname]) // Re-fetch when pathname changes (like new chat created)

  return (
    <aside
      className={`hidden lg:flex shrink-0 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] text-[var(--color-sidebar-text)] flex-col z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-[64px]' : 'w-[260px]'}`}
    >
      {/* Logo + Collapse Toggle */}
      <div className="px-3 flex items-center justify-between border-b border-[var(--color-sidebar-border)] h-[60px] shrink-0">
        <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-black font-bold shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          <span className="font-bold tracking-tight whitespace-nowrap text-sm">Shadow Shelf</span>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--color-sidebar-muted)] hover:text-white hover:bg-[var(--color-sidebar-hover)] transition-all duration-200 shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : 'rotate-0'}`}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Nav Items */}
        <div className="p-2 flex flex-col gap-0.5 mt-2 shrink-0 border-b border-[var(--color-sidebar-border)] pb-4 mb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--color-sidebar-hover)] text-white'
                    : 'text-[var(--color-sidebar-muted)] hover:text-white hover:bg-[var(--color-sidebar-hover)]/60'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Recent Chats */}
        {!collapsed && activePathSegment && (
          <div className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-4 flex flex-col">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-[var(--color-sidebar-muted)] uppercase tracking-wider">
              <span>Recent Chats</span>
              <Link href={`/${activePathSegment}`} title="New Chat" className="p-1 hover:text-white rounded hover:bg-[var(--color-sidebar-hover)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </Link>
            </div>
            
            <div className="flex flex-col gap-0.5">
              {loadingChats && chats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--color-sidebar-muted)]">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--color-sidebar-muted)]">No recent chats</div>
              ) : (
                chats.map(chat => (
                  <Link
                    key={chat.id}
                    href={`/${activePathSegment}/${chat.id}`}
                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      activeChatId === chat.id ? 'bg-[var(--color-sidebar-hover)] text-white font-medium' : 'text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)]/60 hover:text-white'
                    }`}
                  >
                    <span className="truncate flex-1">{chat.title || 'New Chat'}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings at Bottom */}
      <div className="shrink-0 p-2 border-t border-[var(--color-sidebar-border)]">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            pathname?.startsWith('/settings')
              ? 'bg-[var(--color-sidebar-hover)] text-white'
              : 'text-[var(--color-sidebar-muted)] hover:text-white hover:bg-[var(--color-sidebar-hover)]/60'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Settings
          </span>
        </Link>
      </div>
    </aside>
  )
}
