import React from 'react';
import { motion } from 'framer-motion';

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
        <section className="py-24 bg-white border-b border-[#EAEAEA]">
            <motion.div 
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-5xl mx-auto px-6 text-center"
            >
                {/* Headline */}
                <h3 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-16 tracking-tight">
                    Trusted by{' '}
                    <span className="relative inline-block">
                        <span>10,000+</span>
                        <span className="absolute bottom-1 left-0 w-full h-1 bg-[#FBF3DB] -z-10" />
                    </span>{' '}
                    aspirants and educators
                </h3>

                {/* Logo row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {logos.map((name, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className="w-full h-14 rounded-lg bg-[#FBFBFA] border border-[#EAEAEA]
                         flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                        >
                            <span className="text-[#EAEAEA] text-[10px] font-mono font-bold uppercase tracking-widest">{name}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};

export default SocialProof;
