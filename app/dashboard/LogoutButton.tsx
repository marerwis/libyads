"use client"
import { signOut } from "next-auth/react"

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-6 py-2.5 bg-red-500/10 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-500 font-semibold rounded-xl transition-all shadow-sm"
        >
            Log Out
        </button>
    )
}
