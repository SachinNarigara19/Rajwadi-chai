import React from 'react';
import { MapPin, Phone, User, ExternalLink, Sparkles } from 'lucide-react';

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface FooterProps {
  compact?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ compact = false }) => {
  const instagramUrl =
    'https://www.instagram.com/jaymataji_rajwadichai01?stkn=MW9taWtvZmlid3RoaA==';

  return (
    <footer className="w-full bg-stone-950 text-stone-300 border-t border-amber-600/30 shadow-2xl relative z-10 mt-auto">
      {/* Subtle top golden accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Brand & Owner Information */}
          <div className="md:col-span-4 flex items-center space-x-3.5">
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 rounded-full bg-amber-500/30 blur-xs" />
              <img
                src="/logo.png"
                alt="Jay Mataji Rajwadi Chai"
                className="relative w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/70 shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 uppercase">
                  Jay Mataji Rajwadi Chai
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                  ESTD
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5 text-stone-200">
                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-xs font-bold tracking-wide">
                  <span className="text-stone-400 font-medium">Owner: </span>
                  <span className="text-amber-300 uppercase">PRINCE DUMARALIYA</span>
                </p>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5 text-stone-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href="tel:8401256000"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition"
                  title="Call Prince Dumraliya"
                >
                  Mo. 8401256000
                </a>
              </div>
            </div>
          </div>

          {/* Shop Address */}
          <div className="md:col-span-5 bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-stone-300">
                <span className="font-bold text-amber-400">Address: </span>
                <span>
                  Shop No. 24, Shiv Shopping Center, Sagvadi  , Virani circale to Water Tank Road, near by Rameshvar Mahadev Temple  bhavnagar.
                </span>
              </div>
            </div>
          </div>

          {/* Instagram Profile Action Button */}
          <div className="md:col-span-3 flex sm:justify-end items-center">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 hover:shadow-rose-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              title="Open Official Instagram Profile (@jaymataji_rajwadichai01)"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition">
                <InstagramIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left leading-tight">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black tracking-wide">Instagram</span>
                  <ExternalLink className="w-3 h-3 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <span className="text-[9px] text-white/90 font-mono tracking-tighter">
                  @jaymataji_rajwadichai01
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-4 pt-3 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} Jay Mataji Rajwadi Chai, Bhavnagar • All Rights Reserved</p>
          <div className="flex items-center space-x-3 text-stone-400">
            <span>Owner: PRINCE DUMARALIYA</span>
            <span>•</span>
            <a href="tel:8401256000" className="hover:text-amber-400 transition">
              Mo. 8401256000
            </a>
            <span>•</span>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center space-x-1"
            >
              <InstagramIcon className="w-3 h-3" />
              <span>@jaymataji_rajwadichai01</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
