"""
Normalized Content Layer — Common internal structure for all file types.
Regardless of original format, produces a unified representation consumable by agents.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class VisualAnalysis(BaseModel):
    """Result of visual analysis via Qwen Vision."""
    source: str = ""          # e.g. "page_3", "slide_5", "embedded_image_1"
    description: str = ""
    extracted_text: str = ""
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    entities: Dict[str, Any] = Field(default_factory=dict)
    raw_response: str = ""


class NormalizedContent(BaseModel):
    """Universal normalized content produced by any file pipeline."""
    document_id: str = ""
    filename: str = ""
    file_type: str = ""        # pdf, image, xlsx, pptx, docx, txt
    mime_type: str = ""
    file_url: str = ""

    # Extracted content
    summary: str = ""
    text: str = ""
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    structured_data: Dict[str, Any] = Field(default_factory=dict)
    visual_analyses: List[VisualAnalysis] = Field(default_factory=list)

    # Chunking-ready segments
    chunks: List[Dict[str, Any]] = Field(default_factory=list)

    # Metadata
    page_count: int = 0
    sheet_count: int = 0
    slide_count: int = 0
    table_count: int = 0
    has_visual_content: bool = False

    metadata: Dict[str, Any] = Field(default_factory=dict)
    processing_errors: List[str] = Field(default_factory=list)
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
