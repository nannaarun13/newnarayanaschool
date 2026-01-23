import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSchool } from '@/contexts/SchoolContext';
import { Button } from '@/components/ui/button';
import { Menu, GraduationCap } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const Navigation = () => {
  const { state } = useSchool();
  // Safe destructuring with fallback
  const navigationItems = state.data?.navigationItems || [];
  const schoolName = state.data?.name || "School Name";
  
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Filter visible items
  const visibleItems = navigationItems.filter(item => item.visible);

  // Helper to check if a link is active (handles sub-pages too)
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {visibleItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            isActive(item.path)
              ? 'bg-school-blue text-white shadow-sm'
              : 'text-school-blue hover:bg-school-blue-light hover:text-school-blue'
          } ${mobile ? 'block w-full text-lg py-3 border-b border-gray-100 last:border-0' : ''}`}
          onClick={() => mobile && setIsOpen(false)}
        >
          {item.name}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center space-x-2 py-4">
          <NavLinks />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between py-3">
          {/* Mobile Logo/Name on Left */}
          <Link to="/" className="flex items-center space-x-2 text-school-blue font-bold text-lg truncate max-w-[70%]">
            <GraduationCap className="h-6 w-6 flex-shrink-0" />
            <span className="truncate">{schoolName}</span>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-school-blue hover:bg-school-blue-light">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className="text-left border-b pb-4 mb-4">
                <SheetTitle className="text-school-blue flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-1">
                <NavLinks mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;