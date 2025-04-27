import { Link, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, Cpu, MapPin } from 'lucide-react';

export default function WazeDemoNavMenu() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    {
      name: 'Demo Home',
      path: '/demo',
      icon: <Cpu className="mr-2 h-4 w-4" />
    },
    {
      name: 'Socket Demo',
      path: '/socket-demo',
      icon: <Navigation className="mr-2 h-4 w-4" />
    },
    {
      name: 'Waze Integration',
      path: '/waze-demo',
      icon: <MapPin className="mr-2 h-4 w-4" />
    }
  ];
  
  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path) 
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}