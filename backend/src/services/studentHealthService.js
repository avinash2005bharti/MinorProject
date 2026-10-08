// ============================================================================
// Departmental ERP - Centralized Student Health & Risk Classification Service
// Canonical Business Logic for Tutor Guardian (TG) Student Health Assessment
// ============================================================================

/**
 * Health Classification Categories:
 * - GOOD: Attendance >= 75% and no critical academic warning or pending requests
 * - NEEDS_ATTENTION: Attendance 60-74.9% OR pending requests OR moderate academic flag
 * - AT_RISK: Attendance < 60% OR serious academic risk (CGPA < 6.5) OR multiple issues
 */

const THRESHOLDS = {
  ATTENDANCE_GOOD: 75.0,
  ATTENDANCE_WARNING: 60.0,
  CGPA_SAFE: 7.5,
  CGPA_RISK: 6.5
};

/**
 * Classifies an individual student's risk profile based on actual records
 * @param {Object} params
 * @param {number|null} params.attendanceRate - Attendance percentage (0-100)
 * @param {number|null} params.cgpa - CGPA (0.0 - 10.0)
 * @param {number} params.pendingLeavesCount - Active pending leave applications
 * @param {number} params.pendingConsiderationsCount - Active attendance consideration requests
 * @param {number} params.pendingQueriesCount - Active attendance correction queries
 * @returns {Object} { healthStatus, label, badgeVariant, issue, action, priority }
 */
function classifyStudentHealth({
  attendanceRate = null,
  cgpa = null,
  pendingLeavesCount = 0,
  pendingConsiderationsCount = 0,
  pendingQueriesCount = 0
}) {
  const hasPendingLeave = pendingLeavesCount > 0;
  const hasPendingConsideration = pendingConsiderationsCount > 0;
  const hasPendingQuery = pendingQueriesCount > 0;
  const hasPendingRequest = hasPendingLeave || hasPendingConsideration || hasPendingQuery;

  const rate = typeof attendanceRate === 'number' && Number.isFinite(attendanceRate)
    ? attendanceRate
    : null;

  const academicScore = typeof cgpa === 'number' && Number.isFinite(cgpa)
    ? cgpa
    : null;

  // 1. AT RISK conditions
  const isCriticalAttendance = rate !== null && rate < THRESHOLDS.ATTENDANCE_WARNING;
  const isAcademicRisk = academicScore !== null && academicScore < THRESHOLDS.CGPA_RISK;

  if (isCriticalAttendance || isAcademicRisk) {
    let issue = 'Low Attendance';
    if (isAcademicRisk && !isCriticalAttendance) {
      issue = 'Academic Performance';
    } else if (isCriticalAttendance && isAcademicRisk) {
      issue = 'Low Attendance & Academics';
    } else if (hasPendingLeave) {
      issue = 'Low Attendance (Pending Leave)';
    }

    return {
      healthStatus: 'AT_RISK',
      label: 'At Risk',
      badgeVariant: 'danger',
      issue,
      action: hasPendingRequest ? 'Review' : 'View',
      priority: 3
    };
  }

  // 2. NEEDS ATTENTION conditions
  const isAttendanceWarning = rate !== null && rate < THRESHOLDS.ATTENDANCE_GOOD;
  const isAcademicWarning = academicScore !== null && academicScore < THRESHOLDS.CGPA_SAFE;

  if (isAttendanceWarning || hasPendingRequest || isAcademicWarning) {
    let issue = 'Needs Attention';
    let action = 'View';

    if (hasPendingLeave) {
      issue = 'Pending Leave';
      action = 'Review';
    } else if (hasPendingConsideration) {
      issue = 'Attendance Consideration';
      action = 'Review';
    } else if (hasPendingQuery) {
      issue = 'Attendance Query';
      action = 'Review';
    } else if (isAttendanceWarning) {
      issue = rate <= 68 ? 'Low Attendance' : 'Irregular Attendance';
      action = 'View';
    } else if (isAcademicWarning) {
      issue = 'Low Internal Marks';
      action = 'View';
    }

    return {
      healthStatus: 'NEEDS_ATTENTION',
      label: 'Needs Attention',
      badgeVariant: 'warning',
      issue,
      action,
      priority: 2
    };
  }

  // 3. GOOD standing
  return {
    healthStatus: 'GOOD',
    label: 'Good Standing',
    badgeVariant: 'success',
    issue: 'None',
    action: 'View',
    priority: 1
  };
}

/**
 * Computes attendance distribution into standard College ERP bands
 * @param {Array<number|null>} rates - List of attendance rates
 */
function computeAttendanceDistribution(rates = []) {
  const distribution = {
    excellent: 0, // 90%+
    good: 0,      // 75 - 89.9%
    low: 0,       // 60 - 74.9%
    critical: 0   // < 60%
  };

  for (const r of rates) {
    if (r === null || r === undefined || !Number.isFinite(r)) continue;
    if (r >= 90) {
      distribution.excellent++;
    } else if (r >= 75) {
      distribution.good++;
    } else if (r >= 60) {
      distribution.low++;
    } else {
      distribution.critical++;
    }
  }

  return distribution;
}

/**
 * Computes overall health category breakdown (counts and percentages)
 * @param {Array<{ healthStatus: string }>} classifiedList
 */
function computeCohortHealthSummary(classifiedList = []) {
  const total = classifiedList.length;
  if (!total) {
    return {
      good: { count: 0, percentage: 0 },
      needsAttention: { count: 0, percentage: 0 },
      atRisk: { count: 0, percentage: 0 }
    };
  }

  let goodCount = 0;
  let needsAttentionCount = 0;
  let atRiskCount = 0;

  for (const item of classifiedList) {
    if (item.healthStatus === 'GOOD') goodCount++;
    else if (item.healthStatus === 'NEEDS_ATTENTION') needsAttentionCount++;
    else if (item.healthStatus === 'AT_RISK') atRiskCount++;
  }

  return {
    good: {
      count: goodCount,
      percentage: Math.round((goodCount / total) * 100)
    },
    needsAttention: {
      count: needsAttentionCount,
      percentage: Math.round((needsAttentionCount / total) * 100)
    },
    atRisk: {
      count: atRiskCount,
      percentage: Math.round((atRiskCount / total) * 100)
    }
  };
}

module.exports = {
  THRESHOLDS,
  classifyStudentHealth,
  computeAttendanceDistribution,
  computeCohortHealthSummary
};
