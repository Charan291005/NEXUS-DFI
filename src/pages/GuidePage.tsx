import { motion } from 'framer-motion';
import { PageHeader } from '../components/ui';

export default function GuidePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Platform Guide" 
        subtitle="Learn how to navigate and utilize the NexusDFI platform effectively." 
      />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.section variants={item} className="glass p-6 rounded-2xl border border-navy-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
            <span className="text-blue-400">1.</span> Uploading Evidence
          </h2>
          <p className="text-navy-300 text-sm leading-relaxed mb-4">
            Begin by securely uploading digital artifacts to the platform. 
            NexusDFI supports images (JPG, PNG), documents (PDF, DOCX), logs (TXT), and packet captures (PCAP).
          </p>
          <ul className="list-disc list-inside text-sm text-navy-400 space-y-2">
            <li>Go to the <strong className="text-white">Evidence</strong> page.</li>
            <li>Click the "Upload Evidence" button or drag and drop your file.</li>
            <li>Once uploaded, the system generates a secure cryptographic hash (SHA-256) to maintain the chain of custody.</li>
          </ul>
        </motion.section>

        <motion.section variants={item} className="glass p-6 rounded-2xl border border-navy-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
            <span className="text-red-400">2.</span> Running AI Analysis
          </h2>
          <p className="text-navy-300 text-sm leading-relaxed mb-4">
            NexusDFI includes advanced machine learning models to detect manipulation and threats.
          </p>
          <ul className="list-disc list-inside text-sm text-navy-400 space-y-2">
            <li>Select an uploaded file from the Evidence vault.</li>
            <li>Click <strong className="text-white">Run Analysis</strong> and choose a module:
              <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                <li><span className="text-blue-400 font-medium">Image Forensics:</span> Analyzes Error Level Analysis (ELA) and PRNU inconsistencies to find Photoshopped areas.</li>
                <li><span className="text-blue-400 font-medium">Deepfake Detection:</span> Uses vision models to detect facial manipulation and GAN artifacts.</li>
                <li><span className="text-blue-400 font-medium">Log Analysis:</span> Scans system logs for malicious IPs and suspicious activity.</li>
              </ul>
            </li>
            <li>Review the detailed findings. The platform explains exactly <em>why</em> a finding is flagged and where to look.</li>
          </ul>
        </motion.section>

        <motion.section variants={item} className="glass p-6 rounded-2xl border border-navy-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
            <span className="text-emerald-400">3.</span> Case Management
          </h2>
          <p className="text-navy-300 text-sm leading-relaxed mb-4">
            Organize your evidence and findings into dedicated investigations.
          </p>
          <ul className="list-disc list-inside text-sm text-navy-400 space-y-2">
            <li>Navigate to the <strong className="text-white">Cases</strong> tab.</li>
            <li>Create a new case, assigning a priority level and attaching related evidence files.</li>
            <li>Collaborate with other investigators by adding notes and visualizing the case timeline.</li>
          </ul>
        </motion.section>

        <motion.section variants={item} className="glass p-6 rounded-2xl border border-navy-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
            <span className="text-purple-400">4.</span> Threat Intelligence & Assistant
          </h2>
          <p className="text-navy-300 text-sm leading-relaxed mb-4">
            Leverage advanced tools for broader intelligence gathering.
          </p>
          <ul className="list-disc list-inside text-sm text-navy-400 space-y-2">
            <li><strong className="text-white">Threat Intel:</strong> (Admin Only) View live global cyber threat indicators, CVE feeds, and active botnet trackers.</li>
            <li><strong className="text-white">AI Assistant:</strong> Chat with NexusDFI's trained investigation model. Ask it to summarize logs, explain attack vectors, or guide you through a forensic protocol.</li>
          </ul>
        </motion.section>
      </motion.div>
    </div>
  );
}
