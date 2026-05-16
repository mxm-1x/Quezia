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
    <footer className="w-full bg-white pt-24 pb-24 border-t border-[#EAEAEA]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold font-mono">Q</span>
              </div>
              <span className="text-lg font-bold tracking-tighter text-[#111111]">QUEZIA</span>
            </div>
            
            <p className="text-[#787774] text-sm leading-relaxed max-w-xs">
              Transforming test performance into focused insight. Built for the next generation of high-stakes preparation.
            </p>
            
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-[#787774] hover:text-[#111111] transition-colors duration-200">
                <TwitterLogo className="w-5 h-5" weight="bold" />
              </a>
              <a href="#" className="text-[#787774] hover:text-[#111111] transition-colors duration-200">
                <InstagramLogo className="w-5 h-5" weight="bold" />
              </a>
              <a href="#" className="text-[#787774] hover:text-[#111111] transition-colors duration-200">
                <LinkedinLogo className="w-5 h-5" weight="bold" />
              </a>
              <a href="#" className="text-[#787774] hover:text-[#111111] transition-colors duration-200">
                <GithubLogo className="w-5 h-5" weight="bold" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 lg:pl-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {footerData.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h3 className="font-bold text-[#111111] text-xs uppercase tracking-widest">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a 
                          href={link.href}
                          className="text-[#787774] hover:text-[#111111] text-sm transition-colors duration-200"
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
        <div className="border-t border-[#EAEAEA] pt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#787774]">
          <p>© 2025 Quezia AI Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#111111] transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#111111] transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#111111] transition-colors duration-200">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;