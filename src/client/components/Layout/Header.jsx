import Image from 'next/image';
import logoImage from '@/static/logo.jpg';

/**
 * Header Component
 * Displays the site's header with a logo and a gradient background.
 */
export default function Header() {
  return (
    <header className="h-20 shrink-0 flex items-center bg-white">
      {/* Logo Section */}
      <div className="flex items-center mr-4 px-3 border-2 border-transparent">
        <Image
          src={logoImage} // Logo image imported from static assets
          alt="CrossFit Hell's Kitchen Logo"
          width={250}  // Fixed width for consistency
          height={250} // Fixed height (Next.js automatically optimizes it)
        />
      </div>

      {/* Background Gradient Section */}
      <div className="flex-1 h-full bg-gradient-to-r from-white to-black/15"></div>
    </header>
  );
}
