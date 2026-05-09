import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import HuggingFaceSearch from '../components/HuggingFaceSearch';
import { PipelineConfigWizard } from '../components/PipelineConfigWizard';
import { supabase } from '../lib/supabase';
import { ApiService } from '../api/client';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChevronRightIcon,
  DocumentIcon,
  GlobeAltIcon,
  LockClosedIcon,
  XMarkIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

const MODEL_FILES_BUCKET = 'model-files';

const generateShortId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

const fetchHFTfliteFiles = async (hfModelId) => {
  const res = await fetch(`https://huggingface.co/api/models/${hfModelId}`);
  if (!res.ok) throw new Error(`Could not fetch HF repo files (HTTP ${res.status})`);
  const data = await res.json();
  return (data.siblings || [])
    .filter(s => s.rfilename.endsWith('.tflite'))
    .map(s => ({
      filename: s.rfilename,
      url: `https://huggingface.co/${hfModelId}/resolve/main/${s.rfilename}`,
      size_bytes: s.size ?? 0,
    }));
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const STEP_LABELS = ['Model Info', 'Pipeline', 'Model File', 'Pipeline Config'];

const StepProgress = ({ current }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const done = current > step;
        const active = current === step;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                done    ? 'bg-primary-600 text-white' :
                active  ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                          'bg-slate-200 text-slate-500'
              }`}>
                {done ? <CheckCircleIcon className="h-5 w-5" /> : step}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-primary-700' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mb-5 transition-colors ${current > step ? 'bg-primary-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

export const UploadModelPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [showHFSearch, setShowHFSearch] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  // Creation progress overlay: null = hidden, array of step objects = visible
  const [progressSteps, setProgressSteps] = useState(null);

  // ── Step 1: Model metadata ─────────────────────────────────────────────────
  const [meta, setMeta] = useState({
    name: '', description: '', category: 'utility',
    task: '', tags: '', license_type: 'unknown',
    hf_model_id: '', is_public: true,
  });
  const [metaErrors, setMetaErrors] = useState({});

  // ── Step 2: Version details ────────────────────────────────────────────────
  const [version, setVersion] = useState({ version_name: '1.0.0', changelog: '' });
  const [versionErrors, setVersionErrors] = useState({});

  // ── Step 3: Model file ─────────────────────────────────────────────────────
  const [fileMode, setFileMode] = useState('upload'); // 'upload' | 'hf'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [hfFiles, setHfFiles] = useState([]);
  const [loadingHfFiles, setLoadingHfFiles] = useState(false);
  const [hfFilesError, setHfFilesError] = useState(null);
  const [selectedHfFile, setSelectedHfFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // ── Step 4: Pipeline ───────────────────────────────────────────────────────
  // pipelineChoice: 'manual' | 'generate' | 'skip'
  const [pipelineChoice, setPipelineChoice] = useState(null);
  const [showPipelineWizard, setShowPipelineWizard] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState(null); // set after manual edit

  // ── HF file loading ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meta.hf_model_id.trim()) { setHfFiles([]); return; }
    setLoadingHfFiles(true);
    setHfFilesError(null);
    fetchHFTfliteFiles(meta.hf_model_id.trim())
      .then(files => {
        setHfFiles(files);
        if (files.length === 1) setSelectedHfFile(files[0]);
        else setSelectedHfFile(null);
      })
      .catch(err => setHfFilesError(err.message))
      .finally(() => setLoadingHfFiles(false));
  }, [meta.hf_model_id]);

  useEffect(() => {
    if (hfFiles.length > 0) setFileMode('hf');
  }, [hfFiles]);

  // ── HF search autofill ─────────────────────────────────────────────────────
  const handleHFModelSelect = (hfModelData) => {
    setMeta(prev => ({
      ...prev,
      name: hfModelData.name || prev.name,
      description: hfModelData.description || prev.description,
      category: hfModelData.category || prev.category,
      tags: Array.isArray(hfModelData.tags) ? hfModelData.tags.join(', ') : prev.tags,
      task: hfModelData.task || prev.task,
      hf_model_id: hfModelData.hf_model_id || prev.hf_model_id,
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateMeta = () => {
    const e = {};
    if (!meta.name.trim()) e.name = 'Model name is required';
    if (!meta.description.trim()) e.description = 'Description is required';
    setMetaErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateVersion = () => {
    const e = {};
    if (!version.version_name.trim()) e.version_name = 'Version name is required';
    setVersionErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateFile = () => {
    if (fileMode === 'upload' && !uploadedFile) {
      setFileError('Please select a .tflite file to upload');
      return false;
    }
    if (fileMode === 'hf' && !selectedHfFile) {
      setFileError('Please select a model file from the list');
      return false;
    }
    setFileError('');
    return true;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentStep === 1 && !validateMeta()) return;
    if (currentStep === 2 && !validateVersion()) return;
    if (currentStep === 3 && !validateFile()) return;
    setCurrentStep(s => s + 1);
  };

  // ── File input handler ─────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.tflite')) { setFileError('Only .tflite files are supported'); return; }
    setUploadedFile(file);
    setFileError('');
  };

  // ── Pipeline wizard handlers ───────────────────────────────────────────────
  const handlePipelineWizardSave = (config) => {
    setPipelineConfig(config);
    setShowPipelineWizard(false);
    setPipelineChoice('manual');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!pipelineChoice) {
      setSubmitError('Please choose a pipeline option.');
      return;
    }
    setSubmitError('');

    // Build the step list for the progress overlay
    const steps = [
      { id: 'model',   label: 'Creating model record',           status: 'active'  },
      { id: 'upload',  label: fileMode === 'upload'
          ? `Uploading ${uploadedFile?.name ?? 'model file'}`
          : 'Linking model file from Hugging Face',              status: 'pending' },
      { id: 'version', label: 'Creating pipeline',               status: 'pending' },
      ...(pipelineChoice === 'generate'
        ? [{ id: 'pipeline', label: 'Generating AI pipeline…',         status: 'pending' }]
        : pipelineChoice === 'manual' && pipelineConfig
        ? [{ id: 'pipeline', label: 'Saving pipeline configuration',  status: 'pending' }]
        : []),
    ];
    setProgressSteps(steps);

    const advance = (id) => setProgressSteps(prev =>
      prev ? prev.map(s =>
        s.id === id ? { ...s, status: 'done' } :
        // activate the next pending step automatically
        s.status === 'pending' && prev.findIndex(x => x.id === id) === prev.findIndex(x => x.id === s.id) - 1
          ? { ...s, status: 'active' }
          : s
      ) : prev
    );
    const activate = (id) => setProgressSteps(prev =>
      prev ? prev.map(s => s.id === id ? { ...s, status: 'active' } : s) : prev
    );

    try {
      // 1. Create model
      const newModel = await ApiService.createModel({
        name: meta.name.trim(),
        description: meta.description.trim(),
        category: meta.category,
        task: meta.task.trim() || null,
        tags: meta.tags.split(',').map(t => t.trim()).filter(Boolean),
        license_type: meta.license_type,
        hf_model_id: meta.hf_model_id.trim() || null,
        is_public: meta.is_public,
      });
      advance('model');

      // 2. Resolve file URL
      activate('upload');
      let tfliteUrl, fileSizeBytes = 0, isHostedByUs = false;
      if (fileMode === 'upload') {
        const { data: { user } } = await supabase.auth.getUser();
        const path = `${user.id}/${generateShortId()}/${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(MODEL_FILES_BUCKET)
          .upload(path, uploadedFile, { contentType: 'application/octet-stream' });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from(MODEL_FILES_BUCKET).getPublicUrl(path);
        tfliteUrl = publicUrl;
        fileSizeBytes = uploadedFile.size;
        isHostedByUs = true;
      } else {
        tfliteUrl = selectedHfFile.url;
        fileSizeBytes = selectedHfFile.size_bytes;
      }
      advance('upload');

      // 3. Create version
      activate('version');
      const newVersion = await ApiService.createModelVersion(newModel.id, {
        version_name: version.version_name.trim(),
        commit_sha: generateShortId(),
        assets: { tflite: tfliteUrl },
        changelog: version.changelog.trim() || null,
        license_type: meta.license_type,
        is_commercial_safe: false,
        is_hosted_by_us: isHostedByUs,
        file_size_bytes: fileSizeBytes,
        ...(pipelineChoice === 'manual' && pipelineConfig ? { pipeline_spec: pipelineConfig } : {}),
      });
      advance('version');

      // 4. Pipeline
      if (pipelineChoice === 'generate') {
        activate('pipeline');
        await ApiService.generatePipeline(newVersion.id).catch(() => {});
        advance('pipeline');
      } else if (pipelineChoice === 'manual' && pipelineConfig) {
        advance('pipeline');
      }

      // Hold the completed state briefly so the user can see all ticks
      await new Promise(r => setTimeout(r, 900));
      navigate(`/models/${newModel.id}`);
    } catch (err) {
      setProgressSteps(null);
      setSubmitError(err.response?.data?.detail || err.message || 'Failed to create model.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Create Model</h1>
        <p className="text-slate-500">Add a new edge-AI model to the platform</p>
      </div>

      {currentStep === 1 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-slate-50 border border-primary-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-900 text-sm">Quick-start: Import from Hugging Face</p>
              <p className="text-xs text-slate-500">Auto-fill metadata from an existing HF repo</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowHFSearch(true)}>Search HF</Button>
        </div>
      )}

      {showHFSearch && (
        <HuggingFaceSearch onModelSelect={handleHFModelSelect} onClose={() => setShowHFSearch(false)} />
      )}

      {/* ── Creation progress overlay ──────────────────────────────────── */}
      {progressSteps && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 space-y-6">
            {/* Animated icon */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <CpuChipIcon className="h-10 w-10 text-primary-600" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-4 border-primary-300 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-pulse opacity-60" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">Building your model…</h2>
              <p className="text-sm text-slate-500 mt-1">Just a moment while we set everything up</p>
            </div>

            <div className="space-y-3">
              {progressSteps.map(step => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                    {step.status === 'done' && (
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    {step.status === 'active' && (
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <ArrowPathIcon className="h-4 w-4 text-primary-600 animate-spin" />
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      </div>
                    )}
                  </div>
                  <span className={`text-sm transition-colors ${
                    step.status === 'done'    ? 'text-slate-400 line-through' :
                    step.status === 'active'  ? 'text-slate-900 font-semibold' :
                                                'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline wizard opens on top of the page when triggered from step 4 */}
      {showPipelineWizard && (
        <PipelineConfigWizard
          initialConfig={pipelineConfig}
          onSave={handlePipelineWizardSave}
          onCancel={() => setShowPipelineWizard(false)}
        />
      )}

      <StepProgress current={currentStep} />

      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">

        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <XMarkIcon className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* ── Step 1: Model Info ─────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Model Information</h2>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={meta.name}
                onChange={e => setMeta(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. MobileNet v3 Small"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${metaErrors.name ? 'border-red-400' : 'border-slate-300'}`}
              />
              {metaErrors.name && <p className="text-xs text-red-600 mt-1">{metaErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={meta.description}
                onChange={e => setMeta(p => ({ ...p, description: e.target.value }))}
                placeholder="What does this model do? What are its capabilities and limitations?"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${metaErrors.description ? 'border-red-400' : 'border-slate-300'}`}
              />
              {metaErrors.description && <p className="text-xs text-red-600 mt-1">{metaErrors.description}</p>}
            </div>

            <div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">License</label>
                <select
                  value={meta.license_type}
                  onChange={e => setMeta(p => ({ ...p, license_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[['apache-2.0','Apache 2.0'],['mit','MIT'],['bsd','BSD'],['cc-by-4.0','CC BY 4.0'],['openrail','OpenRAIL'],['gpl-3.0','GPL 3.0'],['unknown','Unknown']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Task Type</label>
              <input
                type="text"
                value={meta.task}
                onChange={e => setMeta(p => ({ ...p, task: e.target.value }))}
                placeholder="e.g. image-classification, object-detection"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Hugging Face Model ID <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={meta.hf_model_id}
                onChange={e => setMeta(p => ({ ...p, hf_model_id: e.target.value }))}
                placeholder="e.g. google/mobilenet_v2_1.0_224"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Link to an existing HF repo to select the model file from it in the next step.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Tags</label>
              <input
                type="text"
                value={meta.tags}
                onChange={e => setMeta(p => ({ ...p, tags: e.target.value }))}
                placeholder="e.g. vision, classification, mobile"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">Separate tags with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeta(p => ({ ...p, is_public: true }))}
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all ${meta.is_public ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <GlobeAltIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${meta.is_public ? 'text-primary-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${meta.is_public ? 'text-primary-800' : 'text-slate-700'}`}>Public</p>
                    <p className="text-xs text-slate-500 mt-0.5">Anyone can view, download, and contribute pipelines</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMeta(p => ({ ...p, is_public: false }))}
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all ${!meta.is_public ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <LockClosedIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${!meta.is_public ? 'text-slate-700' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${!meta.is_public ? 'text-slate-900' : 'text-slate-700'}`}>Private</p>
                    <p className="text-xs text-slate-500 mt-0.5">Only you can see and use this model</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Pipeline Details ─────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Pipeline Details</h2>
            <p className="text-sm text-slate-500">
              This is the first pipeline for your model. You can add more pipelines later from the model detail page.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Pipeline Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={version.version_name}
                onChange={e => setVersion(p => ({ ...p, version_name: e.target.value }))}
                placeholder="e.g. 1.0.0 or initial"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${versionErrors.version_name ? 'border-red-400' : 'border-slate-300'}`}
              />
              {versionErrors.version_name && <p className="text-xs text-red-600 mt-1">{versionErrors.version_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Changelog <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={version.changelog}
                onChange={e => setVersion(p => ({ ...p, changelog: e.target.value }))}
                placeholder="Initial release"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Model File ─────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Model File</h2>

            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm font-medium">
              <button
                type="button"
                onClick={() => setFileMode('upload')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${fileMode === 'upload' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setFileMode('hf')}
                disabled={!meta.hf_model_id.trim()}
                title={!meta.hf_model_id.trim() ? 'Set a Hugging Face Model ID in Step 1 to use this option' : ''}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${fileMode === 'hf' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <SparklesIcon className="h-4 w-4" />
                Hugging Face Repo
              </button>
            </div>

            {fileMode === 'upload' && (
              <div>
                <input ref={fileInputRef} type="file" accept=".tflite" onChange={handleFileSelect} className="hidden" />
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-4 border border-primary-200 bg-primary-50 rounded-xl">
                    <DocumentIcon className="h-8 w-8 text-primary-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(uploadedFile.size)}</p>
                    </div>
                    <button type="button" onClick={() => { setUploadedFile(null); fileInputRef.current.value = ''; }} className="p-1 hover:bg-primary-100 rounded-lg">
                      <XMarkIcon className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <ArrowUpTrayIcon className="h-8 w-8 text-slate-400 group-hover:text-primary-500 transition-colors" />
                    <div className="text-center">
                      <p className="font-medium text-slate-700 group-hover:text-primary-700">Click to select a .tflite file</p>
                      <p className="text-xs text-slate-400 mt-0.5">The file will be stored in Jacana's model storage</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {fileMode === 'hf' && (
              <div>
                {loadingHfFiles ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Loading files from Hugging Face…
                  </div>
                ) : hfFilesError ? (
                  <p className="text-sm text-red-600 py-2">{hfFilesError}</p>
                ) : hfFiles.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    No .tflite files found in <span className="font-mono font-medium">{meta.hf_model_id}</span>.
                    Try uploading a file instead.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hfFiles.map(f => (
                      <button
                        key={f.url}
                        type="button"
                        onClick={() => setSelectedHfFile(f)}
                        className={`w-full flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-all ${selectedHfFile?.url === f.url ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <DocumentIcon className={`h-5 w-5 flex-shrink-0 ${selectedHfFile?.url === f.url ? 'text-primary-600' : 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedHfFile?.url === f.url ? 'text-primary-800' : 'text-slate-700'}`}>{f.filename}</p>
                          {f.size_bytes > 0 && <p className="text-xs text-slate-400">{formatBytes(f.size_bytes)}</p>}
                        </div>
                        {selectedHfFile?.url === f.url && <CheckCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {fileError && <p className="text-sm text-red-600">{fileError}</p>}
          </div>
        )}

        {/* ── Step 4: Pipeline ───────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pipeline Configuration</h2>
              <p className="text-sm text-slate-500 mt-1">
                A pipeline tells the app how to pre-process inputs and interpret model outputs on-device.
              </p>
            </div>

            <div className="space-y-3">
              {/* Create Manually */}
              <button
                type="button"
                onClick={() => { setPipelineChoice('manual'); setShowPipelineWizard(true); }}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all group ${pipelineChoice === 'manual' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${pipelineChoice === 'manual' ? 'bg-primary-200' : 'bg-primary-100 group-hover:bg-primary-200'}`}>
                    <PencilSquareIcon className="h-5 w-5 text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">Create Manually</p>
                      {pipelineChoice === 'manual' && pipelineConfig && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {pipelineChoice === 'manual' && pipelineConfig
                        ? 'Pipeline configured — click to edit.'
                        : 'Build the pipeline step-by-step using the visual or JSON editor.'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Generate with AI */}
              <button
                type="button"
                onClick={() => setPipelineChoice('generate')}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all group ${pipelineChoice === 'generate' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${pipelineChoice === 'generate' ? 'bg-amber-200' : 'bg-amber-100 group-hover:bg-amber-200'}`}>
                    <SparklesIcon className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Generate with AI</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Gemini will attempt to generate the pipeline automatically from the model's metadata after creation.
                    </p>
                  </div>
                </div>
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={() => setPipelineChoice('skip')}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all group ${pipelineChoice === 'skip' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${pipelineChoice === 'skip' ? 'bg-slate-200' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <XMarkIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Skip for Now</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Create the model without a pipeline. You can configure it later from the model detail page.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => currentStep === 1 ? navigate(-1) : setCurrentStep(s => s - 1)}
            className="flex-1"
            disabled={!!progressSteps}
          >
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2"
            >
              Next <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!pipelineChoice || !!progressSteps}
              className="flex-1"
            >
              Create Model
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
