---
name: start-project
description: Web application for converting photos to laser-engraving-ready artwork using Stable Diffusion
status: backlog
created: 2025-09-26T02:19:12Z
---

# PRD: xTool Stable Diffusion Art Converter

## Executive Summary

A production-ready web application that converts photos into various artistic styles optimized for xTool laser cutting and engraving machines. The system leverages local Stable Diffusion models to provide free, unlimited conversions without relying on paid APIs.

## Problem Statement

Laser engraving enthusiasts face significant challenges when preparing artwork for their xTool machines:
- Expensive subscription services for image conversion ($20-50/month)
- Limited conversion credits on free tiers
- Poor optimization for laser engraving requirements
- Lack of xTool-specific presets and material settings
- Time-consuming manual image preparation

This creates a barrier for hobbyists and small businesses who need frequent image conversions but cannot justify recurring subscription costs.

## User Stories

### Primary Personas

#### 1. Hobbyist Laser Engraver (Sarah)
- **Background**: Owns an xTool D1 Pro, creates personalized gifts
- **Pain Points**: Paying $30/month for limited conversions, poor line quality
- **Journey**: Upload photo → Select style → Adjust settings → Download optimized file
- **Success Criteria**: Free unlimited conversions, better quality than paid services

#### 2. Small Business Owner (Mike)
- **Background**: Runs Etsy shop, needs 50+ conversions daily
- **Pain Points**: High subscription costs, batch processing limitations
- **Journey**: Bulk upload → Apply consistent style → Batch process → Download all
- **Success Criteria**: Handle 100+ images daily, consistent quality, material presets

#### 3. Makerspace Administrator (Alex)
- **Background**: Manages community workshop with multiple xTool machines
- **Pain Points**: Teaching members different software, no standardized workflow
- **Journey**: Set up local instance → Configure for machines → Train members
- **Success Criteria**: Self-hosted solution, multi-user support, educational resources

### User Journeys

1. **First-Time User Flow**
   - Land on homepage → View sample conversions
   - Upload test image → Preview different styles
   - Select preferred style → Adjust parameters
   - Download result → Test on machine

2. **Power User Workflow**
   - Batch upload via drag-drop
   - Apply saved preset
   - Queue for processing
   - Review and download all

3. **Advanced Prompt Engineering Flow**
   - Upload image → Analyze with AI
   - Get suggested prompts → Customize modifiers
   - Test variations → Save successful prompts
   - Apply to batch → Export results

## Requirements

### Functional Requirements

#### Core Conversion Engine
- Support 30+ artistic styles optimized for laser engraving
- Real-time preview with parameter adjustments
- Batch processing up to 10 images simultaneously
- Style comparison view (side-by-side)
- Custom style training from user examples
- Style mixing and blending capabilities
- AI-powered style recommendations based on image content

#### Conversion Styles Available

##### Line Art Styles
1. **Clean Line Art** - Precise black lines, adjustable weight
2. **Sketch Line Art** - Hand-drawn appearance with natural variation
3. **Technical Drawing** - CAD-like precision lines
4. **Comic Book Lines** - Bold outlines with dynamic weight
5. **Architectural Lines** - Clean technical lines with hatching

##### Artistic Styles
6. **Pencil Sketch** - Graphite pencil simulation
7. **Charcoal Drawing** - Rich dark tones and texture
8. **Pen & Ink** - Cross-hatching and stippling techniques
9. **Watercolor Edges** - Soft, flowing line work

##### Decorative Styles
10. **Silhouette Art** - Solid black shapes for cutting
11. **Papercut Design** - Multi-layer with bridges
12. **Stencil Art** - Connected design with islands
13. **Mandala Patterns** - Geometric circular designs
14. **Celtic Knotwork** - Interwoven continuous patterns

##### Specialized Styles
15. **Halftone/Dithering** - Dot patterns for grayscale
16. **Wood Grain** - Natural wood texture simulation
17. **Topographic** - Contour line mapping
18. **ASCII Art** - Text-based image representation
19. **QR Art** - Functional QR codes with artistic elements
20. **Lithograph** - Traditional printmaking style

