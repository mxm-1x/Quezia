import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white overflow-hidden border-b border-[#EAEAEA]">
      <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative accent marks */}
          <div className="flex justify-center mb-8">
            <div className="px-3 py-1 bg-[#FBF3DB] rounded-full border border-[#956400]/10">
              <span className="text-[#956400] text-xs font-mono font-bold tracking-widest uppercase">Version 1.0 Alpha</span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#111111] leading-[1.1] tracking-tight mb-8">
            Practice Without Limits,
            <br />
            <span className="text-[#787774]">Until Mastery Becomes Inevitable</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#787774] max-w-xl mx-auto mb-12 leading-relaxed text-lg sm:text-xl">
            A structured exam preparation system with real patterns,
            instant analytics, and AI-powered practice.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?mode=register"
              className="group inline-flex items-center gap-2 px-8 py-3 bg-[#111111] text-white
                         font-medium rounded-md hover:bg-[#333333] transition-all duration-200
                         active:scale-[0.98]"
            >
              Start Practicing
              <ArrowRight
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/auth?mode=login"
              className="inline-flex items-center px-8 py-3 border border-[#EAEAEA]
                         text-[#111111] font-medium rounded-md hover:bg-[#F9F9F8]
                         transition-all duration-200 active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Product Image with Smoky Effect */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 pb-32"
      >
        <div className="relative group">
          {/* The Image */}
          <div className="relative rounded-xl border border-[#EAEAEA] overflow-hidden bg-white shadow-sm transition-all duration-500 group-hover:border-[#D1D1D1]">
            <img 
              src="/images/AI Image Upscale.png" 
              alt="Quezia Intelligence Dashboard" 
              className="w-full h-auto block"
            />
            
            {/* Smoky Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top fade */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white via-white/40 to-transparent" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/60 to-transparent" />
              {/* Left/Right soft vignettes */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent" />
              
              {/* Atmospheric "Smoke" blobs */}
              <div className="absolute top-1/4 -left-12 w-64 h-64 bg-white/40 blur-[80px] rounded-full" />
              <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-white/30 blur-[100px] rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/5 blur-[40px] pointer-events-none" />
            </div>
          </div>

          {/* Minimalist Browser Chrome Dots (Floating) */}
          <div className="absolute top-4 left-4 flex gap-1.5 z-10">
            <div className="w-2 h-2 rounded-full bg-[#EAEAEA]" />
            <div className="w-2 h-2 rounded-full bg-[#EAEAEA]" />
            <div className="w-2 h-2 rounded-full bg-[#EAEAEA]" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
