
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Dr. Reinaldo Gonçalves Miguel de Jesus | Advocacia de Elite',
  description: 'Defesa jurídica com excelência, estratégia e discrição. Especialista em Direito do Trabalho e Soluções Estratégicas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;600;700&family=Sora:wght@400;600;700&family=Instrument+Serif:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
