"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Plug,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Integrations", href: "/integrations", icon: Plug },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 border-b border-zinc-800/50 p-4", collapsed && "justify-center")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30 shrink-0">
          <Zap className="h-5 w-5 text-violet-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white">
            Agent<span className="text-violet-400">Flow</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-zinc-800/50 p-3 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all cursor-pointer",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0 text-zinc-500" />
          {!collapsed && <span>Logout</span>}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full", collapsed ? "justify-center" : "justify-end")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