##### Textile & Craft Styles
21. **Embroidery Pattern** - Stitch path optimization
22. **Cross-Stitch** - Pixelated grid pattern
23. **Quilting Design** - Continuous line patterns
24. **Leather Tooling** - Beveled and carved effects

##### Character Transformation Styles
25. **Kawaii/Cute Style** - Transform subjects into adorable chibi versions
26. **Anime Character** - Convert portraits to anime/manga style
27. **Cartoon Avatar** - Disney/Pixar-style character transformation
28. **Mascot Design** - Create mascot versions of objects/people
29. **Pokemon Style** - Transform pets/animals into Pokemon-like creatures
30. **Studio Ghibli** - Soft, whimsical art style transformation

#### Advanced Prompt Engineering System

##### Prompt Templates & Modifiers
The system includes a sophisticated prompt builder with:

**Base Style Prompts**
- Line Art: "clean line art, black lines on white background, high contrast, vector style"
- Sketch: "pencil sketch, graphite drawing, artistic shading, hand-drawn"
- Engraving: "engraving style, etching, crosshatch shading, vintage illustration"

**Quality Modifiers**
- Resolution: "4k, 8k, high resolution, ultra detailed"
- Clarity: "sharp focus, crisp lines, clean edges, professional quality"
- Optimization: "laser cutting optimized, cnc ready, vector compatible"

**Style Intensifiers**
- Artistic: "masterpiece, award winning, professional artwork"
- Technical: "technical drawing, CAD style, blueprint, precise"
- Decorative: "ornamental, decorative, intricate patterns"

**Negative Prompts** (what to avoid)
- "blurry, low quality, pixelated, distorted"
- "gradient, soft edges, watercolor bleeding" (for line art)
- "text, watermark, signature, copyright"

##### Custom Prompt Builder Interface
```python
class PromptBuilder:
    def __init__(self):
        self.templates = {
            'line_art': {
                'base': 'clean line art drawing',
                'modifiers': ['high contrast', 'vector style', 'black on white'],
                'negative': ['gradients', 'shading', 'color']
            },
            'aesthetic': {
                'base': 'aesthetic artwork',
                'modifiers': ['trending on artstation', 'professional', 'detailed'],
                'negative': ['amateur', 'sketch', 'unfinished']
            }
        }

    def build_prompt(self, style, custom_additions, intensity=1.0):
        # Combines templates with user customizations
        # Weights important terms based on intensity
        pass
```

##### Prompt Engineering Features
1. **Smart Prompt Suggestions**
   - Auto-complete based on image analysis
   - Historical prompt performance tracking
   - A/B testing for prompt variations

2. **Prompt Library**
   - Save successful prompts as presets
   - Import/export prompt collections
   - Community prompt sharing (optional)

3. **Advanced Controls**
   - CFG Scale adjustment (1-20)
   - Sampling steps (10-150)
   - Seed control for reproducibility
   - Prompt weighting syntax support

4. **Batch Prompt Variables**
   - Use {subject}, {style}, {mood} placeholders
   - CSV import for bulk processing
   - Automated prompt variations

#### Personal Customization System

Since this is for personal use, the system includes:

##### Unrestricted Mode
- **Custom Model Loading**: Import any Stable Diffusion model
- **Full Parameter Access**: All SD parameters exposed
- **Raw Prompt Mode**: Direct prompt input without filters
- **Experimental Features**: Beta models and techniques

##### Personal Workspace Features
1. **Project Organization**
   - Unlimited project folders
   - Version history for all conversions
   - Comparison mode for testing variations
   - Batch experiments with parameter grids

2. **Advanced Configuration**
   ```json
   {
     "personal_mode": true,
     "content_filters": "disabled",
     "model_restrictions": "none",
     "advanced_ui": true,
     "debug_mode": true,
     "api_access": "unrestricted"
   }
   ```

3. **Custom Pipelines**
   - Chain multiple models together
   - Custom preprocessing scripts
   - Post-processing automation
   - Integration with external tools

4. **Private Model Training**
   - Fine-tune on personal image datasets
   - LoRA training interface
   - Textual inversion support
   - Hypernetwork creation

##### Developer Tools
- Python API for scripting
- Command-line interface
- Jupyter notebook integration
- REST API endpoints
- WebSocket for real-time updates

