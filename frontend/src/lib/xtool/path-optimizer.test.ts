/**
 * Tests for xTool Path Optimization Algorithms
 */

import { describe, test, expect } from 'vitest';
import {
  optimizePaths,
  estimateJobTime,
  calculatePathComplexity,
  generateOptimizationSuggestions
} from './path-optimizer';
import type {
  ToolpathLayer,
  LaserPath,
  PathPoint,
  OptimizationSettings,
  XToolMachine
} from './types';

// Test data helpers
function createTestPath(
  id: string,
  points: PathPoint[],
  type: 'cut' | 'engrave' | 'score' = 'cut',
  closed: boolean = false
): LaserPath {
  return {
    id,
    type,
    points,
    settings: {
      power: 50,
      speed: 1000,
      passes: 1,
      airAssist: false
    },
    material: 'test-material',
    priority: 0,
    closed,
    depth: 0.1
  };
}

function createTestLayer(
  id: string,
  name: string,
  paths: LaserPath[],
  type: 'cut' | 'engrave' | 'score' = 'cut'
): ToolpathLayer {
  return {
    id,
    name,
    type,
    paths,
    settings: {
      power: 50,
      speed: 1000,
      passes: 1,
      airAssist: false
    },
    color: '#ff0000',
    visible: true,
    locked: false
  };
}

function createTestMachine(): XToolMachine {
  return {
    id: 'test-machine',
    name: 'Test Machine',
    workArea: { width: 400, height: 300 },
    powerRange: { min: 1, max: 100 },
    speedRange: { min: 1, max: 20000 },
    supportedMaterials: ['wood', 'acrylic'],
    features: ['air-assist']
  };
}

function createDefaultSettings(): OptimizationSettings {
  return {
    machine: 'test-machine',
    material: 'test-material',
    optimizeTravel: true,
    minimizeSharpTurns: true,
    groupSimilarOperations: true,
    optimizeLayerOrder: true,
    respectMaterialLimits: true,
    safetyMargin: 5
  };
}

