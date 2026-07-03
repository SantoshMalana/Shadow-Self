import { logout } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button 
        type="submit" 
        className="fixed bottom-4 right-4 z-50 bg-[#151515] hover:bg-[#222] text-[#888] hover:text-white border border-[#222] text-xs font-medium px-4 py-2 rounded-full transition-all"
      >
        Sign Out
      </button>
    </form>
  )
}
