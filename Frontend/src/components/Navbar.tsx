import { Bell, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/report", label: "Report" },
    { href: "/alerts", label: "Alerts" },
    { href: "/authority", label: "Monitor" },
    { href: "/analytics", label: "Analytics" },
  ];

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">

        {/* ── BRAND ── */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-foreground">
              ResQNet
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              Emergency Response System
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button
                variant={
                  location.pathname === link.href ? "secondary" : "ghost"
                }
                size="sm"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>

          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex items-center justify-around border-t border-border px-2 py-1 md:hidden">
        {navLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            <Button
              variant={
                location.pathname === link.href ? "default" : "ghost"
              }
              size="sm"
              className="text-xs"
            >
              {link.label}
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;