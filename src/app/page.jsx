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
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <video autoPlay loop muted className="w-full h-full object-cover">
          <source src="weights.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      <Layout className="border-4 border-gray-300">
        <HomePage />
      </Layout>
    </GlobalProvider>
  );
}