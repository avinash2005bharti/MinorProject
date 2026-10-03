"""
PowerPoint Pipeline — Extracts text, tables, notes, and images from PPTX files.
Slide images with important visual content are routed through Qwen Vision.
"""

import os
import tempfile
from typing import Dict, Any, Optional
from loguru import logger
from file_processing.normalizer import NormalizedContent, VisualAnalysis

try:
    import httpx
except ImportError:
    httpx = None


class PPTXPipeline:
    """
    Processes PowerPoint files (PPTX, PPT).
    Extracts slide text, tables, speaker notes, and optionally processes images via vision.
    """
    def process(
        self,
        file_url: str,
        filename: str = "",
        document_id: str = "",
        local_path: str = None
    ) -> NormalizedContent:
        logger.info(f"[PPTXPipeline] Processing presentation: {filename}")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type="pptx",
            file_url=file_url
        )

        temp_path = local_path
        cleanup_temp = False

        try:
            if not temp_path or not os.path.exists(temp_path):
                temp_path = self._download_file(file_url, filename)
                cleanup_temp = True

            if not temp_path or not os.path.exists(temp_path):
                normalized.processing_errors.append("Could not download or locate PPTX file.")
                return normalized

            from pptx import Presentation
            prs = Presentation(temp_path)

            all_text_parts = []
            slide_data = []
            normalized.slide_count = len(prs.slides)

            for i, slide in enumerate(prs.slides):
                slide_num = i + 1
                slide_info = {
                    "slide_number": slide_num,
                    "title": "",
                    "text_content": [],
                    "tables": [],
                    "notes": "",
                    "has_images": False
                }

                # Extract title
                if slide.shapes.title and slide.shapes.title.text:
                    slide_info["title"] = slide.shapes.title.text.strip()

                # Extract all shape content
                for shape in slide.shapes:
                    # Text content
                    if hasattr(shape, "text") and shape.text.strip():
                        slide_info["text_content"].append(shape.text.strip())

                    # Table content
                    if shape.has_table:
                        table = shape.table
                        headers = [cell.text.strip() for cell in table.rows[0].cells]
                        rows = []
                        for row_idx in range(1, len(table.rows)):
                            row = [cell.text.strip() for cell in table.rows[row_idx].cells]
                            rows.append(row)

                        table_data = {
                            "slide": slide_num,
                            "headers": headers,
                            "columns": headers,
                            "rows": rows,
                            "name": f"Slide {slide_num} Table"
                        }
                        slide_info["tables"].append(table_data)
                        normalized.tables.append(table_data)

                    # Check for images
                    if shape.shape_type and str(shape.shape_type) in ['13', '17']:  # PICTURE or LINKED_PICTURE
                        slide_info["has_images"] = True
                        normalized.has_visual_content = True

                # Speaker notes
                if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                    notes_text = slide.notes_slide.notes_text_frame.text.strip()
                    if notes_text:
                        slide_info["notes"] = notes_text

                slide_data.append(slide_info)

                # Build text representation
                text_part = f"--- Slide {slide_num} ---"
                if slide_info["title"]:
                    text_part += f"\nTitle: {slide_info['title']}"
                if slide_info["text_content"]:
                    text_part += "\n" + "\n".join(slide_info["text_content"])
                if slide_info["notes"]:
                    text_part += f"\nNotes: {slide_info['notes']}"
                all_text_parts.append(text_part)

            normalized.text = "\n\n".join(all_text_parts)
            normalized.table_count = len(normalized.tables)
            normalized.structured_data = {
                "type": "presentation",
                "filename": normalized.filename,
                "slide_count": normalized.slide_count,
                "slides": slide_data
            }
            normalized.summary = (
                f"Presentation '{filename}' with {normalized.slide_count} slides. "
                + (f"Titles: {', '.join(s['title'] for s in slide_data[:5] if s['title'])}" or "")
            )

        except Exception as e:
            logger.error(f"[PPTXPipeline] Error: {e}")
            normalized.processing_errors.append(str(e))
        finally:
            if cleanup_temp and temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

        return normalized

    def _download_file(self, url: str, filename: str) -> Optional[str]:
        """Download file from URL or locate on local disk."""
        if "localhost" in url or url.startswith("/"):
            fname = os.path.basename(url)
            possible_local = os.path.join(os.path.dirname(__file__), "../../backend/uploads", fname)
            if os.path.exists(possible_local):
                return possible_local

        if not httpx:
            return None
        try:
            ext = os.path.splitext(filename)[1] or '.pptx'
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="pptx_proc_")
            os.close(temp_fd)
            with httpx.stream("GET", url, timeout=60.0, follow_redirects=True) as response:
                if response.status_code == 200:
                    with open(temp_path, "wb") as f:
                        for chunk in response.iter_bytes():
                            f.write(chunk)
                    return temp_path
                else:
                    os.unlink(temp_path)
                    return None
        except Exception as e:
            logger.error(f"[PPTXPipeline] Download error: {e}")
            return None


pptx_pipeline = PPTXPipeline()
