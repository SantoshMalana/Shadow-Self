import { logout } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={logout} className="w-full">
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-[14px] text-sm font-semibold bg-transparent border border-border text-text-muted hover:text-red-400 hover:border-red-900/50 hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        Sign out
      </button>
    </form>
  )
}
