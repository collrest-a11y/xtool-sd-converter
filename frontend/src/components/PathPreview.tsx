/**
 * PathPreview Component
 * Visualizes laser toolpaths with layer controls and animation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ToolpathLayer, PathPoint, LaserPath } from '../lib/xtool/types';

interface PathPreviewProps {
  layers: ToolpathLayer[];
  workArea: { width: number; height: number };
  showTravel?: boolean;
  animationSpeed?: number;
  selectedLayer?: string;
  onLayerSelect?: (layerId: string | null) => void;
  className?: string;
}

interface ViewportSettings {
  zoom: number;
  panX: number;
  panY: number;
}

export function PathPreview({
  layers,
  workArea,
  showTravel = false,
  animationSpeed = 1,
  selectedLayer = null,
  onLayerSelect,
  className = ''
}: PathPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<ViewportSettings>({
    zoom: 1,
    panX: 0,
    panY: 0
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(layers.filter(l => l.visible).map(l => l.id))
  );

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // Canvas dimensions
  const canvasSize = 400; // Fixed canvas size
  const padding = 20;
  const drawableSize = canvasSize - (padding * 2);

  // Calculate scale to fit work area in canvas
  const scale = useMemo(() => {
    const scaleX = drawableSize / workArea.width;
    const scaleY = drawableSize / workArea.height;
    return Math.min(scaleX, scaleY) * viewport.zoom;
  }, [workArea, drawableSize, viewport.zoom]);

  // Transform point from world coordinates to canvas coordinates
  const transformPoint = (point: PathPoint): { x: number; y: number } => {
    return {
      x: padding + (point.x * scale) + viewport.panX,
      y: padding + ((workArea.height - point.y) * scale) + viewport.panY // Flip Y axis
    };
  };

  // Draw work area bounds
  const drawWorkArea = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const topLeft = transformPoint({ x: 0, y: 0 });
    const bottomRight = transformPoint({ x: workArea.width, y: workArea.height });

    ctx.strokeRect(
      topLeft.x,
      bottomRight.y,
      bottomRight.x - topLeft.x,
      topLeft.y - bottomRight.y
    );

    ctx.setLineDash([]);
  };

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;

    const gridSpacing = 10; // mm

    for (let x = 0; x <= workArea.width; x += gridSpacing) {
      const start = transformPoint({ x, y: 0 });
      const end = transformPoint({ x, y: workArea.height });
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    for (let y = 0; y <= workArea.height; y += gridSpacing) {
      const start = transformPoint({ x: 0, y });
      const end = transformPoint({ x: workArea.width, y });
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  // Draw a single path
  const drawPath = (
    ctx: CanvasRenderingContext2D,
    path: LaserPath,
    color: string,
    opacity: number = 1,
    progressLimit?: number
  ) => {
    if (path.points.length < 2) return;

    const actualProgress = progressLimit ?? 1;
    const pointsToShow = Math.max(1, Math.floor(path.points.length * actualProgress));

    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = path.type === 'cut' ? 2 : path.type === 'score' ? 1.5 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set line dash for different operations
    if (path.type === 'score') {
      ctx.setLineDash([3, 3]);
    } else if (path.type === 'engrave') {
      ctx.setLineDash([]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();

    for (let i = 0; i < Math.min(pointsToShow, path.points.length); i++) {
      const point = transformPoint(path.points[i]);

      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Draw start point
    if (path.points.length > 0) {
      const startPoint = transformPoint(path.points[0]);
      ctx.fillStyle = '#10b981';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw end point if path is complete
    if (actualProgress >= 1 && path.points.length > 1) {
      const endPoint = transformPoint(path.points[path.points.length - 1]);
      ctx.fillStyle = '#ef4444';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  // Draw travel movements between paths
  const drawTravelPaths = (ctx: CanvasRenderingContext2D, layer: ToolpathLayer) => {
    if (!showTravel || layer.paths.length < 2) return;

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.globalAlpha = 0.5;

    for (let i = 1; i < layer.paths.length; i++) {
      const prevPath = layer.paths[i - 1];
      const currentPath = layer.paths[i];

      if (prevPath.points.length === 0 || currentPath.points.length === 0) continue;

      const start = transformPoint(prevPath.points[prevPath.points.length - 1]);
      const end = transformPoint(currentPath.points[0]);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  // Main drawing function
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx);

    // Draw work area bounds
    drawWorkArea(ctx);

    // Draw layers
    layers.forEach(layer => {
      if (!visibleLayers.has(layer.id)) return;

      const isSelected = selectedLayer === layer.id;
      const opacity = isSelected ? 1 : 0.7;

      // Draw travel paths for this layer
      drawTravelPaths(ctx, layer);

      // Draw paths in this layer
      layer.paths.forEach((path, pathIndex) => {
        let pathProgress = 1;

        // Apply animation progress if animating
        if (isAnimating && selectedLayer === layer.id) {
          const totalPaths = layer.paths.length;
          const pathStartProgress = pathIndex / totalPaths;
          const pathEndProgress = (pathIndex + 1) / totalPaths;

          if (animationProgress < pathStartProgress) {
            pathProgress = 0;
          } else if (animationProgress > pathEndProgress) {
            pathProgress = 1;
          } else {
            pathProgress = (animationProgress - pathStartProgress) / (pathEndProgress - pathStartProgress);
          }
        }

        if (pathProgress > 0) {
          drawPath(ctx, path, layer.color, opacity, pathProgress);
        }
      });
    });

    // Draw layer info
    drawLayerInfo(ctx);
  };

  // Draw layer information overlay
  const drawLayerInfo = (ctx: CanvasRenderingContext2D) => {
    const infoY = canvasSize - 80;
    let currentY = infoY;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, infoY - 10, 200, layers.length * 20 + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui';
    ctx.fillText('Layers:', 15, currentY);
    currentY += 18;

    layers.forEach(layer => {
      if (!visibleLayers.has(layer.id)) return;

      const isSelected = selectedLayer === layer.id;

      // Layer color indicator
      ctx.fillStyle = layer.color;
      ctx.fillRect(15, currentY - 8, 12, 12);

      // Layer name
      ctx.fillStyle = isSelected ? '#60a5fa' : '#ffffff';
      ctx.font = isSelected ? 'bold 11px system-ui' : '11px system-ui';
      ctx.fillText(layer.name, 32, currentY);

      // Path count
      ctx.fillStyle = '#d1d5db';
      ctx.font = '10px system-ui';
      ctx.fillText(`(${layer.paths.length} paths)`, 120, currentY);

      currentY += 16;
    });
  };

  // Animation loop
  const animate = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    setAnimationProgress(prev => {
      const newProgress = prev + (deltaTime * animationSpeed * 0.001);
      return newProgress >= 1 ? 0 : newProgress; // Loop animation
    });

    draw();

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const zoomFactor = 0.1;
    const newZoom = viewport.zoom - (e.deltaY > 0 ? zoomFactor : -zoomFactor);

    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, newZoom))
    }));
  };

  // Handle pan
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPosition.x;
      const deltaY = e.clientY - lastPanPosition.y;

      setViewport(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));

      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset viewport
  const resetView = () => {
    setViewport({ zoom: 1, panX: 0, panY: 0 });
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  // Start/stop animation
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsAnimating(true);
      setAnimationProgress(0);
      lastTimeRef.current = undefined;
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Draw when dependencies change
  useEffect(() => {
    if (!isAnimating) {
      draw();
    }
  }, [layers, workArea, visibleLayers, selectedLayer, showTravel, viewport]);

  // Update visible layers when layers change
  useEffect(() => {
    setVisibleLayers(new Set(layers.filter(l => l.visible).map(l => l.id)));
  }, [layers]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`path-preview ${className}`} ref={containerRef}>
      {/* Canvas */}
      <div className="relative bg-white border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="block cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Controls overlay */}
        <div className="absolute top-2 right-2 space-y-1">
          <button
            onClick={resetView}
            className="px-2 py-1 bg-white bg-opacity-90 text-gray-700 text-xs rounded shadow hover:bg-opacity-100"
            title="Reset view"
          >
            Reset
          </button>
          <button
            onClick={toggleAnimation}
            className={`px-2 py-1 text-xs rounded shadow ${
              isAnimating
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title={isAnimating ? 'Stop animation' : 'Start animation'}
          >
            {isAnimating ? 'Stop' : 'Play'}
          </button>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      {/* Layer controls */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-800">Layers</h4>
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showTravel}
              onChange={(e) => {/* This would be handled by parent component */}}
              className="rounded border-gray-300 text-blue-600"
            />
            <span>Show travel</span>
          </label>
        </div>

        <div className="space-y-1">
          {layers.map(layer => (
            <div
              key={layer.id}
              className={`flex items-center space-x-3 p-2 rounded border cursor-pointer ${
                selectedLayer === layer.id
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onLayerSelect?.(selectedLayer === layer.id ? null : layer.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="flex-shrink-0"
              >
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    backgroundColor: visibleLayers.has(layer.id) ? layer.color : 'transparent',
                    borderColor: layer.color
                  }}
                />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {layer.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {layer.paths.length} paths
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)} •
                  {layer.settings.power}% • {layer.settings.speed}mm/min
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PathPreview;