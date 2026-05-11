import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle radial gradient decoration */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse at center, #EC2801 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        {/* Decorative accent marks */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-1">
            <span className="text-[#EC2801] text-3xl font-bold">//</span>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          Practice Without Limits,
          <br />
          <span className="text-gray-900">Until Mastery Becomes Inevitable</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ fontSize: '18px' }}>
          A structured exam preparation system with real exam patterns,
          instant analytics, and AI-powered practice sessions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth?mode=register"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[#EC2801] text-white
                       font-semibold rounded-full hover:bg-[#d12300] transition-all duration-300
                       shadow-lg shadow-[#EC2801]/20 hover:shadow-xl hover:shadow-[#EC2801]/30"
          >
            Get Started
            <ArrowRight
              size={18}
              weight="bold"
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link
            to="/auth?mode=login"
            className="inline-flex items-center px-8 py-3.5 border-2 border-gray-200
                       text-gray-700 font-semibold rounded-full hover:border-gray-300
                       hover:bg-gray-50 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Product Screenshot Placeholder */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative">
          {/* Main screenshot placeholder */}
          <div className="bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-2xl shadow-black/5">
            <div className="aspect-[16/9] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Product Screenshot</p>
                <p className="text-gray-300 text-xs mt-1">Dashboard Preview</p>
              </div>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute -left-4 top-1/4 w-20 h-14 rounded-xl bg-[#EC2801]/5 border border-[#EC2801]/10 backdrop-blur-sm
                          hidden lg:flex items-center justify-center transform -rotate-6">
            <span className="text-[#EC2801]/40 text-xs font-bold">AI</span>
          </div>
          <div className="absolute -right-4 top-1/3 w-24 h-16 rounded-xl bg-gray-50 border border-gray-200 shadow-sm
                          hidden lg:flex items-center justify-center transform rotate-3">
            <div className="text-center">
              <p className="text-gray-400 text-[10px] font-medium">SCORE</p>
              <p className="text-gray-600 text-sm font-bold">84.2%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
