import React, { useState } from 'react';
import { motion } from 'framer-motion';

const featureItems = [
  'Exam Blueprints',
  'AI Question Generation',
  'Adaptive Difficulty',
  'Real-time Analytics',
  'Section Mastery Tracking',
  'Time Pressure Simulation',
  'Performance Predictions',
  'Detailed Answer Review',
];

const Features: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-white border-b border-[#EAEAEA]" id="features">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 max-w-2xl"
        >
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#E1F3FE] text-[#1F6C9F] mb-6 tracking-wide uppercase">
            Platform Capabilities
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#111111] leading-[1.1] mb-8">
            Serious tools for serious aspirants
          </h2>
          <p className="text-[#787774] text-lg leading-relaxed max-w-lg">
            Every feature in Quezia is designed to meet the rigorous demands of high-stakes competitive exams.
          </p>
        </motion.div>

        {/* Content: Feature list + Screenshot */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Feature list */}
          <motion.div 
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="divide-y divide-[#EAEAEA]"
          >
            {featureItems.map((item, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                className={`
                  w-full text-left py-6 px-2 transition-all duration-200
                  group flex items-center justify-between
                  ${activeIndex === i ? 'text-[#111111]' : 'text-[#787774] hover:text-[#111111]'}
                `}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm ${activeIndex === i ? 'text-[#111111]' : 'text-[#EAEAEA]'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xl font-medium tracking-tight">{item}</span>
                </div>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-[#111111] opacity-100' : 'bg-[#EAEAEA] opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </motion.div>

          {/* Right: Product screenshot placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:sticky lg:top-32"
          >
            <div className="bg-[#FBFBFA] rounded-xl border border-[#EAEAEA] overflow-hidden shadow-sm">
              {/* Screenshot header bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#EAEAEA] bg-white">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#EAEAEA]" />
              </div>

              {/* Screenshot body */}
              <div className="aspect-[4/3] flex items-center justify-center p-12 bg-white">
                <div className="w-full space-y-6">
                  <div className="h-10 w-2/3 bg-[#F7F6F3] rounded-md border border-[#EAEAEA]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-[#F7F6F3] rounded-md border border-[#EAEAEA]" />
                    <div className="h-24 bg-[#F7F6F3] rounded-md border border-[#EAEAEA]" />
                  </div>
                  <div className="h-32 bg-[#F7F6F3] rounded-md border border-[#EAEAEA]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
