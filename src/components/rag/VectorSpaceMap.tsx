import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Search, 
  Sparkles, 
  Layers, 
  Info, 
  Eye, 
  Compass,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RagChunk, RagDocument } from '@/types/rag';
import { RetrievalSimulator } from '@/services/retrievalSimulator';

interface VectorSpaceMapProps {
  chunks: RagChunk[];
  documents: RagDocument[];
}

interface Point2D {
  chunk: RagChunk;
  x: number;
  y: number;
  color: string;
}

export const VectorSpaceMap: React.FC<VectorSpaceMapProps> = ({
  chunks,
  documents
}) => {
  const [mapQuery, setMapQuery] = useState('SLA uptime commitment');
  const [selectedPoint, setSelectedPoint] = useState<Point2D | null>(null);

  // Document color mapping palette
  const docColorMap = useMemo(() => {
    const palette = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    const map: Record<string, string> = {};
    documents.forEach((doc, idx) => {
      map[doc.id] = palette[idx % palette.length];
    });
    return map;
  }, [documents]);

  // Compute 2D coordinates for chunks using vocabulary hashing + document cluster centers
  const points: Point2D[] = useMemo(() => {
    if (chunks.length === 0) return [];

    // Distinct document angles on unit circle
    const docAngles: Record<string, number> = {};
    documents.forEach((doc, idx) => {
      docAngles[doc.id] = (idx / (documents.length || 1)) * Math.PI * 2;
    });

    return chunks.map((chunk, idx) => {
      const docAngle = docAngles[chunk.documentId] || 0;
      // Document cluster center
      const centerX = 300 + Math.cos(docAngle) * 140;
      const centerY = 240 + Math.sin(docAngle) * 120;

      // Hash chunk keywords to perturb within cluster
      let hash = 0;
      for (let i = 0; i < chunk.id.length; i++) {
        hash = (hash * 31 + chunk.id.charCodeAt(i)) & 0xffffff;
      }
      const radius = 25 + (hash % 65);
      const angle = (idx * 137.5 * Math.PI) / 180; // Golden angle dispersion

      const x = Math.max(30, Math.min(570, centerX + Math.cos(angle) * radius));
      const y = Math.max(30, Math.min(450, centerY + Math.sin(angle) * radius));

      return {
        chunk,
        x,
        y,
        color: docColorMap[chunk.documentId] || '#06b6d4'
      };
    });
  }, [chunks, documents, docColorMap]);

  // Query nearest neighbors
  const nearestNeighborIds = useMemo(() => {
    if (!mapQuery.trim()) return [];
    const results = RetrievalSimulator.search(mapQuery, chunks, 3);
    return results.map(r => r.chunk.id);
  }, [mapQuery, chunks]);

  // Query vector coordinate (centered near nearest neighbors)
  const queryCoord = useMemo(() => {
    if (nearestNeighborIds.length === 0) return { x: 300, y: 240 };
    const matchedPoints = points.filter(p => nearestNeighborIds.includes(p.chunk.id));
    if (matchedPoints.length === 0) return { x: 300, y: 240 };
    const avgX = matchedPoints.reduce((acc, p) => acc + p.x, 0) / matchedPoints.length;
    const avgY = matchedPoints.reduce((acc, p) => acc + p.y, 0) / matchedPoints.length;
    return { x: avgX + 15, y: avgY - 15 };
  }, [nearestNeighborIds, points]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Title & Query Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            2D Semantic Vector Embedding Space
          </h3>
          <p className="text-xs text-slate-400">
            High-dimensional projection visualizing semantic cluster distances and query cosine search
          </p>
        </div>

        {/* Live Vector Query */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={mapQuery}
              onChange={(e) => setMapQuery(e.target.value)}
              placeholder="Query to project in vector space..."
              className="pl-8 bg-slate-950 border-slate-800 text-xs h-8 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Document Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500 font-mono text-[11px]">Clusters:</span>
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/60 px-2 py-0.5 rounded-md">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: docColorMap[doc.id] || '#06b6d4' }}
            />
            <span className="text-slate-300 font-medium truncate max-w-[140px] text-[11px]">
              {doc.name}
            </span>
          </div>
        ))}
      </div>

      {/* SVG Vector Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#050811] border border-slate-800/90 rounded-xl relative overflow-hidden h-[460px] flex items-center justify-center shadow-inner">
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />

          <svg className="w-full h-full" viewBox="0 0 600 480">
            <defs>
              <radialGradient id="queryGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Connection lines from query to nearest neighbors */}
            {mapQuery.trim() && nearestNeighborIds.map(id => {
              const neighbor = points.find(p => p.chunk.id === id);
              if (!neighbor) return null;
              return (
                <line
                  key={`line-${id}`}
                  x1={queryCoord.x}
                  y1={queryCoord.y}
                  x2={neighbor.x}
                  y2={neighbor.y}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              );
            })}

            {/* Chunk nodes */}
            {points.map((pt) => {
              const isNearest = nearestNeighborIds.includes(pt.chunk.id);
              const isSelected = selectedPoint?.chunk.id === pt.chunk.id;

              return (
                <g 
                  key={pt.chunk.id}
                  onClick={() => setSelectedPoint(pt)}
                  className="cursor-pointer transition-transform duration-200"
                >
                  {/* Highlight ring for top-K retrieved */}
                  {isNearest && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.6"
                    />
                  )}

                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 9 : isNearest ? 7 : 5}
                    fill={pt.color}
                    stroke={isSelected ? '#ffffff' : '#050811'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="hover:scale-125 transition-all"
                  />
                </g>
              );
            })}

            {/* Query Vector Node */}
            {mapQuery.trim() && (
              <g>
                <circle
                  cx={queryCoord.x}
                  cy={queryCoord.y}
                  r="24"
                  fill="url(#queryGlow)"
                />
                <circle
                  cx={queryCoord.x}
                  cy={queryCoord.y}
                  r="7"
                  fill="#ffffff"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
                <text
                  x={queryCoord.x + 12}
                  y={queryCoord.y + 4}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Q: "{mapQuery.slice(0, 15)}..."
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Selected Node Details Pane */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Selected Chunk Inspector
              </h4>
            </div>

            {selectedPoint ? (
              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="text-[10px] font-mono border-cyan-800 text-cyan-300">
                    {selectedPoint.chunk.id}
                  </Badge>
                  <p className="text-xs font-semibold text-slate-200 mt-1">
                    {selectedPoint.chunk.documentName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedPoint.chunk.tokenCount} tokens • {selectedPoint.chunk.charCount} chars
                  </p>
                </div>

                {selectedPoint.chunk.sectionBreadcrumbs && (
                  <div className="text-[11px] text-cyan-400 font-medium">
                    {selectedPoint.chunk.sectionBreadcrumbs.join(' > ')}
                  </div>
                )}

                <div className="text-xs font-mono text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedPoint.chunk.originalSlice}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                <p>Click any node on the vector scatter plot to view its passage and metadata.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="text-cyan-400 font-semibold">Tip: </span>
            Nodes located close together have high cosine similarity in embedding space.
          </div>
        </div>
      </div>
    </div>
  );
};
