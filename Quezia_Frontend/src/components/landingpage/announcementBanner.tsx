import React from 'react';
import { Sparkle } from '@phosphor-icons/react';

const AnnouncementBanner: React.FC = () => {
    return (
        <div className="w-full bg-[#FBF3DB] border-b border-[#956400]/10 text-[#956400] py-2 text-center z-40 relative">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
                <Sparkle size={14} weight="bold" className="shrink-0" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-widest">
                    Quezia is now in beta.{' '}
                    <a
                        href="#"
                        className="underline underline-offset-4 hover:text-[#111111] transition-colors"
                    >
                        Read the journey →
                    </a>
                </p>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
