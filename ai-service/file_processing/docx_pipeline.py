"""
DOCX Pipeline — Extracts headings, paragraphs, tables, lists, and metadata from Word documents.
Embedded images are optionally flagged for vision processing.
"""

import os
import tempfile
from typing import Dict, Any, Optional
from loguru import logger
from file_processing.normalizer import NormalizedContent

try:
    import httpx
except ImportError:
    httpx = None


class DOCXPipeline:
    """
    Processes Word documents (DOCX, DOC).
    Extracts headings, paragraphs, tables, lists, and embedded image references.
    """
    def process(
        self,
        file_url: str,
        filename: str = "",
        document_id: str = "",
        local_path: str = None
    ) -> NormalizedContent:
        logger.info(f"[DOCXPipeline] Processing document: {filename}")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type="docx",
            file_url=file_url
        )

        temp_path = local_path
        cleanup_temp = False

        try:
            if not temp_path or not os.path.exists(temp_path):
                temp_path = self._download_file(file_url, filename)
                cleanup_temp = True

            if not temp_path or not os.path.exists(temp_path):
                normalized.processing_errors.append("Could not download or locate DOCX file.")
                return normalized

            import docx
            doc = docx.Document(temp_path)

            all_text_parts = []
            headings = []
            image_count = 0

            # Extract paragraphs with heading detection
            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue

                if para.style and para.style.name.startswith('Heading'):
                    level = para.style.name.replace('Heading', '').strip() or '1'
                    headings.append({"level": level, "text": text})
                    all_text_parts.append(f"\n{'#' * int(level) if level.isdigit() else '#'} {text}")
                else:
                    all_text_parts.append(text)

            # Extract tables
            for i, table in enumerate(doc.tables):
                headers = []
                rows = []
                for row_idx, row in enumerate(table.rows):
                    cells = [cell.text.strip() for cell in row.cells]
                    if row_idx == 0:
                        headers = cells
                    else:
                        rows.append(cells)

                if headers or rows:
                    table_data = {
                        "name": f"Table {i + 1}",
                        "headers": headers,
                        "columns": headers,
                        "rows": rows,
                        "row_count": len(rows)
                    }
                    normalized.tables.append(table_data)

                    # Add table text representation
                    table_text = f"\n--- Table {i + 1} ---\n"
                    if headers:
                        table_text += " | ".join(headers) + "\n"
                    for row in rows[:20]:
                        table_text += " | ".join(row) + "\n"
                    all_text_parts.append(table_text)

            # Check for embedded images (via relationships)
            try:
                for rel in doc.part.rels.values():
                    if "image" in str(rel.reltype).lower():
                        image_count += 1
                if image_count > 0:
                    normalized.has_visual_content = True
                    normalized.metadata["embedded_images"] = image_count
            except Exception:
                pass

            normalized.text = "\n\n".join(all_text_parts)
            normalized.table_count = len(normalized.tables)
            normalized.page_count = max(1, len(normalized.text) // 3000)  # Approximate
            normalized.structured_data = {
                "type": "document",
                "filename": normalized.filename,
                "headings": headings,
                "table_count": normalized.table_count,
                "embedded_images": image_count
            }
            normalized.summary = (
                f"Word document '{filename}' with {len(headings)} headings, "
                f"{normalized.table_count} tables, {image_count} embedded images."
            )

        except Exception as e:
            logger.error(f"[DOCXPipeline] Error: {e}")
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
            ext = os.path.splitext(filename)[1] or '.docx'
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="docx_proc_")
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
            logger.error(f"[DOCXPipeline] Download error: {e}")
            return None


docx_pipeline = DOCXPipeline()
