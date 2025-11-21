import { useAuth } from '../contexts/AuthContext';
import { PromotoreDashboard } from '../components/PromotoreDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { LogOut, BookOpen } from 'lucide-react';

export function Dashboard() {
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Piattaforma Analisi Programmi
                </h1>
                <p className="text-sm text-slate-600">Zanichelli Editore</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                <p className="text-xs text-slate-600 capitalize">
                  {userRole?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'super_admin' || userRole === 'admin_materia' ? (
          <AdminDashboard />
        ) : (
          <PromotoreDashboard />
        )}
      </main>
    </div>
  );
}
