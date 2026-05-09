import React, { useState } from 'react';
import { ExclamationTriangleIcon, Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// ── Step pill row (operations) — collapsible ──────────────────────────────────

const StepRow = ({ step, accent }) => {
  const [open, setOpen] = useState(false);
  const name = step.step || step.action || '?';
  const params = step.params || {};
  const paramEntries = Object.entries(params);
  const hasParams = paramEntries.length > 0;

  return (
    <div className="py-0.5">
      <button
        onClick={() => hasParams && setOpen(o => !o)}
        className={`flex items-center gap-2 w-full text-left ${hasParams ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="text-slate-300 text-xs flex-shrink-0">→</span>
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0 ${accent}`}>
          {name}
        </span>
        {hasParams && (
          <ChevronDownIcon className={`h-3 w-3 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && hasParams && (
        <div className="ml-5 mt-1 mb-1 pl-2 border-l border-slate-200 space-y-0.5">
          {paramEntries.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5 text-xs">
              <span className="text-slate-400">{k}:</span>
              <span className="font-mono text-slate-600">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tensor chip row (data objects) ────────────────────────────────────────────

const TensorRow = ({ tensor }) => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono mr-1 mb-1">
    <span className="font-semibold text-slate-700">{tensor.name}</span>
    <span className="text-slate-400">[{Array.isArray(tensor.shape) ? tensor.shape.join(', ') : tensor.shape}]</span>
    <span className="text-slate-400">{tensor.dtype}</span>
  </div>
);

const TensorGroup = ({ tensors }) =>
  tensors && tensors.length > 0 ? (
    <div className="flex flex-wrap mt-1 mb-2">{tensors.map((t, i) => <TensorRow key={i} tensor={t} />)}</div>
  ) : null;

// ── Divider with label ────────────────────────────────────────────────────────

const SectionDivider = ({ label, color }) => (
  <div className="flex items-center gap-2 my-3">
    <div className={`flex-1 h-px ${color}`} />
    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
      label === 'INPUT'    ? 'bg-primary-100 text-primary-700' :
      label === 'OUTPUT'   ? 'bg-teal-100 text-teal-700'     :
      label === 'METADATA' ? 'bg-slate-200 text-slate-600'   :
                             'bg-amber-100 text-amber-700'
    }`}>{label}</span>
    <div className={`flex-1 h-px ${color}`} />
  </div>
);

// ── Visual view ───────────────────────────────────────────────────────────────

const VisualView = ({ pipelineSpec }) => {
  const hasNewFormat = pipelineSpec.metadata && Array.isArray(pipelineSpec.preprocessing);

  if (hasNewFormat) {
    const meta = pipelineSpec.metadata?.[0] || {};
    const preBlocks  = pipelineSpec.preprocessing  || [];
    const postBlocks = pipelineSpec.postprocessing || [];

    return (
      <div className="space-y-1">
        {/* Metadata */}
        <SectionDivider label="METADATA" color="bg-slate-200" />
        <div className="flex flex-wrap items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg mb-3">
          {meta.model_name && <span className="font-semibold text-slate-800">{meta.model_name}</span>}
          {meta.model_task && <><span className="text-slate-300">·</span><span className="text-slate-500">{meta.model_task}</span></>}
          {meta.framework  && <><span className="text-slate-300">·</span><span className="text-slate-500">{meta.framework}</span></>}
          {meta.schema_version && <><span className="text-slate-300">·</span><span className="text-slate-400">v{meta.schema_version}</span></>}
        </div>

        {/* INPUT */}
        {preBlocks.length > 0 && (
          <div>
            <SectionDivider label="INPUT" color="bg-primary-200" />
            <TensorGroup tensors={pipelineSpec.inputs} />
            {preBlocks.map((block, bi) => (
              <div key={bi} className="mt-2">
                <p className="text-xs text-slate-400 mb-0.5">
                  <span className="font-mono text-primary-600">{block.input_name}</span>
                  {block.expects_type && <span> · {block.expects_type}</span>}
                </p>
                {(block.steps || []).map((s, si) => (
                  <StepRow key={si} step={s} accent="bg-primary-100 text-primary-700" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Model inference */}
        <SectionDivider label="MODEL" color="bg-amber-200" />

        {/* OUTPUT */}
        {postBlocks.length > 0 && (
          <div>
            <SectionDivider label="OUTPUT" color="bg-teal-200" />
            <TensorGroup tensors={pipelineSpec.outputs} />
            {postBlocks.map((block, bi) => (
              <div key={bi} className="mt-2">
                <p className="text-xs text-slate-400 mb-0.5">
                  <span className="font-mono text-teal-600">{block.output_name}</span>
                  {block.interpretation && <span> · {block.interpretation}</span>}
                </p>
                {(block.steps || []).map((s, si) => (
                  <StepRow key={si} step={s} accent="bg-teal-100 text-teal-700" />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Legacy format ──────────────────────────────────────────────────────────
  const preSteps  = pipelineSpec.preprocessing  || [];
  const postSteps = pipelineSpec.postprocessing || [];

  return (
    <div className="space-y-1">
      {pipelineSpec.schema_version && (
        <p className="text-xs text-slate-400 mb-3">schema v{pipelineSpec.schema_version}</p>
      )}

      {preSteps.length > 0 && (
        <div>
          <SectionDivider label="INPUT" color="bg-primary-200" />
          {preSteps.map((s, i) => <StepRow key={i} step={s} accent="bg-primary-100 text-primary-700" />)}
        </div>
      )}

      <SectionDivider label="MODEL" color="bg-amber-200" />

      {postSteps.length > 0 && (
        <div>
          <SectionDivider label="OUTPUT" color="bg-teal-200" />
          {postSteps.map((s, i) => <StepRow key={i} step={s} accent="bg-teal-100 text-teal-700" />)}
        </div>
      )}
    </div>
  );
};

// ── JSON view ─────────────────────────────────────────────────────────────────

const JsonView = ({ pipelineSpec }) => (
  <pre className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[60vh] leading-relaxed whitespace-pre-wrap break-words">
    {JSON.stringify(pipelineSpec, null, 2)}
  </pre>
);

// ── Main component ────────────────────────────────────────────────────────────

const PipelineConfigViewer = ({ pipelineSpec, onEdit, isEditable = false, activeTab: activeTabProp, onTabChange, hideTabBar = false }) => {
  const [activeTabInternal, setActiveTabInternal] = useState('visual');
  const activeTab = activeTabProp ?? activeTabInternal;
  const setActiveTab = onTabChange ?? setActiveTabInternal;

  const isValidSpec = pipelineSpec && (
    pipelineSpec.metadata ||
    pipelineSpec.preprocessing ||
    pipelineSpec.postprocessing
  );

  if (!isValidSpec) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-900">No Pipeline Configuration</p>
          <p className="text-sm text-yellow-800 mt-0.5">
            This pipeline doesn't have a configuration file yet.
            {isEditable && ' Create one to define how this model should be executed.'}
          </p>
          {isEditable && (
            <button
              onClick={onEdit}
              className="mt-3 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Configuration
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar + edit button — hidden when tab is controlled by the parent */}
      {(!hideTabBar || isEditable) && (
      <div className="flex items-center justify-between">
        {!hideTabBar && (
          <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm font-medium">
            {['visual', 'json'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab === 'json' ? 'JSON' : 'Visual'}
              </button>
            ))}
          </div>
        )}
        {isEditable && (
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>
      )}

      {/* Content */}
      {activeTab === 'visual'
        ? <VisualView pipelineSpec={pipelineSpec} />
        : <JsonView  pipelineSpec={pipelineSpec} />
      }
    </div>
  );
};

export default PipelineConfigViewer;
