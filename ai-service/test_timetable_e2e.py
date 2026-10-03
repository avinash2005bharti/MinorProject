import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from agents.timetable_agent import timetable_agent

def main():
    print("--- TESTING SCENARIO 1: GENERATE TIMETABLE ---")
    res1 = timetable_agent.handle_request(
        prompt="Generate timetable for CSE 3A for semester 5",
        user_id="hod_1",
        conversation_id="test_conv_gen",
        role="hod"
    )
    print("Intent:", res1.get("detected_intent"))
    print("Files generated:", [f["file_name"] for f in res1.get("generated_files", [])])
    print("Metrics:", res1.get("metrics"))
    print("Slots generated count:", len(res1.get("timetable_data", [])))
    print("Requires approval:", res1.get("approval_requirement"))

    print("\n--- TESTING SCENARIO 2: ABSENT TEACHER ADJUSTMENT ---")
    res2 = timetable_agent.handle_request(
        prompt="Professor Sharma is absent today. Adjust all his classes.",
        user_id="hod_1",
        conversation_id="test_conv_absence",
        role="hod"
    )
    print("Intent:", res2.get("detected_intent"))
    print("Affected count:", len(res2.get("affected_classes", [])))
    for p in res2.get("affected_classes", []):
        print(f"  Class: {p['class_info']} | {p['subject']} ({p['time']}) -> Substitute: {p['proposed_substitute']} ({p['status']})")
    print("Requires approval:", res2.get("approval_requirement"))

    print("\n--- TESTING APPROVAL OF SUBSTITUTIONS ---")
    res3 = timetable_agent.handle_request(
        prompt="Approve",
        user_id="hod_1",
        conversation_id="test_conv_absence",
        role="hod"
    )
    print("Approval Response intent:", res3.get("detected_intent"))
    print("Answer snippet:\n", res3.get("answer", "")[:250].encode('ascii', 'ignore').decode('ascii'))

if __name__ == "__main__":
    main()
