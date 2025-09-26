/**
 * xTool Path Optimization Algorithms
 * Optimizes laser toolpaths for efficient movement and reduced cutting time
 */

import type {
  LaserPath,
  PathPoint,
  ToolpathLayer,
  PathOptimizationResult,
  OptimizationSettings,
  XToolMachine
} from './types';

/**
 * Calculate distance between two points
 */
function calculateDistance(p1: PathPoint, p2: PathPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total path length
 */
function calculatePathLength(points: PathPoint[]): number {
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += calculateDistance(points[i - 1], points[i]);
  }
  return totalLength;
}

/**
 * Calculate travel distance between two paths
 */
function calculateTravelDistance(path1: LaserPath, path2: LaserPath): number {
  const end1 = path1.points[path1.points.length - 1];
  const start2 = path2.points[0];
  return calculateDistance(end1, start2);
}

/**
 * Find the nearest neighbor path
 */
function findNearestPath(currentPath: LaserPath, remainingPaths: LaserPath[]): LaserPath {
  let nearestPath = remainingPaths[0];
  let shortestDistance = calculateTravelDistance(currentPath, nearestPath);

  for (let i = 1; i < remainingPaths.length; i++) {
    const distance = calculateTravelDistance(currentPath, remainingPaths[i]);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestPath = remainingPaths[i];
    }
  }

  return nearestPath;
}

/**
 * Optimize path order using nearest neighbor algorithm
 */
function optimizePathOrder(paths: LaserPath[]): LaserPath[] {
  if (paths.length <= 1) return paths;

  const optimizedPaths: LaserPath[] = [];
  const remainingPaths = [...paths];

  // Start with the path closest to origin
  let currentPath = remainingPaths.reduce((closest, path) => {
    const closestDistance = calculateDistance({ x: 0, y: 0 }, closest.points[0]);
    const pathDistance = calculateDistance({ x: 0, y: 0 }, path.points[0]);
    return pathDistance < closestDistance ? path : closest;
  });

  remainingPaths.splice(remainingPaths.indexOf(currentPath), 1);
  optimizedPaths.push(currentPath);

  // Find nearest neighbors
  while (remainingPaths.length > 0) {
    const nearestPath = findNearestPath(currentPath, remainingPaths);
    remainingPaths.splice(remainingPaths.indexOf(nearestPath), 1);
    optimizedPaths.push(nearestPath);
    currentPath = nearestPath;
  }

  return optimizedPaths;
}

/**
 * Check if a path should be reversed for optimal travel
 */
function shouldReversePath(fromPath: LaserPath, toPath: LaserPath): boolean {
  const fromEnd = fromPath.points[fromPath.points.length - 1];
  const toStart = toPath.points[0];
  const toEnd = toPath.points[toPath.points.length - 1];

  const distanceToStart = calculateDistance(fromEnd, toStart);
  const distanceToEnd = calculateDistance(fromEnd, toEnd);

  return distanceToEnd < distanceToStart && !toPath.closed;
}

/**
 * Reverse a path direction
 */
function reversePath(path: LaserPath): LaserPath {
  return {
    ...path,
    points: [...path.points].reverse()
  };
}

/**
 * Group similar operations together
 */
