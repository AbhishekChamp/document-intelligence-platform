import React, { memo, useState, useCallback } from "react";
import { cn } from "../../shared/utils/cn";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutComponent: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggle} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header sidebarCollapsed={sidebarCollapsed} />
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 overflow-auto",
            sidebarCollapsed ? "ml-20" : "ml-72",
          )}
        >
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export const AppLayout = memo(AppLayoutComponent);
