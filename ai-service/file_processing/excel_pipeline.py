"""
Excel Pipeline — Processes XLSX, XLS, CSV files using openpyxl and pandas.
Extracts sheet metadata, headers, rows, and produces normalized structured data.
"""

import os
import tempfile
from typing import Dict, Any, Optional, List
from loguru import logger
from file_processing.normalizer import NormalizedContent

try:
    import httpx
except ImportError:
    httpx = None


class ExcelPipeline:
    """
    Processes spreadsheet files (XLSX, XLS, CSV).
    Uses openpyxl for XLSX and pandas for CSV/analysis.
    """
    def process(
        self,
        file_url: str,
        filename: str = "",
        document_id: str = "",
        file_type: str = "xlsx",
        local_path: str = None
    ) -> NormalizedContent:
        logger.info(f"[ExcelPipeline] Processing spreadsheet: {filename} ({file_type})")

        normalized = NormalizedContent(
            document_id=document_id,
            filename=filename,
            file_type=file_type,
            file_url=file_url
        )

        temp_path = local_path
        cleanup_temp = False

        try:
            if not temp_path or not os.path.exists(temp_path):
                temp_path = self._download_file(file_url, filename)
                cleanup_temp = True

            if not temp_path or not os.path.exists(temp_path):
                normalized.processing_errors.append("Could not download or locate spreadsheet file.")
                return normalized

            if file_type == 'csv':
                self._process_csv(temp_path, normalized)
            else:
                self._process_xlsx(temp_path, normalized)

        except Exception as e:
            logger.error(f"[ExcelPipeline] Error: {e}")
            normalized.processing_errors.append(str(e))
        finally:
            if cleanup_temp and temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

        return normalized

    def _process_xlsx(self, file_path: str, normalized: NormalizedContent):
        """Process XLSX/XLS file using openpyxl."""
        import openpyxl

        wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
        sheet_names = wb.sheetnames
        normalized.sheet_count = len(sheet_names)

        all_text_parts = []
        structured_sheets = []

        for sheet_name in sheet_names:
            ws = wb[sheet_name]
            headers = []
            rows = []
            row_count = 0

            for row_idx, row in enumerate(ws.iter_rows(values_only=True)):
                row_values = [str(cell) if cell is not None else "" for cell in row]

                # Skip completely empty rows
                if not any(v.strip() for v in row_values):
                    continue

                if row_idx == 0:
                    headers = row_values
                else:
                    rows.append(row_values)
                    row_count += 1

                    # Cap at 500 rows to avoid excessive data
                    if row_count >= 500:
                        break

            sheet_data = {
                "name": sheet_name,
                "columns": headers,
                "headers": headers,
                "rows": rows,
                "row_count": row_count,
                "sheet": sheet_name
            }
            structured_sheets.append(sheet_data)
            normalized.tables.append(sheet_data)

            # Build text representation
            text_repr = f"=== Sheet: {sheet_name} ===\n"
            if headers:
                text_repr += "Headers: " + " | ".join(headers) + "\n"
            for row in rows[:20]:  # Preview first 20 rows in text
                text_repr += " | ".join(row) + "\n"
            if row_count > 20:
                text_repr += f"... ({row_count - 20} more rows)\n"
            all_text_parts.append(text_repr)

        wb.close()

        normalized.text = "\n\n".join(all_text_parts)
        normalized.table_count = len(structured_sheets)
        normalized.structured_data = {
            "type": "spreadsheet",
            "filename": normalized.filename,
            "sheets": structured_sheets
        }
        normalized.summary = (
            f"Spreadsheet '{normalized.filename}' with {normalized.sheet_count} sheet(s): "
            + ", ".join(sheet_names)
        )

    def _process_csv(self, file_path: str, normalized: NormalizedContent):
        """Process CSV file using pandas."""
        try:
            import pandas as pd
        except ImportError:
            # Fallback to basic CSV reading
            import csv
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                rows_list = list(reader)

            headers = rows_list[0] if rows_list else []
            data_rows = rows_list[1:500] if len(rows_list) > 1 else []

            normalized.tables.append({
                "name": "CSV Data",
                "columns": headers,
                "headers": headers,
                "rows": data_rows,
                "row_count": len(data_rows),
                "sheet": "CSV"
            })
            normalized.sheet_count = 1
            normalized.table_count = 1
            normalized.text = "Headers: " + " | ".join(headers) + "\n"
            for row in data_rows[:20]:
                normalized.text += " | ".join(row) + "\n"
            normalized.summary = f"CSV file '{normalized.filename}' with {len(data_rows)} rows."
            return

        df = pd.read_csv(file_path, nrows=500)
        headers = list(df.columns)
        rows = df.fillna("").astype(str).values.tolist()

        normalized.tables.append({
            "name": "CSV Data",
            "columns": headers,
            "headers": headers,
            "rows": rows,
            "row_count": len(rows),
            "sheet": "CSV"
        })
        normalized.sheet_count = 1
        normalized.table_count = 1
        normalized.text = df.to_string(max_rows=30, max_cols=15)
        normalized.structured_data = {
            "type": "spreadsheet",
            "filename": normalized.filename,
            "sheets": [{
                "name": "CSV Data",
                "columns": headers,
                "rows": rows,
                "row_count": len(rows)
            }]
        }
        normalized.summary = (
            f"CSV file '{normalized.filename}' with {len(rows)} rows and {len(headers)} columns: "
            + ", ".join(headers[:10])
        )

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
            ext = os.path.splitext(filename)[1] or '.xlsx'
            temp_fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="excel_proc_")
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
            logger.error(f"[ExcelPipeline] Download error: {e}")
            return None

    def analyze_spreadsheet(self, file_path: str, query: str = "") -> Dict[str, Any]:
        """
        Safe analytical computation tool for spreadsheets using pandas.
        Performs calculations like finding rows with attendance < 75%, counts by section, summaries.
        """
        import pandas as pd
        q_lower = query.lower()
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, sheet_name=0)

            total_records = len(df)
            cols = list(df.columns)

            # 1. Attendance shortage analysis (< 75%)
            if "75" in q_lower or "shortage" in q_lower or "attendance" in q_lower:
                # Find attendance column
                att_col = None
                for c in cols:
                    if any(k in str(c).lower() for k in ["attendance", "percentage", "pct", "%"]):
                        att_col = c
                        break

                if att_col:
                    # Clean percentage values
                    clean_vals = df[att_col].astype(str).str.replace("%", "").str.strip()
                    numeric_vals = pd.to_numeric(clean_vals, errors="coerce")
                    shortage_mask = numeric_vals < 75
                    shortage_df = df[shortage_mask]

                    return {
                        "success": True,
                        "analysis_type": "attendance_shortage",
                        "total_students": total_records,
                        "shortage_count": len(shortage_df),
                        "shortage_percentage": round((len(shortage_df) / max(total_records, 1)) * 100, 1),
                        "columns": cols,
                        "rows": shortage_df.fillna("").to_dict(orient="records")
                    }

            # 2. Section count / distribution
            if "section" in q_lower or "how many" in q_lower or "count" in q_lower:
                sec_col = None
                for c in cols:
                    if "section" in str(c).lower():
                        sec_col = c
                        break
                if sec_col:
                    counts = df[sec_col].value_counts().to_dict()
                    return {
                        "success": True,
                        "analysis_type": "section_distribution",
                        "total_rows": total_records,
                        "counts_by_section": counts
                    }

            # General statistical summary
            return {
                "success": True,
                "analysis_type": "general_summary",
                "total_rows": total_records,
                "columns": cols,
                "sample_preview": df.head(5).fillna("").to_dict(orient="records")
            }
        except Exception as e:
            logger.error(f"[ExcelPipeline] analyze_spreadsheet error: {e}")
            return {"success": False, "error": str(e)}


excel_pipeline = ExcelPipeline()

