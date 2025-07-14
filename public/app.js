class TireAcceptApp {
    constructor() {
        this.config = null;
        this.currentShop = null;
        this.currentPO = null;
        this.poDetails = [];
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.showInitialScreen();
    }

    async loadConfig() {
        const response = await fetch('/api/config');
        this.config = await response.json();
        document.getElementById('modeIndicator').textContent = this.config.mode;
    }

    setupEventListeners() {
        document.getElementById('shopNextBtn').onclick = () => this.selectShop();
        document.getElementById('poNextBtn').onclick = () => this.selectPO();
        document.getElementById('scanBtn').onclick = () => this.scanBarcode();
        document.getElementById('backBtn').onclick = () => this.goBack();
        document.getElementById('doneBtn').onclick = () => this.finish();
        
        document.getElementById('shopSelect').onchange = (e) => {
            document.getElementById('shopNextBtn').disabled = !e.target.value;
        };
        
        document.getElementById('poSelect').onchange = (e) => {
            document.getElementById('poNextBtn').disabled = !e.target.value;
        };

        document.getElementById('barcodeInput').onkeypress = (e) => {
            if (e.key === 'Enter') this.scanBarcode();
        };
    }

    async showInitialScreen() {
        if (this.config.mode === 'office') {
            await this.loadShops();
            this.showScreen('shopScreen');
        } else {
            await this.loadPONumbers();
            this.showScreen('poScreen');
        }
    }

    async loadShops() {
        try {
            const response = await fetch('/api/shops');
            const shops = await response.json();
            const select = document.getElementById('shopSelect');
            select.innerHTML = '<option value="">Select a shop...</option>';
            shops.forEach(shop => {
                select.innerHTML += `<option value="${shop.COMPANY}">${shop.COMPANY}</option>`;
            });
        } catch (err) {
            this.showToast('Failed to load shops', 'error');
        }
    }

    async loadPONumbers(company = null) {
        try {
            const url = company ? `/api/po-numbers?company=${encodeURIComponent(company)}` : '/api/po-numbers';
            const response = await fetch(url);
            const poNumbers = await response.json();
            const select = document.getElementById('poSelect');
            select.innerHTML = '<option value="">Select a PO number...</option>';
            poNumbers.forEach(po => {
                select.innerHTML += `<option value="${po.NUMBER}">${po.NUMBER}</option>`;
            });
        } catch (err) {
            this.showToast('Failed to load PO numbers', 'error');
        }
    }

    async selectShop() {
        this.currentShop = document.getElementById('shopSelect').value;
        await this.loadPONumbers(this.currentShop);
        this.showScreen('poScreen');
    }

    async selectPO() {
        this.currentPO = document.getElementById('poSelect').value;
        if (this.config.mode === 'shop') {
            this.currentShop = 'DEFAULT'; // Shop mode uses first available company
        }
        await this.loadPODetails();
        this.showScreen('scanScreen');
    }

    async loadPODetails() {
        try {
            const response = await fetch(`/api/po-details?company=${encodeURIComponent(this.currentShop)}&number=${encodeURIComponent(this.currentPO)}`);
            this.poDetails = await response.json();
            
            if (this.config.mode === 'shop' && this.poDetails.length > 0) {
                this.currentShop = this.poDetails[0].COMPANY;
            }
            
            document.getElementById('currentPO').textContent = this.currentPO;
            this.updatePartsDisplay();
            this.updateProgress();
        } catch (err) {
            this.showToast('Failed to load PO details', 'error');
        }
    }

    updatePartsDisplay() {
        const container = document.getElementById('partsList');
        container.innerHTML = '';
        
        this.poDetails.forEach(part => {
            const isCompleted = part.Qty_Received >= part.Qty_Ordered;
            const isOverReceived = part.Qty_Received > part.Qty_Ordered;
            
            const div = document.createElement('div');
            div.className = `part-item ${isCompleted ? 'completed' : ''} ${isOverReceived ? 'over-received' : ''}`;
            div.innerHTML = `
                <div class="part-info">
                    <div class="part-number">${part.Part_Number}</div>
                    <div class="part-vendor">Vendor: ${part.VENDOR_NUMBER}</div>
                </div>
                <div class="part-qty ${isCompleted ? 'completed' : ''} ${isOverReceived ? 'over-received' : ''}">
                    ${part.Qty_Received} / ${part.Qty_Ordered}
                </div>
            `;
            container.appendChild(div);
        });
    }

    updateProgress() {
        const totalOrdered = this.poDetails.reduce((sum, part) => sum + part.Qty_Ordered, 0);
        const totalReceived = this.poDetails.reduce((sum, part) => sum + part.Qty_Received, 0);
        const percentage = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
        
        document.getElementById('progressText').textContent = `${totalReceived} / ${totalOrdered} received`;
        document.getElementById('progressFill').style.width = `${Math.min(percentage, 100)}%`;
        
        const allCompleted = this.poDetails.every(part => part.Qty_Received >= part.Qty_Ordered);
        document.getElementById('doneBtn').style.display = allCompleted ? 'block' : 'none';
    }

    async scanBarcode() {
        const barcode = document.getElementById('barcodeInput').value.trim();
        if (!barcode) return;

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: this.currentShop,
                    number: this.currentPO,
                    barcode: barcode
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                this.poDetails = result.allParts;
                this.updatePartsDisplay();
                this.updateProgress();
                
                if (result.part.Qty_Received > result.part.Qty_Ordered) {
                    this.showToast(`Warning: ${barcode} over-received!`, 'error');
                } else {
                    this.showToast(`Scanned: ${barcode}`, 'success');
                }
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (err) {
            this.showToast('Scan failed', 'error');
        }

        document.getElementById('barcodeInput').value = '';
        document.getElementById('barcodeInput').focus();
    }

    goBack() {
        if (this.config.mode === 'office') {
            this.showScreen('poScreen');
        } else {
            this.showScreen('poScreen');
        }
    }

    finish() {
        this.showToast('PO completed successfully!', 'success');
        setTimeout(() => {
            if (this.config.mode === 'office') {
                this.showScreen('shopScreen');
            } else {
                this.showScreen('poScreen');
            }
        }, 2000);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'block';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TireAcceptApp();
});