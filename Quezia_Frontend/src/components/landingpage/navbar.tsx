import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-10 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`
            pointer-events-auto
            flex items-center justify-between
            w-full max-w-3xl h-14 px-6
            bg-white/80 backdrop-blur-md
            border border-[#EAEAEA] rounded-full
            shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
            transition-all duration-300
            ${isScrolled ? 'max-w-2xl h-12 px-5' : ''}
          `}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#111111] rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold font-mono">Q</span>
            </div>
            <span className={`font-bold tracking-tighter text-[#111111] transition-all ${isScrolled ? 'text-sm' : 'text-base'}`}>QUEZIA</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111] transition-colors">Features</a>
            <a href="#solutions" className="text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111] transition-colors">Solutions</a>
            <a href="#pricing" className="text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111] transition-colors">Pricing</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to="/auth?mode=login"
              className="hidden sm:inline-flex px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#787774] hover:text-[#111111] transition-colors"
            >
              Login
            </Link>
            <Link
              to="/auth?mode=register"
              className={`
                bg-[#111111] text-white text-xs font-bold uppercase tracking-widest rounded-full
                hover:bg-[#333333] transition-all duration-200 active:scale-[0.98]
                ${isScrolled ? 'px-4 py-1.5' : 'px-5 py-2'}
              `}
            >
              Join
            </Link>
            
            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1 text-[#111111]"
            >
              {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-40 bg-white/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-24 left-6 right-6 bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-6">
                <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-bold uppercase tracking-widest text-[#111111]">Features</a>
                <a href="#solutions" onClick={() => setMobileOpen(false)} className="text-sm font-bold uppercase tracking-widest text-[#111111]">Solutions</a>
                <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm font-bold uppercase tracking-widest text-[#111111]">Pricing</a>
                <hr className="border-[#EAEAEA]" />
                <div className="flex flex-col gap-3">
                  <Link to="/auth?mode=login" onClick={() => setMobileOpen(false)} className="text-center py-2 text-sm font-bold uppercase tracking-widest text-[#787774]">Login</Link>
                  <Link to="/auth?mode=register" onClick={() => setMobileOpen(false)} className="text-center py-3 bg-[#111111] text-white text-sm font-bold uppercase tracking-widest rounded-xl">Join Now</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
