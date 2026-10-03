"""
ImageKit Client for Python AI Service.
Reuses the same credentials configured in backend .env.
Used for uploading agent-generated files to ImageKit Cloud.
"""

import os
import base64
import httpx
from loguru import logger

class ImageKitClient:
    """
    Lightweight ImageKit upload client for the Python AI service.
    Reuses the same IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT.
    """
    def __init__(self):
        self.private_key = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
        self.public_key = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
        self.url_endpoint = os.getenv("IMAGEKIT_URL_ENDPOINT", "")
        self.upload_url = "https://upload.imagekit.io/api/v1/files/upload"
        self._configured = bool(self.private_key and self.public_key and self.url_endpoint)

        if self._configured:
            logger.info(f"[ImageKit Python] Initialized with endpoint: {self.url_endpoint}")
        else:
            logger.warning("[ImageKit Python] Credentials not configured. Generated files will use local fallback.")

    def is_configured(self) -> bool:
        return self._configured

    def upload_file(
        self,
        file_path: str,
        file_name: str,
        folder: str = "/campusflow-erp/generated",
        tags: list = None
    ) -> dict:
        """
        Upload a local file to ImageKit. Returns dict with url, fileId, name.
        """
        if not self._configured:
            logger.warning("[ImageKit Python] Not configured, skipping upload.")
            return None

        if not os.path.exists(file_path):
            logger.error(f"[ImageKit Python] File not found: {file_path}")
            return None

        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            file_b64 = base64.b64encode(file_bytes).decode("utf-8")

            # ImageKit uses HTTP Basic Auth with private_key as username and empty password
            auth = (self.private_key, "")
            data = {
                "fileName": file_name,
                "folder": folder,
            }
            if tags:
                data["tags"] = ",".join(tags) if isinstance(tags, list) else tags

            files_payload = {
                "file": (file_name, file_bytes),
            }

            response = httpx.post(
                self.upload_url,
                data=data,
                files={"file": (file_name, file_bytes)},
                auth=auth,
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"[ImageKit Python] Uploaded: {result.get('name')} → {result.get('url')}")
                return {
                    "url": result.get("url"),
                    "fileId": result.get("fileId"),
                    "name": result.get("name"),
                    "size": result.get("size"),
                    "filePath": result.get("filePath"),
                    "thumbnailUrl": result.get("thumbnailUrl")
                }
            else:
                logger.error(f"[ImageKit Python] Upload failed ({response.status_code}): {response.text[:300]}")
                return None

        except Exception as e:
            logger.error(f"[ImageKit Python] Upload error: {e}")
            return None

    def upload_bytes(
        self,
        file_bytes: bytes,
        file_name: str,
        folder: str = "/campusflow-erp/generated",
        tags: list = None
    ) -> dict:
        """
        Upload raw bytes to ImageKit.
        """
        if not self._configured:
            return None

        try:
            auth = (self.private_key, "")
            data = {
                "fileName": file_name,
                "folder": folder,
            }
            if tags:
                data["tags"] = ",".join(tags) if isinstance(tags, list) else tags

            response = httpx.post(
                self.upload_url,
                data=data,
                files={"file": (file_name, file_bytes)},
                auth=auth,
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"[ImageKit Python] Uploaded bytes: {result.get('name')} → {result.get('url')}")
                return {
                    "url": result.get("url"),
                    "fileId": result.get("fileId"),
                    "name": result.get("name"),
                    "size": result.get("size")
                }
            else:
                logger.error(f"[ImageKit Python] Bytes upload failed ({response.status_code}): {response.text[:300]}")
                return None

        except Exception as e:
            logger.error(f"[ImageKit Python] Bytes upload error: {e}")
            return None


imagekit_client = ImageKitClient()
