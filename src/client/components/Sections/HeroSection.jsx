import BoxHandler from "../BoxHandler"
import { useGlobal } from "@/app/contexts/GlobalContext";

export default function HeroSection() {
  const { title, subtitle } = useGlobal();
  
  return (
    <section className="relative flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-10 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-wide">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            {subtitle}
          </p>
          
          <div className="w-full max-w-xl mx-auto">
            <BoxHandler />
          </div>
        </div>
      </div>
    </section>
  );
}