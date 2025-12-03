'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Settings, Folder, MessagesSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useState } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({ className, mode = 'desktop' }: SidebarProps) {
  const pathname = usePathname();
  const { activeProject } = useProjectStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Force expanded in mobile mode
  const collapsed = mode === 'mobile' ? false : isCollapsed;

  const menuItems = [
    { name: 'Projects', href: '/projects', icon: Folder },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'System Instructions', icon: MessagesSquare, href: '/prompts', color: 'text-violet-500' },
    { name: 'Settings', icon: Settings, href: '/settings', color: 'text-muted-foreground' },
  ];

  return (
    <div 
        className={cn(
            "pb-12 border-r min-h-screen bg-muted/40 flex flex-col transition-all duration-300", 
            mode === 'desktop' ? (collapsed ? "w-16" : "w-64") : "w-full",
            className
        )}
    >
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className={cn("flex items-center mb-6", collapsed ? "justify-center" : "justify-between px-2")}>
              {!collapsed && (
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    DocTalk
                  </h2>
              )}
              {mode === 'desktop' && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              )}
          </div>
          
          {!collapsed && activeProject && (
            <div className="px-4 mb-4">
                <div className="text-xs font-medium text-muted-foreground uppercase">Active Project</div>
                <div className="text-sm font-bold truncate">{activeProject.name}</div>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                      "w-full", 
                      collapsed ? "justify-center px-2" : "justify-start"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", collapsed ? "mr-0" : "mr-2")} />
                  {!collapsed && item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={cn("p-4 border-t border-border flex items-center", collapsed ? "justify-center" : "justify-start")}>
          <ModeToggle />
      </div>
    </div>
  );
}