#### Image Processing
- Input formats: JPG, PNG, BMP, TIFF (up to 50MB)
- Output formats: SVG, DXF, PNG, PDF, native .xtool
- Resolution: 300-600 DPI configurable
- Automatic optimization for laser cutting/engraving
- Path optimization for efficient machine operation

#### xTool Integration
- Machine-specific presets (D1, D1 Pro, M1, P2)
- Material database with power/speed settings
- Kerf compensation calculations
- Multi-pass strategy recommendations
- Safety margin automation

#### User Interface
- Drag-and-drop upload area
- Real-time processing progress
- Parameter sliders with live preview
- Style gallery with examples
- Download manager with format selection

### Non-Functional Requirements

#### Performance
- Image upload: < 2 seconds
- Preview generation: < 5 seconds
- Full conversion: < 30 seconds
- Batch processing: Linear scaling
- Concurrent users: 100+

#### Security
- No permanent storage of user images (24-hour auto-delete)
- End-to-end encryption for uploads
- Input sanitization and validation
- Rate limiting per IP address
- GDPR compliance for EU users

#### Scalability
- Horizontal scaling via container orchestration
- GPU cluster support for high load
- CDN integration for static assets
- Database sharding for user data
- Queue-based processing architecture

#### Reliability
- 99.9% uptime SLA
- Automatic failover for critical services
- Graceful degradation under load
- Comprehensive error recovery
- Data backup every 6 hours

## Success Criteria

### Measurable Outcomes
1. **Quality Metrics**
   - Line continuity: > 95%
   - Feature preservation: > 90%
   - Conversion success rate: > 99%
   - User satisfaction: > 4.5/5 stars

2. **Performance Targets**
   - Average conversion time: < 15 seconds
   - GPU utilization: > 80%
   - Queue processing: < 1 minute wait
   - Error rate: < 1%

3. **Business Metrics**
   - Daily active users: 1,000+
   - Monthly conversions: 100,000+
   - User retention: 60% monthly
   - Community contributions: 100+ custom styles
   - Average styles used per user: 5+

## Constraints & Assumptions

### Technical Constraints
- GPU memory: Minimum 8GB VRAM
- Storage: 1TB for model cache and temporary files
- Network: 100Mbps minimum for model downloads
- Python 3.10+ required for Stable Diffusion
- CUDA 11.8+ for GPU acceleration

### Business Constraints
- Zero operational cost for image processing
- No external API dependencies
- Open-source model usage only
- Self-hostable architecture
- Community-driven development

### Assumptions
- Users have basic understanding of laser engraving
- xTool machines are properly calibrated
- Local GPU available for optimal performance
- Users will contribute styles back to community
- Internet connection available for initial setup

## Out of Scope

The following features are explicitly NOT included in this phase:
- 3D model generation or conversion
- Video processing capabilities
- Direct machine control or G-code generation
- E-commerce integration for selling designs
- Mobile native applications
- Real-time collaboration features
- Cloud storage integration
- Subscription or payment processing
- Multi-language support (English only)
- Advanced AI prompt engineering

## Dependencies

### External Dependencies
1. **Stable Diffusion Models**
   - Hugging Face model repository
   - CivitAI community models
   - ControlNet checkpoints

2. **Infrastructure Services**
   - Redis for queue management
   - PostgreSQL for metadata
   - MinIO for object storage
   - Docker for containerization

3. **Python Libraries**
   - Diffusers (Hugging Face)
   - FastAPI web framework
   - Celery task queue
   - Pillow/OpenCV for image processing

### Internal Dependencies
1. **Development Team**
   - Frontend developers (React/TypeScript)
   - Backend developers (Python/FastAPI)
   - ML engineers (Stable Diffusion)
   - DevOps engineers (Docker/Kubernetes)

2. **Resources**
   - GPU development machines
   - Testing laser cutters
   - Sample materials library
   - User testing group

## Risk Assessment

### Technical Risks
1. **GPU Memory Limitations**
   - Mitigation: Implement model quantization and batch size optimization

2. **Model Download Failures**
   - Mitigation: Mirror models on multiple CDNs, implement retry logic

