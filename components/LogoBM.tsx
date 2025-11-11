import React from 'react';
import Image from 'next/image';

type LogoBMProps = {
  size?: number; // width/height in px
  className?: string; // extra Tailwind/utility classes
};

/**
 * BookMate "BM" Logo Component
 * 
 * Official brand monogram in yellow (#FFF02B).
 * Use this consistently across the app for brand identity.
 * 
 * @param size - Width/height in pixels (default: 40)
 * @param className - Additional Tailwind classes for positioning/styling
 */
const LogoBM: React.FC<LogoBMProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      className={`flex items-center justify-center mx-auto my-0 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src="/logo/bm-logo.svg"
        alt="BookMate"
        width={size}
        height={size}
        priority
        className="w-full h-full"
      />
    </div>
  );
};

export default LogoBM;
