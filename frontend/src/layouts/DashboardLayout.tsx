import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, LogOut, Compass, Database } from 'lucide-react';

export default function DashboardLayout() {
    const location = useLocation();
    const navItems = [
        { icon: Home, label: 'Lead Matrix', path: '/' },
        { icon: Database, label: 'Campaign Ingestion', path: '/ingestion' },
        { icon: Users, label: 'Profiles', path: '/profiles' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 mb-4 bg-brand-50/30">
                        <Compass className="w-7 h-7 text-brand-600 mr-2" strokeWidth={2.5} />
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">TripNour<span className="text-brand-500">AI</span></h1>
                    </div>
                    <nav className="px-4 space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path || (location.pathname.startsWith('/profile') && item.path === '/');
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 
                    ${isActive ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors">
                        <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" />
                        Sign Out
                    </button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white flex flex-shrink-0 items-center justify-between px-8 z-10 shadow-sm border-b border-gray-200 relative">
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                        {location.pathname === '/' ? 'Sales Operations' : 'Intelligence Deep Dive'}
                    </h2>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">Agent: Sarah</span>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                            S
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-8 relative isolate">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
