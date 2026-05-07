import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, RectangleStackIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Badge from './Badge';
import { isTaskSupported } from '../lib/supportedTasks';

export const ModelCard = ({ model, from = 'browse' }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Object Detection': 'primary',
      'Image Classification': 'lime',
      'Pose Estimation': 'amber',
      'Semantic Segmentation': 'rose',
      'Text Generation': 'teal',
      'Automatic Speech Recognition': 'blue',
      'Custom': 'slate',
    };
    return colors[category] || 'primary';
  };

  const getBorderColor = (category) => {
    const colors = {
      'Object Detection': 'border-primary-500',
      'Image Classification': 'border-lime-500',
      'Pose Estimation': 'border-amber-500',
      'Semantic Segmentation': 'border-rose-500',
      'Text Generation': 'border-teal-500',
      'Automatic Speech Recognition': 'border-blue-500',
      'Custom': 'border-slate-400',
    };
    return colors[category] || 'border-primary-500';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  };

  const rating = model.rating_weighted_avg?.toFixed(1) || '0.0';
  const taskLabel = model.task
    ? model.task.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <Link
      to={`/models/${model.id}`}
      state={{ from }}
      className={`group block bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover hover:border-primary-300 transition-all duration-300 ease-smooth border-t-4 ${getBorderColor(model.category)} hover:-translate-y-1`}
    >
      <div className="p-4 space-y-2">
        {/* Row 1: task (left) + badges (right) */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold text-slate-900 truncate">
            {taskLabel ?? '—'}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {model.is_public === false && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                <LockClosedIcon className="h-3 w-3" />
                Private
              </span>
            )}
            {model.best_version_status === 'verified' && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-semibold bg-secondary-100 text-secondary-700 cursor-help"
                title="This model has a verified pipeline and is ready for on-device inference."
              >
                Pipeline ✓
              </span>
            )}
            {model.task && (
              isTaskSupported(model.task) ? (
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 cursor-help"
                  title="This model's task is supported by the Jacana app — it can be downloaded and run on-device."
                >
                  Supported
                </span>
              ) : (
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 cursor-help"
                  title="The Jacana app does not yet have an inference pipeline for this task type. The model can still be browsed but cannot be run on-device."
                >
                  Unsupported
                </span>
              )
            )}
          </div>
        </div>

        {/* Row 3: model name */}
        <h3 className="text-sm font-medium text-slate-500 group-hover:text-primary-600 truncate transition-colors">
          {model.name}
        </h3>

        {/* Row 3: description */}
        <p className="text-sm text-slate-600 line-clamp-1">
          {model.description || 'No description provided.'}
        </p>

        {/* Row 4: stats */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            <span>{model.total_download_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <StarSolidIcon className="h-3.5 w-3.5 text-accent-amber" />
            <span className="font-medium text-slate-700">{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <RectangleStackIcon className="h-3.5 w-3.5" />
            <span>{model.version_count ?? 0} {model.version_count === 1 ? 'version' : 'versions'}</span>
          </div>
          {formatFileSize(model.file_size_bytes) && (
            <span className="text-slate-500">
              {formatFileSize(model.file_size_bytes)}
            </span>
          )}
          {model.license_type && (
            <span className="ml-auto px-1.5 py-0.5 bg-slate-100 rounded uppercase tracking-wide">
              {model.license_type}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
