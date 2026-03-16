/**
 * @module offlineSync.worker
 * @description Worker for offline data synchronization.
 * Syncs attendance records collected offline when app reconnects.
 */
const { AppError } = require('../../utils/AppError.js');
const logger = require('../../utils/logger.js');

/**
 * Process offline sync job
 * @param {object} job - Bull job object containing records, empId, orgId
 */
const processOfflineSync = async (job) => {
  try {
    const { records, empId, orgId, syncId } = job.data;

    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError('VAL_001', 'Records array is required', 400);
    }

    if (!empId || !orgId) {
      throw new AppError('VAL_001', 'Missing required fields: empId, orgId', 400);
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Validate and process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Validate record structure
        if (!record.timestamp || !record.type) {
          results.errors.push({
            index: i,
            error: 'Missing timestamp or type',
          });
          results.failed++;
          continue;
        }

        // Validate timestamp is valid ISO date
        if (isNaN(new Date(record.timestamp).getTime())) {
          results.errors.push({
            index: i,
            error: 'Invalid timestamp format',
          });
          results.failed++;
          continue;
        }

        // TODO: Integrate with attendance service to create/update records
        // This would typically involve:
        // 1. Verify record type (checkin/checkout)
        // 2. Check for duplicate transactions (idempotency)
        // 3. Create attendance/session records
        // 4. Calculate attendance status
        // 5. Emit socket events for live updates

        results.successful++;
        job.progress((i + 1) / records.length * 100);
      } catch (recordErr) {
        results.errors.push({
          index: i,
          error: recordErr.message,
        });
        results.failed++;
      }
    }

    logger.info('Offline sync completed', {
      syncId,
      empId,
      orgId,
      jobId: job.id,
      results,
    });

    return results;
  } catch (error) {
    logger.error('Offline sync worker failed', {
      error: error.message,
      jobId: job.id,
      jobData: job.data,
    });
    throw error;
  }
};

/**
 * Handle job failure
 * @param {object} job - Failed job
 * @param {Error} error - Error that occurred
 */
const handleFailure = async (job, error) => {
  logger.error('Offline sync job failed after retries', {
    jobId: job.id,
    syncId: job.data.syncId,
    empId: job.data.empId,
    error: error.message,
    attemptsMade: job.attemptsMade,
  });
};

/**
 * Handle job completion
 * @param {object} job - Completed job
 */
const handleCompletion = async (job) => {
  logger.info('Offline sync job completed', {
    jobId: job.id,
    syncId: job.data.syncId,
    empId: job.data.empId,
  });
};

module.exports = {
  processOfflineSync,
  handleFailure,
  handleCompletion,
};
