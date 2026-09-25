import React from 'react';
import { useERP } from '../../context/ERPContext';
import ApplyLeaveModal from './ApplyLeaveModal';
import CreateAssignmentModal from './CreateAssignmentModal';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import SendNoticeModal from './SendNoticeModal';
import AddSectionModal from './AddSectionModal';
import ScheduleLectureModal from './ScheduleLectureModal';
import CreateTestModal from './CreateTestModal';
import StudentFeedbackModal from './StudentFeedbackModal';
import StudentDetailModal from './StudentDetailModal';
import RequestConsiderationModal from './RequestConsiderationModal';

export default function GlobalModals() {
  const { modalState, closeModal } = useERP();

  if (!modalState || !modalState.name) return null;

  switch (modalState.name) {
    case 'applyLeave':
      return <ApplyLeaveModal data={modalState.data} onClose={closeModal} />;
    case 'requestConsideration':
      return <RequestConsiderationModal data={modalState.data} onClose={closeModal} />;
    case 'createAssignment':
      return <CreateAssignmentModal data={modalState.data} onClose={closeModal} />;
    case 'submitAssignment':
      return <SubmitAssignmentModal data={modalState.data} onClose={closeModal} />;
    case 'sendNotice':
      return <SendNoticeModal data={modalState.data} onClose={closeModal} />;
    case 'addSection':
      return <AddSectionModal data={modalState.data} onClose={closeModal} />;
    case 'scheduleLecture':
      return <ScheduleLectureModal data={modalState.data} onClose={closeModal} />;
    case 'createTest':
      return <CreateTestModal data={modalState.data} onClose={closeModal} />;
    case 'studentFeedback':
      return <StudentFeedbackModal data={modalState.data} onClose={closeModal} />;
    case 'studentDetail':
      return <StudentDetailModal data={modalState.data} onClose={closeModal} />;
    default:
      return null;
  }
}
