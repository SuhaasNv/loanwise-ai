import { Link } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  BarChart3,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { LiquidButton, MetalButton } from "@/components/ui/liquid-glass-button";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-50 font-sans selection:bg-cyan-500/30">
      {/* ─── Nav ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0A0F1C]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/50">
              <BrainCircuit className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">LoanWise AI</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Features
            </a>
            <Link to="/eligibility-check" className="hover:text-emerald-400 transition-colors">
              Eligibility Check
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden text-slate-300 hover:bg-white/5 hover:text-white sm:inline-flex" asChild>
              <Link to="/sign-in">Manager Login</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden text-slate-400 hover:bg-white/5 hover:text-cyan-400 sm:inline-flex" asChild>
              <Link to="/claim-manager">
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Claim Manager
              </Link>
            </Button>
            <Button size="sm" className="rounded-full bg-cyan-500 px-6 text-[#0A0F1C] hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" asChild>
              <Link to="/sign-up">
                Apply Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        {/* WebGL Animated Shader Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
          <WebGLShader />
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-4xl px-4 md:px-6 text-center z-10"
        >
          <motion.h1 variants={fadeUp} className="mb-6 text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl">
            AI-Powered<br/> Loan Decisions{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              in Seconds
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-2xl text-base sm:text-lg text-slate-400 md:text-xl">
            Submit your loan application and get an instant risk assessment, bias-free decision,
            and personalised product recommendations — all driven by intelligent AI agents.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center z-10 relative mt-8">
            <Link to="/sign-up">
              <LiquidButton size="xl" className="text-cyan-400 font-bold tracking-wide hover:text-cyan-300">
                Get Started <ArrowRight className="h-4 w-4" />
              </LiquidButton>
            </Link>
            <Link to="/eligibility-check">
              <MetalButton variant="cyan">
                Check Eligibility Free
              </MetalButton>
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="text-xs text-slate-500 mt-4">
            No sign-in required · No credit inquiry · Instant result
          </motion.p>
        </motion.div>
      </section>

      {/* ─── Features (Alternating Layout) ─────────────────────────────────── */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-20 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
              A loan based on <br/> your future potential
            </h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Four specialised agents work together to evaluate your application, ensuring lightning-fast processing, zero bias, and personalized terms.
            </p>
          </motion.div>

          <div className="relative space-y-24 md:space-y-32">
            {/* Vertical glowing wire line */}
            <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 md:block"></div>

            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative flex flex-col items-center gap-12 md:flex-row md:even:flex-row-reverse"
            >
              <div className="flex-1 md:pr-16 md:text-right">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30 md:ml-auto md:mr-0">
                   1
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl font-bold text-white">Instant Risk Assessment</h3>
                <p className="text-lg leading-relaxed text-slate-400">
                  Our <span className="text-cyan-400 font-medium">RiskAssessor agent</span> analyses your credit profile, income, and DTI ratio to compute a precise risk score in milliseconds.
                </p>
              </div>
              
              {/* Center point */}
              <div className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 ring-4 ring-[#0A0F1C] shadow-[0_0_15px_rgba(6,182,212,0.8)] md:block" />

              <div className="flex-1 w-full md:pl-16">
                <div className="aspect-square w-full sm:aspect-video md:aspect-square max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1 shadow-2xl backdrop-blur-sm md:mr-auto">
                   <div className="h-full w-full rounded-2xl bg-slate-900/80 p-6 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
                     {/* Faux code/dashboard element */}
                     <div className="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay"></div>
                     <BarChart3 className="h-16 w-16 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                     <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden"><div className="bg-cyan-400 h-2 w-[85%] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" /></div>
                     <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden"><div className="bg-indigo-400 h-2 w-[60%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" /></div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative flex flex-col items-center gap-12 md:flex-row md:even:flex-row-reverse"
            >
              <div className="flex-1 md:pl-16">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30">
                   2
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl font-bold text-white">AI Email Generation</h3>
                <p className="text-lg leading-relaxed text-slate-400">
                  The <span className="text-indigo-400 font-medium">EmailGenerator agent</span> drafts a clear, professional decision letter tailored specifically to your unique application parameters.
                </p>
              </div>
              
               <div className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 ring-4 ring-[#0A0F1C] shadow-[0_0_15px_rgba(99,102,241,0.8)] md:block" />

              <div className="flex-1 w-full md:pr-16">
                <div className="aspect-square w-full sm:aspect-video md:aspect-square max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1 shadow-2xl backdrop-blur-sm md:ml-auto">
                   <div className="h-full w-full rounded-2xl bg-slate-900/80 p-6 flex flex-col items-start border border-white/5">
                      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                         <div className="h-3 w-20 bg-slate-700/50 rounded-full" />
                         <Sparkles className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="h-2 w-3/4 bg-slate-700 rounded-full mb-4" />
                      <div className="h-2 w-full bg-slate-700 rounded-full mb-4" />
                      <div className="h-2 w-5/6 bg-slate-700 rounded-full mb-4" />
                      <div className="h-2 w-1/2 bg-slate-700/50 rounded-full" />
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative flex flex-col items-center gap-12 md:flex-row md:even:flex-row-reverse"
            >
              <div className="flex-1 md:pr-16 md:text-right">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 md:ml-auto md:mr-0">
                   3
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl font-bold text-white">Bias-Free Decisions</h3>
                <p className="text-lg leading-relaxed text-slate-400">
                  Every communication is scanned by the <span className="text-emerald-400 font-medium">BiasDetector agent</span> to ensure fair, equitable language and zero discrimination.
                </p>
              </div>

              <div className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 ring-4 ring-[#0A0F1C] shadow-[0_0_15px_rgba(16,185,129,0.8)] md:block" />

              <div className="flex-1 w-full md:pl-16">
                <div className="aspect-square w-full sm:aspect-video md:aspect-square max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1 shadow-2xl backdrop-blur-sm md:mr-auto">
                   <div className="h-full w-full rounded-2xl bg-slate-900/80 p-6 flex items-center justify-center border border-white/5 relative group overflow-hidden">
                       <ShieldCheck className="h-24 w-24 text-emerald-400/80 transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   </div>
                </div>
              </div>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative flex flex-col items-center gap-12 md:flex-row md:even:flex-row-reverse"
            >
              <div className="flex-1 md:pl-16">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
                   4
                </div>
                <h3 className="mb-4 text-2xl md:text-3xl font-bold text-white">Smart Recommendations</h3>
                <p className="text-lg leading-relaxed text-slate-400">
                  If denied, the <span className="text-amber-400 font-medium">ProductRecommender agent</span> intelligently suggests alternative financial products best matched to your current situation.
                </p>
              </div>
              
               <div className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-4 ring-[#0A0F1C] shadow-[0_0_15px_rgba(245,158,11,0.8)] md:block" />

              <div className="flex-1 w-full md:pr-16">
                <div className="aspect-square w-full sm:aspect-video md:aspect-square max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1 shadow-2xl backdrop-blur-sm md:ml-auto">
                   <div className="h-full w-full rounded-2xl bg-slate-900/80 p-6 flex flex-col justify-center border border-white/5 space-y-4">
                      <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                         <div className="h-10 w-10 bg-amber-500/20 rounded-lg flex items-center justify-center"><Zap className="h-5 w-5 text-amber-400" /></div>
                         <div className="flex-1"><div className="h-2 w-1/2 bg-slate-600 rounded-full mb-2" /><div className="h-2 w-1/3 bg-slate-700 rounded-full" /></div>
                      </div>
                      <div className="w-full bg-slate-800/20 p-4 rounded-xl border border-white/5 flex items-center gap-4 filter blur-[1px]">
                         <div className="h-10 w-10 bg-slate-700/50 rounded-lg" />
                         <div className="flex-1"><div className="h-2 w-2/3 bg-slate-700 rounded-full mb-2" /><div className="h-2 w-1/4 bg-slate-800 rounded-full" /></div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Multi-Agent AI Engine Architecture ───────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-slate-900/50 border-y border-white/5">
        {/* Background ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">The Engine</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl mb-4">
              A Symphony of AI Agents
            </h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Unlike traditional monolithic models, our platform uses a decoupled multi-agent architecture. Each agent is highly specialized, independently audited, and strictly handles a single step in the loan lifecycle.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Data Orchestrator",
                desc: "Ingests and structures raw application data into universally readable formats for remaining agents.",
                icon: BrainCircuit,
                color: "text-cyan-400",
                bg: "bg-cyan-500/10",
                ring: "ring-cyan-500/30"
              },
              {
                title: "Risk Engine",
                desc: "Analyzes financial points using advanced predictive models without demographic bias.",
                icon: BarChart3,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                ring: "ring-indigo-500/30"
              },
              {
                title: "Compliance Node",
                desc: "Strictly enforces regulatory limits, checking all decisions for disparate impact and bias.",
                icon: ShieldCheck,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                ring: "ring-emerald-500/30"
              },
              {
                title: "Decision Synthesizer",
                desc: "Generates the final secure output including optimal loan terms, next steps, and emails.",
                icon: Zap,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                ring: "ring-amber-500/30"
              }
            ].map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-[#0A0F1C] border border-white/5 hover:border-white/20 transition-colors shadow-xl"
              >
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                  className={`flex h-16 w-16 mb-6 items-center justify-center rounded-2xl ring-1 shadow-lg ${agent.bg} ${agent.ring}`}
                >
                  <agent.icon className={`h-8 w-8 ${agent.color}`} />
                </motion.div>
                <h3 className="mb-2 text-xl font-bold text-white">{agent.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Faux Equalizer Wave Decorator ────────────────────────────────── */}
      <div className="w-full overflow-hidden opacity-30 select-none py-10 mt-10">
         <div className="flex h-20 items-end justify-center gap-1 md:gap-2 mx-auto w-full max-w-[1200px]">
            {Array.from({ length: 100 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1 md:w-2 bg-gradient-to-t from-cyan-600 via-cyan-400 to-transparent rounded-t-full origin-bottom inline-block"
                style={{ height: `${Math.random() * 80 + 20}%`, opacity: Math.random() * 0.5 + 0.3 }}
              />
            ))}
         </div>
      </div>

      {/* ─── How it Works / Eligibility ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid gap-16 md:grid-cols-2 lg:items-center"
          >
              <div>
                <h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight text-white lg:text-5xl">
                   Who's eligible for financing?
                </h2>
                <p className="mb-8 text-base md:text-lg leading-relaxed text-slate-400">
                   Open to Singapore Citizens, Permanent Residents, and valid Work Pass holders. 
                   Our platform supports everyone from young professionals and families to small business owners, 
                   providing fair and transparent credit access for all residents of Singapore.
                </p>
                <div className="space-y-6 flex flex-col items-start pt-6 border-t border-white/10">
                   {[
                     { title: "Fast Application", desc: "Sign up securely and complete your application in minutes with our intuitive digital form." },
                     { title: "AI Multi-Agent Review", desc: "Four AI agents analyze your profile in real time, assessing risk and eliminating bias." },
                     { title: "Instant Loan Decision", desc: "Receive an immediate decision with your risk score and tailored financial options." }
                   ].map((step, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.2 }}
                        key={i} 
                        className="flex gap-4"
                      >
                         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400 ring-1 ring-cyan-500/50">
                            {i + 1}
                         </div>
                         <div>
                            <h4 className="font-semibold text-white">{step.title}</h4>
                            <p className="text-sm text-slate-400 mt-1">{step.desc}</p>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
                {/* Decorative glowing backplate */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-2xl z-0" />
                <div className="relative z-10 aspect-square md:aspect-[4/5] overflow-hidden rounded-3xl bg-slate-800 border border-white/10 shadow-2xl">
                   {/* Placeholder for real image, using a sleek gradient/texture for now to fit the prompt 'beautiful design without breaking code' */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-transparent to-transparent z-10" />
                   <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80" 
                      alt="Students on campus" 
                      className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-60 transition-transform duration-1000 hover:scale-105"
                   />
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Know Before You Apply ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-slate-900/30 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                No credit inquiry
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Know before you apply
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Our free eligibility checker gives you an instant, honest assessment of your approval odds
                — before you submit a full application. See your exact risk factors and get actionable
                suggestions to improve your profile.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: Zap, text: "Results in under 30 seconds" },
                  { icon: ShieldCheck, text: "No sign-in or credit pull required" },
                  { icon: BarChart3, text: "Approval probability + top blockers" },
                  { icon: Clock, text: "Interactive What-If simulator for denied profiles" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
                      <Icon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
              <Button
                className="rounded-full bg-emerald-500 text-white hover:bg-emerald-400 px-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                asChild
              >
                <Link to="/eligibility-check">
                  Check My Eligibility <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl border border-white/10 bg-slate-800/50 p-8 space-y-4"
            >
              {/* Faux eligibility result preview */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligibility Result</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Likely to Qualify</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Approval Probability", value: "78%", bar: 78, color: "bg-emerald-400" },
                  { label: "Risk Score", value: "22/100", bar: 22, color: "bg-emerald-400" },
                  { label: "Model Confidence", value: "91%", bar: 91, color: "bg-blue-400" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{m.label}</span>
                      <span className="text-white font-semibold">{m.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/10 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Factor Breakdown</p>
                {[
                  { name: "Credit Score", value: "742 (Very Good)", positive: true },
                  { name: "DTI Ratio", value: "28% (Good)", positive: true },
                  { name: "Employment", value: "Full-time", positive: true },
                  { name: "Loan-to-Income", value: "3.2× (Elevated)", positive: false },
                ].map((f) => (
                  <div key={f.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{f.name}</span>
                    <span className={f.positive ? "text-emerald-400" : "text-amber-400"}>{f.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
           <div className="relative px-6 py-16 md:py-24 text-center">
             <h2 className="mb-6 text-2xl font-bold text-white md:text-5xl">
               Are you ready to apply<br className="hidden md:block" /> for funding?
             </h2>
             <p className="mx-auto mb-10 max-w-xl text-slate-400">
               Get instant decisions, unbiased evaluations, and smart recommendations for your financial journey in Singapore.
             </p>
             <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
               <Button
                 size="lg"
                 className="w-full sm:w-auto rounded-full bg-cyan-500 px-8 text-[#0A0F1C] hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                 asChild
               >
                 <Link to="/sign-up">
                   Start Application <ChevronRight className="ml-1 h-4 w-4" />
                 </Link>
               </Button>
               <Button
                 size="lg"
                 variant="outline"
                 className="w-full sm:w-auto rounded-full border-white/20 bg-transparent px-8 text-white hover:bg-white/5"
                 asChild
               >
                 <Link to="/sign-in">Manager Dashboard</Link>
               </Button>
             </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#050810] px-6 pt-16 pb-8 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl">
           <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5 mb-12">
              <div className="lg:col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-cyan-500/20">
                     <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
                   </div>
                   <span className="font-semibold text-white">LoanWise AI</span>
                 </div>
                 <p className="max-w-xs mb-6">Empowering Singapore residents with AI-driven, lightning-fast financial decisions.</p>
                 <div className="flex items-center gap-2 text-emerald-500 mb-2">
                   <ShieldCheck className="h-4 w-4" />
                   <span className="text-xs font-semibold">Bias-free guarantees</span>
                 </div>
                 <div className="flex items-center gap-2 text-slate-500 text-xs">
                   <Lock className="h-3.5 w-3.5" />
                   <span>MAS-aligned fair lending practices</span>
                 </div>
              </div>
              
              <div>
                 <h4 className="font-semibold text-white mb-4">Company</h4>
                 <ul className="space-y-2">
                    <li><Link to="/about" className="hover:text-cyan-400">About us</Link></li>
                    <li><Link to="/contact" className="hover:text-cyan-400">Contact</Link></li>
                    <li><a href="#" className="hover:text-cyan-400">Press</a></li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-semibold text-white mb-4">Product</h4>
                 <ul className="space-y-2">
                    <li><a href="#how-it-works" className="hover:text-cyan-400">How it works</a></li>
                    <li><Link to="/privacy" className="hover:text-cyan-400">Privacy</Link></li>
                    <li><Link to="/terms" className="hover:text-cyan-400">Terms</Link></li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-semibold text-white mb-4">Support</h4>
                 <ul className="space-y-2">
                    <li><Link to="/help" className="hover:text-cyan-400">Help Center</Link></li>
                    <li><Link to="/eligibility-check" className="hover:text-cyan-400">Eligibility Check</Link></li>
                    <li><Link to="/contact" className="hover:text-cyan-400">Contact</Link></li>
                 </ul>
              </div>
           </div>
           <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
             <p>© {new Date().getFullYear()} LoanWise AI. All rights reserved.</p>
             <div className="flex gap-6">
                <Link to="/terms" className="hover:text-white">Terms</Link>
                <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

