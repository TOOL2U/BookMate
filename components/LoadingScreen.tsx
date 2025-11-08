import React from "react";
import Image from "next/image";

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Image
        src="/logo/bm-logo.svg"
        alt="BookMate"
        width={200}
        height={200}
        className="animate-fade-in"
        priority
      />
    </div>
  );
};

export default LoadingScreen;
