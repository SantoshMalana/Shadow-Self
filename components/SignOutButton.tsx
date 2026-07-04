import { logout } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button 
        type="submit" 
        className="px-3 py-1.5 rounded-full text-xs bg-accent-soft hover:bg-accent-soft/80 text-text-muted hover:text-text-primary border border-border transition-colors cursor-pointer font-medium"
      >
        Sign Out
      </button>
    </form>
  )
}