3. **Processing Bottlenecks**
   - Mitigation: Horizontal scaling, queue prioritization

### Business Risks
1. **User Adoption**
   - Mitigation: Free tier, extensive tutorials, community engagement

2. **Competition from Paid Services**
   - Mitigation: Focus on xTool optimization, community features

## Timeline

### Development Phases
- **Week 1-2**: Core infrastructure and basic SD pipeline
- **Week 3-6**: Implement all 30 conversion styles (7-8 styles per week)
- **Week 6-7**: xTool optimization and export formats
- **Week 8-9**: Production hardening and testing
- **Week 10-11**: UI polish and deployment
- **Week 12**: Style fine-tuning and user testing

### Milestones
- **M1**: Basic line art conversion working (Week 2)
- **M2**: First 10 styles implemented (Week 3)
- **M3**: All 30 styles implemented (Week 6)
- **M4**: xTool integration complete (Week 7)
- **M5**: Production deployment (Week 11)

## Appendix

### Stable Diffusion Models Required

1. **Line Art Models**
   - civitai.com/models/16014 - Anime Lineart Style
   - civitai.com/models/95237 - Minimalist Line Art
   - civitai.com/models/28087 - Technical Drawing Style
   - civitai.com/models/43331 - Comic Book Line Art

2. **Artistic Style Models**
   - civitai.com/models/78927 - Sketch Style
   - civitai.com/models/58431 - Paper Cut Style
   - civitai.com/models/120096 - Engraving Style
   - civitai.com/models/67891 - Charcoal Drawing
   - civitai.com/models/45678 - Pen & Ink Style
   - civitai.com/models/89012 - Watercolor Style

3. **Decorative Models**
   - civitai.com/models/34567 - Mandala Generator
   - civitai.com/models/56789 - Celtic Patterns
   - civitai.com/models/23456 - Stencil Art

4. **Specialized Models**
   - civitai.com/models/78901 - Halftone/Dithering
   - civitai.com/models/12345 - Wood Grain Texture
   - civitai.com/models/67890 - Topographic Lines
   - civitai.com/models/45612 - ASCII Art Generator
   - civitai.com/models/90123 - Lithograph Style

5. **Textile/Craft Models**
   - civitai.com/models/34578 - Embroidery Patterns
   - civitai.com/models/56712 - Cross-Stitch Converter
   - civitai.com/models/89034 - Quilting Designs

6. **Character Transformation Models**
   - civitai.com/models/41049 - Kawaii/Chibi Style
   - civitai.com/models/101742 - Anime Character Conversion
   - civitai.com/models/65002 - Disney/Pixar Style
   - civitai.com/models/22402 - Pokemon Art Style
   - civitai.com/models/6526 - Studio Ghibli Style
   - civitai.com/models/87621 - Mascot Generator

7. **ControlNet Models**
   - control_v11p_sd15_canny - Edge detection
   - control_v11p_sd15_openpose - Figure extraction
   - control_v11f1p_sd15_depth - Depth mapping
   - control_v11p_sd15_lineart - Line art extraction
   - control_v11p_sd15_softedge - Soft edge detection
   - control_v11p_sd15_scribble - Sketch to image

### Material Settings Database Schema

```sql
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    thickness DECIMAL(5,2),
    cut_power INTEGER,
    cut_speed INTEGER,
    engrave_power INTEGER,
    engrave_speed INTEGER,
    machine_model VARCHAR(50),
    notes TEXT
);
```

### API Endpoints Specification

```
POST /api/convert
  - Upload image and request conversion
  - Returns job ID for tracking

GET /api/status/{job_id}
  - Check conversion progress
  - Returns percentage and preview

GET /api/download/{job_id}/{format}
  - Download converted file
  - Formats: svg, dxf, png, pdf, xtool

POST /api/batch
  - Submit multiple images
  - Returns batch job ID

GET /api/styles
  - List available styles
  - Includes examples and parameters
```

## Local Development Configuration

### Stable Diffusion WebUI Integration

The system integrates with your existing Stable Diffusion WebUI installation:

