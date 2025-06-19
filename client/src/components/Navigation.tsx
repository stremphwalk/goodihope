import { Link, useLocation } from 'wouter';
import { FileText, Settings, Stethoscope, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function Navigation() {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navigationItems = [
    {
      path: '/',
      label: t('nav.medicalNotes'),
      icon: FileText,
      description: t('nav.medicalNotes.desc')
    },
    {
      path: '/dot-phrases',
      label: t('nav.dotPhrases'),
      icon: Settings,
      description: t('nav.dotPhrases.desc')
    },
    {
      path: '/calculations',
      label: t('nav.calculations'),
      icon: Calculator,
      description: t('nav.calculations.desc')
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            {/* AriNote Logo - Clipboard with dots and red cross */}
            <div className="arinote-logo" style={{ width: 256, height: 256, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <img src="/AriNote_Logo_Vector.svg" alt="AriNote logo" style={{ width: 256, height: 256, objectFit: 'contain', display: 'block' }} />
            </div>
            <span style={{ fontFamily: 'Inter, Manrope, Arial, sans-serif', fontWeight: 600, color: '#2D3748', fontSize: '1.5rem', letterSpacing: '-0.01em' }}>AriNote</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            >
              {language === 'en' ? 'Français' : 'English'}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}