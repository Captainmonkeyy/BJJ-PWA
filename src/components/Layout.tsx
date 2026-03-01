import { Outlet } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, BookOpen, GitBranch } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/add', icon: Plus, label: '记录' },
  { path: '/review', icon: BookOpen, label: '复盘' },
  { path: '/tags', icon: GitBranch, label: '标签树' },
]

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-bjj-primary text-white px-4 py-3 shadow-lg">
        <h1 className="text-xl font-bold tracking-wide">BJJ 训练日志</h1>
        <p className="text-sm text-slate-300 mt-0.5">记录每一次进步</p>
      </header>

      <main className="flex-1 overflow-auto pb-20">
        {children ?? <Outlet />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
                  ? 'text-bjj-primary bg-slate-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
