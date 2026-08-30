import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TooltipProvider } from '../components/ui/tooltip'
import { useEffect } from 'react'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      },
      {
        title: 'OpenCut - Editor de Vídeo',
      },
      {
        name: 'description',
        content: 'Editor de vídeo completo e open-source para Android e Web com linha do tempo multitrilha, efeitos e exportação.',
      },
      {
        name: 'theme-color',
        content: '#090d16',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'OpenCut',
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'icon',
        href: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        rel: 'apple-touch-icon',
        href: '/icon.svg',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, [])

  return (
    <html lang="pt-BR" className="dark bg-[#090d16] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 overflow-x-hidden font-sans touch-manipulation">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