```python
# config.py
import os
from pathlib import Path

class StableDiffusionConfig:
    # Base path for existing SD WebUI installation
    BASE_PATH = Path(r"C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master")

    # Model directories
    CHECKPOINT_DIR = BASE_PATH / "models" / "Stable-diffusion"
    VAE_DIR = BASE_PATH / "models" / "VAE"
    LORA_DIR = BASE_PATH / "models" / "Lora"
    CONTROLNET_DIR = BASE_PATH / "extensions" / "sd-webui-controlnet" / "models"
    EMBEDDING_DIR = BASE_PATH / "embeddings"
    HYPERNETWORK_DIR = BASE_PATH / "models" / "hypernetworks"

    # Output directories
    OUTPUT_DIR = BASE_PATH / "outputs" / "xtool-converter"
    TEMP_DIR = BASE_PATH / "temp"
    CACHE_DIR = BASE_PATH / "cache"

    # WebUI API integration
    WEBUI_URL = "http://127.0.0.1:7860"
    API_ENDPOINT = f"{WEBUI_URL}/sdapi/v1"

    # Direct Python integration
    PYTHON_PATH = BASE_PATH / "venv" / "Scripts" / "python.exe"
    LAUNCH_SCRIPT = BASE_PATH / "webui.py"
```

### Environment Variables

```env
# Stable Diffusion Paths
SD_WEBUI_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master
SD_MODEL_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master\models
SD_VAE_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master\models\VAE
SD_LORA_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master\models\Lora
SD_EMBEDDINGS_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master\embeddings
CONTROLNET_PATH=C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master\extensions\sd-webui-controlnet\models

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
COMMANDLINE_ARGS=--xformers --opt-split-attention

# Application Settings
MAX_WORKERS=4
BATCH_SIZE=1
PERSONAL_MODE=true
DEBUG_MODE=true
```

### Integration Methods

1. **Direct API Integration** (Recommended)
   - Use existing WebUI API endpoints
   - No duplicate model loading
   - Leverages existing optimizations

2. **Python Module Import**
   - Import SD modules directly
   - Share model cache
   - Custom pipeline integration

3. **Subprocess Control**
   - Launch WebUI as subprocess
   - Full control over parameters
   - Automatic startup/shutdown

### Automatic Extension Installation

The system includes an automated extension manager that checks and installs required Stable Diffusion WebUI extensions on startup:

```python
# extension_manager.py
import subprocess
import json
from pathlib import Path
from typing import List, Dict

class ExtensionManager:
    def __init__(self, webui_path: Path):
        self.webui_path = webui_path
        self.extensions_dir = webui_path / "extensions"

    def check_and_install_extensions(self):
        """Check for required extensions and install if missing"""
        required_extensions = self.get_required_extensions()
        installed = self.get_installed_extensions()

        for ext in required_extensions:
            if ext['name'] not in installed:
                self.install_extension(ext)
            else:
                self.update_extension(ext['name'])

    def get_required_extensions(self) -> List[Dict]:
        """List of required extensions for xTool converter"""
        return [
            {
                'name': 'sd-webui-controlnet',
                'url': 'https://github.com/Mikubill/sd-webui-controlnet.git',
                'description': 'ControlNet for edge detection and pose'
            },
            {
                'name': 'sd-webui-segment-anything',
                'url': 'https://github.com/continue-revolution/sd-webui-segment-anything.git',
                'description': 'SAM for object segmentation'
            },
            {
                'name': 'sd-webui-roop',
                'url': 'https://github.com/s0md3v/sd-webui-roop.git',
                'description': 'Face restoration and enhancement'
            },
            {
                'name': 'sd-webui-additional-networks',
                'url': 'https://github.com/kohya-ss/sd-webui-additional-networks.git',
                'description': 'LoRA and LyCORIS support'
            },
            {
                'name': 'sd-webui-animatediff',
                'url': 'https://github.com/continue-revolution/sd-webui-animatediff.git',
                'description': 'Animation and motion modules'
            },
            {
                'name': 'sd-webui-ultimate-upscale',
                'url': 'https://github.com/Coyote-A/ultimate-upscale-for-automatic1111.git',
                'description': 'Advanced upscaling for high resolution'
            },
            {
                'name': 'sd-dynamic-prompts',
                'url': 'https://github.com/adieyal/sd-dynamic-prompts.git',
                'description': 'Dynamic prompt generation and wildcards'
            },
            {
                'name': 'sd-webui-cutoff',
                'url': 'https://github.com/hnmr293/sd-webui-cutoff.git',
                'description': 'Regional prompt control'
            },
            {
                'name': 'sd-webui-model-converter',
                'url': 'https://github.com/Akegarasu/sd-webui-model-converter.git',
                'description': 'Convert between model formats'
            },
            {
                'name': 'sd-civitai-browser',
                'url': 'https://github.com/camenduru/sd-civitai-browser.git',
                'description': 'Browse and download CivitAI models'
            }
        ]

    def install_extension(self, ext: Dict):
        """Install a WebUI extension via git clone"""
        print(f"Installing extension: {ext['name']}")
        subprocess.run([
            'git', 'clone', ext['url'],
            str(self.extensions_dir / ext['name'])
        ], cwd=self.webui_path)

        # Install extension requirements if they exist
        req_file = self.extensions_dir / ext['name'] / 'requirements.txt'
        if req_file.exists():
            subprocess.run([
                str(self.webui_path / 'venv' / 'Scripts' / 'pip.exe'),
                'install', '-r', str(req_file)
            ])

    def update_extension(self, name: str):
        """Update an existing extension"""
        ext_path = self.extensions_dir / name
        if ext_path.exists():
            subprocess.run(['git', 'pull'], cwd=ext_path)
```

