import { logout } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button 
        type="submit" 
        className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300 border border-neutral-800 transition-colors font-medium"
      >
        Sign Out
      </button>
    </form>
  )
}
