"use client";

import {
  Bot,
  CreditCard,
  LayoutDashboard,
  Presentation,
  Settings,
  Sidebar as SidebarIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, useSidebar } from "~/components/ui/sidebar"; // Import the sidebar context
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";

const item = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "Q&A", url: "/qa", icon: Bot },
  { label: "Meetings", url: "/meetings", icon: Presentation },
  { label: "Billing", url: "/billing", icon: CreditCard },
  { label: "Settings", url: "/settings", icon: Settings },
];

export const AppSideBar = () => {
  const pathname = usePathname();

  return (
    <div className="relative">
      {/* Toggle Button */}

      <Sidebar>
        <SidebarHeader>Logo</SidebarHeader>

        <SidebarContent>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          "flex items-center gap-2 rounded-md p-2 hover:bg-gray-700",
                          pathname === item.url && "bg-primary !text-white",
                        )}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  );
};
