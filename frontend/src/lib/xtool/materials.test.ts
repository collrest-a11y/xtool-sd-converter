/**
 * Tests for xTool Material Database
 */

import { describe, test, expect } from 'vitest';
import {
  XTOOL_MACHINES,
  MATERIAL_PROFILES,
  getCompatibleMaterials,
  getMaterialsByCategory,
  findMaterialByThickness,
  getRecommendedSettings,
  validateMaterialCompatibility,
  createCustomMaterial,
  getAvailableMachines,
  getMachine,
  getMaterial,
  estimateCuttingTime,
  estimatePowerConsumption
} from './materials';
import type { XToolMachineId } from './types';

describe('xTool Materials Database', () => {
  describe('Machine Database', () => {
    test('should have all required xTool machines', () => {
      const expectedMachines: XToolMachineId[] = ['xtool-d1', 'xtool-d1-pro', 'xtool-m1', 'xtool-p2'];

      expectedMachines.forEach(machineId => {
        expect(XTOOL_MACHINES[machineId]).toBeDefined();
        expect(XTOOL_MACHINES[machineId].name).toContain('xTool');
      });
    });

    test('should have valid machine specifications', () => {
      Object.values(XTOOL_MACHINES).forEach(machine => {
        expect(machine.id).toBeTruthy();
        expect(machine.name).toBeTruthy();
        expect(machine.workArea.width).toBeGreaterThan(0);
        expect(machine.workArea.height).toBeGreaterThan(0);
        expect(machine.powerRange.min).toBeGreaterThanOrEqual(0);
        expect(machine.powerRange.max).toBeGreaterThan(machine.powerRange.min);
        expect(machine.speedRange.min).toBeGreaterThan(0);
        expect(machine.speedRange.max).toBeGreaterThan(machine.speedRange.min);
        expect(Array.isArray(machine.supportedMaterials)).toBe(true);
        expect(Array.isArray(machine.features)).toBe(true);
      });
    });

    test('should have correct work area dimensions for known machines', () => {
      expect(XTOOL_MACHINES['xtool-d1'].workArea).toEqual({ width: 432, height: 406 });
      expect(XTOOL_MACHINES['xtool-d1-pro'].workArea).toEqual({ width: 432, height: 950 });
      expect(XTOOL_MACHINES['xtool-m1'].workArea).toEqual({ width: 385, height: 385 });
      expect(XTOOL_MACHINES['xtool-p2'].workArea).toEqual({ width: 600, height: 308 });
    });
  });

  describe('Material Database', () => {
    test('should have materials for all major categories', () => {
      const categories = ['wood', 'acrylic', 'leather', 'fabric', 'paper'];

      categories.forEach(category => {
        const materialsInCategory = Object.values(MATERIAL_PROFILES)
          .filter(material => material.category === category);
        expect(materialsInCategory.length).toBeGreaterThan(0);
      });
    });

    test('should have valid material specifications', () => {
      Object.values(MATERIAL_PROFILES).forEach(material => {
        expect(material.id).toBeTruthy();
        expect(material.name).toBeTruthy();
        expect(material.category).toBeTruthy();
        expect(material.thickness).toBeGreaterThan(0);
        expect(material.density).toBeGreaterThan(0);

        // Validate cut settings
        expect(material.cutSettings.power).toBeGreaterThan(0);
        expect(material.cutSettings.power).toBeLessThanOrEqual(100);
        expect(material.cutSettings.speed).toBeGreaterThan(0);
        expect(material.cutSettings.passes).toBeGreaterThan(0);

        // Validate engrave settings
        expect(material.engraveSettings.power).toBeGreaterThan(0);
        expect(material.engraveSettings.power).toBeLessThanOrEqual(100);
        expect(material.engraveSettings.speed).toBeGreaterThan(0);
        expect(material.engraveSettings.passes).toBeGreaterThan(0);
      });
    });

    test('should have materials with different thicknesses', () => {
      const thicknesses = Object.values(MATERIAL_PROFILES).map(m => m.thickness);
      const uniqueThicknesses = new Set(thicknesses);
      expect(uniqueThicknesses.size).toBeGreaterThan(3);
    });
  });

  describe('getCompatibleMaterials', () => {
    test('should return materials compatible with xTool D1', () => {
      const materials = getCompatibleMaterials('xtool-d1');
      expect(materials.length).toBeGreaterThan(0);

      materials.forEach(material => {
        expect(XTOOL_MACHINES['xtool-d1'].supportedMaterials)
          .toContain(material.category);
      });
    });

    test('should return different materials for different machines', () => {
      const d1Materials = getCompatibleMaterials('xtool-d1');
      const d1ProMaterials = getCompatibleMaterials('xtool-d1-pro');

      // D1 Pro should support metal (if we add metal materials)
      expect(d1ProMaterials.length).toBeGreaterThanOrEqual(d1Materials.length);
    });

    test('should throw error for unknown machine', () => {
      expect(() => {
        getCompatibleMaterials('unknown-machine' as XToolMachineId);
      }).toThrow('Unknown machine');
    });
  });

  describe('getMaterialsByCategory', () => {
    test('should return only wood materials when category is wood', () => {
      const woodMaterials = getMaterialsByCategory('wood');
      expect(woodMaterials.length).toBeGreaterThan(0);
      woodMaterials.forEach(material => {
        expect(material.category).toBe('wood');
      });
    });

    test('should return empty array for non-existent category', () => {
      const materials = getMaterialsByCategory('nonexistent' as any);
      expect(materials).toEqual([]);
    });
  });

  describe('findMaterialByThickness', () => {
    test('should find materials within thickness tolerance', () => {
      const materials = findMaterialByThickness('wood', 3, 0.5);
      expect(materials.length).toBeGreaterThan(0);

      materials.forEach(material => {
        expect(material.category).toBe('wood');
        expect(Math.abs(material.thickness - 3)).toBeLessThanOrEqual(0.5);
      });
    });

    test('should return empty array when no materials match thickness', () => {
      const materials = findMaterialByThickness('wood', 100, 0.1);
      expect(materials).toEqual([]);
    });

    test('should use default tolerance when not specified', () => {
      const materials = findMaterialByThickness('acrylic', 3);
      const materialsWithTolerance = findMaterialByThickness('acrylic', 3, 0.5);
      expect(materials).toEqual(materialsWithTolerance);
    });
  });

  describe('getRecommendedSettings', () => {
    test('should return cut settings for cut operation', () => {
      const settings = getRecommendedSettings('basswood-3mm', 'cut');
      expect(settings).toBeDefined();
      expect(settings).toEqual(MATERIAL_PROFILES['basswood-3mm'].cutSettings);
    });

    test('should return engrave settings for engrave operation', () => {
      const settings = getRecommendedSettings('basswood-3mm', 'engrave');
      expect(settings).toBeDefined();
      expect(settings).toEqual(MATERIAL_PROFILES['basswood-3mm'].engraveSettings);
    });

    test('should return null for unknown material', () => {
      const settings = getRecommendedSettings('unknown-material', 'cut');
      expect(settings).toBeNull();
    });
  });

  describe('validateMaterialCompatibility', () => {
    test('should validate compatible material and machine', () => {
      const result = validateMaterialCompatibility('basswood-3mm', 'xtool-d1');
      expect(result.compatible).toBe(true);
      expect(result.issues).toEqual([]);
    });

    test('should detect incompatible material category', () => {
      // Assuming we have a metal material and D1 doesn't support it
      const metalMaterial = Object.values(MATERIAL_PROFILES)
        .find(m => m.category === 'metal');

      if (metalMaterial) {
        const result = validateMaterialCompatibility(metalMaterial.id, 'xtool-d1');
        expect(result.compatible).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues[0]).toContain('not supported');
      }
    });

    test('should handle unknown material', () => {
      const result = validateMaterialCompatibility('unknown-material', 'xtool-d1');
      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Unknown material: unknown-material');
    });

    test('should handle unknown machine', () => {
      const result = validateMaterialCompatibility('basswood-3mm', 'unknown-machine' as XToolMachineId);
      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Unknown machine: unknown-machine');
    });

    test('should check power and speed limits', () => {
      // Create a test scenario where settings exceed machine limits
      const testMaterial = createCustomMaterial(
        'test-material',
        'Test Material',
        'wood',
        3,
        150, // Power exceeds 100%
        30000, // Speed exceeds typical machine limits
        50,
        1000
      );

      // Temporarily add to profiles for testing
      const originalProfiles = { ...MATERIAL_PROFILES };
      (MATERIAL_PROFILES as any)['test-material'] = testMaterial;

      const result = validateMaterialCompatibility('test-material', 'xtool-d1');
      expect(result.compatible).toBe(false);
      expect(result.issues.some(issue => issue.includes('power'))).toBe(true);

      // Restore original profiles
      Object.keys(MATERIAL_PROFILES).forEach(key => {
        if (key === 'test-material') {
          delete (MATERIAL_PROFILES as any)[key];
        }
      });
      Object.assign(MATERIAL_PROFILES, originalProfiles);
    });
  });

  describe('createCustomMaterial', () => {
    test('should create valid custom material', () => {
      const customMaterial = createCustomMaterial(
        'custom-wood-5mm',
        'Custom Wood 5mm',
        'wood',
        5,
        80,
        200,
        40,
        1500
      );

      expect(customMaterial.id).toBe('custom-wood-5mm');
      expect(customMaterial.name).toBe('Custom Wood 5mm');
      expect(customMaterial.category).toBe('wood');
      expect(customMaterial.thickness).toBe(5);
      expect(customMaterial.cutSettings.power).toBe(80);
      expect(customMaterial.cutSettings.speed).toBe(200);
      expect(customMaterial.engraveSettings.power).toBe(40);
      expect(customMaterial.engraveSettings.speed).toBe(1500);
      expect(customMaterial.safetyNotes).toContain('test settings');
    });

    test('should set appropriate air assist defaults', () => {
      const woodMaterial = createCustomMaterial('test-wood', 'Test Wood', 'wood', 3, 50, 100, 25, 1000);
      const acrylicMaterial = createCustomMaterial('test-acrylic', 'Test Acrylic', 'acrylic', 3, 50, 100, 25, 1000);

      expect(woodMaterial.cutSettings.airAssist).toBe(true);
      expect(acrylicMaterial.cutSettings.airAssist).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    test('getAvailableMachines should return all machines', () => {
      const machines = getAvailableMachines();
      expect(machines.length).toBe(Object.keys(XTOOL_MACHINES).length);
      expect(machines).toEqual(Object.values(XTOOL_MACHINES));
    });

    test('getMachine should return correct machine', () => {
      const machine = getMachine('xtool-d1');
      expect(machine).toEqual(XTOOL_MACHINES['xtool-d1']);
    });

    test('getMachine should return null for unknown machine', () => {
      const machine = getMachine('unknown' as XToolMachineId);
      expect(machine).toBeNull();
    });

    test('getMaterial should return correct material', () => {
      const material = getMaterial('basswood-3mm');
      expect(material).toEqual(MATERIAL_PROFILES['basswood-3mm']);
    });

    test('getMaterial should return null for unknown material', () => {
      const material = getMaterial('unknown-material');
      expect(material).toBeNull();
    });
  });

  describe('Estimation Functions', () => {
    test('estimateCuttingTime should calculate time correctly', () => {
      const pathLength = 1000; // mm
      const settings = { speed: 500, passes: 2 }; // mm/min, passes

      const time = estimateCuttingTime(pathLength, settings);

      // Expected: (1000/500) * 2 + 0.5 = 4.5 minutes
      expect(time).toBe(4.5);
    });

    test('estimatePowerConsumption should calculate power correctly', () => {
      const cuttingTime = 60; // minutes
      const power = 50; // %
      const consumption = estimatePowerConsumption(cuttingTime, power, 'xtool-d1');

      // Expected: 40W * 0.5 * 1 hour = 20Wh
      expect(consumption).toBe(20);
    });

    test('should handle edge cases in estimation', () => {
      expect(estimateCuttingTime(0, { speed: 1000, passes: 1 })).toBe(0.5); // Setup time only
      expect(estimatePowerConsumption(0, 100, 'xtool-d1')).toBe(0);
      expect(estimatePowerConsumption(30, 0, 'xtool-d1')).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    test('all materials should have reasonable settings', () => {
      Object.values(MATERIAL_PROFILES).forEach(material => {
        // Cut power should generally be higher than engrave power
        expect(material.cutSettings.power).toBeGreaterThanOrEqual(material.engraveSettings.power);

        // Engrave speed should generally be higher than cut speed
        expect(material.engraveSettings.speed).toBeGreaterThanOrEqual(material.cutSettings.speed);

        // Thickness should be reasonable (0.1mm to 20mm)
        expect(material.thickness).toBeGreaterThan(0.1);
        expect(material.thickness).toBeLessThan(20);

        // Density should be reasonable
        expect(material.density).toBeGreaterThan(0.01);
        expect(material.density).toBeLessThan(20);
      });
    });

    test('machine work areas should be reasonable', () => {
      Object.values(XTOOL_MACHINES).forEach(machine => {
        expect(machine.workArea.width).toBeGreaterThan(100); // At least 100mm
        expect(machine.workArea.width).toBeLessThan(2000); // Less than 2000mm
        expect(machine.workArea.height).toBeGreaterThan(100);
        expect(machine.workArea.height).toBeLessThan(2000);
      });
    });

    test('material IDs should follow naming convention', () => {
      Object.keys(MATERIAL_PROFILES).forEach(id => {
        expect(id).toMatch(/^[a-z0-9-]+$/); // lowercase, numbers, hyphens only
        expect(id).toContain('-'); // Should contain material type and thickness
      });
    });
  });
});