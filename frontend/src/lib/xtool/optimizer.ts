/**
 * xTool Main Optimization Engine
 * Integrates with style processing and provides laser-specific optimization
 */

import type {
  OptimizationJob,
  OptimizationResult,
  OptimizationSettings,
  XToolJob,
  ToolpathLayer,
  LaserPath,
  PathPoint,
  XToolMachineId,
  StyleToXToolMapping
} from './types';
import type { ProcessingResult, StyleParameters } from '../styles/types';
import { optimizePaths, estimateJobTime } from './path-optimizer';
import { generatePowerSpeedRecommendation, generateOptimizationRecommendations } from './recommendations';
import { XTOOL_MACHINES, MATERIAL_PROFILES, validateMaterialCompatibility } from './materials';

/**
 * Default style to xTool operation mappings
 */
const STYLE_MAPPINGS: Record<string, StyleToXToolMapping> = {
  'line-art': {
    styleId: 'line-art',
    defaultOperation: 'engrave',
    layerSeparation: true,
    pathExtraction: 'vector',
    qualityLevel: 'high'
  },
  'halftone': {
    styleId: 'halftone',
    defaultOperation: 'engrave',
    layerSeparation: false,
    pathExtraction: 'raster',
    qualityLevel: 'normal'
  },
  'stipple': {
    styleId: 'stipple',
    defaultOperation: 'engrave',
    layerSeparation: false,
    pathExtraction: 'vector',
    qualityLevel: 'high'
  },
  'geometric': {
    styleId: 'geometric',
    defaultOperation: 'cut',
    layerSeparation: true,
    pathExtraction: 'vector',
    qualityLevel: 'normal'
  },
  'minimalist': {
    styleId: 'minimalist',
    defaultOperation: 'engrave',
    layerSeparation: false,
    pathExtraction: 'contour',
    qualityLevel: 'ultra'
  }
};

export class XToolOptimizer {
  private processingQueue: Map<string, OptimizationJob> = new Map();
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Initialize the optimizer
   */
  constructor() {
    this.setupDefaultEventHandlers();
  }

  /**
   * Convert style processing result to laser toolpaths
   */
  async convertStyleToToolpaths(
    styleResult: ProcessingResult,
    styleId: string,
    settings: OptimizationSettings
  ): Promise<ToolpathLayer[]> {
    if (!styleResult.success || !styleResult.imageUrl) {
      throw new Error('Style processing failed or no image result');
    }

    const mapping = STYLE_MAPPINGS[styleId];
    if (!mapping) {
      throw new Error(`No xTool mapping found for style: ${styleId}`);
    }

    const machine = XTOOL_MACHINES[settings.machine as XToolMachineId];
    const material = MATERIAL_PROFILES[settings.material];

    if (!machine || !material) {
      throw new Error('Invalid machine or material specified');
    }

    // Get recommended settings
    const powerSpeedRec = generatePowerSpeedRecommendation(
      settings.material,
      material.thickness,
      mapping.defaultOperation,
      settings.machine as XToolMachineId,
      mapping.qualityLevel
    );

    // Extract paths from the processed image based on the style
    const paths = await this.extractPathsFromImage(
      styleResult.imageUrl,
      mapping,
      machine.workArea
    );

    // Create base layer
    const baseLayer: ToolpathLayer = {
      id: `layer-${mapping.defaultOperation}`,
      name: `${mapping.defaultOperation.charAt(0).toUpperCase() + mapping.defaultOperation.slice(1)}`,
      type: mapping.defaultOperation,
      paths: paths.map((path, index) => ({
        ...path,
        id: `path-${index}`,
        type: mapping.defaultOperation,
        settings: powerSpeedRec.recommended,
        material: settings.material,
        priority: index
      })),
      settings: powerSpeedRec.recommended,
      color: this.getLayerColor(mapping.defaultOperation),
      visible: true,
      locked: false
    };

    // Perform layer separation if enabled
    if (mapping.layerSeparation) {
      return this.separateIntoLayers(baseLayer, settings);
    }

    return [baseLayer];
  }

  /**
   * Extract paths from processed image
   */
  private async extractPathsFromImage(
    imageUrl: string,
    mapping: StyleToXToolMapping,
    workArea: { width: number; height: number }
  ): Promise<Omit<LaserPath, 'id' | 'type' | 'settings' | 'material' | 'priority'>[]> {
    // This would integrate with actual image processing libraries
    // For now, create sample paths based on the extraction method

    const paths: Omit<LaserPath, 'id' | 'type' | 'settings' | 'material' | 'priority'>[] = [];

    switch (mapping.pathExtraction) {
      case 'vector':
        // Vector extraction would trace outlines and convert to paths
        paths.push(...this.generateVectorPaths(workArea));
        break;

      case 'raster':
        // Raster extraction creates a grid of points for dot-based operations
        paths.push(...this.generateRasterPaths(workArea));
        break;

      case 'contour':
        // Contour extraction finds edge boundaries
        paths.push(...this.generateContourPaths(workArea));
        break;
    }

    return paths;
  }

