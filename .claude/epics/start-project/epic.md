---
name: start-project
status: backlog
created: 2025-09-26T02:45:57Z
progress: 0%
prd: .claude/prds/start-project.md
github: [Will be updated when synced to GitHub]
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
- **Frontend**: React 18 with TypeScript (single-page app)
- **Backend**: FastAPI Python server (thin layer)
- **SD Integration**: WebUI API calls via HTTP
- **File Processing**: Browser-based Canvas API for preprocessing
- **Storage**: Local filesystem only (no database initially)

### Simplification Strategy
- Use WebUI's existing queue system instead of Celery
- Leverage WebUI's model management instead of custom downloading
- Use browser localStorage instead of PostgreSQL for settings
- Skip Docker initially - direct Python installation

## Technical Approach

### Frontend Components
- **MainConverter.tsx**: Single page with upload area and style selector
- **PromptBuilder.tsx**: Advanced prompt engineering interface
- **PreviewPanel.tsx**: Before/after comparison view
- **ExportOptions.tsx**: Format selection and xTool presets

### Backend Services
- **api/convert**: Proxy requests to WebUI with xTool optimization
- **api/styles**: Serve style templates and prompts
- **api/materials**: xTool material settings database
- **api/export**: Post-process images for laser cutting formats

### WebUI Integration
```python
class WebUIConnector:
    def __init__(self):
        self.base_url = "http://127.0.0.1:7860"
        self.api = f"{self.base_url}/sdapi/v1"

    def txt2img(self, prompt, negative, settings):
        # Direct API call to existing WebUI
        return requests.post(f"{self.api}/txt2img", json={...})

    def img2img(self, image, prompt, settings):
        # Use WebUI's img2img endpoint
        return requests.post(f"{self.api}/img2img", json={...})
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
- [ ] 001.md - WebUI Integration (parallel: true)
- [ ] 002.md - Core UI Shell (parallel: true)
- [ ] 003.md - Style Engine (parallel: false, depends on: 001)
- [ ] 004.md - xTool Optimizer (parallel: false, depends on: 003)
- [ ] 005.md - Export Pipeline (parallel: false, depends on: 003, 004)
- [ ] 006.md - Prompt System (parallel: true, depends on: 002)
- [ ] 007.md - Extension Checker (parallel: true)
- [ ] 008.md - Polish & Testing (parallel: false, depends on: all)

Total tasks: 8
Parallel tasks: 4 (001, 002, 006, 007)
Sequential tasks: 4 (003, 004, 005, 008)
Estimated total effort: 116 hours