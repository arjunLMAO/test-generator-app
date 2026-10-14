import React, { useEffect, useState } from 'react';
import { Eye, Maximize2, Minus, Plus, RotateCcw, X, AlertCircle } from 'lucide-react';
import { VisualAsset, VisualStatus } from '../types/jee';
import { canonicalizeImageUrl } from '../services/VisualAssetResolver';

export interface VisualDiagramRendererProps {
  asset?: VisualAsset | null;
  imageUrl?: string | null;
  caption?: string;
  className?: string;
  enableZoom?: boolean;
}

export const VisualDiagramRenderer: React.FC<VisualDiagramRendererProps> = ({
  asset,
  imageUrl,
  caption,
  className = '',
  enableZoom = true,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const hasSvg = Boolean(asset?.svgContent);
  const resolvedImgUrl = imageUrl || asset?.imageUrl || asset?.url;
  const hasImg = Boolean(resolvedImgUrl && !imageError && !/^\[(image|diagram|figure|graph|reaction|structure|asset):/i.test(resolvedImgUrl));
  const displayCaption = caption || asset?.caption;

  if (!hasSvg && !hasImg) {
    return null;
  }

  const handleOpen = () => {
    if (!enableZoom) return;
    setZoomLevel(1);
    setIsLightboxOpen(true);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(0.75, prev - 0.25));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  return (
    <div className={`my-4 w-full ${className}`}>
      {/* Inline Preview Container */}
      <div
        onClick={handleOpen}
        className={`group relative max-w-2xl mx-auto rounded-xl overflow-hidden border border-slate-700/80 bg-[#070D1E]/90 shadow-lg transition-all duration-200 ${
          enableZoom ? 'cursor-zoom-in hover:border-blue-500/60 hover:shadow-blue-500/10' : ''
        }`}
      >
        {/* Visual Content */}
        <div className="p-3 sm:p-4 flex items-center justify-center min-h-[160px]">
          {hasSvg ? (
            <div
              className="w-full flex justify-center items-center [&_svg]:max-h-[320px] [&_svg]:w-auto [&_svg]:mx-auto select-none"
              dangerouslySetInnerHTML={{ __html: asset!.svgContent! }}
            />
          ) : (
            <img
              src={resolvedImgUrl!}
              alt={asset?.altText || 'Problem diagram'}
              onError={() => setImageError(true)}
              className="max-h-[320px] w-auto max-w-full object-contain rounded"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Hover / Click to enlarge overlay indicator */}
        {enableZoom && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-300 opacity-80 group-hover:opacity-100 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-all shadow">
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Click to enlarge</span>
          </div>
        )}

        {/* Caption */}
        {displayCaption && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-400 font-medium">
            {displayCaption}
          </div>
        )}
      </div>

      {/* Lightbox Modal (Non-destructive, does NOT reset test state or timer) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col max-w-5xl w-full max-h-[90vh] bg-[#0A1022] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Diagram View</span>
                {displayCaption && <span className="text-xs text-slate-400 font-normal">({displayCaption})</span>}
              </div>

              {/* Zoom & Close Toolbar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/80 border border-slate-700/70 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono font-medium text-slate-300 select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors ml-0.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Zoomable Canvas */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#070D1E] min-h-[350px]">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full flex items-center justify-center"
              >
                {hasSvg ? (
                  <div
                    className="max-w-3xl w-full flex justify-center [&_svg]:max-h-[550px] [&_svg]:w-auto select-none"
                    dangerouslySetInnerHTML={{ __html: asset!.svgContent! }}
                  />
                ) : (
                  <img
                    src={resolvedImgUrl!}
                    alt={asset?.altText || 'Enlarged problem diagram'}
                    className="max-h-[550px] w-auto max-w-full object-contain rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>

            {/* Footer with Hint */}
            <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
              <span>High-resolution visual rendering</span>
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> or click outside to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface QuestionVisualsProps {
  visuals?: VisualAsset[] | string[];
  visualAsset?: VisualAsset | null;
  imageUrl?: string | null;
  caption?: string;
  visualRequired?: boolean;
  visualStatus?: VisualStatus;
  rawVisualMetadata?: string | null;
  className?: string;
  enableZoom?: boolean;
  questionOrder?: number;
}

/**
 * QuestionVisuals component (Section 9 & 10 of JEE Exam Interface).
 * Renders verified diagram images, SVGs, or clean status notice between question text and options.
 * Strictly prevents raw metadata markers from ever displaying to the student.
 */
export const QuestionVisuals: React.FC<QuestionVisualsProps> = ({
  visuals,
  visualAsset,
  imageUrl,
  caption,
  visualRequired = false,
  visualStatus = 'verified',
  rawVisualMetadata,
  className = '',
  enableZoom = true,
  questionOrder,
}) => {
  // Normalize visual assets list with strict canonical deduplication
  const assetList: VisualAsset[] = [];
  const seenCanonicalKeys = new Set<string>();

  const getCanonicalKey = (item: VisualAsset | string | null | undefined): string | null => {
    if (!item) return null;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed || /^\[(image|diagram|figure|graph|reaction|structure|asset):/i.test(trimmed)) return null;
      if (trimmed.startsWith('data:image/svg+xml') || trimmed.startsWith('<svg')) {
        return `svg:${trimmed.slice(0, 120)}`;
      }
      const c = canonicalizeImageUrl(trimmed);
      return c ? `url:${c}` : null;
    }
    if (typeof item === 'object') {
      if (item.svgContent) {
        return `svg:${item.svgContent.slice(0, 120)}`;
      }
      const u = item.imageUrl || item.url || item.sourceUrl;
      if (u) {
        const c = canonicalizeImageUrl(u);
        return c ? `url:${c}` : null;
      }
    }
    return null;
  };

  // 1. Add primary verified visualAsset first (highest fidelity)
  if (visualAsset && (visualAsset.svgContent || visualAsset.imageUrl || visualAsset.url)) {
    const key = getCanonicalKey(visualAsset);
    if (key) {
      seenCanonicalKeys.add(key);
      assetList.push(visualAsset);
    }
  }

  // 2. Add from visuals array (strictly deduplicated against visualAsset and earlier entries)
  if (Array.isArray(visuals)) {
    for (const v of visuals) {
      const key = getCanonicalKey(v);
      if (!key || seenCanonicalKeys.has(key)) continue;
      seenCanonicalKeys.add(key);

      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed.startsWith('data:image/svg+xml') || trimmed.startsWith('<svg')) {
          assetList.push({
            assetId: `svg-${assetList.length}`,
            type: 'diagram',
            subject: 'Physics',
            chapter: '',
            format: 'svg',
            svgContent: trimmed.startsWith('<svg') ? trimmed : decodeURIComponent(trimmed.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')),
            altText: caption || `Question ${questionOrder || ''} Diagram`,
          });
        } else {
          assetList.push({
            assetId: `img-${assetList.length}`,
            type: 'image',
            subject: 'Physics',
            chapter: '',
            format: 'url',
            imageUrl: trimmed,
            altText: caption || `Question ${questionOrder || ''} Diagram`,
          });
        }
      } else if (typeof v === 'object' && (v.svgContent || v.imageUrl || v.url)) {
        assetList.push(v);
      }
    }
  }

  // 3. Fallback to primary imageUrl only if not already represented in assetList
  if (assetList.length === 0 && imageUrl) {
    const trimmed = imageUrl.trim();
    const key = getCanonicalKey(trimmed);
    if (key && !seenCanonicalKeys.has(key)) {
      seenCanonicalKeys.add(key);
      if (trimmed.startsWith('data:image/svg+xml')) {
        assetList.push({
          assetId: 'primary-svg',
          type: 'diagram',
          subject: 'Physics',
          chapter: '',
          format: 'svg',
          svgContent: decodeURIComponent(trimmed.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')),
          altText: caption || `Question ${questionOrder || ''} Diagram`,
        });
      } else {
        assetList.push({
          assetId: 'primary-img',
          type: 'image',
          subject: 'Physics',
          chapter: '',
          format: 'url',
          imageUrl: trimmed,
          altText: caption || `Question ${questionOrder || ''} Diagram`,
        });
      }
    }
  }

  // If we have resolved visual assets, render them
  if (assetList.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {assetList.map((asset, idx) => (
          <VisualDiagramRenderer
            key={asset.assetId || idx}
            asset={asset}
            imageUrl={asset.imageUrl || asset.url}
            caption={asset.caption || caption}
            enableZoom={enableZoom}
          />
        ))}
      </div>
    );
  }

  // Priority 5: If visual is required but missing, display clean examination notice (NEVER raw metadata string)
  if (visualRequired && visualStatus === 'missing') {
    return (
      <div className={`my-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 block mb-0.5">Examination Diagram Reference</span>
          <span className="text-slate-400">
            This problem references a visual diagram from the original examination paper. All quantitative relationships required for evaluation are defined in the problem statement above.
          </span>
        </div>
      </div>
    );
  }

  return null;
};