function groupSimilarOperations(paths: LaserPath[]): LaserPath[] {
  const groups: { [key: string]: LaserPath[] } = {};

  // Group by operation type and settings
  paths.forEach(path => {
    const key = `${path.type}-${path.settings.power}-${path.settings.speed}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(path);
  });

  // Optimize each group and concatenate
  const optimizedGroups = Object.values(groups).map(group => optimizePathOrder(group));
  return optimizedGroups.flat();
}

/**
 * Remove redundant points from paths
 */
function simplifyPath(points: PathPoint[], tolerance: number = 0.1): PathPoint[] {
  if (points.length <= 2) return points;

  const simplified: PathPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    // Calculate the distance from current point to the line between prev and next
    const A = next.y - prev.y;
    const B = prev.x - next.x;
    const C = next.x * prev.y - prev.x * next.y;
    const distance = Math.abs(A * current.x + B * current.y + C) / Math.sqrt(A * A + B * B);

    if (distance > tolerance) {
      simplified.push(current);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
}

/**
 * Optimize sharp turns by adding intermediate points
 */
function smoothSharpTurns(points: PathPoint[], maxAngle: number = 45): PathPoint[] {
  if (points.length <= 2) return points;

  const smoothed: PathPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    // Calculate angle between vectors
    const v1 = { x: current.x - prev.x, y: current.y - prev.y };
    const v2 = { x: next.x - current.x, y: next.y - current.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * (180 / Math.PI);

    if (angle < 180 - maxAngle) {
      // Sharp turn detected, add intermediate point
      const midPoint: PathPoint = {
        x: (prev.x + next.x) / 2,
        y: (prev.y + next.y) / 2
      };
      smoothed.push(current, midPoint);
    } else {
      smoothed.push(current);
    }
  }

  smoothed.push(points[points.length - 1]);
  return smoothed;
}

/**
 * Optimize layer execution order
 */
function optimizeLayerOrder(layers: ToolpathLayer[]): string[] {
  // Sort by operation priority: engrave first, then score, then cut
  const operationPriority: { [key: string]: number } = {
    'engrave': 1,
    'score': 2,
    'cut': 3
  };

  return layers
    .sort((a, b) => {
      const aPriority = operationPriority[a.type] || 999;
      const bPriority = operationPriority[b.type] || 999;
      return aPriority - bPriority;
    })
    .map(layer => layer.id);
}

/**
 * Check if path is within work area bounds
 */
function isPathWithinBounds(path: LaserPath, workArea: { width: number; height: number }): boolean {
  return path.points.every(point =>
    point.x >= 0 && point.x <= workArea.width &&
    point.y >= 0 && point.y <= workArea.height
  );
}

/**
 * Apply safety margin to paths
 */
function applySafetyMargin(paths: LaserPath[], margin: number): LaserPath[] {
  return paths.map(path => ({
    ...path,
    points: path.points.map(point => ({
      ...point,
      x: Math.max(margin, Math.min(point.x, point.x - margin)),
      y: Math.max(margin, Math.min(point.y, point.y - margin))
    }))
  }));
}

/**
 * Calculate optimization metrics
 */
function calculateOptimizationMetrics(
  originalPaths: LaserPath[],
  optimizedPaths: LaserPath[]
): {
  originalLength: number;
  optimizedLength: number;
  travelReduction: number;
  timeReduction: number;
} {
  const originalLength = originalPaths.reduce((total, path) =>
    total + calculatePathLength(path.points), 0
  );

  const optimizedLength = optimizedPaths.reduce((total, path) =>
    total + calculatePathLength(path.points), 0
  );

  // Calculate travel distances
  let originalTravel = 0;
  let optimizedTravel = 0;

  for (let i = 1; i < originalPaths.length; i++) {
    originalTravel += calculateTravelDistance(originalPaths[i - 1], originalPaths[i]);
  }

  for (let i = 1; i < optimizedPaths.length; i++) {
    optimizedTravel += calculateTravelDistance(optimizedPaths[i - 1], optimizedPaths[i]);
  }

  const travelReduction = originalTravel - optimizedTravel;
  const timeReduction = travelReduction / 1000; // Assume 1000mm/min travel speed

  return {
    originalLength,
    optimizedLength,
    travelReduction,
    timeReduction
  };
}

/**
 * Main path optimization function
 */
export function optimizePaths(
  layers: ToolpathLayer[],
  settings: OptimizationSettings,
  machine: XToolMachine
): {
  optimizedLayers: ToolpathLayer[];
  result: PathOptimizationResult;
} {
  const warnings: string[] = [];
  let totalOriginalLength = 0;
  let totalOptimizedLength = 0;
  let totalTravelReduction = 0;
  let totalTimeReduction = 0;

  const optimizedLayers = layers.map(layer => {
    let paths = [...layer.paths];

    // Apply safety margin
    if (settings.safetyMargin > 0) {
      paths = applySafetyMargin(paths, settings.safetyMargin);
    }

    // Check bounds
    const outOfBoundsPaths = paths.filter(path => !isPathWithinBounds(path, machine.workArea));
    if (outOfBoundsPaths.length > 0) {
      warnings.push(`${outOfBoundsPaths.length} paths exceed work area bounds in layer ${layer.name}`);
    }

    // Simplify paths to remove redundant points
    paths = paths.map(path => ({
      ...path,
      points: simplifyPath(path.points)
    }));

    // Smooth sharp turns if enabled
    if (settings.minimizeSharpTurns) {
      paths = paths.map(path => ({
        ...path,
        points: smoothSharpTurns(path.points)
      }));
    }

    // Group similar operations
    if (settings.groupSimilarOperations) {
      paths = groupSimilarOperations(paths);
    }

    // Optimize path order
    if (settings.optimizeTravel) {
      const originalPaths = [...layer.paths];
      const optimizedPaths = optimizePathOrder(paths);

      // Check for path reversal opportunities
      for (let i = 1; i < optimizedPaths.length; i++) {
        if (shouldReversePath(optimizedPaths[i - 1], optimizedPaths[i])) {
          optimizedPaths[i] = reversePath(optimizedPaths[i]);
        }
      }

      // Calculate metrics for this layer
      const metrics = calculateOptimizationMetrics(originalPaths, optimizedPaths);
      totalOriginalLength += metrics.originalLength;
      totalOptimizedLength += metrics.optimizedLength;
      totalTravelReduction += metrics.travelReduction;
      totalTimeReduction += metrics.timeReduction;

      paths = optimizedPaths;
    }

    return {
      ...layer,
      paths
    };
  });

  // Optimize layer order
  const layerOrder = settings.optimizeLayerOrder
    ? optimizeLayerOrder(optimizedLayers)
    : optimizedLayers.map(layer => layer.id);

  const result: PathOptimizationResult = {
    originalLength: totalOriginalLength,
    optimizedLength: totalOptimizedLength,
    timeReduction: totalTimeReduction,
    energySaving: Math.max(0, (totalTravelReduction / totalOriginalLength) * 100),
    layerOrder,
    warnings
  };

  return {
    optimizedLayers,
    result
  };
}

/**
 * Estimate total job time
 */
export function estimateJobTime(layers: ToolpathLayer[]): number {
  let totalTime = 0; // minutes

  layers.forEach(layer => {
    layer.paths.forEach(path => {
      const pathLength = calculatePathLength(path.points);
      const cuttingTime = (pathLength / path.settings.speed) * path.settings.passes;
      totalTime += cuttingTime;
    });
  });

  // Add setup time and layer change time
  const setupTime = 2; // minutes
  const layerChangeTime = layers.length * 0.5; // 30 seconds per layer change

  return totalTime + setupTime + layerChangeTime;
}

/**
 * Calculate path complexity score (for UI feedback)
 */
export function calculatePathComplexity(paths: LaserPath[]): number {
  let complexity = 0;

  paths.forEach(path => {
    // Base complexity from point count
    complexity += path.points.length;

    // Additional complexity for closed paths
    if (path.closed) {
      complexity += 5;
    }

    // Additional complexity for multiple passes
    complexity += (path.settings.passes - 1) * 2;
  });

  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, Math.round(complexity / 10)));
}

/**
 * Generate optimization suggestions
 */
export function generateOptimizationSuggestions(
  layers: ToolpathLayer[],
  machine: XToolMachine
): string[] {
  const suggestions: string[] = [];

  const totalPaths = layers.reduce((sum, layer) => sum + layer.paths.length, 0);

  if (totalPaths > 100) {
    suggestions.push('Consider grouping similar operations to reduce laser head movement');
  }

  const hasMultipleLayers = layers.length > 3;
  if (hasMultipleLayers) {
    suggestions.push('Optimize layer order: engrave first, then score, finally cut');
  }

  const hasLongPaths = layers.some(layer =>
    layer.paths.some(path => calculatePathLength(path.points) > machine.workArea.width)
  );
  if (hasLongPaths) {
    suggestions.push('Break long continuous paths into smaller segments for better control');
  }

  const hasHighPowerSettings = layers.some(layer =>
    layer.paths.some(path => path.settings.power > 80)
  );
  if (hasHighPowerSettings) {
    suggestions.push('Consider reducing power and increasing passes for better edge quality');
  }

  return suggestions;
}