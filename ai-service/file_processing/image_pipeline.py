"""
Image Pipeline — Processes images (PNG, JPG, JPEG, WEBP) via Qwen3.8-27B Vision.
Extracts structured visual understanding, text, tables, entities from images.
"""

import os
import json
import base64
import httpx
from typing import Dict, Any, Optional
from loguru import logger
from file_processing.normalizer import NormalizedContent, VisualAnalysis
from llm.provider import llm_provider

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

VISION_SYSTEM_PROMPT = """You are a precise document and image analysis AI. Analyze the provided image thoroughly and return a structured JSON response. Extract ALL useful information visible in the image.

Your response MUST be valid JSON with this structure:
{
  "image_type": "document|table|chart|diagram|form|screenshot|photo|timetable|other",
  "description": "Brief description of what the image contains",
  "extracted_text": "All visible text extracted from the image, preserving structure",
  "tables": [
    {
      "name": "table name if identifiable",
      "headers": ["col1", "col2"],
      "rows": [["val1", "val2"]]
    }
  ],
  "entities": {
    "names": [],
    "dates": [],
    "numbers": [],
    "organizations": [],
    "subjects": [],
    "locations": []
  },
  "key_information": ["Important fact 1", "Important fact 2"],
  "relationships": ["Relationship or pattern observed"],
  "confidence": 0.95
}

Rules:
- Extract ALL visible text accurately
- Identify tables and preserve their structure
- Extract dates, names, numbers, and entities
- Describe charts/diagrams with data points when visible
- For timetables: extract day, time, subject, teacher, room
- For forms: extract field labels and values
- Be thorough but accurate — do not hallucinate content not visible in the image"""


class ImagePipeline:
    """
    Processes images using Qwen3.8-27B Vision via Groq API.
    """
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = llm_provider.get_model_for_role("vision") or GROQ_VISION_MODEL
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"

    def process(
        self,
        image_url: str,
        filename: str = "",
        document_id: str = "",
        user_prompt: str = "",
        local_path: str = None
    ) -> NormalizedContent:
        """
        Process an image URL or local path through Qwen Vision and return normalized content.
        """
        logger.info(f"[ImagePipeline] Processing image: {filename} via {self.model}")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type="image",
            file_url=image_url,
            has_visual_content=True
        )

        try:
            vision_result = self._call_vision(image_url, user_prompt, local_path=local_path)

            if vision_result:
                analysis = VisualAnalysis(
                    source="full_image",
                    description=vision_result.get("description", ""),
                    extracted_text=vision_result.get("extracted_text", ""),
                    tables=vision_result.get("tables", []),
                    entities=vision_result.get("entities", {}),
                    raw_response=json.dumps(vision_result, default=str)
                )
                normalized.visual_analyses = [analysis]
                normalized.text = vision_result.get("extracted_text", "")
                normalized.summary = vision_result.get("description", "")
                normalized.tables = vision_result.get("tables", [])
                normalized.table_count = len(normalized.tables)

                # Build structured data from entities and key info
                normalized.structured_data = {
                    "image_type": vision_result.get("image_type", "other"),
                    "entities": vision_result.get("entities", {}),
                    "key_information": vision_result.get("key_information", []),
                    "relationships": vision_result.get("relationships", []),
                    "confidence": vision_result.get("confidence", 0.0)
                }

                # If text extracted, also set it for chunking
                if normalized.text:
                    normalized.metadata["text_extracted"] = True

        except Exception as e:
            logger.error(f"[ImagePipeline] Processing error: {e}")
            normalized.processing_errors.append(str(e))

        return normalized

    def _call_vision(self, image_url: str, user_prompt: str = "", local_path: str = None) -> Optional[Dict[str, Any]]:
        """
        Call Groq Qwen Vision API with base64 data URI or image URL.
        """
        if not self.api_key:
            logger.warning("[ImagePipeline] No GROQ_API_KEY configured. Skipping vision call.")
            return None

        # Convert image bytes to Base64 data URI to guarantee delivery
        final_image_url = image_url
        img_bytes = None
        mime = "image/jpeg"

        try:
            if local_path and os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    img_bytes = f.read()
                ext = os.path.splitext(local_path)[1].replace(".", "").lower()
                if ext in ["png", "webp"]:
                    mime = f"image/{ext}"
            elif image_url:
                # If localhost or relative URL, try to resolve from uploads directory
                if "localhost" in image_url or image_url.startswith("/"):
                    fname = os.path.basename(image_url)
                    possible_local = os.path.join(os.path.dirname(__file__), "../../backend/uploads", fname)
                    if os.path.exists(possible_local):
                        with open(possible_local, "rb") as f:
                            img_bytes = f.read()
                if img_bytes is None and image_url.startswith("http"):
                    dl = httpx.get(image_url, timeout=20.0, follow_redirects=True)
                    if dl.status_code == 200:
                        img_bytes = dl.content
                        c_type = dl.headers.get("content-type", "")
                        if "image/" in c_type:
                            mime = c_type.split(";")[0]

            if img_bytes:
                b64_str = base64.b64encode(img_bytes).decode("utf-8")
                final_image_url = f"data:{mime};base64,{b64_str}"
        except Exception as img_err:
            logger.warning(f"[ImagePipeline] Base64 conversion warning: {img_err}")

        user_content = []
        user_content.append({
            "type": "image_url",
            "image_url": {"url": final_image_url}
        })

        prompt_text = user_prompt or "Analyze this image thoroughly and extract all information."
        user_content.append({
            "type": "text",
            "text": prompt_text
        })

        messages = [
            {"role": "system", "content": VISION_SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ]

        api_key = self.api_key or os.getenv("GROQ_API_KEY", "")
        model = self.model or os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

        try:
            response = httpx.post(
                self.groq_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 800
                },
                timeout=45.0
            )

            # If 429 OTPM limit hit, retry once with smaller max_tokens
            if response.status_code == 429:
                logger.warning("[ImagePipeline] 429 rate limit hit, retrying with max_tokens=400...")
                import time
                time.sleep(1.0)
                response = httpx.post(
                    self.groq_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.2,
                        "max_tokens": 400
                    },
                    timeout=30.0
                )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                logger.info(
                    f"[ImagePipeline] Vision completed | Tokens: {usage.get('total_tokens', 'N/A')} | Model: {model}"
                )

                # Parse JSON from response — handle markdown code blocks
                return self._parse_vision_response(content)
            else:
                logger.error(f"[ImagePipeline] Groq API error ({response.status_code}): {response.text[:300]}")
                return None

        except Exception as e:
            logger.error(f"[ImagePipeline] Vision API call error: {e}")
            return None

    def _parse_vision_response(self, content: str) -> Dict[str, Any]:
        """
        Parse JSON from vision model response. Handles markdown code blocks and malformed output.
        """
        # Try to extract JSON from markdown code blocks
        if "```json" in content:
            try:
                json_str = content.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            except (IndexError, json.JSONDecodeError):
                pass

        if "```" in content:
            try:
                json_str = content.split("```")[1].split("```")[0].strip()
                return json.loads(json_str)
            except (IndexError, json.JSONDecodeError):
                pass

        # Try direct JSON parse
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # Try to find JSON object in text
        import re
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Fallback: return the raw text as description
        logger.warning("[ImagePipeline] Could not parse JSON from vision response. Using raw text.")
        return {
            "image_type": "other",
            "description": content[:500],
            "extracted_text": content,
            "tables": [],
            "entities": {},
            "key_information": [],
            "relationships": [],
            "confidence": 0.5
        }


image_pipeline = ImagePipeline()
