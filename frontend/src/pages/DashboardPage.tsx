import DashboardStats from '../components/DashboardStats';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header responsive */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container">
          <div className="py-4 sm:py-6">
            <h1 className="heading-responsive text-gray-900">
              Panel de Control
            </h1>
            <p className="text-responsive text-gray-600 mt-1 sm:mt-2">
              Bienvenido al panel administrativo
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container py-4 sm:py-6 lg:py-8">
        <div className="spacing-responsive">
          
          {/* Stats Section */}
          <section className="fade-in">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Estadísticas Generales
            </h2>
            <DashboardStats />
          </section>

          {/* Quick Actions Section */}
          <section className="fade-in">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Acciones Rápidas
            </h2>
            <div className="responsive-grid">
              <QuickActionCard
                title="Usuarios"
                description="Gestionar usuarios del sistema"
                href="/admin/users"
                icon="👥"
                count="245"
              />
              <QuickActionCard
                title="Documentos"
                description="Administrar documentos"
                href="/admin/documents"
                icon="📄"
                count="1,234"
              />
              <QuickActionCard
                title="Configuraciones"
                description="Ajustar configuraciones del bot"
                href="/admin/bot-settings"
                icon="⚙️"
                count="12"
              />
              <QuickActionCard
                title="Plantillas"
                description="Gestionar plantillas de bot"
                href="/admin/bot-templates"
                icon="📝"
                count="8"
              />
              <QuickActionCard
                title="API Routes"
                description="Configurar rutas de API"
                href="/admin/api-routes"
                icon="🔗"
                count="15"
              />
              <QuickActionCard
                title="Empresas"
                description="Administrar empresas"
                href="/admin/business"
                icon="🏢"
                count="32"
              />
            </div>
          </section>

          {/* Recent Activity Section */}
          <section className="fade-in">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Actividad Reciente
            </h2>
            <div className="responsive-card">
              <div className="space-y-4">
                <RecentActivityItem
                  type="user"
                  description="Nuevo usuario registrado: juan.perez@email.com"
                  time="Hace 2 minutos"
                />
                <RecentActivityItem
                  type="document"
                  description="Documento actualizado: Manual de usuario v2.1"
                  time="Hace 15 minutos"
                />
                <RecentActivityItem
                  type="config"
                  description="Configuración de bot modificada"
                  time="Hace 1 hora"
                />
                <RecentActivityItem
                  type="api"
                  description="Nueva ruta API creada: /api/v1/products"
                  time="Hace 2 horas"
                />
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="btn-responsive bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
                  Ver todas las actividades
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

// Componente QuickActionCard
interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  count: string;
}

const QuickActionCard = ({ title, description, href, icon, count }: QuickActionCardProps) => {
  return (
    <a href={href} className="responsive-card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
        <div className="text-lg sm:text-xl font-bold text-blue-600 ml-2">
          {count}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs sm:text-sm text-blue-600 font-medium group-hover:text-blue-700">
          <span>Ver detalles</span>
          <svg 
            className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
};

// Componente RecentActivityItem
interface RecentActivityItemProps {
  type: 'user' | 'document' | 'config' | 'api';
  description: string;
  time: string;
}

const RecentActivityItem = ({ type, description, time }: RecentActivityItemProps) => {
  const getIcon = () => {
    switch (type) {
      case 'user': return '👤';
      case 'document': return '📄';
      case 'config': return '⚙️';
      case 'api': return '🔗';
      default: return '📝';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'user': return 'bg-green-100 text-green-600';
      case 'document': return 'bg-blue-100 text-blue-600';
      case 'config': return 'bg-yellow-100 text-yellow-600';
      case 'api': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex items-start space-x-3 sm:space-x-4">
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm ${getColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base text-gray-900 line-clamp-2">
          {description}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {time}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;