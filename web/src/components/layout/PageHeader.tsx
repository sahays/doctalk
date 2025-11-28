import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-pink-500 via-pink-500 via-80% to-purple-500 pb-24 pt-12 text-white shadow-lg overflow-hidden">
      {/* Wavy Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="h-full w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <g fill="none" stroke="white" strokeWidth="1.5">
            <path d="M0,160 C320,300, 420,300, 740,160 C1060,20, 1120,20, 1440,160" opacity="0.6" />
            <path d="M0,190 C320,330, 420,330, 740,190 C1060,50, 1120,50, 1440,190" opacity="0.5" />
            <path d="M0,220 C320,360, 420,360, 740,220 C1060,80, 1120,80, 1440,220" opacity="0.4" />
            <path d="M0,130 C320,270, 420,270, 740,130 C1060,-10, 1120,-10, 1440,130" opacity="0.5" />
            <path d="M0,100 C320,240, 420,240, 740,100 C1060,-40, 1120,-40, 1440,100" opacity="0.4" />
          </g>
        </svg>
      </div>

      <div className="container relative mx-auto px-6 z-10">
        {breadcrumbs && (
          <div className="flex items-center gap-4 mb-4 text-pink-100">
            {breadcrumbs}
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
            {description && (
              <div className="mt-2 text-pink-100 opacity-90 font-medium">
                {description}
              </div>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </div>
  );
}
