"""
Python FastAPI implementation for SD WebUI extension management
This is the actual backend implementation that the TypeScript route.ts would call
"""

import os
import json
import shutil
import subprocess
import asyncio
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import git
import zipfile
import requests
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Data models for API requests/responses
class ExtensionMetadata(BaseModel):
    id: str
    name: str
    description: str
    author: str
    version: str
    homepage: str
    repository: str
    tags: List[str]
    category: str
    sdVersions: List[str]
    dependencies: List[str]
    conflicts: List[str]
    installUrl: str
    installMethod: str
    isOfficial: bool
    downloadSize: Optional[int] = None
    lastUpdated: str
    rating: Optional[float] = None
    downloadCount: Optional[int] = None

class InstalledExtension(BaseModel):
    id: str
    name: str
    version: str
    path: str
    isEnabled: bool
    installedDate: str
    lastUsed: Optional[str] = None
    hasUpdates: bool

class InstallRequest(BaseModel):
    extensionId: str
    version: Optional[str] = None
    force: bool = False
    installDependencies: bool = True

class SDWebUIInfo(BaseModel):
    version: str
    path: str
    extensionsPath: str
    isRunning: bool
    apiUrl: Optional[str] = None
    installedExtensions: List[InstalledExtension]

router = APIRouter()

