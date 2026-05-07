import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../api/client';
import { ModelCard } from '../components/ModelCard';
import Button from '../components/Button';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import LoadingCard from '../components/LoadingCard';
import EmptyState from '../components/EmptyState';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { isTaskSupported } from '../lib/supportedTasks';

const FILTER_SESSION_KEY = 'browse_filters';

const loadSavedFilters = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FILTER_SESSION_KEY) || '{}');
  } catch {
    return {};
  }
};

export const BrowseModelsPage = () => {
  const saved = loadSavedFilters();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(saved.searchQuery ?? '');
  const [categoryFilter, setCategoryFilter] = useState(saved.categoryFilter ?? []);
  const [taskFilter, setTaskFilter] = useState(saved.taskFilter ?? []);
  const [hasVersionsOnly, setHasVersionsOnly] = useState(saved.hasVersionsOnly ?? false);
  const [statusFilter, setStatusFilter] = useState(saved.statusFilter ?? []);
  const [appSupportFilter, setAppSupportFilter] = useState(saved.appSupportFilter ?? []);
  const [sortBy, setSortBy] = useState(saved.sortBy ?? 'newest');
  const [lastSyncedFilter, setLastSyncedFilter] = useState(saved.lastSyncedFilter ?? '');
  const [currentPage, setCurrentPage] = useState(saved.currentPage ?? 1);
  const itemsPerPage = 50;

  // Fetch all models
  useEffect(() => {
    ApiService.getModels()
      .then(setModels)
      .catch(err => console.error("Failed to load models:", err))
      .finally(() => setLoading(false));
  }, []);

  // Persist filter state for the session
  useEffect(() => {
    sessionStorage.setItem(FILTER_SESSION_KEY, JSON.stringify({
      searchQuery, categoryFilter, taskFilter, hasVersionsOnly, statusFilter, appSupportFilter, sortBy, lastSyncedFilter, currentPage,
    }));
  }, [searchQuery, categoryFilter, taskFilter, hasVersionsOnly, sortBy, lastSyncedFilter, currentPage]);

  // Filter and sort logic
  const filteredModels = useMemo(() => {
    let result = [...models];

    // Category filter (multi)
    if (categoryFilter.length > 0) {
      result = result.filter(m => categoryFilter.includes(m.category));
    }

    // Task filter (multi)
    if (taskFilter.length > 0) {
      result = result.filter(m => taskFilter.includes(m.task));
    }

    // Has versions filter
    if (hasVersionsOnly) {
      result = result.filter(m => (m.version_count ?? 0) >= 1);
    }

    // App support filter (multi-select: 'supported' | 'unsupported')
    if (appSupportFilter.length > 0 && appSupportFilter.length < 2) {
      const wantSupported = appSupportFilter.includes('supported');
      result = result.filter(m => isTaskSupported(m.task) === wantSupported);
    }

    // Pipeline status filter (multi-select)
    if (statusFilter.length > 0) {
      result = result.filter(m => statusFilter.includes(m.best_version_status ?? 'none'));
    }

    // Last synced filter
    if (lastSyncedFilter) {
      const days = parseInt(lastSyncedFilter, 10);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      result = result.filter(m => m.last_synced_at && new Date(m.last_synced_at) >= cutoff);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    const STATUS_PRIORITY = { verified: 0, pending: 1, missing: 2 };
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'popular':
        result.sort((a, b) => b.total_download_count - a.total_download_count);
        break;
      case 'highest-rated':
        result.sort((a, b) => (b.rating_weighted_avg || 0) - (a.rating_weighted_avg || 0));
        break;
      case 'version-status':
        result.sort((a, b) => {
          const pa = STATUS_PRIORITY[a.best_version_status] ?? 99;
          const pb = STATUS_PRIORITY[b.best_version_status] ?? 99;
          return pa - pb;
        });
        break;
      case 'last-synced':
        result.sort((a, b) => {
          if (!a.last_synced_at && !b.last_synced_at) return 0;
          if (!a.last_synced_at) return 1;
          if (!b.last_synced_at) return -1;
          return new Date(b.last_synced_at) - new Date(a.last_synced_at);
        });
        break;
      default:
        break;
    }

    return result;
  }, [models, searchQuery, categoryFilter, taskFilter, hasVersionsOnly, statusFilter, appSupportFilter, sortBy, lastSyncedFilter]);

  // Get unique categories and tasks, sorted by model count descending
  const categories = [...new Set(models.map(m => m.category))]
    .sort((a, b) => models.filter(m => m.category === b).length - models.filter(m => m.category === a).length);
  const tasks = [...new Set(models.map(m => m.task).filter(Boolean))]
    .sort((a, b) => models.filter(m => m.task === b).length - models.filter(m => m.task === a).length);

  // Pagination logic
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModels = filteredModels.slice(startIndex, startIndex + itemsPerPage);

  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handlePageChange = (page, scrollToTop = true) => {
    setCurrentPage(page);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Pagination = ({ scrollToTop = true }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1, scrollToTop)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (totalPages <= 5) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum, scrollToTop)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum, scrollToTop)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return <span key={`ellipsis-${pageNum}`} className="px-2 text-slate-600">...</span>;
            }
            return null;
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1, scrollToTop)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const filterOptions = [
    {
      id: 'task',
      label: 'Task Type',
      multi: true,
      activeValue: taskFilter,
      options: tasks.map(t => ({ label: t, value: t })),
    },
    {
      id: 'appSupport',
      label: 'App Support',
      multi: true,
      activeValue: appSupportFilter,
      options: [
        { label: 'Supported',   value: 'supported'   },
        { label: 'Unsupported', value: 'unsupported' },
      ],
    },
    {
      id: 'status',
      label: 'Pipeline Status',
      multi: true,
      activeValue: statusFilter,
      options: [
        { label: 'Verified', value: 'verified' },
        { label: 'Pending',  value: 'pending'  },
        { label: 'Missing',  value: 'missing'  },
      ],
    },
    {
      id: 'lastSynced',
      label: 'Last Synced',
      activeValue: lastSyncedFilter,
      options: [
        { label: 'Past 7 days',  value: '7'  },
        { label: 'Past 30 days', value: '30' },
        { label: 'Past 90 days', value: '90' },
      ],
    },
    {
      id: 'sort',
      label: 'Sort By',
      activeValue: sortBy,
      options: [
        { label: 'Newest',           value: 'newest'         },
        { label: 'Most Downloaded',  value: 'popular'        },
        { label: 'Highest Rated',    value: 'highest-rated'  },
        { label: 'Pipeline Status',  value: 'version-status' },
        { label: 'Last Synced',      value: 'last-synced'    },
      ],
    },
  ];

  const handleFilterChange = (filterId, value) => {
    if (filterId === 'category') {
      setCategoryFilter(value ?? []);
    } else if (filterId === 'task') {
      setTaskFilter(value ?? []);
    } else if (filterId === 'appSupport') {
      setAppSupportFilter(value ?? []);
    } else if (filterId === 'status') {
      setStatusFilter(value);
    } else if (filterId === 'lastSynced') {
      setLastSyncedFilter(value ?? '');
    } else if (filterId === 'sort') {
      setSortBy(value);
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Models</h1>
        <p className="text-slate-600">Explore {models.length} mobile-optimized AI models</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search models by name or description..."
          className="w-full"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <FunnelIcon className="h-4 w-4 text-slate-600" />
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={hasVersionsOnly}
              onChange={e => { setHasVersionsOnly(e.target.checked); setCurrentPage(1); }}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Has versions
          </label>
          {(searchQuery || categoryFilter.length > 0 || taskFilter.length > 0 || hasVersionsOnly || appSupportFilter.length > 0 || statusFilter.length > 0 || lastSyncedFilter || sortBy !== 'newest') && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter([]);
                setTaskFilter([]);
                setHasVersionsOnly(false);
                setAppSupportFilter([]);
                setStatusFilter([]);
                setLastSyncedFilter('');
                setSortBy('newest');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-600">
        Showing {paginatedModels.length > 0 ? startIndex + 1 : 0} – {Math.min(startIndex + itemsPerPage, filteredModels.length)} of {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : paginatedModels.length > 0 ? (
        <>
          <Pagination scrollToTop={false} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>

          <Pagination scrollToTop={true} />
        </>
      ) : (
        <EmptyState
          title={searchQuery || categoryFilter.length > 0 || taskFilter.length > 0 || hasVersionsOnly || appSupportFilter.length > 0 || statusFilter.length > 0 || lastSyncedFilter ? "No models found" : "No models available"}
          description={
            searchQuery || categoryFilter.length > 0 || taskFilter.length > 0 || hasVersionsOnly || appSupportFilter.length > 0 || statusFilter.length > 0 || lastSyncedFilter
              ? "Try adjusting your search or filters"
              : "Check back later for new models"
          }
        />
      )}
    </div>
  );
};
