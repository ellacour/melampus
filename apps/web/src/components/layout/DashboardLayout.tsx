import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/animals', label: 'Mes animaux', icon: '🐾' },
  { to: '/care', label: 'Soins', icon: '💊' },
  { to: '/vaccinations', label: 'Vaccinations', icon: '💉' },
  { to: '/notifications', label: 'Alertes', icon: '🔔' },
]

export function DashboardLayout() {
  const clearTokens = useAuthStore(s => s.clearTokens)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-emerald-700">Mélampus</h1>
          <p className="text-xs text-gray-500 mt-1">Santé animale connectée</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={clearTokens}
            className="w-full text-sm text-gray-500 hover:text-red-600 py-2"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
