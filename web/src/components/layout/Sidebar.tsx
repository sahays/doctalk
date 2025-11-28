'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Settings, LayoutDashboard, Folder, MessagesSquare } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { activeProject } = useProjectStore();

  const menuItems = [
    { name: 'Projects', href: '/projects', icon: Folder },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'System Instructions', icon: MessagesSquare, href: '/prompts', color: 'text-violet-500' },
    { name: 'Settings', icon: Settings, href: '/settings', color: 'text-gray-500' },
];

  return (
    <div className={cn("pb-12 w-64 border-r min-h-screen bg-slate-50/50", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-slate-900">
            DocTalk
          </h2>
          {activeProject && (
            <div className="px-4 mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase">Active Project</div>
                <div className="text-sm font-bold truncate">{activeProject.name}</div>
            </div>
          )}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
