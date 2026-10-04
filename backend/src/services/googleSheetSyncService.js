// ============================================================================
// Google Live Sheet Synchronization Service - CampusFlow CSE ERP
// Allows HOD to link a Google Live Spreadsheet and stream approvals live
// ============================================================================

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { logger } = require('./loggerService');

const OLD_CONFIG_PATH = path.join(__dirname, '../../uploads/google_sheet_sync.json');
const CONFIG_PATH = path.join(__dirname, '../../data/google_sheet_sync.json');

// In-memory cache with fallback to disk persistence
let syncConfig = {
  sheetUrl: '',
  webhookUrl: '',
  autoSyncEnabled: true,
  lastSyncedAt: null,
  totalSynced: 0,
  department: 'CSE'
};

// Auto-migrate from public uploads to secure data directory and load config (SEC-03)
try {
  const dataDir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // One-time migration from uploads to secure data directory
  if (fs.existsSync(OLD_CONFIG_PATH)) {
    logger.info(`[GoogleSheetSync] Migrating config from public uploads to secure data directory.`);
    const oldRaw = fs.readFileSync(OLD_CONFIG_PATH, 'utf8');
    fs.writeFileSync(CONFIG_PATH, oldRaw, 'utf8');
    try {
      fs.unlinkSync(OLD_CONFIG_PATH);
    } catch (unlinkErr) {
      logger.warn(`[GoogleSheetSync] Could not delete old config from uploads: ${unlinkErr.message}`);
    }
  }

  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    syncConfig = { ...syncConfig, ...JSON.parse(raw) };
  }
} catch (err) {
  logger.warn(`[GoogleSheetSync] Error loading/migrating config: ${err.message}`);
}

function persistConfig() {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(syncConfig, null, 2), 'utf8');
  } catch (err) {
    logger.error(`[GoogleSheetSync] Failed to persist config: ${err.message}`);
  }
}

class GoogleSheetSyncService {
  getConfig() {
    return { ...syncConfig };
  }

  saveConfig(newConfig = {}) {
    syncConfig = {
      ...syncConfig,
      sheetUrl: typeof newConfig.sheetUrl === 'string' ? newConfig.sheetUrl.trim() : syncConfig.sheetUrl,
      webhookUrl: typeof newConfig.webhookUrl === 'string' ? newConfig.webhookUrl.trim() : syncConfig.webhookUrl,
      autoSyncEnabled: typeof newConfig.autoSyncEnabled === 'boolean' ? newConfig.autoSyncEnabled : syncConfig.autoSyncEnabled,
      department: newConfig.department || syncConfig.department || 'CSE'
    };
    persistConfig();
    logger.info(`[GoogleSheetSync] Config updated. AutoSync: ${syncConfig.autoSyncEnabled}, SheetLinked: ${Boolean(syncConfig.sheetUrl)}`);
    return { ...syncConfig };
  }

  formatRecord(record, action = 'APPROVED') {
    const studentUser = record.student?.user || {};
    const studentName = record.studentName || record.applicantName || studentUser.name || 'Student';
    const rollNo = record.rollNo || record.enrollmentNo || record.student?.enrollmentNo || '—';
    
    let category = 'Academic Request';
    if (record.leaveType || record.type === 'leave_request') {
      category = `Student Leave (${record.leaveType || 'General'})`;
    } else if (record.type === 'attendance_consideration' || record.category === 'attendance_consideration') {
      category = 'Attendance Consideration (OD/Duty)';
    } else if (record.type === 'attendance_query' || record.queryNote) {
      category = `Attendance Dispute Query (${record.subjectName || record.subject || 'Session'})`;
    }

    const dates = record.dateRangeLabel 
      || record.dates 
      || record.date 
      || (record.startDate ? `${new Date(record.startDate).toLocaleDateString()} to ${new Date(record.endDate || record.startDate).toLocaleDateString()}` : '—');

    const reason = record.reason || record.title || record.queryNote || 'Particulars submitted by student';
    const remarks = record.hodRemarks || record.tgRemarks || record.comments || 'Sanctioned by HOD CSE via CampusFlow ERP';

    return {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      id: record.id || `REQ-${Date.now()}`,
      studentName,
      rollNo,
      category,
      dates,
      reason,
      status: action.toUpperCase(),
      approvedBy: 'Head of Department (HOD CSE)',
      remarks
    };
  }

  async syncRecord(record, action = 'APPROVED') {
    if (!syncConfig.webhookUrl || !syncConfig.autoSyncEnabled) {
      return { synced: false, reason: 'Webhook URL not configured or Auto-Sync disabled' };
    }

    const formatted = this.formatRecord(record, action);

    try {
      logger.info(`[GoogleSheetSync] Dispatching live record ${formatted.id} to Google Sheet Webhook`);
      const response = await axios.post(
        syncConfig.webhookUrl,
        {
          action: 'sync_record',
          record: formatted,
          records: [formatted],
          timestamp: new Date().toISOString()
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      syncConfig.lastSyncedAt = new Date().toISOString();
      syncConfig.totalSynced = (syncConfig.totalSynced || 0) + 1;
      persistConfig();

      logger.info(`[GoogleSheetSync] Record ${formatted.id} synced successfully to Google Sheet.`);
      return { synced: true, response: response.data };
    } catch (err) {
      logger.warn(`[GoogleSheetSync] Live sync failed for record ${formatted.id}: ${err.message}`);
      return { synced: false, error: err.message };
    }
  }

  async syncBatch(records = [], customWebhookUrl = null) {
    const url = customWebhookUrl || syncConfig.webhookUrl;
    if (!url) {
      throw new Error('Google Sheet Webhook URL is not configured. Please link your Google Sheet Webhook first.');
    }

    const formattedBatch = records.map((r) => this.formatRecord(r, r.status || 'APPROVED'));

    try {
      logger.info(`[GoogleSheetSync] Syncing batch of ${formattedBatch.length} records to Google Sheet`);
      const response = await axios.post(
        url,
        {
          action: 'sync_batch',
          records: formattedBatch,
          count: formattedBatch.length,
          timestamp: new Date().toISOString()
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000
        }
      );

      syncConfig.lastSyncedAt = new Date().toISOString();
      syncConfig.totalSynced = (syncConfig.totalSynced || 0) + formattedBatch.length;
      persistConfig();

      return {
        success: true,
        count: formattedBatch.length,
        response: response.data
      };
    } catch (err) {
      logger.error(`[GoogleSheetSync] Batch sync failed: ${err.message}`);
      throw new Error(`Failed to sync to Google Sheet: ${err.message}`);
    }
  }

  async testConnection(testUrl = null) {
    const url = testUrl || syncConfig.webhookUrl;
    if (!url) {
      throw new Error('No Webhook URL provided to test.');
    }

    try {
      const response = await axios.post(
        url,
        {
          action: 'ping',
          test: true,
          timestamp: new Date().toISOString()
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000
        }
      );
      return {
        connected: true,
        message: 'Successfully reached Google Sheet Apps Script Webhook!',
        data: response.data
      };
    } catch (err) {
      throw new Error(`Connection test failed: ${err.message}`);
    }
  }
}

module.exports = new GoogleSheetSyncService();
