"""
PDF Pipeline — Extracts content from text PDFs and scanned/image PDFs.
Automatically detects scanned PDFs and routes them through Qwen Vision.
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


class PDFPipeline:
    """
    Processes PDF files:
    - Text PDFs: Direct text extraction via pypdf
    - Scanned/Image PDFs: Routes pages through Qwen Vision
    """
    def process(
        self,
        file_url: str,
        filename: str = "",
        document_id: str = "",
        local_path: str = None
    ) -> NormalizedContent:
        logger.info(f"[PDFPipeline] Processing PDF: {filename}")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type="pdf",
            file_url=file_url
        )

        temp_path = local_path
        cleanup_temp = False

        try:
            # Download from URL if no local path
            if not temp_path or not os.path.exists(temp_path):
                temp_path = self._download_file(file_url, filename)
                cleanup_temp = True

            if not temp_path or not os.path.exists(temp_path):
                normalized.processing_errors.append("Could not download or locate PDF file.")
                return normalized

            # Extract text from PDF
            from pypdf import PdfReader
            reader = PdfReader(temp_path)
            page_texts = []
            total_text_chars = 0

            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                total_text_chars += len(page_text.strip())
                page_texts.append({
                    "page": i + 1,
                    "text": page_text,
                    "has_text": len(page_text.strip()) > 20
                })

            normalized.page_count = len(reader.pages)

            # Determine if scanned PDF (very little extractable text)
            avg_chars_per_page = total_text_chars / max(len(reader.pages), 1)
            is_scanned = avg_chars_per_page < 50

            if is_scanned:
                logger.info(f"[PDFPipeline] Detected SCANNED PDF ({avg_chars_per_page:.0f} avg chars/page). Using vision.")
                normalized.has_visual_content = True
                normalized.metadata["is_scanned"] = True

                from file_processing.image_pipeline import image_pipeline
                scanned_page_texts = []
                for i, page in enumerate(reader.pages):
                    page_num = i + 1
                    page_img_text = ""
                    try:
                        # Extract first significant image from page if present
                        if hasattr(page, "images") and len(page.images) > 0:
                            img_obj = page.images[0]
                            temp_img_fd, temp_img_path = tempfile.mkstemp(suffix=".png")
                            os.close(temp_img_fd)
                            with open(temp_img_path, "wb") as img_f:
                                img_f.write(img_obj.data)

                            vis_res = image_pipeline.process(
                                image_url="",
                                filename=f"{filename}_page_{page_num}.png",
                                document_id=document_id,
                                local_path=temp_img_path
                            )
                            try:
                                os.unlink(temp_img_path)
                            except Exception:
                                pass
                            if vis_res.text:
                                page_img_text = vis_res.text
                    except Exception as scan_err:
                        logger.warning(f"[PDFPipeline] Page {page_num} vision OCR warning: {scan_err}")

                    if page_img_text:
                        scanned_page_texts.append(f"--- Page {page_num} ---\n{page_img_text}")
                    elif page_texts[i]['text'].strip():
                        scanned_page_texts.append(f"--- Page {page_num} ---\n{page_texts[i]['text']}")

                if scanned_page_texts:
                    normalized.text = "\n\n".join(scanned_page_texts)
                else:
                    normalized.text = "\n\n".join(
                        f"--- Page {pt['page']} ---\n{pt['text']}" for pt in page_texts if pt['text'].strip()
                    )
            else:
                # Normal text PDF
                full_text_parts = []
                for pt in page_texts:
                    if pt['text'].strip():
                        full_text_parts.append(f"--- Page {pt['page']} ---\n{pt['text']}")

                normalized.text = "\n\n".join(full_text_parts)

            # Extract tables if possible (basic detection)
            normalized.tables = self._extract_tables(page_texts)
            normalized.table_count = len(normalized.tables)

            # Generate summary from first ~500 chars
            text_preview = normalized.text[:500].strip()
            if text_preview:
                normalized.summary = f"PDF document '{filename}' with {normalized.page_count} pages. Preview: {text_preview[:200]}..."

            normalized.metadata["total_chars"] = total_text_chars
            normalized.metadata["is_scanned"] = is_scanned

        except Exception as e:
            logger.error(f"[PDFPipeline] Error processing PDF: {e}")
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
        # 1. Search in backend uploads directory first
        uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/uploads"))
        if os.path.exists(uploads_dir):
            if filename:
                target = os.path.join(uploads_dir, filename)
                if os.path.exists(target):
                    return target
                # Try prefix match for multer timestamped files (e.g. RESUME-17909...pdf)
                clean_name = os.path.splitext(filename)[0].lower().replace(" ", "_")
                for f in os.listdir(uploads_dir):
                    if clean_name in f.lower() and f.lower().endswith(".pdf"):
                        return os.path.join(uploads_dir, f)
            if url:
                ubase = os.path.basename(url)
                utarget = os.path.join(uploads_dir, ubase)
                if os.path.exists(utarget):
                    return utarget

        if not url or not url.startswith("http"):
            return None

        if not httpx:
            logger.warning("[PDFPipeline] httpx not available for download.")
            return None

        try:
            ext = os.path.splitext(filename)[1] or '.pdf'
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="pdf_proc_")
            os.close(temp_fd)

            with httpx.stream("GET", url, timeout=30.0, follow_redirects=True) as response:
                if response.status_code == 200:
                    with open(temp_path, "wb") as f:
                        for chunk in response.iter_bytes():
                            f.write(chunk)
                    return temp_path
                else:
                    logger.error(f"[PDFPipeline] Download failed ({response.status_code})")
                    try: os.unlink(temp_path)
                    except Exception: pass
                    return None
        except Exception as e:
            logger.error(f"[PDFPipeline] Download error: {e}")
            return None

    def _extract_tables(self, page_texts: list) -> list:
        """Basic table detection from text — looks for aligned columns."""
        tables = []
        for pt in page_texts:
            text = pt.get("text", "")
            lines = text.split('\n')
            # Simple heuristic: lines with multiple | or \t separators
            table_lines = []
            for line in lines:
                if line.count('|') >= 2 or line.count('\t') >= 2:
                    table_lines.append(line)

            if len(table_lines) >= 2:
                sep = '|' if '|' in table_lines[0] else '\t'
                headers = [c.strip() for c in table_lines[0].split(sep) if c.strip()]
                rows = []
                for tl in table_lines[1:]:
                    row = [c.strip() for c in tl.split(sep) if c.strip()]
                    if row:
                        rows.append(row)
                if headers and rows:
                    tables.append({
                        "page": pt.get("page"),
                        "headers": headers,
                        "columns": headers,
                        "rows": rows
                    })

        return tables


pdf_pipeline = PDFPipeline()
