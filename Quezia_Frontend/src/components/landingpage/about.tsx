import React from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <section className="py-32 bg-[#FBFBFA] border-b border-[#EAEAEA]" id="about">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#FDEBEC] text-[#9F2F2D] mb-6 tracking-wide uppercase">
              Mission Statement
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#111111] mb-8 leading-[1.1] tracking-tight">
              Designed for serious preparation
            </h2>
            <p className="text-lg text-[#787774] leading-relaxed">
              Quezia is a structured exam preparation system built for aspirants who care about depth, clarity, and measurable progress. It is designed around how competitive exams are actually constructed — not shortcuts, distractions, or surface-level practice. Every component is intentional, guiding learners from foundational concepts to applied mastery.
            </p>
          </motion.div>

          {/* Right: Visual placeholder */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="bg-white rounded-xl border border-[#EAEAEA] shadow-sm overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center p-12 bg-white">
                {/* Mock workflow visualization */}
                <div className="w-full max-w-xs space-y-8 relative">
                  {[
                    { label: 'Intelligence', color: 'bg-[#111111]' },
                    { label: 'Synthesis', color: 'bg-[#787774]' },
                    { label: 'Evaluation', color: 'bg-[#EAEAEA]' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-lg ${step.color} border border-[#EAEAEA] flex items-center justify-center shrink-0`}>
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111111] uppercase tracking-widest">{step.label}</p>
                        <div className="h-1 w-24 bg-[#F7F6F3] rounded-full mt-2" />
                      </div>
                    </div>
                  ))}
                  {/* Connector line */}
                  <div className="absolute left-[23px] top-6 bottom-6 w-[1px] bg-[#EAEAEA] -z-0" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
