import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, X, CaretDown } from '@phosphor-icons/react';

const navLinks = ['Features', 'Pricing', 'Contact Us'];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 w-full z-50 bg-white
        `}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/home"
            className="text-2xl font-bold text-gray-900"
          >
            Quezia
          </Link>

          {/* Desktop Right Side (Links & CTAs) */}
          <div className="hidden md:flex items-center gap-8">
            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors h-16">
                  Exams <CaretDown size={14} weight="bold" className="transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-[calc(100%-16px)] left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col">
                    {['JEE', 'NEET', 'UPSC', 'SSC'].map((exam) => (
                      <Link key={exam} to={`/exams/${exam.toLowerCase()}`} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        {exam}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {navLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                to="/auth?mode=register"
                className="px-5 py-2 rounded-full text-sm font-medium bg-[#EC2801] text-white hover:bg-[#d12300] transition-colors duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-800"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden transition-all duration-300
          ${mobileOpen ? 'visible' : 'invisible'}
        `}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300
            ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 w-[280px] h-full bg-white shadow-2xl
            transform transition-transform duration-300 pt-20 px-6
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col gap-2">
            <div className="py-2 px-4">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Exams</div>
              <div className="flex flex-col gap-2 border-l-2 border-gray-100 pl-4 ml-2">
                {['JEE', 'NEET', 'UPSC', 'SSC'].map((exam) => (
                  <Link
                    key={exam}
                    to={`/exams/${exam.toLowerCase()}`}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    {exam}
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
            <Link
              to="/auth?mode=register"
              onClick={() => setMobileOpen(false)}
              className="py-3 px-4 bg-[#EC2801] text-white font-semibold rounded-full text-center
                         hover:bg-[#d12300] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;