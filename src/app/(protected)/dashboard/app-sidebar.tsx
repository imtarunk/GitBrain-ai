"use client";
import logo from "../../../../public/gitbrainLogo.png";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  Plus,
  Presentation,
  Settings,
  Sidebar as SidebarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
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
import useProject from "~/hooks/use-project";
import { cn } from "~/lib/utils";

const item = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "Q&A", url: "/qa", icon: Bot },
  { label: "Meetings", url: "/meeting", icon: Presentation },
  { label: "Billing", url: "/billing", icon: CreditCard },
  { label: "Settings", url: "/settings", icon: Settings },
];

export const AppSideBar = () => {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { projects, projectId, setProjectId } = useProject();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Image src={logo} alt="logo" width={40} height={40} />
          {open && (
            <h1 className="text-primary/80 text-3xl font-bold">GitBrain</h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>

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

        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects?.map((project) => {
                return (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild>
                      <div onClick={() => setProjectId(project.id)}>
                        <div
                          className={cn(
                            "text-primary flex size-6 items-center justify-center rounded-sm border bg-white text-sm",
                            {
                              "bg-primary text-white": project.id === projectId,
                            },
                          )}
                        >
                          {project.projectName[0]}
                        </div>
                        <span>{project.projectName}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <div className="h-2">
                <SidebarMenuItem>
                  <Link href={"/create"}>
                    <Button size="sm" className="w-full" variant={"outline"}>
                      <Plus />
                      Create Project
                    </Button>
                  </Link>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const Logo = () => {
  return (
    <div className="relative flex w-auto justify-center gap-2 bg-white">
      {/* Main Text */}
      <h1 className="text-pri text-4xl font-bold">GITBRAN</h1>
    </div>
  );
};
