const sql = require('mssql');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.config = this.getConfig();
  }

  getConfig() {
    const isOffice = process.env.APP_MODE !== 'shop';
    return {
      server: process.env.SQL_SERVER || 'localhost\\SQLEXPRESS',
      database: isOffice ? 'VastOffice' : 'VastPOS',
      user: process.env.SQL_USER || 'VastOffice',
      password: process.env.SQL_PASSWORD || 'snowdrift',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }

  async initialize() {
    try {
      this.pool = await sql.connect(this.config);
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }

  async getShops() {
    const request = this.pool.request();
    const result = await request.query('SELECT DISTINCT COMPANY FROM POLine ORDER BY COMPANY');
    return result.recordset;
  }

  async getPONumbers(company = null) {
    const request = this.pool.request();
    let query = 'SELECT DISTINCT NUMBER FROM POLine';
    if (company) {
      query += ' WHERE COMPANY = @company';
      request.input('company', sql.VarChar, company);
    }
    query += ' ORDER BY NUMBER';
    const result = await request.query(query);
    return result.recordset;
  }

  async getPODetails(company, number) {
    const request = this.pool.request();
    request.input('company', sql.VarChar, company);
    request.input('number', sql.VarChar, number);
    
    const result = await request.query(`
      SELECT COMPANY, NUMBER, VENDOR_NUMBER, Part_Number, Qty_Ordered, Qty_Received
      FROM POLine 
      WHERE COMPANY = @company AND NUMBER = @number
      ORDER BY Part_Number
    `);
    return result.recordset;
  }

  async updateQtyReceived(company, number, partNumber) {
    const request = this.pool.request();
    request.input('company', sql.VarChar, company);
    request.input('number', sql.VarChar, number);
    request.input('partNumber', sql.VarChar, partNumber);
    
    await request.query(`
      UPDATE POLine 
      SET Qty_Received = Qty_Received + 1 
      WHERE COMPANY = @company AND NUMBER = @number AND Part_Number = @partNumber
    `);
    
    return this.getPODetails(company, number);
  }
}

module.exports = new DatabaseService();