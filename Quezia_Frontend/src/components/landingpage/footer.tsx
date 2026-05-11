import React from 'react';
import { TwitterLogo, InstagramLogo, LinkedinLogo, GithubLogo } from '@phosphor-icons/react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerData: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "Blog", href: "/blog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Partners", href: "/partners" },
    ],
  },
];

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#F5F5F5] pt-16 pb-0">
      {/* Main Card Container - The modular white box */}
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-900">Quezia</span>
              </div>
              
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Quezia transforms test performance into focused insight — helping learners understand gaps, track growth, and prepare smarter.
              </p>
              
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="text-gray-400 hover:text-[#EC2801] transition-colors duration-200">
                  <TwitterLogo className="w-5 h-5" weight="regular" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#EC2801] transition-colors duration-200">
                  <InstagramLogo className="w-5 h-5" weight="regular" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#EC2801] transition-colors duration-200">
                  <LinkedinLogo className="w-5 h-5" weight="regular" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#EC2801] transition-colors duration-200">
                  <GithubLogo className="w-5 h-5" weight="regular" />
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-8 lg:pl-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {footerData.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-sm tracking-wide">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a 
                            href={link.href}
                            className="text-gray-500 hover:text-[#EC2801] text-sm transition-colors duration-200"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2025 Quezia. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#EC2801] transition-colors duration-200 underline underline-offset-4 decoration-gray-300 hover:decoration-[#EC2801]">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#EC2801] transition-colors duration-200 underline underline-offset-4 decoration-gray-300 hover:decoration-[#EC2801]">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#EC2801] transition-colors duration-200 underline underline-offset-4 decoration-gray-300 hover:decoration-[#EC2801]">
                Cookies Settings
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark - Outside the card, shows top part, clips bottom */}
      <div className="relative w-full h-28 sm:h-32 lg:h-40 overflow-hidden select-none pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 whitespace-nowrap">
          <span 
            className="text-[10rem] sm:text-[14rem] lg:text-[25rem] font-bold tracking-tighter leading-none"
            style={{ 
              color: '#EC2801',
              opacity: '0.12',
            }}
          >
            Quezia
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;