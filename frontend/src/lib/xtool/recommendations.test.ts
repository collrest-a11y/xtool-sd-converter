/**
 * Tests for xTool Power and Speed Recommendation Engine
 */

import { describe, test, expect } from 'vitest';
import {
  generatePowerSpeedRecommendation,
  generateOptimizationRecommendations,
  getRecommendedLayerOrder,
  suggestMaterialAlternatives,
  calculatePowerEfficiency,
  generateQualityRecommendations,
  estimateMaterialCost
} from './recommendations';
import type { LaserSettings, XToolMachineId } from './types';

describe('Power and Speed Recommendation Engine', () => {
  describe('generatePowerSpeedRecommendation', () => {
    test('should generate recommendation for existing material', () => {
      const recommendation = generatePowerSpeedRecommendation(
        'basswood-3mm',
        3,
        'cut',
        'xtool-d1'
      );

      expect(recommendation.material).toBe('Basswood 3mm');
      expect(recommendation.thickness).toBe(3);
      expect(recommendation.operation).toBe('cut');
      expect(recommendation.recommended.power).toBeGreaterThan(0);
      expect(recommendation.recommended.power).toBeLessThanOrEqual(100);
      expect(recommendation.recommended.speed).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(recommendation.alternatives)).toBe(true);
      expect(Array.isArray(recommendation.notes)).toBe(true);
    });

    test('should handle different operations correctly', () => {
      const cutRec = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');
      const engraveRec = generatePowerSpeedRecommendation('basswood-3mm', 3, 'engrave', 'xtool-d1');
      const scoreRec = generatePowerSpeedRecommendation('basswood-3mm', 3, 'score', 'xtool-d1');

      // Cut should generally have higher power than engrave
      expect(cutRec.recommended.power).toBeGreaterThan(engraveRec.recommended.power);

      // Score should be between cut and engrave
      expect(scoreRec.recommended.power).toBeGreaterThan(engraveRec.recommended.power);
      expect(scoreRec.recommended.power).toBeLessThan(cutRec.recommended.power);

      // Engrave should generally be faster than cut
      expect(engraveRec.recommended.speed).toBeGreaterThan(cutRec.recommended.speed);
    });

    test('should adjust for different thickness', () => {
      const thin = generatePowerSpeedRecommendation('basswood-3mm', 1, 'cut', 'xtool-d1');
      const thick = generatePowerSpeedRecommendation('basswood-3mm', 6, 'cut', 'xtool-d1');

      // Thicker material should need more power or slower speed
      expect(thick.recommended.power).toBeGreaterThan(thin.recommended.power);
      expect(thick.confidence).toBeLessThan(1); // Should note adjustment
      expect(thick.notes.some(note => note.includes('thickness'))).toBe(true);
    });

    test('should apply quality modifiers', () => {
      const draft = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1', 'draft');
      const normal = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1', 'normal');
      const high = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1', 'high');
      const ultra = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1', 'ultra');

      // Draft should be faster, ultra should be slower and more powerful
      expect(draft.recommended.speed).toBeGreaterThan(normal.recommended.speed);
      expect(ultra.recommended.speed).toBeLessThan(normal.recommended.speed);
      expect(ultra.recommended.power).toBeGreaterThan(normal.recommended.power);
    });

    test('should respect machine limits', () => {
      const recommendation = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');

      expect(recommendation.recommended.power).toBeGreaterThanOrEqual(1);
      expect(recommendation.recommended.power).toBeLessThanOrEqual(100);
      expect(recommendation.recommended.speed).toBeGreaterThanOrEqual(1);
      expect(recommendation.recommended.speed).toBeLessThanOrEqual(20000);
    });

    test('should generate multiple alternatives', () => {
      const recommendation = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');

      expect(recommendation.alternatives.length).toBeGreaterThan(0);
      recommendation.alternatives.forEach(alt => {
        expect(alt.power).toBeGreaterThanOrEqual(1);
        expect(alt.power).toBeLessThanOrEqual(100);
        expect(alt.speed).toBeGreaterThan(0);
        expect(alt.passes).toBeGreaterThan(0);
      });
    });

    test('should handle unknown material with similar materials', () => {
      // This test would need to be adjusted based on actual material database
      expect(() => {
        generatePowerSpeedRecommendation('unknown-material', 3, 'cut', 'xtool-d1');
      }).toThrow('Unknown material');
    });

    test('should handle unknown machine', () => {
      expect(() => {
        generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'unknown-machine' as XToolMachineId);
      }).toThrow('Unknown machine');
    });

    test('should note air assist recommendations', () => {
      const recommendation = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');

      // Wood cutting typically uses air assist
      expect(recommendation.recommended.airAssist).toBe(true);
    });
  });

  describe('generateOptimizationRecommendations', () => {
    test('should validate material compatibility', () => {
      const recommendations = generateOptimizationRecommendations(
        'basswood-3mm',
        3,
        'xtool-d1',
        50,
        60
      );

      // Should not have compatibility errors for valid combination
      const errors = recommendations.filter(r => r.severity === 'error');
      expect(errors.length).toBe(0);
    });

    test('should warn about high path counts', () => {
      const recommendations = generateOptimizationRecommendations(
        'basswood-3mm',
        3,
        'xtool-d1',
        600, // High path count
        60
      );

      const pathWarnings = recommendations.filter(r =>
        r.type === 'path' && r.message.includes('path count')
      );
      expect(pathWarnings.length).toBeGreaterThan(0);
    });

    test('should warn about long cutting times', () => {
      const recommendations = generateOptimizationRecommendations(
        'basswood-3mm',
        3,
        'xtool-d1',
        50,
        150 // Long time in minutes
      );

      const timeWarnings = recommendations.filter(r =>
        r.message.includes('Long cutting time')
      );
      expect(timeWarnings.length).toBeGreaterThan(0);
    });

    test('should include safety notes for materials', () => {
      const recommendations = generateOptimizationRecommendations(
        'basswood-3mm',
        3,
        'xtool-d1',
        50,
        60
      );

      const safetyRecs = recommendations.filter(r => r.type === 'safety');
      expect(safetyRecs.length).toBeGreaterThan(0);
    });

    test('should handle thickness variations', () => {
      const recommendations = generateOptimizationRecommendations(
        'basswood-3mm',
        6, // Double the reference thickness
        'xtool-d1',
        50,
        60
      );

      const thicknessWarnings = recommendations.filter(r =>
        r.message.includes('thickness')
      );
      expect(thicknessWarnings.length).toBeGreaterThan(0);
    });

    test('should handle unknown materials gracefully', () => {
      const recommendations = generateOptimizationRecommendations(
        'unknown-material',
        3,
        'xtool-d1',
        50,
        60
      );

      const errors = recommendations.filter(r => r.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unknown material');
    });
  });

  describe('getRecommendedLayerOrder', () => {
    test('should order operations correctly', () => {
      const layers = [
        { id: 'cut-layer', type: 'cut' as const },
        { id: 'engrave-layer', type: 'engrave' as const },
        { id: 'score-layer', type: 'score' as const }
      ];

      const order = getRecommendedLayerOrder(layers);

      expect(order).toEqual(['engrave-layer', 'score-layer', 'cut-layer']);
    });

    test('should handle layers with same operation type', () => {
      const layers = [
        { id: 'cut1', type: 'cut' as const },
        { id: 'cut2', type: 'cut' as const },
        { id: 'engrave1', type: 'engrave' as const }
      ];

      const order = getRecommendedLayerOrder(layers);

      expect(order[0]).toBe('engrave1');
      expect(order.slice(1)).toContain('cut1');
      expect(order.slice(1)).toContain('cut2');
    });

    test('should handle empty layer list', () => {
      const order = getRecommendedLayerOrder([]);
      expect(order).toEqual([]);
    });
  });

  describe('suggestMaterialAlternatives', () => {
    test('should suggest alternatives in same category', () => {
      const alternatives = suggestMaterialAlternatives('basswood-3mm', 'xtool-d1');

      expect(alternatives.length).toBeGreaterThan(0);
      alternatives.forEach(alt => {
        expect(alt.material.category).toBe('wood'); // Same category as basswood
        expect(alt.compatibility).toBeGreaterThan(0);
        expect(alt.compatibility).toBeLessThanOrEqual(1);
        expect(Array.isArray(alt.notes)).toBe(true);
      });

      // Should be sorted by compatibility
      for (let i = 1; i < alternatives.length; i++) {
        expect(alternatives[i].compatibility).toBeLessThanOrEqual(alternatives[i-1].compatibility);
      }
    });

    test('should limit number of alternatives', () => {
      const alternatives = suggestMaterialAlternatives('basswood-3mm', 'xtool-d1');
      expect(alternatives.length).toBeLessThanOrEqual(5);
    });

    test('should note thickness differences', () => {
      const alternatives = suggestMaterialAlternatives('basswood-3mm', 'xtool-d1');

      const differentThickness = alternatives.find(alt =>
        Math.abs(alt.material.thickness - 3) > 0.5
      );

      if (differentThickness) {
        expect(differentThickness.notes.some(note =>
          note.includes('thickness')
        )).toBe(true);
      }
    });

    test('should handle unknown material', () => {
      const alternatives = suggestMaterialAlternatives('unknown-material', 'xtool-d1');
      expect(alternatives).toEqual([]);
    });

    test('should handle unknown machine', () => {
      const alternatives = suggestMaterialAlternatives('basswood-3mm', 'unknown-machine' as XToolMachineId);
      expect(alternatives).toEqual([]);
    });
  });

  describe('calculatePowerEfficiency', () => {
    test('should return higher efficiency for lower power', () => {
      const lowPower: LaserSettings = { power: 30, speed: 1000, passes: 1, airAssist: false };
      const highPower: LaserSettings = { power: 90, speed: 1000, passes: 1, airAssist: false };

      const lowEfficiency = calculatePowerEfficiency(lowPower);
      const highEfficiency = calculatePowerEfficiency(highPower);

      expect(lowEfficiency).toBeGreaterThan(highEfficiency);
    });

    test('should return higher efficiency for higher speed', () => {
      const slowSpeed: LaserSettings = { power: 50, speed: 500, passes: 1, airAssist: false };
      const fastSpeed: LaserSettings = { power: 50, speed: 2000, passes: 1, airAssist: false };

      const slowEfficiency = calculatePowerEfficiency(slowSpeed);
      const fastEfficiency = calculatePowerEfficiency(fastSpeed);

      expect(fastEfficiency).toBeGreaterThan(slowEfficiency);
    });

    test('should return higher efficiency for fewer passes', () => {
      const singlePass: LaserSettings = { power: 50, speed: 1000, passes: 1, airAssist: false };
      const multiPass: LaserSettings = { power: 50, speed: 1000, passes: 3, airAssist: false };

      const singleEfficiency = calculatePowerEfficiency(singlePass);
      const multiEfficiency = calculatePowerEfficiency(multiPass);

      expect(singleEfficiency).toBeGreaterThan(multiEfficiency);
    });

    test('should return value between 0 and 100', () => {
      const settings: LaserSettings = { power: 50, speed: 1000, passes: 1, airAssist: false };
      const efficiency = calculatePowerEfficiency(settings);

      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(100);
    });

    test('should handle extreme values', () => {
      const minSettings: LaserSettings = { power: 1, speed: 20000, passes: 1, airAssist: false };
      const maxSettings: LaserSettings = { power: 100, speed: 1, passes: 10, airAssist: false };

      const minEfficiency = calculatePowerEfficiency(minSettings);
      const maxEfficiency = calculatePowerEfficiency(maxSettings);

      expect(minEfficiency).toBeGreaterThan(maxEfficiency);
      expect(minEfficiency).toBeLessThanOrEqual(100);
      expect(maxEfficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateQualityRecommendations', () => {
    test('should warn about very high power', () => {
      const highPowerSettings: LaserSettings = { power: 95, speed: 1000, passes: 1, airAssist: false };

      const recommendations = generateQualityRecommendations('cut', 'wood', highPowerSettings);

      const powerWarnings = recommendations.filter(r =>
        r.message.includes('high power')
      );
      expect(powerWarnings.length).toBeGreaterThan(0);
      expect(powerWarnings[0].severity).toBe('warning');
    });

    test('should warn about high engraving speed', () => {
      const fastEngraveSettings: LaserSettings = { power: 30, speed: 6000, passes: 1, airAssist: false };

      const recommendations = generateQualityRecommendations('engrave', 'wood', fastEngraveSettings);

      const speedWarnings = recommendations.filter(r =>
        r.message.includes('speed')
      );
      expect(speedWarnings.length).toBeGreaterThan(0);
    });

    test('should warn about very slow cutting', () => {
      const slowCutSettings: LaserSettings = { power: 80, speed: 50, passes: 1, airAssist: false };

      const recommendations = generateQualityRecommendations('cut', 'wood', slowCutSettings);

      const speedWarnings = recommendations.filter(r =>
        r.message.includes('slow')
      );
      expect(speedWarnings.length).toBeGreaterThan(0);
    });

    test('should warn about many passes', () => {
      const manyPassSettings: LaserSettings = { power: 50, speed: 1000, passes: 5, airAssist: false };

      const recommendations = generateQualityRecommendations('cut', 'wood', manyPassSettings);

      const passWarnings = recommendations.filter(r =>
        r.message.includes('passes')
      );
      expect(passWarnings.length).toBeGreaterThan(0);
    });

    test('should return no warnings for optimal settings', () => {
      const optimalSettings: LaserSettings = { power: 50, speed: 1000, passes: 1, airAssist: false };

      const recommendations = generateQualityRecommendations('cut', 'wood', optimalSettings);

      expect(recommendations.length).toBe(0);
    });

    test('should provide appropriate suggestions', () => {
      const problematicSettings: LaserSettings = { power: 95, speed: 50, passes: 5, airAssist: false };

      const recommendations = generateQualityRecommendations('cut', 'wood', problematicSettings);

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.suggestion).toBeTruthy();
        expect(rec.suggestion!.length).toBeGreaterThan(10);
      });
    });
  });

  describe('estimateMaterialCost', () => {
    test('should calculate cost correctly', () => {
      const result = estimateMaterialCost('test-material', 100, 50, 1000); // 100cm² used, $50 sheet, 1000cm² sheet

      expect(result).toBeDefined();
      expect(result!.estimatedCost).toBe(5); // (100/1000) * 50 = 5
      expect(result!.utilization).toBe(10); // (100/1000) * 100 = 10%
    });

    test('should handle full sheet utilization', () => {
      const result = estimateMaterialCost('test-material', 1000, 100, 1000); // Full sheet used

      expect(result).toBeDefined();
      expect(result!.estimatedCost).toBe(100);
      expect(result!.utilization).toBe(100);
    });

    test('should handle over-utilization', () => {
      const result = estimateMaterialCost('test-material', 1500, 100, 1000); // More than full sheet

      expect(result).toBeDefined();
      expect(result!.estimatedCost).toBe(150);
      expect(result!.utilization).toBe(100); // Capped at 100%
    });

    test('should return null when price info missing', () => {
      const result1 = estimateMaterialCost('test-material', 100);
      const result2 = estimateMaterialCost('test-material', 100, 50);
      const result3 = estimateMaterialCost('test-material', 100, undefined, 1000);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    test('should handle zero area', () => {
      const result = estimateMaterialCost('test-material', 0, 50, 1000);

      expect(result).toBeDefined();
      expect(result!.estimatedCost).toBe(0);
      expect(result!.utilization).toBe(0);
    });

    test('should round results appropriately', () => {
      const result = estimateMaterialCost('test-material', 123.456, 7.89, 1000);

      expect(result).toBeDefined();
      expect(result!.estimatedCost).toBe(0.97); // Rounded to 2 decimal places
      expect(result!.utilization).toBe(12.35); // Rounded to 2 decimal places
    });
  });

  describe('Integration Tests', () => {
    test('should provide consistent recommendations across functions', () => {
      const powerSpeedRec = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');
      const qualityRecs = generateQualityRecommendations('cut', 'basswood-3mm', powerSpeedRec.recommended);

      // Quality recommendations should not warn about the recommended settings
      const warnings = qualityRecs.filter(r => r.severity === 'warning');
      expect(warnings.length).toBe(0);
    });

    test('should maintain efficiency consistency', () => {
      const recommendation = generatePowerSpeedRecommendation('basswood-3mm', 3, 'cut', 'xtool-d1');

      const mainEfficiency = calculatePowerEfficiency(recommendation.recommended);
      const altEfficiencies = recommendation.alternatives.map(alt => calculatePowerEfficiency(alt));

      // All efficiencies should be reasonable
      expect(mainEfficiency).toBeGreaterThan(0);
      altEfficiencies.forEach(eff => {
        expect(eff).toBeGreaterThan(0);
        expect(eff).toBeLessThanOrEqual(100);
      });
    });
  });
});