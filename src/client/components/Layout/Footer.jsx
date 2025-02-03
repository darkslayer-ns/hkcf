/**
 * Footer Component
 * Displays a simple footer with a dynamic copyright year.
 */
export default function Footer() {
  // Get the current year dynamically
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-12 shrink-0 bg-black border-t border-gray-800">
      {/* Centering content inside the footer */}
      <div className="h-full flex items-center justify-center">
        {/* Copyright Text with Dynamic Year */}
        <p className="text-sm text-gray-400">
          &copy; {currentYear} CrossFit Hell's Kitchen. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
