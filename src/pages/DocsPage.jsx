import React, { useState } from 'react';
import {
  CpuChipIcon,
  ArrowDownTrayIcon,
  BoltIcon,
  CameraIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  CodeBracketIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const Section = ({ icon: Icon, color, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8">
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
    {children}
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
  </div>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-medium text-slate-900">{q}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
};

export const DocsPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">

    {/* Hero */}
    <div className="text-center py-10">
      <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
        <SparklesIcon className="h-4 w-4" />
        How it works
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        AI on your phone.<br />
        <span className="text-primary-600">No internet required.</span>
      </h1>
      <p className="text-lg text-slate-500 max-w-2xl mx-auto">
        Jacana is a marketplace for tiny, powerful AI models that run entirely on your device — no cloud, no subscription, no waiting.
      </p>
    </div>

    {/* Big idea */}
    <Section
      icon={BoltIcon}
      color="bg-amber-100 text-amber-600"
      title="The big idea"
    >
      <p className="text-slate-600 leading-relaxed mb-4">
        Most AI products send your data to a server, process it there, and send results back. That costs money, requires Wi-Fi, and raises privacy concerns.
      </p>
      <p className="text-slate-600 leading-relaxed">
        Jacana flips this on its head. Models are downloaded once to your phone and run <strong className="text-slate-900">100% locally</strong> using the CPU or NPU built into your device. Once downloaded, they work on a plane, underground, wherever.
      </p>
    </Section>

    {/* What is a model */}
    <Section
      icon={CpuChipIcon}
      color="bg-primary-100 text-primary-600"
      title="What exactly is a model?"
    >
      <p className="text-slate-600 leading-relaxed mb-4">
        Think of a model as a very smart function. You feed it an image (or some text), and it tells you something useful about it — like what objects are in the photo, or what language is being spoken.
      </p>
      <p className="text-slate-600 leading-relaxed mb-6">
        The models on Jacana are stored in the <strong className="text-slate-900">LiteRT format</strong> (previously called TFLite) — Google's standard for efficient on-device AI. They're small enough to live on your phone but capable enough to do real work.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: CameraIcon, label: 'Image Classification', desc: 'What is in this photo?' },
          { icon: MagnifyingGlassIcon, label: 'Object Detection', desc: 'Where are things in this photo?' },
          { icon: ChatBubbleBottomCenterTextIcon, label: 'Text Generation', desc: 'Complete or respond to text' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
            <Icon className="h-6 w-6 mx-auto text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* How the platform works */}
    <Section
      icon={ArrowDownTrayIcon}
      color="bg-green-100 text-green-600"
      title="How the platform works"
    >
      <div className="space-y-5">
        <Step number={1} title="Browse the catalogue" description="Find models by task, category, or search. Each listing shows downloads, rating, and which pipeline is ready to use." />
        <Step number={2} title="Download to your phone" description="Open the Jacana mobile app, find the model you want, and tap Download. It's saved locally — no account needed to run models." />
        <Step number={3} title="Run inference" description="Pick a model from My AI, feed it an image or some text, and see results in milliseconds — all on-device." />
        <Step number={4} title="That's it" description="No API key. No credits. No rate limits. Just fast, private AI on your hardware." />
      </div>
    </Section>

    {/* For contributors */}
    <Section
      icon={CloudArrowUpIcon}
      color="bg-violet-100 text-violet-600"
      title="Contributing a model"
    >
      <p className="text-slate-600 leading-relaxed mb-6">
        Anyone with an account can upload a model. You can link to an existing Hugging Face repository or upload a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">.tflite</code> file directly from your computer.
      </p>
      <div className="space-y-4">
        <Step number={1} title="Create a model listing" description="Give it a name, description, category, and optionally link it to a Hugging Face repo." />
        <Step number={2} title="Add a pipeline" description="Attach your .tflite file. New pipelines can be added anytime as you improve the model." />
        <Step number={3} title="Generate a pipeline" description="Jacana's AI assistant (powered by Gemini) reads your model and generates a pipeline config automatically — telling the app how to pre-process inputs and interpret outputs." />
        <Step number={4} title="Publish" description="Set visibility to Public and other users can find, download, and run your model." />
      </div>
    </Section>

    {/* Pipeline concept */}
    <Section
      icon={WrenchScrewdriverIcon}
      color="bg-rose-100 text-rose-600"
      title="What's a pipeline config?"
    >
      <p className="text-slate-600 leading-relaxed mb-4">
        Raw TFLite models just take tensors in and spit tensors out. The pipeline config is a small JSON file that bridges the gap between "user gives us an image" and "model receives a 224×224 float32 tensor".
      </p>
      <p className="text-slate-600 leading-relaxed mb-4">
        It describes how to resize and normalise inputs, which output tensor contains the predictions, how to map raw numbers back to human-readable labels, and much more.
      </p>
      <p className="text-slate-600 leading-relaxed">
        In most cases the AI generates this automatically. If the auto-generation fails or you need fine control, you can write it manually using the built-in editor.
      </p>
    </Section>

    {/* Open source / tech */}
    <Section
      icon={CodeBracketIcon}
      color="bg-slate-100 text-slate-600"
      title="Under the hood"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
        {[
          { label: 'Flutter', sub: 'Mobile app' },
          { label: 'FastAPI', sub: 'Backend API' },
          { label: 'Supabase', sub: 'Database & Auth' },
          { label: 'Gemini 2.5', sub: 'Pipeline AI' },
        ].map(({ label, sub }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* FAQ */}
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently asked questions</h2>
      <div className="divide-y divide-slate-100">
        <FaqItem
          q="Is it really free?"
          a="Yes. Browsing, downloading, and running models is completely free. There's no premium tier for core features."
        />
        <FaqItem
          q="Do models work offline?"
          a="Once downloaded, absolutely. The model file lives on your device. You only need a connection to download new models or browse the catalogue."
        />
        <FaqItem
          q="How accurate are the models?"
          a="Accuracy varies by model. Check the pipeline status — 'Verified' means the pipeline config has been validated against the TFLite model. Ratings from other users are also a good signal."
        />
        <FaqItem
          q="Can I upload a model trained in PyTorch?"
          a="You'll need to convert it to the LiteRT (.tflite) format first using TensorFlow's conversion tools. Once converted, upload it here like any other model."
        />
        <FaqItem
          q="What happens to my data when I run a model?"
          a="Nothing leaves your device. The image or text you feed the model is processed locally and the result is shown directly to you. We never see it."
        />
        <FaqItem
          q="Why did pipeline generation fail for my model?"
          a="Some models use operations not yet supported by the inference engine (e.g. custom ops, certain LSTM variants). The failure reason is shown on the pipeline row. You can try writing the pipeline config manually, or open a GitHub issue."
        />
      </div>
    </div>

  </div>
);
