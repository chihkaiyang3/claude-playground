import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Food Logger',
    short_name: 'Food Logger',
    description: 'Photo-based calorie and macro tracker',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