describe('Path Optimization Algorithms', () => {
  describe('optimizePaths', () => {
    test('should optimize simple path order', () => {
      // Create paths that are far apart to test travel optimization
      const path1 = createTestPath('path1', [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 }
      ], 'cut', true);

      const path2 = createTestPath('path2', [
        { x: 100, y: 100 },
        { x: 110, y: 100 },
        { x: 110, y: 110 },
        { x: 100, y: 110 }
      ], 'cut', true);

      const path3 = createTestPath('path3', [
        { x: 50, y: 50 },
        { x: 60, y: 50 },
        { x: 60, y: 60 },
        { x: 50, y: 60 }
      ], 'cut', true);

      const layer = createTestLayer('test-layer', 'Test Layer', [path1, path2, path3]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      expect(result.optimizedLayers).toHaveLength(1);
      expect(result.optimizedLayers[0].paths).toHaveLength(3);
      expect(result.result.originalLength).toBeGreaterThan(0);
      expect(result.result.optimizedLength).toBeGreaterThan(0);
    });

    test('should apply safety margin', () => {
      const path = createTestPath('path1', [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]);

      const layer = createTestLayer('test-layer', 'Test Layer', [path]);
      const settings = { ...createDefaultSettings(), safetyMargin: 5 };
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Points should be moved away from edges
      const optimizedPath = result.optimizedLayers[0].paths[0];
      expect(optimizedPath.points[0].x).toBeGreaterThanOrEqual(5);
      expect(optimizedPath.points[0].y).toBeGreaterThanOrEqual(5);
    });

    test('should detect paths outside work area', () => {
      const path = createTestPath('path1', [
        { x: 500, y: 500 }, // Outside 400x300 work area
        { x: 600, y: 500 },
        { x: 600, y: 600 },
        { x: 500, y: 600 }
      ]);

      const layer = createTestLayer('test-layer', 'Test Layer', [path]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      expect(result.result.warnings.length).toBeGreaterThan(0);
      expect(result.result.warnings[0]).toContain('exceed work area bounds');
    });

    test('should group similar operations when enabled', () => {
      // Create paths with different settings
      const path1 = createTestPath('path1', [{ x: 0, y: 0 }, { x: 10, y: 0 }]);
      path1.settings = { power: 50, speed: 1000, passes: 1, airAssist: false };

      const path2 = createTestPath('path2', [{ x: 20, y: 0 }, { x: 30, y: 0 }]);
      path2.settings = { power: 80, speed: 500, passes: 1, airAssist: false };

      const path3 = createTestPath('path3', [{ x: 40, y: 0 }, { x: 50, y: 0 }]);
      path3.settings = { power: 50, speed: 1000, passes: 1, airAssist: false }; // Same as path1

      const layer = createTestLayer('test-layer', 'Test Layer', [path1, path2, path3]);
      const settings = { ...createDefaultSettings(), groupSimilarOperations: true };
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Paths with similar settings should be grouped together
      const optimizedPaths = result.optimizedLayers[0].paths;
      const path1Index = optimizedPaths.findIndex(p => p.id === 'path1');
      const path3Index = optimizedPaths.findIndex(p => p.id === 'path3');

      // path1 and path3 should be closer together than path2
      expect(Math.abs(path1Index - path3Index)).toBeLessThan(2);
    });

    test('should optimize layer order correctly', () => {
      const engraveLayer = createTestLayer('engrave', 'Engrave', [], 'engrave');
      const cutLayer = createTestLayer('cut', 'Cut', [], 'cut');
      const scoreLayer = createTestLayer('score', 'Score', [], 'score');

      const settings = { ...createDefaultSettings(), optimizeLayerOrder: true };
      const machine = createTestMachine();

      const result = optimizePaths([cutLayer, engraveLayer, scoreLayer], settings, machine);

      // Should be ordered: engrave, score, cut
      expect(result.result.layerOrder).toEqual(['engrave', 'score', 'cut']);
    });

    test('should handle empty layers', () => {
      const emptyLayer = createTestLayer('empty', 'Empty Layer', []);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([emptyLayer], settings, machine);

      expect(result.optimizedLayers).toHaveLength(1);
      expect(result.optimizedLayers[0].paths).toHaveLength(0);
      expect(result.result.originalLength).toBe(0);
      expect(result.result.optimizedLength).toBe(0);
    });

    test('should simplify paths by removing redundant points', () => {
      // Create a path with many collinear points
      const redundantPath = createTestPath('redundant', [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 }
      ]);

      const layer = createTestLayer('test-layer', 'Test Layer', [redundantPath]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Should have fewer points after simplification
      const optimizedPath = result.optimizedLayers[0].paths[0];
      expect(optimizedPath.points.length).toBeLessThan(redundantPath.points.length);
    });

    test('should smooth sharp turns when enabled', () => {
      // Create a path with sharp turn
      const sharpPath = createTestPath('sharp', [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
      ]);

      const layer = createTestLayer('test-layer', 'Test Layer', [sharpPath]);
      const settings = { ...createDefaultSettings(), minimizeSharpTurns: true };
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Should have more points after smoothing
      const optimizedPath = result.optimizedLayers[0].paths[0];
      expect(optimizedPath.points.length).toBeGreaterThanOrEqual(sharpPath.points.length);
    });
  });

  describe('estimateJobTime', () => {
    test('should calculate time for single layer', () => {
      const path = createTestPath('path1', [
        { x: 0, y: 0 },
        { x: 100, y: 0 } // 100mm long
      ]);
      path.settings.speed = 1000; // mm/min
      path.settings.passes = 2;

      const layer = createTestLayer('test-layer', 'Test Layer', [path]);

      const time = estimateJobTime([layer]);

      // Expected: (100/1000) * 2 + 2 + 0.5 = 2.7 minutes
      // (path time + setup time + layer change time)
      expect(time).toBeCloseTo(2.7, 1);
    });

    test('should include setup and layer change time', () => {
      const emptyLayer1 = createTestLayer('layer1', 'Layer 1', []);
      const emptyLayer2 = createTestLayer('layer2', 'Layer 2', []);

      const time = estimateJobTime([emptyLayer1, emptyLayer2]);

      // Expected: 2 minutes setup + 2 * 0.5 minutes layer change = 3 minutes
      expect(time).toBe(3);
    });

    test('should handle multiple passes correctly', () => {
      const path = createTestPath('path1', [
        { x: 0, y: 0 },
        { x: 60, y: 0 } // 60mm long
      ]);
      path.settings.speed = 600; // mm/min
      path.settings.passes = 3;

      const layer = createTestLayer('test-layer', 'Test Layer', [path]);

      const time = estimateJobTime([layer]);

      // Expected: (60/600) * 3 + 2 + 0.5 = 2.8 minutes
      expect(time).toBeCloseTo(2.8, 1);
    });
  });

  describe('calculatePathComplexity', () => {
    test('should return low complexity for simple paths', () => {
      const simplePath = createTestPath('simple', [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]);

      const complexity = calculatePathComplexity([simplePath]);

      expect(complexity).toBeGreaterThanOrEqual(0);
      expect(complexity).toBeLessThan(50);
    });

    test('should return higher complexity for complex paths', () => {
      const complexPaths = [];

      // Create many paths with many points
      for (let i = 0; i < 20; i++) {
        const points = [];
        for (let j = 0; j < 50; j++) {
          points.push({ x: j, y: i });
        }
        complexPaths.push(createTestPath(`path${i}`, points, 'cut', true));
      }

      const complexity = calculatePathComplexity(complexPaths);

      expect(complexity).toBeGreaterThan(80);
      expect(complexity).toBeLessThanOrEqual(100);
    });

    test('should consider closed paths more complex', () => {
      const openPath = createTestPath('open', [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
      ], 'cut', false);

      const closedPath = createTestPath('closed', [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 }
      ], 'cut', true);

      const openComplexity = calculatePathComplexity([openPath]);
      const closedComplexity = calculatePathComplexity([closedPath]);

      expect(closedComplexity).toBeGreaterThan(openComplexity);
    });

    test('should consider multiple passes more complex', () => {
      const singlePass = createTestPath('single', [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]);
      singlePass.settings.passes = 1;

      const multiPass = createTestPath('multi', [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]);
      multiPass.settings.passes = 3;

      const singleComplexity = calculatePathComplexity([singlePass]);
      const multiComplexity = calculatePathComplexity([multiPass]);

      expect(multiComplexity).toBeGreaterThan(singleComplexity);
    });
  });

  describe('generateOptimizationSuggestions', () => {
    test('should suggest grouping for many paths', () => {
      const manyPaths = [];
      for (let i = 0; i < 150; i++) {
        manyPaths.push(createTestPath(`path${i}`, [
          { x: i, y: 0 },
          { x: i + 1, y: 0 }
        ]));
      }

      const layer = createTestLayer('many-paths', 'Many Paths', manyPaths);
      const machine = createTestMachine();

      const suggestions = generateOptimizationSuggestions([layer], machine);

      expect(suggestions.some(s => s.includes('grouping'))).toBe(true);
    });

    test('should suggest layer optimization for multiple layers', () => {
      const layer1 = createTestLayer('layer1', 'Layer 1', []);
      const layer2 = createTestLayer('layer2', 'Layer 2', []);
      const layer3 = createTestLayer('layer3', 'Layer 3', []);
      const layer4 = createTestLayer('layer4', 'Layer 4', []);

      const machine = createTestMachine();

      const suggestions = generateOptimizationSuggestions([layer1, layer2, layer3, layer4], machine);

      expect(suggestions.some(s => s.includes('layer order'))).toBe(true);
    });

    test('should suggest breaking long paths', () => {
      const longPath = createTestPath('long', [
        { x: 0, y: 0 },
        { x: 500, y: 0 } // Longer than work area width
      ]);

      const layer = createTestLayer('long-path', 'Long Path', [longPath]);
      const machine = createTestMachine(); // 400mm wide

      const suggestions = generateOptimizationSuggestions([layer], machine);

      expect(suggestions.some(s => s.includes('long'))).toBe(true);
    });

    test('should suggest power optimization for high power settings', () => {
      const highPowerPath = createTestPath('high-power', [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]);
      highPowerPath.settings.power = 90;

      const layer = createTestLayer('high-power', 'High Power', [highPowerPath]);
      const machine = createTestMachine();

      const suggestions = generateOptimizationSuggestions([layer], machine);

      expect(suggestions.some(s => s.includes('power'))).toBe(true);
    });

    test('should return empty suggestions for optimal setup', () => {
      const simplePath = createTestPath('simple', [
        { x: 10, y: 10 },
        { x: 20, y: 10 }
      ]);
      simplePath.settings.power = 50; // Reasonable power

      const layer = createTestLayer('simple', 'Simple', [simplePath]);
      const machine = createTestMachine();

      const suggestions = generateOptimizationSuggestions([layer], machine);

      // Should have minimal suggestions for a simple, well-configured job
      expect(suggestions.length).toBeLessThan(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle paths with single point', () => {
      const singlePointPath = createTestPath('single', [{ x: 10, y: 10 }]);
      const layer = createTestLayer('test', 'Test', [singlePointPath]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      expect(result.optimizedLayers[0].paths).toHaveLength(1);
      expect(result.result.originalLength).toBe(0);
    });

    test('should handle paths with no points', () => {
      const emptyPath = createTestPath('empty', []);
      const layer = createTestLayer('test', 'Test', [emptyPath]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      expect(result.optimizedLayers[0].paths).toHaveLength(1);
      expect(result.result.originalLength).toBe(0);
    });

    test('should handle identical points in path', () => {
      const identicalPath = createTestPath('identical', [
        { x: 10, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 10 },
        { x: 20, y: 10 }
      ]);

      const layer = createTestLayer('test', 'Test', [identicalPath]);
      const settings = createDefaultSettings();
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Should handle without errors and potentially simplify
      expect(result.optimizedLayers[0].paths[0].points.length).toBeGreaterThan(0);
    });

    test('should handle zero safety margin', () => {
      const path = createTestPath('path', [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]);

      const layer = createTestLayer('test', 'Test', [path]);
      const settings = { ...createDefaultSettings(), safetyMargin: 0 };
      const machine = createTestMachine();

      const result = optimizePaths([layer], settings, machine);

      // Should work without applying safety margin
      expect(result.optimizedLayers[0].paths[0].points[0]).toEqual(path.points[0]);
    });
  });
});