import { useLocation, Link } from "react-router-dom";
import { Home, Building2, FileText, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Invoices", url: "/invoices", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={cn(
        "border-r-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <FileText className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-semibold text-sidebar-accent-foreground">
                InvoiceHub
              </h1>
              <p className="text-xs text-sidebar-foreground">
                Manage your invoices
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-11 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <SidebarTrigger className="h-10 w-full justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Menu className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </SidebarTrigger>
      </div>
    </Sidebar>
  );
}