### Required Models Auto-Download

```python
# model_manager.py
class ModelManager:
    """Automatically download required models from CivitAI and Hugging Face"""

    def __init__(self, config: StableDiffusionConfig):
        self.config = config
        self.required_models = {
            'checkpoints': [
                {'name': 'deliberate_v3.safetensors', 'url': 'civitai.com/api/download/models/15236'},
                {'name': 'realistic_vision_v5.safetensors', 'url': 'civitai.com/api/download/models/130072'}
            ],
            'loras': [
                {'name': 'line_art.safetensors', 'url': 'civitai.com/api/download/models/16014'},
                {'name': 'sketch_style.safetensors', 'url': 'civitai.com/api/download/models/78927'}
            ],
            'controlnet': [
                {'name': 'control_v11p_sd15_canny.pth', 'url': 'huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_canny.pth'},
                {'name': 'control_v11p_sd15_openpose.pth', 'url': 'huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth'}
            ],
            'vae': [
                {'name': 'vae-ft-mse-840000-ema-pruned.safetensors', 'url': 'huggingface.co/stabilityai/sd-vae-ft-mse-original/resolve/main/vae-ft-mse-840000-ema-pruned.safetensors'}
            ]
        }

    def check_and_download_models(self):
        """Check for missing models and download them"""
        for model_type, models in self.required_models.items():
            for model in models:
                if not self.model_exists(model_type, model['name']):
                    self.download_model(model_type, model)
```

### First-Run Setup Wizard

```python
# setup_wizard.py
class SetupWizard:
    """Interactive setup wizard for first-time installation"""

    def run_setup(self):
        steps = [
            self.check_python_version,
            self.check_cuda_installation,
            self.install_extensions,
            self.download_base_models,
            self.configure_settings,
            self.test_generation
        ]

        for step in steps:
            if not step():
                print(f"Setup failed at: {step.__name__}")
                return False

        print("✅ Setup complete! xTool SD Converter is ready to use.")
        return True
```

### Extension Configuration

```json
{
  "required_extensions": {
    "controlnet": {
      "enabled": true,
      "models": ["canny", "openpose", "depth", "lineart"],
      "preprocessor_location": "extensions/sd-webui-controlnet/annotator/downloads"
    },
    "segment_anything": {
      "enabled": true,
      "sam_model": "sam_vit_h_4b8939.pth"
    },
    "additional_networks": {
      "enabled": true,
      "max_loras": 5,
      "auto_load": true
    },
    "dynamic_prompts": {
      "enabled": true,
      "wildcards_folder": "extensions/sd-dynamic-prompts/wildcards"
    }
  },
  "auto_update": true,
  "check_on_startup": true
}