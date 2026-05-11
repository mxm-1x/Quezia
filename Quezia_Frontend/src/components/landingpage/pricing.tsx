import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from '@phosphor-icons/react';

// Enhanced isometric shapes with glow integration
const IsometricShapes = ({ color }: { color: string }) => (
  <div className="absolute top-0 right-0 overflow-hidden w-56 h-64 rounded-tr-[28px] pointer-events-none">
    <div className="absolute top-8 right-4 flex gap-3 rotate-[-12deg] transform-gpu">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative"
          style={{
            transform: `translateX(${i * 12}px) translateY(${i * 8}px) skewX(-8deg)`,
          }}
        >
          <div 
            className="w-12 h-32 rounded-lg border border-white/10 backdrop-blur-sm"
            style={{
              background: `linear-gradient(180deg, ${color}20 0%, ${color}05 50%, transparent 100%)`,
              boxShadow: `0 0 30px ${color}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          />
          <div 
            className="absolute inset-0 rounded-lg opacity-50"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, transparent 60%)`,
            }}
          />
        </div>
      ))}
    </div>
  </div>
);

// Brighter, multi-layered corner glow
const CornerGlow = ({ colors }: { colors: string[] }) => (
  <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none overflow-hidden rounded-tr-[28px]">
    <div 
      className="absolute -top-10 -right-10 w-48 h-48 opacity-70"
      style={{
        background: `radial-gradient(circle at center, ${colors[0]} 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }}
    />
    <div 
      className="absolute -top-16 -right-16 w-64 h-64 opacity-50"
      style={{
        background: `radial-gradient(circle at center, ${colors[1]} 0%, transparent 60%)`,
        filter: 'blur(40px)',
      }}
    />
    <div 
      className="absolute -top-20 -right-20 w-80 h-80 opacity-30"
      style={{
        background: `radial-gradient(circle at center, ${colors[2]} 0%, ${colors[0]}40 40%, transparent 70%)`,
        filter: 'blur(60px)',
      }}
    />
    <div 
      className="absolute top-0 right-0 w-full h-32 opacity-40"
      style={{
        background: `linear-gradient(180deg, ${colors[0]}30 0%, transparent 100%)`,
        filter: 'blur(20px)',
      }}
    />
    <div 
      className="absolute top-0 right-0 w-32 h-full opacity-30"
      style={{
        background: `linear-gradient(225deg, ${colors[1]}20 0%, transparent 100%)`,
        filter: 'blur(30px)',
      }}
    />
  </div>
);

const PricingCard = ({
  tier,
  subtitle,
  price,
  description,
  children,
  buttonText,
  buttonVariant = 'neutral',
  isPopular,
  glowColors,
  borderGradient,
  index,
}: {
  tier: string;
  subtitle: string;
  price?: string;
  description: string;
  children: React.ReactNode;
  buttonText: string;
  buttonVariant?: 'primary' | 'neutral';
  isPopular?: boolean;
  glowColors: string[];
  borderGradient: string;
  index: number;
}) => {
  const isPrimary = buttonVariant === 'primary';
  
  // Staggered animation delay based on index
  const delay = index * 0.15;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.215, 0.61, 0.355, 1], // Cubic bezier for smooth deceleration
      }}
      className={`relative rounded-[32px] p-[1px] h-full ${isPopular ? 'lg:-translate-y-4' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${borderGradient} 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.5) 100%)`,
      }}
    >
      <div 
        className={`
          relative flex flex-col rounded-[31px] overflow-hidden h-full
          bg-[#141416] backdrop-blur-2xl
          transition-all duration-500
          ${isPopular ? 'shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)]' : ''}
        `}
      >
        <CornerGlow colors={glowColors} />
        <IsometricShapes color={glowColors[0]} />
        
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="absolute inset-0 rounded-[31px] border border-white/[0.08] pointer-events-none" />
        <div 
          className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${glowColors[0]}40 50%, ${glowColors[1]}60 100%)` }}
        />
        <div 
          className="absolute top-0 right-0 bottom-0 w-[1px] opacity-40"
          style={{ background: `linear-gradient(180deg, ${glowColors[0]}50 0%, transparent 100%)` }}
        />

        {isPopular && (
          <div className="absolute top-5 right-5 z-20">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-[11px] font-medium text-white/95 uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              Most popular
            </span>
          </div>
        )}

        <div className="relative z-10 p-8 flex flex-col h-full">
          <div className="space-y-1.5 mb-4 relative z-20">
            <h3 className="text-[30px] font-semibold text-white/95 tracking-tight">
              {tier}
            </h3>
            <p className="text-sm font-medium text-white/50">
              {subtitle}
            </p>
          </div>

          <p className="text-[15px] leading-relaxed text-white/40 mb-6 relative z-20">
            {description}
          </p>

          {price ? (
            <div className="mb-8 flex items-baseline gap-1.5 relative z-20">
              <span className="text-[38px] font-semibold text-white tracking-tight">
                {price}
              </span>
              <span className="text-sm text-white/30 font-medium">/month</span>
            </div>
          ) : (
            <div className="mb-8 relative z-20">
              <span className="text-[28px] font-semibold text-white tracking-tight">
                Contact us
              </span>
            </div>
          )}

          <div className="flex-1 space-y-6 relative z-20">
            {children}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full mt-8 py-4 px-6 rounded-full font-semibold text-[15px] relative z-20
              transition-all duration-300
              ${isPrimary 
                ? 'bg-[#EC2801] hover:bg-[#ff4422] text-white' 
                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white/90 border border-white/[0.12] hover:border-white/[0.2] shadow-[0_0_20px_rgba(0,0,0,0.2)]'}
            `}
          >
            {buttonText}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Pricing = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  return (
    <div className="min-h-screen bg-[#050505] py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.05),transparent_40%)]" />
      
      <section ref={sectionRef} className="max-w-6xl mx-auto relative z-10">
        {/* Header with animation */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-[44px] font-semibold text-white mb-4 tracking-tight">
            Choose your path
          </h2>
          <p className="text-lg text-white/35 max-w-md mx-auto font-light">
            Select the plan that fits your preparation needs
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          
          <PricingCard
            index={0}
            tier="Free"
            subtitle="Get Oriented"
            price="$0"
            description="For individual learners exploring serious practice"
            buttonText="Start Free"
            glowColors={[
              'rgba(96, 165, 250, 1)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(147, 197, 253, 0.6)'
            ]}
            borderGradient="rgba(96, 165, 250, 0.4)"
          >
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                  What you get
                </p>
                <ul className="space-y-3">
                  {[
                    'Limited mock tests per month',
                    'Exam-accurate test simulation',
                    'Standard scoring & answer review',
                    'Basic performance snapshot'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-white/60 leading-snug">
                      <Check weight="bold" size={17} className="mt-0.5 text-blue-400/70 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PricingCard>

          <PricingCard
            index={1}
            tier="Pro"
            subtitle="Practice With Intelligence"
            price="$29"
            description="For serious aspirants who want measurable improvement"
            buttonText="Upgrade to Pro"
            buttonVariant="primary"
            isPopular
            glowColors={[
              'rgba(167, 139, 250, 1)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(196, 181, 253, 0.6)'
            ]}
            borderGradient="rgba(167, 139, 250, 0.5)"
          >
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                  Everything in Free, plus
                </p>
                <ul className="space-y-3">
                  {[
                    'Unlimited AI-generated mock tests',
                    'Adaptive test generation',
                    'Full analytics dashboard',
                    'Predictive rank estimation'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-white/85 leading-snug">
                      <Check weight="bold" size={18} className="mt-0.5 text-[#EC2801] shrink-0" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PricingCard>

          <PricingCard
            index={2}
            tier="Enterprise"
            subtitle="Intelligence at Scale"
            description="For institutes, batches, and organizations"
            buttonText="Contact Sales"
            glowColors={[
              'rgba(251, 191, 36, 0.9)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(253, 230, 138, 0.5)'
            ]}
            borderGradient="rgba(251, 191, 36, 0.3)"
          >
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                  Everything in Pro, plus
                </p>
                <ul className="space-y-3">
                  {[
                    'Multi-user & cohort management',
                    'Centralized analytics',
                    'Role-based access control',
                    'Priority support'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-white/60 leading-snug">
                      <Check weight="bold" size={17} className="mt-0.5 text-amber-400/70 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </PricingCard>

        </div>

        {/* Bottom note with fade animation */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center text-white/20 text-sm mt-20 font-light tracking-wide"
        >
          All plans include SSL security, 99.9% uptime, and data export options.
        </motion.p>
      </section>
    </div>
  );
};

export default Pricing;