  /**
   * Generate sample vector paths (placeholder for actual implementation)
   */
  private generateVectorPaths(workArea: { width: number; height: number }) {
    const paths = [];
    const centerX = workArea.width / 2;
    const centerY = workArea.height / 2;
    const radius = Math.min(workArea.width, workArea.height) / 4;

    // Create a sample circular path
    const points: PathPoint[] = [];
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    paths.push({
      points,
      closed: true,
      depth: 0.1
    });

    return paths;
  }

  /**
   * Generate sample raster paths (placeholder)
   */
  private generateRasterPaths(workArea: { width: number; height: number }) {
    const paths = [];
    const spacing = 2; // mm between dots

    for (let y = spacing; y < workArea.height; y += spacing) {
      const points: PathPoint[] = [];
      for (let x = spacing; x < workArea.width; x += spacing) {
        // Add some randomness for stipple effect
        if (Math.random() > 0.3) {
          points.push({ x, y });
        }
      }
      if (points.length > 0) {
        paths.push({
          points,
          closed: false,
          depth: 0.05
        });
      }
    }

    return paths;
  }

  /**
   * Generate sample contour paths (placeholder)
   */
  private generateContourPaths(workArea: { width: number; height: number }) {
    const paths = [];
    const margin = 10;

    // Create a simple rectangular contour
    const points: PathPoint[] = [
      { x: margin, y: margin },
      { x: workArea.width - margin, y: margin },
      { x: workArea.width - margin, y: workArea.height - margin },
      { x: margin, y: workArea.height - margin },
      { x: margin, y: margin }
    ];

    paths.push({
      points,
      closed: true,
      depth: 0.2
    });

    return paths;
  }

  /**
   * Separate paths into different layers based on operation type
   */
  private separateIntoLayers(
    baseLayer: ToolpathLayer,
    settings: OptimizationSettings
  ): ToolpathLayer[] {
    const layers: ToolpathLayer[] = [];
    const material = MATERIAL_PROFILES[settings.material];
    const machine = XTOOL_MACHINES[settings.machine as XToolMachineId];

    if (!material || !machine) {
      return [baseLayer];
    }

    // Analyze paths to determine which should be cuts vs engraves
    const cutPaths = baseLayer.paths.filter(path => this.shouldBeCut(path));
    const engravePaths = baseLayer.paths.filter(path => !this.shouldBeCut(path));

    // Create engrave layer if needed
    if (engravePaths.length > 0) {
      const engraveRec = generatePowerSpeedRecommendation(
        settings.material,
        material.thickness,
        'engrave',
        settings.machine as XToolMachineId
      );

      layers.push({
        id: 'layer-engrave',
        name: 'Engrave',
        type: 'engrave',
        paths: engravePaths.map(path => ({
          ...path,
          type: 'engrave',
          settings: engraveRec.recommended
        })),
        settings: engraveRec.recommended,
        color: this.getLayerColor('engrave'),
        visible: true,
        locked: false
      });
    }

    // Create cut layer if needed
    if (cutPaths.length > 0) {
      const cutRec = generatePowerSpeedRecommendation(
        settings.material,
        material.thickness,
        'cut',
        settings.machine as XToolMachineId
      );

      layers.push({
        id: 'layer-cut',
        name: 'Cut',
        type: 'cut',
        paths: cutPaths.map(path => ({
          ...path,
          type: 'cut',
          settings: cutRec.recommended
        })),
        settings: cutRec.recommended,
        color: this.getLayerColor('cut'),
        visible: true,
        locked: false
      });
    }

    return layers.length > 0 ? layers : [baseLayer];
  }

  /**
   * Determine if a path should be a cut operation
   */
  private shouldBeCut(path: LaserPath): boolean {
    // Simple heuristic: closed paths with significant area are cuts
    if (!path.closed) return false;

    const area = this.calculatePathArea(path.points);
    return area > 100; // mm² threshold
  }

