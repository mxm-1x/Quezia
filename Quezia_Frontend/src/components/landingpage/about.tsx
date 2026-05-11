import React from 'react';

const About: React.FC = () => {
  return (
    <section className="py-20 lg:py-28 bg-gray-50" id="about">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text content — PRESERVED exactly as original */}
          <div>
            <span className="text-[#EC2801] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              Why We Write Our Code
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Designed for
              <br />
              serious preparation
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Quezia is a structured exam preparation system built for aspirants who care about depth, clarity, and measurable progress. It is designed around how competitive exams are actually constructed — not shortcuts, distractions, or surface-level practice. Every component is intentional, guiding learners from foundational concepts to applied mastery through focused practice, real exam patterns, and continuous feedback. The goal is simple: reduce noise, eliminate guesswork, and create a preparation flow where effort compounds into understanding, confidence, and performance.
            </p>
          </div>

          {/* Right: Visual placeholder */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center p-8">
                {/* Mock workflow visualization */}
                <div className="w-full max-w-xs space-y-6">
                  {/* Step indicators */}
                  {[
                    { label: 'Dataset', opacity: 'bg-[#EC2801]/10 border-[#EC2801]/20', dotColor: 'bg-[#EC2801]' },
                    { label: 'Intelligence', opacity: 'bg-[#EC2801]/15 border-[#EC2801]/30', dotColor: 'bg-[#EC2801]' },
                    { label: 'Output', opacity: 'bg-gray-100 border-gray-200', dotColor: 'bg-gray-400' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      {/* Connector line */}
                      {i > 0 && (
                        <div className="absolute ml-[19px] -mt-12 w-0.5 h-6 bg-gray-200" />
                      )}
                      <div className={`w-10 h-10 rounded-xl ${step.opacity} border flex items-center justify-center shrink-0`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${step.dotColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                        <div className="flex gap-1 mt-1">
                          <div className="h-1 w-12 bg-gray-200 rounded-full" />
                          <div className="h-1 w-8 bg-gray-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;