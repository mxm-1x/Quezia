import React, { useState } from 'react';

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-28 bg-[#0a0a0a] text-white" id="features">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <span className="text-[#EC2801] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Built from the ground up for serious preparation
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Every feature in Quezia, from adaptive difficulty to deep analytics,
            is designed to help aspirants meet each exam's unique demands
            and pace of learning.
          </p>
        </div>

        {/* Content: Feature list + Screenshot */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Feature list */}
          <div className="space-y-1">
            {featureItems.map((item, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`
                  w-full text-left py-4 px-2 border-b border-white/[0.06] transition-all duration-300
                  group flex items-center gap-3
                  ${activeIndex === i ? 'text-white' : 'text-white/50 hover:text-white/80'}
                `}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300
                    ${activeIndex === i ? 'bg-[#EC2801] scale-125' : 'bg-white/20'}`}
                />
                <span className="text-lg font-medium">{item}</span>
              </button>
            ))}
          </div>

          {/* Right: Product screenshot placeholder */}
          <div className="relative">
            <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] overflow-hidden">
              {/* Screenshot header bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="ml-4 h-5 w-40 bg-white/[0.04] rounded" />
              </div>

              {/* Screenshot body */}
              <div className="aspect-[4/3] flex items-center justify-center p-8">
                {/* Mock UI elements */}
                <div className="w-full max-w-sm space-y-4">
                  {/* Mock input */}
                  <div className="bg-white/[0.06] rounded-xl px-4 py-3 border border-white/[0.08]">
                    <p className="text-white/20 text-sm">Create a practice test on thermodynamics...</p>
                  </div>

                  {/* Mock action bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-24 bg-white/[0.04] rounded border border-white/[0.06]" />
                    <div className="flex gap-2 ml-auto">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="w-7 h-7 rounded bg-white/[0.04] border border-white/[0.06]" />
                      ))}
                    </div>
                    <div className="px-4 py-1.5 bg-[#EC2801] rounded-lg">
                      <span className="text-white text-xs font-semibold">Generate</span>
                    </div>
                  </div>

                  {/* Mock cards grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div
                        key={n}
                        className="aspect-square rounded-lg bg-white/[0.03] border border-white/[0.06]
                                   flex items-center justify-center"
                      >
                        <div className="w-6 h-6 rounded bg-white/[0.06]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow behind the card */}
            <div
              className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(ellipse at center, #EC2801, transparent 70%)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;