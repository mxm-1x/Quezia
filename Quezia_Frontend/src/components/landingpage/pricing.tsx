import React from 'react';
import { motion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';

const PricingCard = ({
  tier,
  subtitle,
  price,
  description,
  children,
  buttonText,
  buttonVariant = 'neutral',
  isPopular,
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
  index: number;
}) => {
  const isPrimary = buttonVariant === 'primary';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col rounded-xl overflow-hidden h-full border transition-all duration-200
                  ${isPopular ? 'border-[#111111] bg-white ring-1 ring-[#111111]' : 'border-[#EAEAEA] bg-[#FBFBFA]'}`}
    >
      {isPopular && (
        <div className="bg-[#111111] py-1 text-center">
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
            Recommended
          </span>
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#111111] tracking-tight mb-1">
            {tier}
          </h3>
          <p className="text-sm font-medium text-[#787774]">
            {subtitle}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#787774] mb-8">
          {description}
        </p>

        <div className="mb-8">
          {price ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#111111] tracking-tight">
                {price}
              </span>
              <span className="text-sm text-[#787774] font-medium">/month</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-[#111111] tracking-tight">
              Contact us
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4">
          {children}
        </div>

        <button 
          className={`
            w-full mt-10 py-2.5 px-6 rounded-md font-medium text-sm transition-all duration-200
            active:scale-[0.98]
            ${isPrimary 
              ? 'bg-[#111111] text-white hover:bg-[#333333]' 
              : 'bg-white text-[#111111] border border-[#EAEAEA] hover:bg-[#F9F9F8]'}
          `}
        >
          {buttonText}
        </button>
      </div>
    </motion.div>
  );
};

const Pricing = () => {
  return (
    <section className="py-32 bg-white border-b border-[#EAEAEA]" id="pricing">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#FBF3DB] text-[#956400] mb-6 tracking-wide uppercase">
            Pricing Plans
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#111111] mb-6 tracking-tight">
            Predictable pricing for every stage
          </h2>
          <p className="text-lg text-[#787774] max-w-lg mx-auto leading-relaxed">
            Choose the path that best fits your preparation goals.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          <PricingCard
            index={0}
            tier="Free"
            subtitle="Getting Started"
            price="$0"
            description="For individual learners exploring serious practice"
            buttonText="Start Free"
          >
            <ul className="space-y-3">
              {[
                'Limited mock tests per month',
                'Exam-accurate test simulation',
                'Standard scoring & review',
                'Basic performance snapshot'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#787774]">
                  <Check weight="bold" size={14} className="mt-0.5 text-[#111111] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PricingCard>

          <PricingCard
            index={1}
            tier="Pro"
            subtitle="Full Intelligence"
            price="$29"
            description="For serious aspirants who want measurable improvement"
            buttonText="Get Started with Pro"
            buttonVariant="primary"
            isPopular
          >
            <ul className="space-y-3">
              {[
                'Unlimited AI mock tests',
                'Adaptive test generation',
                'Full analytics dashboard',
                'Predictive rank estimation'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#111111]">
                  <Check weight="bold" size={14} className="mt-0.5 text-[#111111] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PricingCard>

          <PricingCard
            index={2}
            tier="Enterprise"
            subtitle="Institutional Scale"
            description="For institutes, batches, and organizations"
            buttonText="Contact Sales"
          >
            <ul className="space-y-3">
              {[
                'Multi-user & cohort management',
                'Centralized batch analytics',
                'Role-based access control',
                'Priority organizational support'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#787774]">
                  <Check weight="bold" size={14} className="mt-0.5 text-[#111111] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PricingCard>

        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center text-[#787774] text-xs mt-20 tracking-wide font-mono"
        >
          99.9% Uptime · SSL Encrypted · Data Export Ready
        </motion.p>
      </div>
    </section>
  );
};

export default Pricing;