class ExtensionAPI:
    def __init__(self, sd_path: str = None):
        self.sd_path = sd_path or r"C:\Users\Brendan\Downloads\Stable Test\stable-diffusion-webui-master"
        self.extensions_path = os.path.join(self.sd_path, "extensions")
        self.temp_path = os.path.join(self.sd_path, "temp", "extensions")
        self.backup_path = os.path.join(self.sd_path, "backups", "extensions")

        # Ensure directories exist
        os.makedirs(self.temp_path, exist_ok=True)
        os.makedirs(self.backup_path, exist_ok=True)

    async def detect_sd_webui_info(self) -> SDWebUIInfo:
        """Detect SD WebUI installation and gather info"""
        version = await self._detect_sd_version()
        is_running = await self._check_sd_webui_running()
        installed_extensions = await self._scan_installed_extensions()

        return SDWebUIInfo(
            version=version,
            path=self.sd_path,
            extensionsPath=self.extensions_path,
            isRunning=is_running,
            apiUrl="http://127.0.0.1:7860" if is_running else None,
            installedExtensions=installed_extensions
        )

    async def _detect_sd_version(self) -> str:
        """Detect SD WebUI version"""
        try:
            # Try to read version from launch.py or other version files
            launch_py = os.path.join(self.sd_path, "launch.py")
            if os.path.exists(launch_py):
                with open(launch_py, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Look for version patterns
                    import re
                    version_match = re.search(r'version.*?[\'"]([\d.]+)[\'"]', content, re.IGNORECASE)
                    if version_match:
                        return version_match.group(1)

            # Try git tag if it's a git repository
            if os.path.exists(os.path.join(self.sd_path, ".git")):
                try:
                    repo = git.Repo(self.sd_path)
                    tags = sorted(repo.tags, key=lambda t: t.commit.committed_datetime, reverse=True)
                    if tags:
                        return str(tags[0])
                except:
                    pass

            return "unknown"
        except Exception:
            return "unknown"

    async def _check_sd_webui_running(self) -> bool:
        """Check if SD WebUI is currently running"""
        try:
            response = requests.get("http://127.0.0.1:7860/internal/ping", timeout=5)
            return response.status_code == 200
        except:
            return False

    async def _scan_installed_extensions(self) -> List[InstalledExtension]:
        """Scan for installed extensions"""
        extensions = []

        if not os.path.exists(self.extensions_path):
            return extensions

        try:
            for item in os.listdir(self.extensions_path):
                ext_path = os.path.join(self.extensions_path, item)

                if os.path.isdir(ext_path) and not item.startswith('.'):
                    extension = await self._parse_extension_info(item, ext_path)
                    if extension:
                        extensions.append(extension)
        except Exception as e:
            print(f"Error scanning extensions: {e}")

        return extensions

    async def _parse_extension_info(self, ext_id: str, ext_path: str) -> Optional[InstalledExtension]:
        """Parse extension information from installation"""
        try:
            # Check for common extension info files
            info_files = ['install.py', 'scripts/', '__init__.py', 'README.md']
            has_valid_structure = any(
                os.path.exists(os.path.join(ext_path, info_file))
                for info_file in info_files
            )

            if not has_valid_structure:
                return None

            # Get extension name (try to parse from README or directory name)
            name = ext_id.replace('-', ' ').replace('_', ' ').title()

            # Try to get version from git
            version = "unknown"
            try:
                if os.path.exists(os.path.join(ext_path, ".git")):
                    repo = git.Repo(ext_path)
                    commits = list(repo.iter_commits(max_count=1))
                    if commits:
                        version = commits[0].hexsha[:8]
            except:
                pass

            # Get installation date
            installed_date = datetime.fromtimestamp(os.path.getctime(ext_path)).isoformat()

            # Check if enabled (not disabled via naming convention)
            is_enabled = not ext_id.startswith('disabled_')

            return InstalledExtension(
                id=ext_id,
                name=name,
                version=version,
                path=ext_path,
                isEnabled=is_enabled,
                installedDate=installed_date,
                hasUpdates=False  # Would need to check against remote
            )

        except Exception as e:
            print(f"Error parsing extension {ext_id}: {e}")
            return None

    async def install_extension(self, request: InstallRequest, metadata: ExtensionMetadata) -> Dict[str, Any]:
        """Install extension with dependency resolution"""
        try:
            target_path = os.path.join(self.extensions_path, request.extensionId)

            # Create backup if extension already exists
            if os.path.exists(target_path):
                backup_id = await self._create_backup(request.extensionId, "before_install")

            # Install based on method
            if metadata.installMethod == "git_clone":
                await self._git_clone_extension(metadata.repository, target_path, request.version)
            elif metadata.installMethod == "download_zip":
                await self._download_and_extract(metadata.installUrl, target_path)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported install method: {metadata.installMethod}")

            # Install dependencies if requested
            if request.installDependencies and metadata.dependencies:
                await self._install_dependencies(metadata.dependencies)

            # Configure extension
            await self._configure_extension(request.extensionId, target_path)

            return {
                "success": True,
                "extensionId": request.extensionId,
                "version": request.version or metadata.version,
                "message": f"Successfully installed {metadata.name}"
            }

        except Exception as e:
            return {
                "success": False,
                "extensionId": request.extensionId,
                "message": f"Installation failed: {str(e)}"
            }

    async def _git_clone_extension(self, repo_url: str, target_path: str, version: str = None):
        """Clone git repository"""
        try:
            if os.path.exists(target_path):
                shutil.rmtree(target_path)

            repo = git.Repo.clone_from(repo_url, target_path)

            if version and version != "latest":
                # Try to checkout specific version/tag/commit
                try:
                    repo.git.checkout(version)
                except:
                    print(f"Could not checkout version {version}, using default branch")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Git clone failed: {str(e)}")

    async def _download_and_extract(self, download_url: str, target_path: str):
        """Download and extract ZIP archive"""
        try:
            # Download to temp file
            temp_file = os.path.join(self.temp_path, f"download_{datetime.now().timestamp()}.zip")

            response = requests.get(download_url, stream=True)
            response.raise_for_status()

            with open(temp_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Extract
            with zipfile.ZipFile(temp_file, 'r') as zip_ref:
                zip_ref.extractall(target_path)

            # Clean up temp file
            os.remove(temp_file)

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

    async def _install_dependencies(self, dependencies: List[str]):
        """Install extension dependencies"""
        # This would recursively install dependency extensions
        # For now, just a placeholder
        for dep in dependencies:
            print(f"Would install dependency: {dep}")

    async def _configure_extension(self, extension_id: str, extension_path: str):
        """Configure extension after installation"""
        # Run any post-install configuration
        install_script = os.path.join(extension_path, "install.py")
        if os.path.exists(install_script):
            try:
                # Run install script in a subprocess
                subprocess.run([
                    "python", install_script
                ], cwd=extension_path, check=True, timeout=300)
            except subprocess.TimeoutExpired:
                print(f"Install script for {extension_id} timed out")
            except subprocess.CalledProcessError as e:
                print(f"Install script for {extension_id} failed: {e}")

    async def _create_backup(self, extension_id: str, reason: str) -> str:
        """Create backup of extension"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_id = f"{extension_id}_{reason}_{timestamp}"

        source_path = os.path.join(self.extensions_path, extension_id)
        backup_path = os.path.join(self.backup_path, backup_id)

        if os.path.exists(source_path):
            shutil.copytree(source_path, backup_path)

        return backup_id

    async def uninstall_extension(self, extension_id: str) -> Dict[str, Any]:
        """Uninstall extension"""
        try:
            extension_path = os.path.join(self.extensions_path, extension_id)

            if not os.path.exists(extension_path):
                return {
                    "success": False,
                    "extensionId": extension_id,
                    "message": "Extension not found"
                }

            # Create backup before uninstalling
            backup_id = await self._create_backup(extension_id, "before_uninstall")

            # Remove extension directory
            shutil.rmtree(extension_path)

            return {
                "success": True,
                "extensionId": extension_id,
                "message": "Extension uninstalled successfully",
                "backupId": backup_id
            }

        except Exception as e:
            return {
                "success": False,
                "extensionId": extension_id,
                "message": f"Uninstallation failed: {str(e)}"
            }

    async def toggle_extension(self, extension_id: str, enabled: bool) -> Dict[str, Any]:
        """Enable/disable extension by renaming"""
        try:
            current_path = os.path.join(self.extensions_path, extension_id)

            if enabled:
                # Remove 'disabled_' prefix if present
                if extension_id.startswith('disabled_'):
                    new_id = extension_id[9:]  # Remove 'disabled_' prefix
                    new_path = os.path.join(self.extensions_path, new_id)
                    os.rename(current_path, new_path)
            else:
                # Add 'disabled_' prefix
                if not extension_id.startswith('disabled_'):
                    new_id = f"disabled_{extension_id}"
                    new_path = os.path.join(self.extensions_path, new_id)
                    os.rename(current_path, new_path)

            return {
                "success": True,
                "extensionId": extension_id,
                "enabled": enabled,
                "message": f"Extension {'enabled' if enabled else 'disabled'}"
            }

        except Exception as e:
            return {
                "success": False,
                "extensionId": extension_id,
                "message": f"Toggle failed: {str(e)}"
            }

# Initialize API instance
extension_api = ExtensionAPI()

# FastAPI routes
@router.get("/detect-sdwebui")
async def detect_sdwebui():
    """Detect SD WebUI installation"""
    try:
        info = await extension_api.detect_sd_webui_info()
        return {"success": True, "data": info.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/installed")
async def list_installed():
    """List installed extensions"""
    try:
        extensions = await extension_api._scan_installed_extensions()
        return {"success": True, "data": [ext.dict() for ext in extensions]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/install")
async def install_extension(request: InstallRequest, metadata: ExtensionMetadata):
    """Install extension"""
    try:
        result = await extension_api.install_extension(request, metadata)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/uninstall")
async def uninstall_extension(extension_id: str):
    """Uninstall extension"""
    try:
        result = await extension_api.uninstall_extension(extension_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle")
async def toggle_extension(extension_id: str, enabled: bool):
    """Toggle extension enabled/disabled"""
    try:
        result = await extension_api.toggle_extension(extension_id, enabled)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))