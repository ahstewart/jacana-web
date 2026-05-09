import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const generateShortId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

const fetchHFTfliteFiles = async (hfModelId) => {
  const res = await fetch(`https://huggingface.co/api/models/${hfModelId}`);
  if (!res.ok) throw new Error(`Could not fetch model files (HTTP ${res.status})`);
  const data = await res.json();
  return (data.siblings || [])
    .filter(s => s.rfilename.endsWith('.tflite'))
    .map(s => ({
      filename: s.rfilename,
      url: `https://huggingface.co/${hfModelId}/resolve/main/${s.rfilename}`,
    }));
};

export const AddPipelineWizard = ({ hfModelId, existingTfliteUrl, onCreateManual, onCreateAndGenerate, onCancel }) => {
  const [step, setStep] = useState('details');
  const [details, setDetails] = useState({
    version_name: '',
    tflite_url: '',
    changelog: '',
  });
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [tfliteFiles, setTfliteFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState(null);

  useEffect(() => {
    if (!hfModelId) return;
    setLoadingFiles(true);
    fetchHFTfliteFiles(hfModelId)
      .then(files => {
        setTfliteFiles(files);
        // Auto-select if there's only one file
        if (files.length === 1) {
          setDetails(d => ({ ...d, tflite_url: files[0].url }));
        }
      })
      .catch(err => setFilesError(err.message))
      .finally(() => setLoadingFiles(false));
  }, [hfModelId]);

  const validate = () => {
    const e = {};
    if (!details.version_name.trim()) e.version_name = 'Version name is required';
    if (hfModelId && !details.tflite_url) e.tflite_url = 'Please select a model file';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep('pipeline-choice');
  };

  // Attach an auto-generated commit SHA just before handing off to parent.
  // For non-HF models, carry the inherited tflite URL so handlers can use it.
  const withSha = () => ({
    ...details,
    tflite_url: hfModelId ? details.tflite_url : (existingTfliteUrl || ''),
    commit_sha: generateShortId(),
  });

  const handleCreateAndGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await onCreateAndGenerate(withSha());
    } catch (err) {
      setGenerateError(err.message || 'Failed to create pipeline.');
      setGenerating(false);
    }
  };

  const renderModelFileField = () => {
    if (!hfModelId) {
      return null;
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Model File <span className="text-red-500">*</span>
        </label>
        {loadingFiles ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Loading files from Hugging Face…
          </div>
        ) : filesError ? (
          <p className="text-sm text-red-600 py-1">{filesError}</p>
        ) : tfliteFiles.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-1">
            No .tflite files found in this repository.
          </p>
        ) : (
          <select
            value={details.tflite_url}
            onChange={e => setDetails({ ...details, tflite_url: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.tflite_url ? 'border-red-400' : 'border-slate-300'
            }`}
          >
            <option value="">Select a model file…</option>
            {tfliteFiles.map(f => (
              <option key={f.url} value={f.url}>{f.filename}</option>
            ))}
          </select>
        )}
        {errors.tflite_url && <p className="text-xs text-red-600 mt-1">{errors.tflite_url}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Pipeline</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {step === 'details' ? 'Step 1 of 2 — Pipeline Details' : 'Step 2 of 2 — Pipeline Config'}
            </p>
          </div>
          <button onClick={onCancel} disabled={generating} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pipeline Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={details.version_name}
                onChange={e => setDetails({ ...details, version_name: e.target.value })}
                placeholder="e.g. v1.0.0 or main"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.version_name ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {errors.version_name && <p className="text-xs text-red-600 mt-1">{errors.version_name}</p>}
            </div>

            {renderModelFileField()}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Changelog <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={details.changelog}
                onChange={e => setDetails({ ...details, changelog: e.target.value })}
                rows={3}
                placeholder="Describe what changed in this pipeline…"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Pipeline choice */}
        {step === 'pipeline-choice' && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              A pipeline file is required. Choose how to provide it:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => onCreateManual(withSha())}
                disabled={generating}
                className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-primary-400 hover:bg-primary-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors flex-shrink-0">
                    <PencilSquareIcon className="h-5 w-5 text-primary-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Create Manually</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Build the pipeline configuration step-by-step using the visual editor.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleCreateAndGenerate}
                disabled={generating}
                className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-amber-400 hover:bg-amber-50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors flex-shrink-0">
                    <SparklesIcon className={`h-5 w-5 text-amber-700 ${generating ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Generate with AI</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {generating
                        ? 'Creating pipeline…'
                        : 'Let Gemini generate the pipeline config automatically from the model metadata.'}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {generateError}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          {step === 'details' ? (
            <>
              <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleNext}>Next: Pipeline</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep('details')} disabled={generating}>
                Back
              </Button>
              <span className="text-xs text-slate-400">Select an option above</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPipelineWizard;
