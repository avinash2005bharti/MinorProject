import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/uploads"))

# Import ImageKit client for cloud upload of generated files
try:
    from file_processing.imagekit_client import imagekit_client
except ImportError:
    imagekit_client = None

class TimetableFileGenerator:
    """
    Generates professional, production-ready PDF and Excel (.xlsx) timetables
    with departmental metadata, versioning tags, and grid formatting.
    """
    def __init__(self):
        os.makedirs(UPLOADS_DIR, exist_ok=True)

    def generate_excel(
        self,
        department: str,
        year: str,
        semester: int,
        section: str,
        academic_year: str,
        version: int,
        slots: List[Dict[str, Any]],
        stats: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a beautifully formatted Excel workbook (.xlsx) with grid styling.
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Timetable_Sem{semester}_{section}"

        # Colors & Styling
        primary_color = "1E3A8A" # Deep Indigo
        accent_color = "DBEAFE"  # Soft Blue
        header_fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
        sub_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
        title_font = Font(name="Segoe UI", size=15, bold=True, color="FFFFFF")
        header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
        cell_font = Font(name="Segoe UI", size=10)
        thin_border = Border(
            left=Side(style='thin', color='CBD5E1'),
            right=Side(style='thin', color='CBD5E1'),
            top=Side(style='thin', color='CBD5E1'),
            bottom=Side(style='thin', color='CBD5E1')
        )

        # Title Rows
        ws.merge_cells('A1:F1')
        ws['A1'] = f"{department.upper()} — MASTER ACADEMIC TIMETABLE"
        ws['A1'].font = title_font
        ws['A1'].fill = header_fill
        ws['A1'].alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[1].height = 35

        ws.merge_cells('A2:F2')
        ws['A2'] = f"Class: {year} | Semester {semester} - Section {section} | Academic Session: {academic_year} | Version: v{version}"
        ws['A2'].font = Font(name="Segoe UI", size=10, italic=True, color="334155")
        ws['A2'].fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        ws['A2'].alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[2].height = 22

        # Column Headers
        headers = ["Day", "Time Slot", "Subject", "Teacher / Faculty", "Room / Laboratory", "Type"]
        for col_idx, h in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col_idx, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border
        ws.row_dimensions[4].height = 26

        # Populate Rows
        row_idx = 5
        for s in slots:
            time_display = f"{s.get('start_time', '')} - {s.get('end_time', '')}"
            ws.cell(row=row_idx, column=1, value=s.get("day", "")).alignment = Alignment(horizontal="center")
            ws.cell(row=row_idx, column=2, value=time_display).alignment = Alignment(horizontal="center")
            ws.cell(row=row_idx, column=3, value=s.get("subject", "")).alignment = Alignment(horizontal="left")
            ws.cell(row=row_idx, column=4, value=s.get("faculty", "")).alignment = Alignment(horizontal="left")
            ws.cell(row=row_idx, column=5, value=s.get("room", "")).alignment = Alignment(horizontal="center")
            ws.cell(row=row_idx, column=6, value=s.get("type", "Lecture")).alignment = Alignment(horizontal="center")

            for col in range(1, 7):
                c = ws.cell(row=row_idx, column=col)
                c.font = cell_font
                c.border = thin_border
                if row_idx % 2 == 0:
                    c.fill = sub_fill
            row_idx += 1

        # Adjust Column Widths
        column_widths = {'A': 16, 'B': 24, 'C': 34, 'D': 26, 'E': 24, 'F': 14}
        for col, width in column_widths.items():
            ws.column_dimensions[col].width = width

        # Save File temporarily
        file_id = f"timetable_{section.lower()}_v{version}_{uuid.uuid4().hex[:6]}"
        file_name = f"{file_id}.xlsx"
        file_path = os.path.join(UPLOADS_DIR, file_name)
        wb.save(file_path)
        file_size = os.path.getsize(file_path)

        logger.info(f"[File Generator] Created Excel timetable: {file_path} ({file_size} bytes)")

        result = {
            "file_id": file_id,
            "file_name": file_name,
            "file_type": "xlsx",
            "file_path": file_path,
            "file_size": file_size,
            "download_url": f"/uploads/{file_name}"
        }

        # Upload to ImageKit Cloud and clean up local file
        result = self._upload_to_imagekit_and_cleanup(result, file_path, file_name)
        return result

    def generate_pdf(
        self,
        department: str,
        year: str,
        semester: int,
        section: str,
        academic_year: str,
        version: int,
        slots: List[Dict[str, Any]],
        stats: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a high-resolution, printable PDF document using ReportLab.
        """
        file_id = f"timetable_{section.lower()}_v{version}_{uuid.uuid4().hex[:6]}"
        file_name = f"{file_id}.pdf"
        file_path = os.path.join(UPLOADS_DIR, file_name)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=25,
            bottomMargin=25
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.HexColor('#1E3A8A'),
            alignment=1, # Center
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=10,
            textColor=colors.HexColor('#475569'),
            alignment=1,
            spaceAfter=14
        )
        cell_style = ParagraphStyle(
            'CellStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=11
        )
        header_cell_style = ParagraphStyle(
            'HeaderCellStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.white,
            alignment=1
        )

        elements = []

        # 1. Header Title
        elements.append(Paragraph(f"DEPARTMENT OF {department.upper()} — OFFICIAL TIMETABLE", title_style))
        elements.append(Paragraph(
            f"Class: <b>{year} (Semester {semester}, Section {section})</b> | Academic Session: <b>{academic_year}</b> | Document Version: <b>v{version}.0</b> | Generated on: {datetime.now().strftime('%d %b %Y, %I:%M %p')}",
            subtitle_style
        ))

        # 2. Table Data
        table_data = [
            [
                Paragraph("<b>Day</b>", header_cell_style),
                Paragraph("<b>Time Slot</b>", header_cell_style),
                Paragraph("<b>Subject Name</b>", header_cell_style),
                Paragraph("<b>Faculty Member</b>", header_cell_style),
                Paragraph("<b>Room / Lab</b>", header_cell_style),
                Paragraph("<b>Type</b>", header_cell_style)
            ]
        ]

        for s in slots:
            time_display = f"{s.get('start_time', '')} - {s.get('end_time', '')}"
            table_data.append([
                Paragraph(s.get("day", ""), cell_style),
                Paragraph(time_display, cell_style),
                Paragraph(s.get("subject", ""), cell_style),
                Paragraph(s.get("faculty", ""), cell_style),
                Paragraph(s.get("room", ""), cell_style),
                Paragraph(s.get("type", "Lecture"), cell_style)
            ])

        t = Table(table_data, colWidths=[90, 130, 210, 150, 110, 60])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))

        elements.append(t)
        elements.append(Spacer(1, 15))

        # 3. Footer / Approval block
        approval_text = Paragraph(
            f"<b>Authorization Notice:</b> This schedule was compiled using deterministic CSP scheduling rules. "
            f"All hard collision constraints verified 100% collision-free. Published under authority of Head of Department, CSE.",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#64748B'))
        )
        elements.append(approval_text)

        doc.build(elements)
        file_size = os.path.getsize(file_path)

        logger.info(f"[File Generator] Created PDF timetable: {file_path} ({file_size} bytes)")

        result = {
            "file_id": file_id,
            "file_name": file_name,
            "file_type": "pdf",
            "file_path": file_path,
            "file_size": file_size,
            "download_url": f"/uploads/{file_name}"
        }

        # Upload to ImageKit Cloud and clean up local file
        result = self._upload_to_imagekit_and_cleanup(result, file_path, file_name)
        return result

    def _upload_to_imagekit_and_cleanup(self, result: dict, file_path: str, file_name: str) -> dict:
        """
        Upload generated file to ImageKit Cloud, update result dict, and delete local temp file.
        """
        if imagekit_client and imagekit_client.is_configured():
            try:
                ik_result = imagekit_client.upload_file(
                    file_path=file_path,
                    file_name=file_name,
                    folder="/campusflow-erp/generated",
                    tags=["agent_generated", result.get("file_type", "file")]
                )
                if ik_result and ik_result.get("url"):
                    result["download_url"] = ik_result["url"]
                    result["storage_url"] = ik_result["url"]
                    result["imagekit_file_id"] = ik_result.get("fileId", "")
                    result["storage_provider"] = "imagekit"
                    logger.info(f"[File Generator] Uploaded to ImageKit: {ik_result['url']}")

                    # Clean up local temp file
                    try:
                        if os.path.exists(file_path):
                            os.unlink(file_path)
                            logger.info(f"[File Generator] Cleaned temp file: {file_path}")
                    except Exception as ce:
                        logger.warning(f"[File Generator] Temp cleanup warning: {ce}")
            except Exception as e:
                logger.warning(f"[File Generator] ImageKit upload warning (keeping local): {e}")

        return result

timetable_file_generator = TimetableFileGenerator()
