import React from "react";
import Image from "next/image";

/**
 * Page Loading Screen - Shows within AdminShell
 * Displays centered logo with loading animation while page data loads
 * Sidebar remains visible
 */
const PageLoadingScreen: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Image
        src="/logo/bm-logo.svg"
        alt="Loading..."
        width={150}
        height={150}
        className="animate-logo-loading-glow"
        priority
      />
    </div>
  );
};

export default PageLoadingScreen;
