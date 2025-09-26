---
name: start-project
status: backlog
created: 2025-09-26T02:45:57Z
progress: 0%
prd: .claude/prds/start-project.md
github: https://github.com/collrest-a11y/xtool-sd-converter/issues/1
updated: 2025-09-26T03:38:36Z
---

# Epic: xTool Stable Diffusion Art Converter

## Overview
Build a streamlined web application that integrates with the existing Stable Diffusion WebUI installation to convert photos into laser-engraving-ready artwork. The system leverages the WebUI's API endpoints to avoid model duplication while providing a specialized interface optimized for xTool laser cutting machines.

## Architecture Decisions

### Core Decisions
- **WebUI API Integration**: Use existing SD WebUI API at port 7860 instead of loading models separately
- **Minimal Backend**: Lightweight FastAPI server primarily for UI serving and xTool optimization logic
- **Progressive Complexity**: Start with 5 core styles, expand to 30 incrementally
- **Local-First**: All processing happens locally, no cloud dependencies
- **Extension Reuse**: Leverage existing WebUI extensions rather than reimplementing functionality

### Technology Stack
- **Full-Stack Framework**: Next.js 14+ with TypeScript
- **Frontend**: React 18 components with App Router
- **Backend**: Next.js API routes (/app/api/*)
- **SD Integration**: WebUI API calls via fetch
- **File Processing**: Browser Canvas API + Sharp (server-side)
- **Storage**: Local filesystem only (no database initially)

### Simplification Strategy
- Use WebUI's existing queue system instead of Celery
- Leverage WebUI's model management instead of custom downloading
- Use browser localStorage instead of PostgreSQL for settings
- Skip Docker initially - direct Python installation

## Technical Approach

### Next.js App Structure
```
app/
├── api/                    # Backend API routes
│   ├── convert/route.ts    # Image conversion endpoint
│   ├── styles/route.ts     # Style templates endpoint
│   ├── materials/route.ts  # xTool materials database
│   └── export/route.ts     # Export formats endpoint
├── components/             # React components
│   ├── ImageUpload.tsx     # Drag-drop upload area
│   ├── StyleSelector.tsx   # Style gallery with previews
│   ├── PromptBuilder.tsx   # Advanced prompt interface
│   ├── PreviewPanel.tsx    # Before/after comparison
│   └── ExportOptions.tsx   # Format selection
├── page.tsx               # Main converter page
└── layout.tsx             # Root layout with providers
```

### WebUI Integration
```typescript
// lib/sd-client.ts
export class SDWebUIClient {
  private baseUrl = 'http://127.0.0.1:7860'
  private api = `${this.baseUrl}/sdapi/v1`

  async txt2img(prompt: string, negative: string, settings: Settings) {
    const response = await fetch(`${this.api}/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, negative_prompt: negative, ...settings })
    })
    return response.json()
  }

  async img2img(image: string, prompt: string, settings: Settings) {
    const response = await fetch(`${this.api}/img2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ init_images: [image], prompt, ...settings })
    })
    return response.json()
  }
}
```

## Implementation Strategy

### Phase 1: MVP (Week 1-2)
- Basic UI with file upload
- 5 core styles (line art, sketch, silhouette, engraving, papercut)
- Direct WebUI API integration
- Simple PNG/SVG export

### Phase 2: Enhancement (Week 3-4)
- Prompt builder interface
- Material presets for xTool machines
- Batch processing support
- Additional 10 styles

### Phase 3: Polish (Week 5-6)
- Remaining 15 styles
- Advanced export formats (DXF, native .xtool)
- Extension auto-installer
- Performance optimization

## Task Breakdown Preview

Simplified to 8 essential tasks:

- [ ] **Task 1: WebUI Integration** - Establish API connection and test endpoints
- [ ] **Task 2: Core UI Shell** - React app with upload and preview components
- [ ] **Task 3: Style Engine** - Implement 5 primary conversion styles with prompts
- [ ] **Task 4: xTool Optimizer** - Post-processing for laser compatibility
- [ ] **Task 5: Export Pipeline** - SVG/PNG/PDF generation with proper formatting
- [ ] **Task 6: Prompt System** - Advanced prompt builder and template manager
- [ ] **Task 7: Extension Checker** - Auto-install missing SD extensions
- [ ] **Task 8: Polish & Testing** - Error handling, UI refinement, documentation

## Dependencies

### External Dependencies
- Existing SD WebUI installation at specified path
- WebUI API must be enabled (--api flag)
- Python 3.10+ environment
- Node.js 18+ for React frontend

### Required WebUI Extensions
- ControlNet (for edge detection)
- Dynamic Prompts (for wildcards)
- Additional Networks (for LoRA support)

### Prerequisite Work
- Ensure WebUI is running and accessible
- Verify GPU drivers and CUDA installation
- Install required Python packages (fastapi, uvicorn, pillow)

## Success Criteria (Technical)

### Performance Metrics
- API response time < 100ms (excluding SD generation)
- Image conversion < 30s for 1024x1024
- Support 10 concurrent users
- Zero memory leaks over 24-hour operation

### Quality Gates
- All 30 styles produce laser-compatible output
- SVG exports are valid and optimized
- Material presets tested on actual xTool machines
- Error recovery for all failure modes

### Acceptance Criteria
- Works with existing SD WebUI installation
- No manual model downloading required
- One-click conversion for basic users
- Advanced controls accessible for power users

## Estimated Effort

### Timeline
- **Total Duration**: 6 weeks (simplified from 12)
- **Development**: 4 weeks
- **Testing & Polish**: 2 weeks

### Resource Requirements
- 1 Full-stack developer
- Access to xTool machine for testing
- 100GB disk space for models
- GPU with 8GB+ VRAM

### Critical Path
1. WebUI API integration (blocker for all features)
2. Core style implementation (defines quality baseline)
3. Export pipeline (required for testing on hardware)

## Risk Mitigation

### Technical Risks
- **WebUI API changes**: Pin to specific WebUI version
- **Performance bottlenecks**: Implement request queuing
- **Browser limitations**: Provide desktop app fallback option

### Simplification Opportunities
- Start with web-only, skip desktop app
- Use existing UI libraries (Material-UI)
- Leverage WebUI's built-in features wherever possible
- Focus on most-used styles first

## Tasks Created
- [ ] #2 - WebUI Integration (parallel: true)
- [ ] #3 - Core UI Shell (parallel: true)
- [ ] #4 - Style Engine (parallel: false, depends on: #2)
- [ ] #5 - xTool Optimizer (parallel: false, depends on: #4)
- [ ] #6 - Export Pipeline (parallel: false, depends on: #4, #5)
- [ ] #7 - Prompt System (parallel: true, depends on: #3)
- [ ] #8 - Extension Checker (parallel: true)
- [ ] #9 - Polish & Testing (parallel: false, depends on: all)

Total tasks: 8
Parallel tasks: 4 (#2, #3, #7, #8)
Sequential tasks: 4 (#4, #5, #6, #9)
Estimated total effort: 116 hours