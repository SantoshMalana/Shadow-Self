import { logout } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button 
        type="submit" 
        className="px-3 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-widest bg-bg hover:bg-surface text-text-muted hover:text-text-primary border border-[#2A2630] transition-colors cursor-pointer"
      >
        [Sign Out]
      </button>
    </form>
  )
}
