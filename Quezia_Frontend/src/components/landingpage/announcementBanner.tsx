import React from 'react';
import { Sparkle } from '@phosphor-icons/react';

const AnnouncementBanner: React.FC = () => {
    return (
        <div className="w-full bg-[#EC2801] text-white py-2.5 text-center z-40 relative mt-16">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-2">
                <Sparkle size={16} weight="fill" className="shrink-0" />
                <p className="text-sm font-medium">
                    Quezia is now in beta.{' '}
                    <a
                        href="#"
                        className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
                    >
                        Learn more about our journey and what's next →
                    </a>
                </p>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