  /**
   * Calculate area of a closed path
   */
  private calculatePathArea(points: PathPoint[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
      area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Get appropriate color for layer type
   */
  private getLayerColor(type: 'cut' | 'engrave' | 'score'): string {
    const colors = {
      'cut': '#ff0000', // Red for cuts
      'engrave': '#0000ff', // Blue for engraves
      'score': '#00ff00' // Green for scores
    };
    return colors[type];
  }

  /**
   * Main optimization function
   */
  async optimizeForXTool(
    styleResult: ProcessingResult,
    styleId: string,
    settings: OptimizationSettings
  ): Promise<OptimizationResult> {
    const jobId = this.generateJobId();

    const job: OptimizationJob = {
      id: jobId,
      inputImage: styleResult.imageUrl || '',
      styleId,
      settings,
      status: 'processing',
      progress: 0,
      createdAt: new Date()
    };

    this.processingQueue.set(jobId, job);
    this.emit('job:started', { jobId, job });

    try {
      // Convert style to toolpaths
      job.progress = 25;
      this.emit('job:progress', { jobId, progress: job.progress });

      const layers = await this.convertStyleToToolpaths(styleResult, styleId, settings);

      // Optimize paths
      job.progress = 50;
      this.emit('job:progress', { jobId, progress: job.progress });

      const machine = XTOOL_MACHINES[settings.machine as XToolMachineId];
      const { optimizedLayers, result: pathResult } = optimizePaths(layers, settings, machine!);

      // Generate recommendations
      job.progress = 75;
      this.emit('job:progress', { jobId, progress: job.progress });

      const material = MATERIAL_PROFILES[settings.material];
      const estimatedTime = estimateJobTime(optimizedLayers);
      const totalPaths = optimizedLayers.reduce((sum, layer) => sum + layer.paths.length, 0);

      const recommendations = generateOptimizationRecommendations(
        settings.material,
        material?.thickness || 3,
        settings.machine as XToolMachineId,
        totalPaths,
        estimatedTime
      );

      // Create xTool job
      const xToolJob: XToolJob = {
        id: jobId,
        name: `${styleId} Laser Job`,
        machine: machine!,
        material: material!,
        layers: optimizedLayers,
        settings,
        estimatedTime,
        estimatedPowerUsage: this.calculatePowerUsage(optimizedLayers, estimatedTime),
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      // Complete the job
      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date();

      const optimizationResult: OptimizationResult = {
        success: true,
        job: xToolJob,
        layers: optimizedLayers,
        pathOptimization: pathResult,
        recommendations,
        previewUrl: await this.generatePreviewUrl(optimizedLayers)
      };

      job.result = optimizationResult;
      this.processingQueue.set(jobId, job);

      this.emit('job:completed', { jobId, result: optimizationResult });
      return optimizationResult;

    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors = [error instanceof Error ? error.message : 'Unknown error'];

      const result: OptimizationResult = {
        success: false,
        job: {} as XToolJob,
        layers: [],
        pathOptimization: {
          originalLength: 0,
          optimizedLength: 0,
          timeReduction: 0,
          energySaving: 0,
          layerOrder: [],
          warnings: []
        },
        recommendations: [],
        error: job.errors[0]
      };

      job.result = result;
      this.processingQueue.set(jobId, job);

      this.emit('job:failed', { jobId, error });
      return result;
    }
  }

  /**
   * Calculate estimated power usage
   */
  private calculatePowerUsage(layers: ToolpathLayer[], estimatedTime: number): number {
    let totalPowerUsage = 0;

    layers.forEach(layer => {
      const layerTime = layer.paths.reduce((time, path) => {
        const pathLength = path.points.length * 2; // rough estimate
        return time + (pathLength / path.settings.speed) * path.settings.passes;
      }, 0);

      const avgPower = layer.paths.reduce((sum, path) => sum + path.settings.power, 0) / layer.paths.length;
      totalPowerUsage += (layerTime / 60) * (avgPower / 100) * 40; // 40W typical laser
    });

    return totalPowerUsage; // Wh
  }

  /**
   * Generate preview URL for toolpaths
   */
  private async generatePreviewUrl(layers: ToolpathLayer[]): Promise<string> {
    // This would generate an SVG or image preview of the toolpaths
    // For now, return a placeholder
    return `/api/preview/${this.generateJobId()}`;
  }

  /**
   * Export job to various formats
   */
  async exportJob(
    job: XToolJob,
    format: 'gcode' | 'lbrn2' | 'svg' | 'dxf'
  ): Promise<{ filename: string; content: string }> {
    switch (format) {
      case 'gcode':
        return this.exportToGCode(job);
      case 'lbrn2':
        return this.exportToLightBurn(job);
      case 'svg':
        return this.exportToSVG(job);
      case 'dxf':
        return this.exportToDXF(job);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to G-code format
   */
  private exportToGCode(job: XToolJob): { filename: string; content: string } {
    let gcode = '';

    // G-code header
    gcode += '; Generated by xTool Optimizer\n';
    gcode += `; Job: ${job.name}\n`;
    gcode += `; Machine: ${job.machine.name}\n`;
    gcode += `; Material: ${job.material.name}\n`;
    gcode += `; Generated: ${new Date().toISOString()}\n\n`;

    gcode += 'G21 ; Set units to millimeters\n';
    gcode += 'G90 ; Absolute positioning\n';
    gcode += 'M3 ; Laser on\n\n';

    // Process layers in order
    job.layers.forEach(layer => {
      gcode += `; Layer: ${layer.name}\n`;
      gcode += `M106 S${Math.round((layer.settings.power / 100) * 255)} ; Set laser power\n`;

      layer.paths.forEach(path => {
        if (path.points.length === 0) return;

        // Move to start point
        const start = path.points[0];
        gcode += `G0 X${start.x} Y${start.y} ; Move to start\n`;

        // Process path points
        for (let i = 1; i < path.points.length; i++) {
          const point = path.points[i];
          const feedRate = path.settings.speed;
          gcode += `G1 X${point.x} Y${point.y} F${feedRate}\n`;
        }

        // Multiple passes if needed
        for (let pass = 1; pass < path.settings.passes; pass++) {
          gcode += `; Pass ${pass + 1}\n`;
          for (let i = 1; i < path.points.length; i++) {
            const point = path.points[i];
            gcode += `G1 X${point.x} Y${point.y}\n`;
          }
        }

        gcode += '\n';
      });
    });

    gcode += 'M5 ; Laser off\n';
    gcode += 'G0 X0 Y0 ; Return to origin\n';

    return {
      filename: `${job.name.replace(/\s+/g, '_')}.gcode`,
      content: gcode
    };
  }

  /**
   * Export to LightBurn format (simplified)
   */
  private exportToLightBurn(job: XToolJob): { filename: string; content: string } {
    // This would generate a proper LightBurn .lbrn2 file
    // For now, create a basic XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<LightBurnProject>\n';
    xml += `  <CutSettings>\n`;

    job.layers.forEach((layer, index) => {
      xml += `    <CutSetting type="${layer.type}" priority="${index}">\n`;
      xml += `      <index Value="${index}"/>\n`;
      xml += `      <power Value="${layer.settings.power}"/>\n`;
      xml += `      <speed Value="${layer.settings.speed}"/>\n`;
      xml += `      <passes Value="${layer.settings.passes}"/>\n`;
      xml += `    </CutSetting>\n`;
    });

    xml += '  </CutSettings>\n';
    xml += '</LightBurnProject>\n';

    return {
      filename: `${job.name.replace(/\s+/g, '_')}.lbrn2`,
      content: xml
    };
  }

  /**
   * Export to SVG format
   */
  private exportToSVG(job: XToolJob): { filename: string; content: string } {
    let svg = `<svg width="${job.machine.workArea.width}" height="${job.machine.workArea.height}" xmlns="http://www.w3.org/2000/svg">\n`;

    job.layers.forEach(layer => {
      layer.paths.forEach(path => {
        if (path.points.length === 0) return;

        const pathData = path.points
          .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
          .join(' ');

        svg += `  <path d="${pathData}${path.closed ? ' Z' : ''}" `;
        svg += `stroke="${layer.color}" fill="none" stroke-width="0.1"/>\n`;
      });
    });

    svg += '</svg>\n';

    return {
      filename: `${job.name.replace(/\s+/g, '_')}.svg`,
      content: svg
    };
  }

  /**
   * Export to DXF format (simplified)
   */
  private exportToDXF(job: XToolJob): { filename: string; content: string } {
    let dxf = '0\nSECTION\n2\nENTITIES\n';

    job.layers.forEach(layer => {
      layer.paths.forEach(path => {
        if (path.points.length < 2) return;

        for (let i = 1; i < path.points.length; i++) {
          const start = path.points[i - 1];
          const end = path.points[i];

          dxf += '0\nLINE\n';
          dxf += '8\n' + layer.name + '\n';
          dxf += `10\n${start.x}\n20\n${start.y}\n`;
          dxf += `11\n${end.x}\n21\n${end.y}\n`;
        }
      });
    });

    dxf += '0\nENDSEC\n0\nEOF\n';

    return {
      filename: `${job.name.replace(/\s+/g, '_')}.dxf`,
      content: dxf
    };
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `xtool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event system
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any = {}): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultEventHandlers(): void {
    this.on('job:started', (data) => {
      console.log(`xTool optimization job started: ${data.jobId}`);
    });

    this.on('job:completed', (data) => {
      console.log(`xTool optimization job completed: ${data.jobId}`);
    });

    this.on('job:failed', (data) => {
      console.error(`xTool optimization job failed: ${data.jobId}`, data.error);
    });
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): OptimizationJob | null {
    return this.processingQueue.get(jobId) || null;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): void {
    const job = this.processingQueue.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors = ['Job cancelled by user'];
      this.processingQueue.set(jobId, job);
      this.emit('job:cancelled', { jobId });
    }
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): void {
    for (const [jobId, job] of this.processingQueue.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.processingQueue.delete(jobId);
      }
    }
    this.emit('queue:cleared');
  }
}