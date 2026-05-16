import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface SolutionCardProps {
    badge: string;
    badgeColor: string;
    heading: string;
    description: string;
    placeholderLabel: string;
    index: number;
}

const SolutionCard: React.FC<SolutionCardProps> = ({
    badge,
    badgeColor,
    heading,
    description,
    placeholderLabel,
    index,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FBFBFA] rounded-xl overflow-hidden border border-[#EAEAEA]"
    >
        <div className="grid md:grid-cols-2 gap-0">
            {/* Text content */}
            <div className="p-10 lg:p-12 flex flex-col justify-center bg-white">
                <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-6 w-fit border"
                    style={{ backgroundColor: `${badgeColor}20`, color: badgeColor, borderColor: `${badgeColor}40` }}
                >
                    {badge}
                </span>
                <h3 className="text-3xl font-bold text-[#111111] leading-tight mb-6 tracking-tight">
                    {heading}
                </h3>
                <p className="text-[#787774] leading-relaxed mb-8 text-lg">
                    {description}
                </p>
                <a
                    href="#"
                    className="inline-flex items-center gap-2 px-6 py-2 border border-[#EAEAEA] rounded-md
                     text-sm font-medium text-[#111111] hover:bg-[#F9F9F8]
                     transition-all duration-200 w-fit group active:scale-[0.98]"
                >
                    Learn more
                    <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </a>
            </div>

            {/* Image placeholder */}
            <div className="bg-[#FBFBFA] min-h-[320px] flex items-center justify-center border-t md:border-t-0 md:border-l border-[#EAEAEA]">
                <div className="text-center p-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center">
                        <div className="w-6 h-6 rounded bg-[#F7F6F3]" />
                    </div>
                    <p className="text-[#787774] text-sm font-medium">{placeholderLabel}</p>
                </div>
            </div>
        </div>
    </motion.div>
);

const Solutions: React.FC = () => {
    return (
        <section className="py-32 bg-white border-b border-[#EAEAEA]" id="solutions">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section header */}
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-20 max-w-2xl"
                >
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#EDF3EC] text-[#346538] mb-6 tracking-wide uppercase">
                        Product Ecosystem
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-bold text-[#111111] leading-[1.1] mb-8">
                        Structured preparation for both sides
                    </h2>
                    <p className="text-[#787774] text-lg leading-relaxed">
                        Empowering aspirants and institutions with AI-driven, structured practice solutions.
                    </p>
                </motion.div>

                {/* Solution cards */}
                <div className="space-y-12">
                    <SolutionCard
                        index={0}
                        badge="For Aspirants"
                        badgeColor="#1F6C9F"
                        heading="From structured practice to exam-day confidence"
                        description="AI-powered practice that isn't just another question bank. Get real exam simulations and build exam-specific instincts through pattern-aligned practice."
                        placeholderLabel="Aspirant Dashboard"
                    />
                    <SolutionCard
                        index={1}
                        badge="For Institutions"
                        badgeColor="#956400"
                        heading="Learning customized to your students' needs"
                        description="Whether your students need more challenge or more support, Quezia adapts to each learner. Track batch performance and deliver data-driven coaching."
                        placeholderLabel="Institution Dashboard"
                    />
                </div>
            </div>
        </section>
    );
};

export default Solutions;
