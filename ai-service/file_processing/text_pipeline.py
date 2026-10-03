"""
Text Pipeline — Processes plain text files (TXT and other text-based documents).
"""

import os
import tempfile
from typing import Optional
from loguru import logger
from file_processing.normalizer import NormalizedContent

try:
    import httpx
except ImportError:
    httpx = None


class TextPipeline:
    """
    Processes plain text files (TXT, etc).
    """
    def process(
        self,
        file_url: str,
        filename: str = "",
        document_id: str = "",
        local_path: str = None
    ) -> NormalizedContent:
        logger.info(f"[TextPipeline] Processing text file: {filename}")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type="txt",
            file_url=file_url
        )

        temp_path = local_path
        cleanup_temp = False

        try:
            if not temp_path or not os.path.exists(temp_path):
                temp_path = self._download_file(file_url, filename)
                cleanup_temp = True

            if not temp_path or not os.path.exists(temp_path):
                normalized.processing_errors.append("Could not download or locate text file.")
                return normalized

            with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            normalized.text = content
            normalized.summary = f"Text file '{filename}' with {len(content)} characters."
            normalized.page_count = max(1, len(content) // 3000)

        except Exception as e:
            logger.error(f"[TextPipeline] Error: {e}")
            normalized.processing_errors.append(str(e))
        finally:
            if cleanup_temp and temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

        return normalized

    def _download_file(self, url: str, filename: str) -> Optional[str]:
        if not httpx:
            return None
        try:
            ext = os.path.splitext(filename)[1] or '.txt'
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="text_proc_")
            os.close(temp_fd)
            with httpx.stream("GET", url, timeout=30.0, follow_redirects=True) as response:
                if response.status_code == 200:
                    with open(temp_path, "wb") as f:
                        for chunk in response.iter_bytes():
                            f.write(chunk)
                    return temp_path
                else:
                    os.unlink(temp_path)
                    return None
        except Exception as e:
            logger.error(f"[TextPipeline] Download error: {e}")
            return None


text_pipeline = TextPipeline()
