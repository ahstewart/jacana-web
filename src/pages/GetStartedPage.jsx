import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import {
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CheckCircleIcon,
  StarIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

const Step = ({ number, icon: Icon, iconBg, title, children }) => (
  <div className="relative flex gap-6">
    {/* connector line */}
    <div className="flex flex-col items-center">
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="w-px flex-1 bg-slate-200 mt-3" />
    </div>
    <div className="pb-10">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Step {number}</p>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      {children}
    </div>
  </div>
);

const PlatformBadge = ({ label, icon, sub, soon }) => (
  <div className={`flex items-center gap-3 bg-white border rounded-xl px-5 py-4 ${soon ? 'border-slate-200 opacity-60' : 'border-slate-200 shadow-sm'}`}>
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
    {soon && (
      <span className="ml-auto text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
        Coming soon
      </span>
    )}
  </div>
);

const Tip = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary-600" />
    </div>
    <div>
      <p className="font-semibold text-slate-900 text-sm">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

export const GetStartedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-16">

      {/* Hero */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <SparklesIcon className="h-4 w-4" />
          Get started in minutes
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          From zero to on-device AI<br />
          <span className="text-primary-600">in under 5 minutes.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          No account required to run models. Just download the app, grab a model, and go.
        </p>
      </div>

      {/* Download the app */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <DevicePhoneMobileIcon className="h-5 w-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">1. Download the app</h2>
        </div>
        <p className="text-slate-600 mb-6">
          Jacana is a free mobile app for Android and iOS. Download it from your app store to get started.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlatformBadge label="Android" icon="🤖" sub="Google Play Store" />
          <PlatformBadge label="iOS" icon="🍎" sub="Apple App Store" soon />
        </div>
        <p className="text-xs text-slate-400 mt-4">
          iOS support is in progress. Android is available now.
        </p>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Your first model in 4 steps</h2>

        <div>
          <Step number={1} icon={MagnifyingGlassIcon} iconBg="bg-blue-100 text-blue-600" title="Browse the catalogue">
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Open the app (or browse here on the web) and explore the model catalogue. You can filter by task type — image classification, object detection, text generation, and more.
            </p>
            <p className="text-sm text-slate-500">
              Look for models with a <span className="inline-flex items-center gap-1 text-green-700 font-medium"><CheckCircleIcon className="h-3.5 w-3.5" /> Supported</span> task badge and a <strong>Verified</strong> pipeline status — these have been validated and are ready to use.
            </p>
          </Step>

          <Step number={2} icon={ArrowDownTrayIcon} iconBg="bg-green-100 text-green-600" title="Download a model">
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Tap a model to open its detail page. Pick a pipeline and hit <strong>Download</strong>. The model file is saved to your device — it only needs to download once.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <strong>Tip:</strong> Model files range from a few MB to a few hundred MB. Download over Wi-Fi if you're on a limited data plan.
            </div>
          </Step>

          <Step number={3} icon={PlayIcon} iconBg="bg-primary-100 text-primary-600" title="Run inference">
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Head to the <strong>My AI</strong> tab in the app. Tap the model you downloaded and hit <strong>Run</strong>. Depending on the model type you'll be prompted to:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-3 list-disc list-inside">
              <li>Take a photo or choose one from your gallery (image models)</li>
              <li>Type a prompt (text generation models)</li>
            </ul>
            <p className="text-slate-600 text-sm">
              Results appear in milliseconds. Everything happens on your device — nothing is sent anywhere.
            </p>
          </Step>

          <Step number={4} icon={StarIcon} iconBg="bg-amber-100 text-amber-600" title="Rate and explore">
            <p className="text-slate-600 text-sm leading-relaxed">
              Found a model you love? Rate it to help others discover it. Then keep exploring — new models are added regularly by the community and automatically synced from Hugging Face.
            </p>
          </Step>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Tips for the best experience</h2>
        <div className="space-y-5">
          <Tip
            icon={CheckCircleIcon}
            title='Filter by "Verified" pipeline status'
            desc="Verified models have a validated pipeline and are most likely to work perfectly out of the box."
          />
          <Tip
            icon={WifiIcon}
            title="Download on Wi-Fi"
            desc="Model files can be large. Save your mobile data and download when you're on a fast connection."
          />
          <Tip
            icon={DevicePhoneMobileIcon}
            title="Newer phones run faster"
            desc="Modern Android phones have dedicated NPU hardware that can run models 10–50× faster than older devices."
          />
          <Tip
            icon={MagnifyingGlassIcon}
            title="Search by task"
            desc='Use the task filter on Browse to narrow down models. Try "image-classification" or "object-detection" to find the right type quickly.'
          />
        </div>
      </div>

      {/* For contributors */}
      <div className="bg-gradient-to-br from-primary-50 via-teal-50 to-blue-50 rounded-2xl border border-teal-200 p-8 text-center">
        <SparklesIcon className="h-8 w-8 text-primary-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Have a model to share?</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Create a free account and publish your own LiteRT models. The AI assistant will auto-generate the pipeline config — you just upload the file.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={() => navigate('/auth/signup')}>
            Create a free account
          </Button>
          <Button variant="outline" onClick={() => navigate('/docs')}>
            Read the docs
          </Button>
        </div>
      </div>

    </div>
  );
};
