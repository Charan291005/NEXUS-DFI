import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card } from '../components/ui';

const STEPS = [
  {
    title: 'Phase 1: Case Initialization',
    desc: 'Establish the foundation of the investigation by creating a secure container for evidence and assigning an initial priority based on the incident report.',
    details: [
      'Navigate to Case Management.',
      'Click "+ New Case" and define scope, priority, and status.',
      'Assign an investigator (or claim the case yourself).',
      'A unique Case ID is generated for tracking.'
    ]
  },
  {
    title: 'Phase 2: Evidence Acquisition & Hashing',
    desc: 'Securely ingest digital artifacts while maintaining strict chain-of-custody protocols through automated cryptographic hashing.',
    details: [
      'Navigate to the Case Details page.',
      'Upload artifacts (Images, Videos, Logs, PDFs).',
      'The system automatically calculates and stores the SHA-256 hash.',
      'Verify the hash to ensure the artifact remains unaltered.'
    ]
  },
  {
    title: 'Phase 3: Automated AI Forensic Analysis',
    desc: 'Leverage the NexusDFI Engine to detect anomalies, deepfakes, manipulated metadata, and indicators of compromise.',
    details: [
      'In the Evidence tab, select an artifact.',
      'Choose the appropriate analysis module (e.g., Image Forensics, Deepfake Detection, Log Analysis).',
      'Review the AI-generated summary, Risk Score, and identified anomalies.',
      'Cross-reference findings with Threat Intel for IP/Domain context.'
    ]
  },
  {
    title: 'Phase 4: Timeline Reconstruction',
    desc: 'Aggregate all case events, evidence uploads, and analysis findings into a unified chronological view to establish a sequence of events.',
    details: [
      'Navigate to the Timeline tab.',
      'Filter events by category (Case, Evidence, Analysis, Alert).',
      'Identify critical timestamps that define the incident window.'
    ]
  },
  {
    title: 'Phase 5: Reporting & Case Closure',
    desc: 'Compile all findings, chain-of-custody logs, and executive summaries into a formal PDF report suitable for stakeholders or legal proceedings.',
    details: [
      'Navigate to the Reports page.',
      'Select the target case and configure the required sections.',
      'Generate and download the PDF report.',
      'Update the Case Status to "Closed" or "Archived".'
    ]
  }
];

export default function GuidePage() {
  const [activeStep, setActiveStep] = useState<number | null>(0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Standard Operating Procedure" 
        subtitle="NexusDFI Official Investigation Workflow Protocol" 
      />

      <div className="space-y-4">
        {STEPS.map((step, idx) => (
          <Card 
            key={idx} 
            className={`p-0 overflow-hidden transition-colors border ${activeStep === idx ? 'border-accent-500/50' : 'border-navy-800'}`}
          >
            <div 
              className={`p-5 cursor-pointer flex items-center justify-between ${activeStep === idx ? 'bg-navy-800/40' : 'hover:bg-navy-900/40'}`}
              onClick={() => setActiveStep(activeStep === idx ? null : idx)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-mono border ${
                  activeStep === idx 
                    ? 'bg-accent-500 text-white border-accent-400' 
                    : 'bg-navy-900 text-navy-400 border-navy-700'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <h3 className={`font-semibold font-display ${activeStep === idx ? 'text-white' : 'text-navy-100'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5 max-w-2xl hidden md:block">
                    {step.desc}
                  </p>
                </div>
              </div>
              <span className={`text-navy-400 transition-transform ${activeStep === idx ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>

            <AnimatePresence>
              {activeStep === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-navy-800 bg-navy-900/20"
                >
                  <div className="p-6 pl-16">
                    <p className="text-sm text-navy-300 mb-4 leading-relaxed md:hidden">{step.desc}</p>
                    <ul className="space-y-3">
                      {step.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-3 text-sm text-navy-200">
                          <span className="text-accent-400 mt-0.5 text-xs">■</span>
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}
