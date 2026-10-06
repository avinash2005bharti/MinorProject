from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
from tools.postgres_tools import postgres_tools

class TeacherAbsenceAdjuster:
    """
    Deterministic Dynamic Teacher Absence & Substitution Engine.
    Evaluates:
    - Affected slots for absent teacher
    - All faculty availability and free slots for that exact day and time
    - Subject expertise and specialization matches
    - Workload balancing (daily and weekly)
    - Generates ranked substitution proposals requiring HOD authorization.
    """
    def __init__(self):
        self.sql = postgres_tools

    def analyze_and_propose(
        self,
        teacher_query: str,
        department: str,
        date_str: Optional[str] = None,
        day_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates affected classes and ranks feasible substitutes deterministically.
        """
        # 1. Identify teacher from PostgreSQL
        matched_faculty = self.sql.get_faculty_by_name(teacher_query, department=department)
        if not matched_faculty:
            # Fallback scan all faculty
            all_fac = self.sql.get_all_faculty(department=department)
            clean_q = teacher_query.lower()
            for f in all_fac:
                if clean_q in f["name"].lower() or any(p in clean_q for p in f["name"].lower().split()):
                    matched_faculty = [f]
                    break

        if not matched_faculty:
            return {
                "success": False,
                "error": f"Faculty member matching '{teacher_query}' not found in {department} department records."
            }

        absent_teacher = matched_faculty[0]
        absent_id = absent_teacher["id"]
        absent_name = absent_teacher["name"]

        # 2. Determine target day & date
        now = datetime.now()
        target_date = date_str or now.strftime("%Y-%m-%d")
        target_day = day_name or now.strftime("%A")
        # If weekend, default to Monday
        if target_day in ["Saturday", "Sunday"]:
            target_day = "Monday"

        logger.info(f"[Absence Adjuster] Analyzing absence for {absent_name} on {target_day} ({target_date})")

        # 3. Retrieve affected classes from PostgreSQL timetable
        affected_slots = self.sql.get_affected_classes_for_absence(
            absent_name,
            target_day,
            department=department
        )
        if not affected_slots:
            # Try searching by day only for this teacher
            schedule = self.sql.get_teacher_schedule(absent_name, day=target_day, department=department)
            affected_slots = schedule

        if not affected_slots:
            return {
                "success": True,
                "absent_teacher": absent_name,
                "teacher_id": absent_id,
                "day": target_day,
                "date": target_date,
                "affected_count": 0,
                "affected_classes": [],
                "proposals": [],
                "message": f"{absent_name} has no scheduled lectures or labs on {target_day}."
            }

        # 4. Retrieve candidate teachers in the department
        all_teachers = self.sql.get_all_faculty(department=department)
        candidates = [t for t in all_teachers if t["id"] != absent_id and t.get("availability_status") != "On Leave"]

        # 5. Evaluate Substitutes for each affected class
        proposals = []

        for slot in affected_slots:
            slot_id = slot.get("id", 1)
            slot_time = slot.get("start_time", "")
            slot_end = slot.get("end_time", "")
            subject = slot.get("subject", "")
            room = slot.get("room", "")
            section = slot.get("section", "A")
            year = slot.get("year", "3rd Year")
            sem = slot.get("semester", 5)

            # Find feasible candidates for this time slot
            ranked_substitutes = []

            for teacher in candidates:
                t_name = teacher["name"]
                t_id = teacher["id"]

                # Hard Filter 1: Check if teacher is already teaching in this slot
                t_schedule_today = self.sql.get_teacher_schedule(
                    t_name,
                    day=target_day,
                    department=department
                )
                is_busy = any(s.get("start_time") == slot_time for s in t_schedule_today)
                if is_busy:
                    continue # Hard conflict: cannot be in two places at once!

                # Hard Filter 2: Daily workload limit (max 4 periods)
                daily_classes = len(t_schedule_today)
                max_daily = teacher.get("max_periods_per_day", 4)
                if daily_classes >= max_daily:
                    continue # Exceeds max daily load

                # Scoring Criteria (Deterministic Ranking)
                score = 100.0

                # A. Subject Expertise Match
                spec = teacher.get("specialization", "").lower()
                sub_lower = subject.lower()
                expertise_match = False

                if ("database" in sub_lower or "dbms" in sub_lower) and ("database" in spec or "big data" in spec or "data" in spec):
                    score += 50
                    expertise_match = True
                elif ("operating" in sub_lower or "os" in sub_lower) and ("operating" in spec or "systems" in spec or "architecture" in spec):
                    score += 50
                    expertise_match = True
                elif ("network" in sub_lower) and ("network" in spec or "cyber" in spec or "cloud" in spec):
                    score += 50
                    expertise_match = True
                elif ("computation" in sub_lower or "toc" in sub_lower or "ai" in sub_lower) and ("ai" in spec or "theory" in spec or "machine" in spec):
                    score += 50
                    expertise_match = True
                elif "hod" in teacher.get("designation", "").lower():
                    score += 25 # Senior faculty can cover theory
                    expertise_match = True

                # B. Current Daily Workload (Prefer teacher with fewer classes today)
                score -= (daily_classes * 10)

                # C. Designation / Role Preference
                if "Assistant Professor" in teacher.get("designation", ""):
                    score += 5 # Good for lab / tutorial substitution

                ranked_substitutes.append({
                    "teacher_id": t_id,
                    "teacher_name": t_name,
                    "designation": teacher.get("designation", ""),
                    "specialization": teacher.get("specialization", ""),
                    "classes_today": daily_classes,
                    "score": round(score, 1),
                    "expertise_match": expertise_match
                })

            # Sort by highest deterministic score
            ranked_substitutes.sort(key=lambda s: s["score"], reverse=True)

            if ranked_substitutes:
                top_sub = ranked_substitutes[0]
                reason = (
                    f"Free at {slot_time}; {top_sub['designation']} ({top_sub['specialization']}); "
                    f"currently teaching {top_sub['classes_today']} classes today."
                )
                proposals.append({
                    "timetable_entry_id": slot_id,
                    "class_info": f"{year} Sem {sem} Sec {section}",
                    "subject": subject,
                    "room": room,
                    "time": f"{slot_time} - {slot_end}",
                    "start_time": slot_time,
                    "end_time": slot_end,
                    "day": target_day,
                    "status": "Feasible",
                    "proposed_substitute": top_sub["teacher_name"],
                    "substitute_id": top_sub["teacher_id"],
                    "reason": reason,
                    "alternative_candidates": [s["teacher_name"] for s in ranked_substitutes[1:3]]
                })
            else:
                proposals.append({
                    "timetable_entry_id": slot_id,
                    "class_info": f"{year} Sem {sem} Sec {section}",
                    "subject": subject,
                    "room": room,
                    "time": f"{slot_time} - {slot_end}",
                    "start_time": slot_time,
                    "end_time": slot_end,
                    "day": target_day,
                    "status": "No Substitute Found",
                    "proposed_substitute": None,
                    "substitute_id": None,
                    "reason": "All qualified departmental teachers are scheduled or have reached maximum daily workload limits.",
                    "alternative_candidates": []
                })

        return {
            "success": True,
            "absent_teacher": absent_name,
            "teacher_id": absent_id,
            "day": target_day,
            "date": target_date,
            "affected_count": len(affected_slots),
            "proposals": proposals,
            "requires_approval": True,
            "summary": f"{len(affected_slots)} affected classes found for {absent_name} on {target_day}. Generated conflict-free substitution proposal requiring HOD approval."
        }

    def execute_approved_substitutions(
        self,
        absence_data: Dict[str, Any],
        approved_by: str,
        department: str
    ) -> Dict[str, Any]:
        """
        Transactionally applies approved substitutions to PostgreSQL database,
        creating substitution records, updating timetable entries, and recording audit logs.
        """
        absent_id = absence_data.get("teacher_id")
        absent_name = absence_data.get("absent_teacher")
        date_str = absence_data.get("date")
        proposals = absence_data.get("proposals")
        if not absent_id or not absent_name or not date_str or not isinstance(proposals, list) or not proposals:
            return {"success": False, "error": "The substitution proposal is incomplete or contains no approved changes."}
        for proposal in proposals:
            slot_id = proposal.get("timetable_entry_id")
            substitute_id = proposal.get("substitute_id")
            if (
                not slot_id
                or not substitute_id
                or not proposal.get("proposed_substitute")
                or not proposal.get("day")
                or not proposal.get("start_time")
                or not proposal.get("end_time")
                or not proposal.get("subject")
                or not self.sql.substitution_is_in_department(
                    timetable_slot_id=str(slot_id),
                    original_teacher_id=str(absent_id),
                    original_teacher_name=str(absent_name),
                    substitute_teacher_id=str(substitute_id),
                    substitute_teacher_name=str(proposal.get("proposed_substitute") or ""),
                    department=department
                )
            ):
                return {
                    "success": False,
                    "error": "A proposed substitution does not match the authenticated department, original teacher, and scheduled slot."
                }

        # 1. Record absence in PostgreSQL
        absence_id = self.sql.create_absence_record(
            faculty_id=absent_id,
            faculty_name=absent_name,
            date_str=date_str,
            reason="Approved HOD Absence Adjustment"
        )
        if not absence_id:
            return {"success": False, "error": "The absence record could not be saved; no substitutions were applied."}

        applied_count = 0
        details = []

        for p in proposals:
            if not p.get("proposed_substitute") or not p.get("substitute_id"):
                continue

            # 2. Record substitution in PostgreSQL
            sub_id = self.sql.create_substitution_record(
                absence_id=absence_id,
                timetable_entry_id=p["timetable_entry_id"],
                original_faculty_id=absent_id,
                original_faculty_name=absent_name,
                substitute_faculty_id=p["substitute_id"],
                substitute_faculty_name=p["proposed_substitute"],
                date_str=date_str,
                day_str=p["day"],
                start_time=p["start_time"],
                end_time=p["end_time"],
                subject=p["subject"],
                room=p["room"],
                status="Approved",
                reason=p.get("reason", "Approved HOD Substitution")
            )

            # 3. Apply change transactionally to timetable
            success = self.sql.apply_substitution_transactional(sub_id, approved_by=approved_by)
            if success:
                applied_count += 1
                details.append({
                    "subject": p["subject"],
                    "class": p["class_info"],
                    "time": p["time"],
                    "original": absent_name,
                    "substitute": p["proposed_substitute"]
                })

        logger.info(f"[Absence Adjuster] Transactionally applied {applied_count} substitutions for {absent_name}.")

        return {
            "success": applied_count == len(proposals),
            "absence_id": absence_id,
            "applied_count": applied_count,
            "approved_by": approved_by,
            "modifications": details,
            "message": (
                f"Successfully updated timetable records. {applied_count} classes reassigned from {absent_name}."
                if applied_count == len(proposals)
                else f"Only {applied_count} of {len(proposals)} substitutions were applied."
            )
        }

absence_adjuster = TeacherAbsenceAdjuster()
