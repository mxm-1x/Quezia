import React from 'react';

const SocialProof: React.FC = () => {
    const logos = [
        'Partner 1',
        'Partner 2',
        'Partner 3',
        'Partner 4',
        'Partner 5',
        'Partner 6',
    ];

    return (
        <section className="py-16 lg:py-20 bg-white border-t border-gray-100">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
                {/* Headline */}
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
                    Trusted by{' '}
                    <span className="relative inline-block">
                        <span>10,000+</span>
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-[#EC2801]/30 rounded-full" />
                    </span>{' '}
                    aspirants and educators
                </h3>

                {/* Logo row */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 lg:gap-10 items-center justify-items-center">
                    {logos.map((name, i) => (
                        <div
                            key={i}
                            className="w-full max-w-[120px] h-12 rounded-lg bg-gray-50 border border-gray-100
                         flex items-center justify-center"
                        >
                            <span className="text-gray-300 text-xs font-medium">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
