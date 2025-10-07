const { sql, getPool } = require('../config/dbConfig');


async function isCustomerEnabled(customerId) {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("customerId", customerId)
      .query(`
        SELECT status
        FROM CustomerTable
        WHERE customer_id = @customerId
      `);

    if (result.recordset.length === 0) {
        throw new Error(`Customer with ID '${customerId}' not found.`);
    }

    const status = result.recordset[0].status;
    return status === 'Enabled';
  } catch (error) {
    console.error("Error checking customer status:", error);
    throw error; // or return false, depending on your error handling strategy
  }
}


async function isTenantEnabled(customerId, tenantId) {
  try {

    // Check if tenant exists and is enabled
    const pool = await getPool();
    const result = await pool
      .request()
      .input('tenantId', tenantId)
      .input('customerId', customerId)
      .query(`
        SELECT status
        FROM TenantTable
        WHERE tenant_id = @tenantId
          AND customer_id = @customerId
      `);

    if (result.recordset.length === 0) {
        throw new Error(`Tenant with ID '${tenantId}' not found.`);
    }

    const tenantStatus = result.recordset[0].status;
    return tenantStatus === 'Enabled';
  } catch (error) {
    console.error('Error checking tenant status:', error);
    throw error; // or false depending on error handling policy
  }
}


async function isUserEnabled(userId) {
  try {
    const pool = await getPool();

    // Find user info (including tenant_id)
    const userResult = await pool
      .request()
      .input('userId', userId)
      .query(`
        SELECT status
        FROM UserTable
        WHERE user_id = @userId
      `);

    if (userResult.recordset.length === 0) {
      // User not found
      throw new Error(`User with ID '${userId}' not found.`);
    }

    const user = userResult.recordset[0];

    if (user.status !== 'Enabled') {
      // User status not enabled
      throw new Error(`User with ID '${userId}' is not enabled.`);
    }

    return true;
  } catch (error) {
    console.error('Error checking user status:', error);
    throw error;
  }
}


module.exports = {
  isCustomerEnabled,
  isTenantEnabled,
  isUserEnabled
};


