'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalProvider } from './contexts/GlobalContext';
import HomePage from '@/client/pages/Home';
import Layout from '@/client/components/Layout';
import './globals.css';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <GlobalProvider>
      {/* Wrapper to contain both video and content */}
      <div className="relative min-h-screen">
        {/* Video background container */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            disablePictureInPicture
            controls={false}
            className="absolute w-full h-full object-cover"
          >
            <source src="weights.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 pointer-events-none"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <Layout className="border-4 border-gray-300">
            <HomePage />
          </Layout>
        </div>
      </div>
    </GlobalProvider>
  );
}