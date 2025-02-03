import Header from './Header';
import Footer from './Footer';

/**
 * Layout Component
 * Provides a consistent page structure with a header, main content, and footer.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - The main content of the page.
 */
export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Component - Fixed at the top */}
      <Header />

      {/* Main Content Section */}
      <main className="flex-1 px-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-7xl">
          {children} {/* Renders the page-specific content */}
        </div>
      </main>

      {/* Footer Component - Stays at the bottom */}
      <Footer className="mt-auto" />
    </div>
  );
}
