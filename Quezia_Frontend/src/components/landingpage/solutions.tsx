import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';

interface SolutionCardProps {
    badge: string;
    badgeColor: string;
    heading: string;
    description: string;
    placeholderLabel: string;
}

const SolutionCard: React.FC<SolutionCardProps> = ({
    badge,
    badgeColor,
    heading,
    description,
    placeholderLabel,
}) => (
    <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
        <div className="grid md:grid-cols-2 gap-0">
            {/* Text content */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">
                <span
                    className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-5 w-fit"
                    style={{ backgroundColor: badgeColor }}
                >
                    {badge}
                </span>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4">
                    {heading}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                    {description}
                </p>
                <a
                    href="#"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-full
                     text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-white
                     transition-all duration-300 w-fit group"
                >
                    Learn more
                    <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </a>
            </div>

            {/* Image placeholder */}
            <div className="bg-gray-100 min-h-[260px] flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-200">
                <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-200 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{placeholderLabel}</p>
                </div>
            </div>
        </div>
    </div>
);

const Solutions: React.FC = () => {
    return (
        <section className="py-20 lg:py-28 bg-white" id="solutions">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                {/* Section header */}
                <div className="mb-14 max-w-2xl">
                    <span className="text-[#EC2801] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                        Solutions
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-gray-900 leading-tight mb-5">
                        Structured preparation for both sides of the exam
                    </h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        Empowering aspirants and institutions with AI-driven, structured practice solutions.
                        Proven to increase exam readiness, improve performance, and support focused preparation.
                    </p>
                </div>

                {/* Solution cards */}
                <div className="space-y-8">
                    <SolutionCard
                        badge="For Aspirants"
                        badgeColor="#EC2801"
                        heading="From structured practice to exam-day confidence"
                        description="AI-powered practice that isn't just another question bank. Get real exam simulations, track your improvement with deep analytics, and build exam-specific instincts through deliberate, pattern-aligned practice."
                        placeholderLabel="Aspirant Dashboard Preview"
                    />
                    <SolutionCard
                        badge="For Institutions"
                        badgeColor="#F59E0B"
                        heading="Learning customized to your students' needs"
                        description="Whether your students need more challenge or more support, Quezia adapts to each learner. Track batch performance, identify weak areas across cohorts, and deliver data-driven coaching at scale."
                        placeholderLabel="Institution Dashboard Preview"
                    />
                </div>
            </div>
        </section>
    );
};

export default Solutions;
