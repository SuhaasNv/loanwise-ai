import {
  LayoutDashboard,
  FileText,
  Brain,
  Gift,
  BarChart3,
  Bot,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Loan Applications", url: "/loans", icon: FileText },
  { title: "AI Decisions", url: "/ai-decisions", icon: Brain },
  { title: "Recommendations", url: "/recommendations", icon: Gift },
];

const insightsNav = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Agent Activity", url: "/agents", icon: Bot },
];

const systemNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof mainNav) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className="hover:bg-sidebar-accent/50 transition-colors"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-foreground leading-none">Agentic</span>
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Loan Intelligence</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {renderGroup("Platform", mainNav)}
        {renderGroup("Insights", insightsNav)}
        {renderGroup("System", systemNav)}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-[10px] text-muted-foreground leading-tight">
              <span className="font-medium text-foreground">v2.4.1</span> · 4 agents active
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
