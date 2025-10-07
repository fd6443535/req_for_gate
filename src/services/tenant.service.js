const { sql, getPool } = require('../config/dbConfig');


async function getTenantCustomerId(tenantId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('tenantId', sql.VarChar(50), tenantId)
      .query('SELECT customer_id FROM TenantTable WHERE tenant_id = @tenantId');
  
    if (result.recordset.length === 0) throw new Error(`Customer ID not found for tenant '${tenantId}'`);
  
    return result.recordset[0].customer_id;
  }


async function getUserDefaults(userId) {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT tenant_id, employee_id, company_id, language
        FROM UserTable
        WHERE user_id = @userId
      `);

    if (result.recordset.length === 0) {
      throw new Error(`User with ID '${userId}' not found.`);
    }

    const userDetails = result.recordset[0];

    return {
      tenant_id: userDetails.tenant_id,
      employee_id: userDetails.employee_id,
      company_id: userDetails.company_id,
      language: userDetails.language,
    };
  } catch (error) {
    console.error('Error retrieving user details:', error.message);
    throw error;
  }
}

module.exports = {
  getTenantCustomerId,
  getUserDefaults,
};