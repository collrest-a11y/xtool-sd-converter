/**
 * Export Functions for xTool SD Converter
 * Handles export to various formats for different use cases
 */

import type { XToolJob, ToolpathLayer } from '../xtool/types';
import type { ProcessingResult } from '../styles/types';

export interface ExportOptions {
  format: 'svg' | 'dxf' | 'gcode' | 'lbrn2' | 'png' | 'jpg' | 'pdf';
  quality?: 'draft' | 'normal' | 'high';
  includeMetadata?: boolean;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  content: string | ArrayBuffer;
  mimeType: string;
  size: number;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Export style processing result to image formats
 */
export async function exportStyleResult(
  result: ProcessingResult,
  options: ExportOptions
): Promise<ExportResult> {
  if (!result.success || !result.imageUrl) {
    return {
      success: false,
      filename: '',
      content: '',
      mimeType: '',
      size: 0,
      error: 'No valid image result to export'
    };
  }

  const filename = options.filename || `style-result.${options.format}`;

  try {
    switch (options.format) {
      case 'png':
        return await exportImageAsPNG(result.imageUrl, filename, options);
      case 'jpg':
        return await exportImageAsJPG(result.imageUrl, filename, options);
      case 'svg':
        return await exportImageAsSVG(result.imageUrl, filename, options);
      default:
        throw new Error(`Unsupported format for style result: ${options.format}`);
    }
  } catch (error) {
    return {
      success: false,
      filename,
      content: '',
      mimeType: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
}

/**
 * Export xTool job to machine-compatible formats
 */
export async function exportXToolJob(
  job: XToolJob,
  options: ExportOptions
): Promise<ExportResult> {
  const filename = options.filename || `${job.name.replace(/\s+/g, '_')}.${options.format}`;

  try {
    switch (options.format) {
      case 'gcode':
        return exportAsGCode(job, filename, options);
      case 'lbrn2':
        return exportAsLightBurn(job, filename, options);
      case 'svg':
        return exportJobAsSVG(job, filename, options);
      case 'dxf':
        return exportAsDXF(job, filename, options);
      case 'pdf':
        return await exportAsPDF(job, filename, options);
      default:
        throw new Error(`Unsupported format for xTool job: ${options.format}`);
    }
  } catch (error) {
    return {
      success: false,
      filename,
      content: '',
      mimeType: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
}

/**
 * Export layers as individual files
 */
export async function exportLayers(
  layers: ToolpathLayer[],
  options: ExportOptions & { separateFiles?: boolean }
): Promise<ExportResult[]> {
  const results: ExportResult[] = [];

  if (options.separateFiles) {
    // Export each layer as a separate file
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerFilename = options.filename
        ? `${options.filename.split('.')[0]}_layer_${i + 1}.${options.format}`
        : `layer_${layer.name.replace(/\s+/g, '_')}.${options.format}`;

      const mockJob: XToolJob = {
        id: `layer-export-${i}`,
        name: layer.name,
        machine: {} as any,
        material: {} as any,
        layers: [layer],
        settings: {} as any,
        estimatedTime: 0,
        estimatedPowerUsage: 0,
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      const result = await exportXToolJob(mockJob, {
        ...options,
        filename: layerFilename
      });
      results.push(result);
    }
  } else {
    // Export all layers in a single file
    const mockJob: XToolJob = {
      id: 'layers-export',
      name: 'Combined Layers',
      machine: {} as any,
      material: {} as any,
      layers,
      settings: {} as any,
      estimatedTime: 0,
      estimatedPowerUsage: 0,
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    const result = await exportXToolJob(mockJob, options);
    results.push(result);
  }

  return results;
}

/**
 * Export image as PNG
 */
async function exportImageAsPNG(
  imageUrl: string,
  filename: string,
  options: ExportOptions
): Promise<ExportResult> {
  // In a real implementation, this would convert the image
  // For simulation, we'll create a mock result
  const content = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

  return {
    success: true,
    filename,
    content,
    mimeType: 'image/png',
    size: content.length,
    metadata: options.includeMetadata ? {
      format: 'PNG',
      quality: options.quality,
      exportedAt: new Date().toISOString()
    } : undefined
  };
}

/**
 * Export image as JPG
 */
async function exportImageAsJPG(
  imageUrl: string,
  filename: string,
  options: ExportOptions
): Promise<ExportResult> {
  const content = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA8=`;

  return {
    success: true,
    filename,
    content,
    mimeType: 'image/jpeg',
    size: content.length,
    metadata: options.includeMetadata ? {
      format: 'JPEG',
      quality: options.quality,
      exportedAt: new Date().toISOString()
    } : undefined
  };
}

/**
 * Export image as SVG
 */
async function exportImageAsSVG(
  imageUrl: string,
  filename: string,
  options: ExportOptions
): Promise<ExportResult> {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="white"/>
  <image href="${imageUrl}" width="400" height="400"/>
  ${options.includeMetadata ? `<!-- Exported from xTool SD Converter at ${new Date().toISOString()} -->` : ''}
</svg>`;

  return {
    success: true,
    filename,
    content: svg,
    mimeType: 'image/svg+xml',
    size: svg.length
  };
}

/**
 * Export job as G-code
 */
function exportAsGCode(
  job: XToolJob,
  filename: string,
  options: ExportOptions
): ExportResult {
  let gcode = '';

  // G-code header
  gcode += '; Generated by xTool SD Converter\n';
  gcode += `; Job: ${job.name}\n`;
  gcode += `; Machine: ${job.machine.name || 'xTool'}\n`;
  gcode += `; Material: ${job.material.name || 'Unknown'}\n`;
  gcode += `; Generated: ${new Date().toISOString()}\n\n`;

  if (options.includeMetadata) {
    gcode += `; Estimated Time: ${job.estimatedTime} minutes\n`;
    gcode += `; Estimated Power: ${job.estimatedPowerUsage} Wh\n\n`;
  }

  gcode += 'G21 ; Set units to millimeters\n';
  gcode += 'G90 ; Absolute positioning\n';
  gcode += 'M3 ; Laser on\n\n';

  // Process layers
  job.layers.forEach(layer => {
    gcode += `; Layer: ${layer.name}\n`;
    gcode += `M106 S${Math.round((layer.settings.power / 100) * 255)} ; Set laser power\n`;

    layer.paths.forEach((path, pathIndex) => {
      if (path.points.length === 0) return;

      gcode += `; Path ${pathIndex + 1}\n`;
      const start = path.points[0];
      gcode += `G0 X${start.x.toFixed(3)} Y${start.y.toFixed(3)} ; Move to start\n`;

      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        gcode += `G1 X${point.x.toFixed(3)} Y${point.y.toFixed(3)} F${path.settings.speed}\n`;
      }

      if (path.closed && path.points.length > 2) {
        gcode += `G1 X${start.x.toFixed(3)} Y${start.y.toFixed(3)} ; Close path\n`;
      }

      gcode += '\n';
    });
  });

  gcode += 'M5 ; Laser off\n';
  gcode += 'G0 X0 Y0 ; Return to origin\n';

  return {
    success: true,
    filename,
    content: gcode,
    mimeType: 'text/plain',
    size: gcode.length,
    metadata: options.includeMetadata ? {
      format: 'G-code',
      totalLines: gcode.split('\n').length,
      estimatedTime: job.estimatedTime
    } : undefined
  };
}

/**
 * Export as LightBurn format
 */
function exportAsLightBurn(
  job: XToolJob,
  filename: string,
  options: ExportOptions
): ExportResult {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<LightBurnProject AppVersion="1.4.03" FormatVersion="1" MaterialHeight="0" MirrorX="False" MirrorY="False">\n';

  // Cut settings
  xml += '  <CutSetting type="Cut">\n';
  job.layers.forEach((layer, index) => {
    xml += `    <index Value="${index}"/>\n`;
    xml += `    <name Value="${layer.name}"/>\n`;
    xml += `    <minPower Value="${layer.settings.power}"/>\n`;
    xml += `    <maxPower Value="${layer.settings.power}"/>\n`;
    xml += `    <speed Value="${layer.settings.speed}"/>\n`;
    xml += `    <kerf Value="0"/>\n`;
    xml += `    <numPasses Value="${layer.settings.passes}"/>\n`;
    xml += `    <zOffset Value="0"/>\n`;
  });
  xml += '  </CutSetting>\n';

  // Shapes
  xml += '  <Shape Type="Group">\n';
  job.layers.forEach(layer => {
    layer.paths.forEach(path => {
      if (path.points.length < 2) return;

      xml += '    <Shape Type="Path">\n';
      xml += `      <XForm>1 0 0 1 ${path.points[0].x} ${path.points[0].y}</XForm>\n`;
      xml += '      <PathData>\n';

      const pathData = path.points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

      xml += `        ${pathData}${path.closed ? ' Z' : ''}\n`;
      xml += '      </PathData>\n';
      xml += '    </Shape>\n';
    });
  });
  xml += '  </Shape>\n';

  xml += '</LightBurnProject>\n';

  return {
    success: true,
    filename,
    content: xml,
    mimeType: 'application/xml',
    size: xml.length
  };
}

/**
 * Export job as SVG
 */
function exportJobAsSVG(
  job: XToolJob,
  filename: string,
  options: ExportOptions
): ExportResult {
  const workArea = job.machine.workArea || { width: 400, height: 400 };
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="${workArea.width}" height="${workArea.height}" xmlns="http://www.w3.org/2000/svg">\n`;

  if (options.includeMetadata) {
    svg += `  <!-- Generated by xTool SD Converter -->\n`;
    svg += `  <!-- Job: ${job.name} -->\n`;
    svg += `  <!-- Generated: ${new Date().toISOString()} -->\n`;
  }

  // Add each layer as a group
  job.layers.forEach(layer => {
    svg += `  <g id="${layer.id}" stroke="${layer.color}" fill="none" stroke-width="0.1">\n`;
    svg += `    <!-- Layer: ${layer.name} -->\n`;

    layer.paths.forEach((path, pathIndex) => {
      if (path.points.length === 0) return;

      const pathData = path.points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

      svg += `    <path id="path-${pathIndex}" d="${pathData}${path.closed ? ' Z' : ''}"/>\n`;
    });

    svg += '  </g>\n';
  });

  svg += '</svg>\n';

  return {
    success: true,
    filename,
    content: svg,
    mimeType: 'image/svg+xml',
    size: svg.length
  };
}

/**
 * Export as DXF format
 */
function exportAsDXF(
  job: XToolJob,
  filename: string,
  options: ExportOptions
): ExportResult {
  let dxf = '0\nSECTION\n2\nHEADER\n';

  if (options.includeMetadata) {
    dxf += '9\n$ACADVER\n1\nAC1015\n';
    dxf += '9\n$DWGCODEPAGE\n3\nANSI_1252\n';
  }

  dxf += '0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';

  job.layers.forEach(layer => {
    layer.paths.forEach(path => {
      if (path.points.length < 2) return;

      // Create polyline for each path
      dxf += '0\nPOLYLINE\n';
      dxf += '8\n' + layer.name + '\n';
      dxf += '66\n1\n';
      dxf += `70\n${path.closed ? '1' : '0'}\n`;

      path.points.forEach(point => {
        dxf += '0\nVERTEX\n';
        dxf += '8\n' + layer.name + '\n';
        dxf += `10\n${point.x.toFixed(3)}\n`;
        dxf += `20\n${point.y.toFixed(3)}\n`;
        dxf += '30\n0.0\n';
      });

      dxf += '0\nSEQEND\n';
    });
  });

  dxf += '0\nENDSEC\n0\nEOF\n';

  return {
    success: true,
    filename,
    content: dxf,
    mimeType: 'application/dxf',
    size: dxf.length
  };
}

/**
 * Export as PDF
 */
async function exportAsPDF(
  job: XToolJob,
  filename: string,
  options: ExportOptions
): Promise<ExportResult> {
  // For simulation, create a minimal PDF structure
  const pdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(xTool Job Export) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000110 00000 n
0000000205 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
298
%%EOF`;

  return {
    success: true,
    filename,
    content: pdf,
    mimeType: 'application/pdf',
    size: pdf.length,
    metadata: options.includeMetadata ? {
      format: 'PDF',
      pageCount: 1,
      jobName: job.name
    } : undefined
  };
}

/**
 * Batch export multiple formats
 */
export async function batchExport(
  job: XToolJob,
  formats: ExportOptions['format'][],
  baseOptions: Omit<ExportOptions, 'format'> = {}
): Promise<ExportResult[]> {
  const results: ExportResult[] = [];

  for (const format of formats) {
    const result = await exportXToolJob(job, {
      ...baseOptions,
      format,
      filename: baseOptions.filename?.replace(/\.[^.]+$/, `.${format}`)
    });
    results.push(result);
  }

  return results;
}

/**
 * Get supported formats for different content types
 */
export function getSupportedFormats() {
  return {
    styleResults: ['png', 'jpg', 'svg'] as const,
    xToolJobs: ['gcode', 'lbrn2', 'svg', 'dxf', 'pdf'] as const,
    layers: ['svg', 'dxf', 'gcode'] as const
  };
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const supportedFormats = ['svg', 'dxf', 'gcode', 'lbrn2', 'png', 'jpg', 'pdf'];

  if (!supportedFormats.includes(options.format)) {
    errors.push(`Unsupported format: ${options.format}`);
  }

  if (options.quality && !['draft', 'normal', 'high'].includes(options.quality)) {
    errors.push(`Invalid quality setting: ${options.quality}`);
  }

  if (options.filename && !/^[a-zA-Z0-9._-]+$/.test(options.filename)) {
    errors.push('Filename contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}