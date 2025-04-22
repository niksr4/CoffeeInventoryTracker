import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();

  // Don't show header on login page
  if (location === "/auth") {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <img 
            src="/coffee-bean.svg" 
            alt="Coffee Bean" 
            className="h-8 w-8"
            onError={(e) => {
              // Fallback if the image doesn't exist
              e.currentTarget.style.display = 'none';
            }} 
          />
          <span className="text-xl font-semibold text-[#4F772D]">Coffee Inventory</span>
        </div>

        <nav className="hidden md:flex space-x-6">
          <Link href="/">
            <span className={`text-sm font-medium cursor-pointer ${location === "/" ? "text-[#4F772D]" : "text-slate-600 hover:text-[#4F772D]"}`}>
              Dashboard
            </span>
          </Link>
          
          {/* Only show transactions link to admin users */}
          {isAdmin && (
            <Link href="/transactions">
              <span className={`text-sm font-medium cursor-pointer ${location === "/transactions" ? "text-[#4F772D]" : "text-slate-600 hover:text-[#4F772D]"}`}>
                Transactions
              </span>
            </Link>
          )}
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-medium text-slate-500">
                Signed in as <span className="font-bold text-slate-700 ml-1">{user.username}</span>
                <span className="ml-2 bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 text-[10px]">
                  {user.role}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/auth">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}