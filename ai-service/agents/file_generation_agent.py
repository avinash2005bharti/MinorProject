from typing import Dict, Any, List, Optional
from loguru import logger
from tools.agent_tools import agent_tools
from tools.file_generator import timetable_file_generator

class FileGenerationAgent:
    """
    Agent 10: File Generation Agent.
    Specializes in:
    - Generating official Timetable PDF documents
    - Generating structured Timetable Excel (.xlsx) spreadsheets
    - Generating CSV attendance and academic data exports
    - Managing secure download URLs and file metadata
    """
    def __init__(self):
        self.tools = agent_tools
        self.files = timetable_file_generator

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "hod",
        context_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        logger.info(f"[FileGenerationAgent] Processing export request: '{prompt}'")

        prompt_lower = prompt.lower()
        is_excel = "excel" in prompt_lower or "xlsx" in prompt_lower or "sheet" in prompt_lower
        is_pdf = "pdf" in prompt_lower or not is_excel

        slots = self.tools.sql.get_timetable(year="3rd Year", semester=5, section="A")

        generated_files = []
        if is_excel or "both" in prompt_lower:
            excel_info = self.files.generate_excel("CSE", "3rd Year", 5, "A", "2026-27", 1, slots)
            generated_files.append({"type": "excel", **excel_info})

        if is_pdf or "both" in prompt_lower:
            pdf_info = self.files.generate_pdf("CSE", "3rd Year", 5, "A", "2026-27", 1, slots)
            generated_files.append({"type": "pdf", **pdf_info})

        file_links = "\n".join([f"- **{f['type'].upper()} File:** [{f.get('fileName', 'Download File')}]({f.get('downloadUrl', '#')})" for f in generated_files])

        answer = (
            "### 📁 File Generation Complete\n\n"
            f"Successfully compiled official academic documents for **CSE 3rd Year Sem 5 Section A**:\n\n"
            f"{file_links}\n\n"
            "The generated files are formatted with departmental headers, periods, classroom numbers, and faculty allocations."
        )

        return {
            "answer": answer,
            "detected_intent": "FILE_GENERATION",
            "agent_used": "FileGenerationAgent",
            "actions_taken": ["generate_formatted_files"],
            "proposed_actions": [],
            "approval_requirement": {"requires_approval": False},
            "generated_files": generated_files
        }

file_generation_agent = FileGenerationAgent()
