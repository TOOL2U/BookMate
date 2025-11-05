import localFont from 'next/font/local';

// Made Mirage - Display font for h1, hero text
export const madeMirage = localFont({
  src: [
    {
      path: './made_mirage/MADE Mirage Regular PERSONAL USE.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './made_mirage/MADE Mirage Bold PERSONAL USE.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-made-mirage',
  display: 'swap',
});

// Bebas Neue - Headers and section titles
export const bebasNeue = localFont({
  src: './Bebas_Neue/BebasNeue-Regular.ttf',
  variable: '--font-bebas-neue',
  weight: '400',
  display: 'swap',
});

// Aileron - Body text and UI
export const aileron = localFont({
  src: [
    {
      path: './aileron/Aileron-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './aileron/Aileron-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: './aileron/Aileron-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-aileron',
  display: 'swap',
});
