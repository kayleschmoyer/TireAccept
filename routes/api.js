const express = require('express');
const dbService = require('../services/database');

const router = express.Router();

// Get app configuration
router.get('/config', (req, res) => {
  res.json({ mode: process.env.APP_MODE || 'office' });
});

// Get shops (office mode only)
router.get('/shops', async (req, res) => {
  try {
    const shops = await dbService.getShops();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get PO numbers
router.get('/po-numbers', async (req, res) => {
  try {
    const { company } = req.query;
    const poNumbers = await dbService.getPONumbers(company);
    res.json(poNumbers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get PO details
router.get('/po-details', async (req, res) => {
  try {
    const { company, number } = req.query;
    if (!company || !number) {
      return res.status(400).json({ error: 'Company and number required' });
    }
    const details = await dbService.getPODetails(company, number);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan barcode and update quantity
router.post('/scan', async (req, res) => {
  try {
    const { company, number, barcode } = req.body;
    if (!company || !number || !barcode) {
      return res.status(400).json({ error: 'Company, number, and barcode required' });
    }
    
    const updatedDetails = await dbService.updateQtyReceived(company, number, barcode);
    const scannedPart = updatedDetails.find(part => part.Part_Number === barcode);
    
    if (!scannedPart) {
      return res.status(404).json({ error: 'Part not found in PO' });
    }
    
    res.json({ 
      success: true, 
      part: scannedPart,
      allParts: updatedDetails 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;