# TireAccept

Modern, mobile-first tire acceptance app for VAST SQL Server databases.

## Features

- **Mobile-First Design**: Optimized for phones and tablets
- **Dual Mode Support**: Office (shop selection) and Shop (direct PO access)
- **Real-Time Updates**: Live quantity tracking with database sync
- **Barcode Scanning**: Camera or hardware scanner support
- **Progress Tracking**: Visual progress bars and completion status
- **Production Ready**: Secure, modular, and scalable architecture

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set `APP_MODE=office` or `APP_MODE=shop`

3. **Start Application**
   ```bash
   npm start
   ```
   Access at `http://localhost:3000`

## Database Configuration

- **Office Mode**: Connects to `.\VastOffice` database
- **Shop Mode**: Connects to `.\VastPOS` database
- **Credentials**: User `VastOffice`, Password `snowdrift`

## Usage

### Office Mode
1. Select shop from dropdown
2. Choose PO number
3. Scan tire barcodes to update quantities

### Shop Mode
1. Choose PO number directly
2. Scan tire barcodes to update quantities

## API Endpoints

- `GET /api/config` - App configuration
- `GET /api/shops` - Available shops (office mode)
- `GET /api/po-numbers` - PO numbers for selected shop
- `GET /api/po-details` - PO line items
- `POST /api/scan` - Process barcode scan

## Deployment

```bash
# Production start
NODE_ENV=production npm start
```

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit: TireAccept mobile app"
git branch -M main
git remote add origin https://github.com/yourusername/TireAccept.git
git push -u origin main
```