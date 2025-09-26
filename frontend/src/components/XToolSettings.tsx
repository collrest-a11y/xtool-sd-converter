/**
 * XToolSettings Component
 * UI component for configuring xTool laser optimization settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import type {
  OptimizationSettings,
  XToolMachine,
  MaterialProfile,
  PowerSpeedRecommendation,
  OptimizationRecommendation,
  XToolMachineId
} from '../lib/xtool/types';
import {
  getAvailableMachines,
  getCompatibleMaterials,
  getMaterialsByCategory,
  validateMaterialCompatibility
} from '../lib/xtool/materials';
import {
  generatePowerSpeedRecommendation,
  generateOptimizationRecommendations
} from '../lib/xtool/recommendations';

interface XToolSettingsProps {
  settings: OptimizationSettings;
  onSettingsChange: (settings: OptimizationSettings) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
}

export function XToolSettings({
  settings,
  onSettingsChange,
  disabled = false,
  showAdvanced = true
}: XToolSettingsProps) {
  const [machines, setMachines] = useState<XToolMachine[]>([]);
  const [materials, setMaterials] = useState<MaterialProfile[]>([]);
  const [recommendations, setRecommendations] = useState<PowerSpeedRecommendation | null>(null);
  const [warnings, setWarnings] = useState<OptimizationRecommendation[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Load available machines on mount
  useEffect(() => {
    const availableMachines = getAvailableMachines();
    setMachines(availableMachines);

    // Set default machine if none selected
    if (!settings.machine && availableMachines.length > 0) {
      handleSettingChange('machine', availableMachines[0].id);
    }
  }, [settings.machine]);

  // Update materials when machine changes
  useEffect(() => {
    if (settings.machine) {
      const compatibleMaterials = getCompatibleMaterials(settings.machine as XToolMachineId);
      setMaterials(compatibleMaterials);

      // Set default material if none selected or not compatible
      if (!settings.material || !compatibleMaterials.find(m => m.id === settings.material)) {
        if (compatibleMaterials.length > 0) {
          handleSettingChange('material', compatibleMaterials[0].id);
        }
      }
    }
  }, [settings.machine, settings.material]);

  // Validate settings and generate recommendations
  useEffect(() => {
    if (settings.machine && settings.material) {
      validateSettings();
    }
  }, [settings.machine, settings.material]);

  const handleSettingChange = useCallback((key: keyof OptimizationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  }, [settings, onSettingsChange]);

  const validateSettings = useCallback(async () => {
    if (!settings.machine || !settings.material) return;

    setIsValidating(true);

    try {
      // Generate power/speed recommendations
      const rec = generatePowerSpeedRecommendation(
        settings.material,
        3, // Default thickness for now
        'cut',
        settings.machine as XToolMachineId
      );
      setRecommendations(rec);

      // Generate optimization recommendations
      const optRecs = generateOptimizationRecommendations(
        settings.material,
        3,
        settings.machine as XToolMachineId,
        100, // Estimated path count
        60  // Estimated time in minutes
      );
      setWarnings(optRecs);

    } catch (error) {
      console.error('Error validating settings:', error);
      setWarnings([{
        type: 'material',
        severity: 'error',
        message: 'Failed to validate settings',
        suggestion: 'Please check your machine and material selection'
      }]);
    } finally {
      setIsValidating(false);
    }
  }, [settings.machine, settings.material]);

  const selectedMachine = machines.find(m => m.id === settings.machine);
  const selectedMaterial = materials.find(m => m.id === settings.material);

  return (
    <div className="xtool-settings space-y-6 p-6 bg-white rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          xTool Laser Settings
        </h3>
        {recommendations && (
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showRecommendations ? 'Hide' : 'Show'} Recommendations
          </button>
        )}
      </div>

      {/* Machine Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          xTool Machine
        </label>
        <select
          value={settings.machine}
          onChange={(e) => handleSettingChange('machine', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a machine...</option>
          {machines.map(machine => (
            <option key={machine.id} value={machine.id}>
              {machine.name} ({machine.workArea.width}×{machine.workArea.height}mm)
            </option>
          ))}
        </select>
        {selectedMachine && (
          <div className="text-xs text-gray-600 mt-1">
            Work area: {selectedMachine.workArea.width}×{selectedMachine.workArea.height}mm |
            Power: {selectedMachine.powerRange.min}-{selectedMachine.powerRange.max}% |
            Speed: {selectedMachine.speedRange.min}-{selectedMachine.speedRange.max}mm/min
          </div>
        )}
      </div>

      {/* Material Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Material
        </label>
        <select
          value={settings.material}
          onChange={(e) => handleSettingChange('material', e.target.value)}
          disabled={disabled || !settings.machine}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select material...</option>
          {Object.entries(
            materials.reduce((groups, material) => {
              const category = material.category;
              if (!groups[category]) groups[category] = [];
              groups[category].push(material);
              return groups;
            }, {} as Record<string, MaterialProfile[]>)
          ).map(([category, categoryMaterials]) => (
            <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
              {categoryMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.thickness}mm)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedMaterial && (
          <div className="text-xs text-gray-600 mt-1">
            Thickness: {selectedMaterial.thickness}mm |
            Cut: {selectedMaterial.cutSettings.power}%@{selectedMaterial.cutSettings.speed}mm/min |
            Engrave: {selectedMaterial.engraveSettings.power}%@{selectedMaterial.engraveSettings.speed}mm/min
          </div>
        )}
      </div>

      {/* Optimization Options */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Optimization Options</h4>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.optimizeTravel}
              onChange={(e) => handleSettingChange('optimizeTravel', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700">Optimize travel paths</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.minimizeSharpTurns}
              onChange={(e) => handleSettingChange('minimizeSharpTurns', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700">Minimize sharp turns</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.groupSimilarOperations}
              onChange={(e) => handleSettingChange('groupSimilarOperations', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700">Group similar operations</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.optimizeLayerOrder}
              onChange={(e) => handleSettingChange('optimizeLayerOrder', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700">Optimize layer order</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.respectMaterialLimits}
              onChange={(e) => handleSettingChange('respectMaterialLimits', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="text-sm text-gray-700">Respect material limits</span>
          </label>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Margin (mm)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={settings.safetyMargin}
              onChange={(e) => handleSettingChange('safetyMargin', parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Warnings and Issues */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-md font-medium text-gray-800">Warnings & Recommendations</h4>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  warning.severity === 'error' ? 'bg-red-50 border border-red-200' :
                  warning.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className={`text-sm font-medium ${
                  warning.severity === 'error' ? 'text-red-800' :
                  warning.severity === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {warning.message}
                </div>
                {warning.suggestion && (
                  <div className={`text-xs mt-1 ${
                    warning.severity === 'error' ? 'text-red-600' :
                    warning.severity === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {warning.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Panel */}
      {showRecommendations && recommendations && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-md">
          <h4 className="text-md font-medium text-gray-800">Power & Speed Recommendations</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Material:</span> {recommendations.material}
            </div>
            <div>
              <span className="font-medium">Thickness:</span> {recommendations.thickness}mm
            </div>
            <div>
              <span className="font-medium">Operation:</span> {recommendations.operation}
            </div>
            <div>
              <span className="font-medium">Confidence:</span> {Math.round(recommendations.confidence * 100)}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-sm">Recommended Settings:</div>
            <div className="bg-white p-3 rounded border text-sm">
              Power: {recommendations.recommended.power}% |
              Speed: {recommendations.recommended.speed}mm/min |
              Passes: {recommendations.recommended.passes}
              {recommendations.recommended.airAssist && ' | Air Assist: ON'}
            </div>
          </div>

          {recommendations.alternatives.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium text-sm">Alternative Settings:</div>
              {recommendations.alternatives.slice(0, 2).map((alt, index) => (
                <div key={index} className="bg-white p-2 rounded border text-xs text-gray-600">
                  Power: {alt.power}% | Speed: {alt.speed}mm/min | Passes: {alt.passes}
                </div>
              ))}
            </div>
          )}

          {recommendations.notes.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-sm">Notes:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {recommendations.notes.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            warnings.some(w => w.severity === 'error') ? 'bg-red-500' :
            warnings.some(w => w.severity === 'warning') ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
          <span>
            {warnings.some(w => w.severity === 'error') ? 'Configuration Error' :
             warnings.some(w => w.severity === 'warning') ? 'Configuration Warning' :
             'Configuration Valid'}
          </span>
        </div>

        {isValidating && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Validating...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default XToolSettings;