import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/react";
import { ApiBanner } from "@/components/ApiBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, type Notification } from "@/lib/api/loans";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const devSkipAuth = import.meta.env.VITE_DEV_SKIP_AUTH === "true";

export function DashboardLayout() {
  const { theme, setTheme } = useTheme();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    retry: 1,
  });

  const unreadCount = notifications.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notification bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground relative"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} new` : ""}`}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="text-xs font-semibold">
                    Recent Activity
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No recent activity
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <DropdownMenuItem key={n.id} asChild>
                        <Link
                          to={n.loanId ? `/loans/${n.loanId}` : "/loans"}
                          className="flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer"
                        >
                          <span className="text-xs font-medium">{n.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {devSkipAuth ? (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">M</AvatarFallback>
                </Avatar>
              ) : (
                <UserButton afterSignOutUrl="/" />
              )}
            </div>
          </header>
          <ApiBanner />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
