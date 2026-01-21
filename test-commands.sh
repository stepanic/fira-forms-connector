#!/bin/bash

# FIRA Forms Connector - Test Commands
# This script demonstrates all available CLI commands

echo "🧪 FIRA Forms Connector - Test Commands"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating .env from .env.example..."
    cp .env.example .env
    echo "   ✅ Created .env file"
    echo "   ⚠️  Please edit .env and add your FIRA_API_KEY"
    echo ""
fi

echo "Available commands:"
echo ""

echo "1️⃣  Validate sample payload (no API call)"
echo "   npm run test:webhook -- --sample --validate-only"
echo ""

echo "2️⃣  Send sample payload to FIRA (creates PONUDA)"
echo "   npm run test:sample"
echo ""

echo "3️⃣  Send custom payload from file"
echo "   npm run test:webhook -- --file examples/sample-payload.json"
echo ""

echo "4️⃣  Create RAČUN (Invoice) instead of PONUDA"
echo "   npm run test:webhook -- --sample --invoice-type RAČUN"
echo ""

echo "5️⃣  Create FISKALNI_RAČUN (Fiscal Invoice)"
echo "   npm run test:webhook -- --sample --invoice-type FISKALNI_RAČUN"
echo ""

echo "6️⃣  Validate custom payload without sending"
echo "   npm run test:webhook -- --file your-payload.json --validate-only"
echo ""

echo "7️⃣  Build TypeScript"
echo "   npm run build"
echo ""

echo "8️⃣  Lint code"
echo "   npm run lint"
echo ""

echo "9️⃣  Format code"
echo "   npm run format"
echo ""

echo "========================================"
echo ""
echo "🚀 Quick Test (validation only):"
echo ""

npm run test:webhook -- --sample --validate-only

echo ""
echo "✅ Test complete!"
echo ""
echo "Next steps:"
echo "1. Add your FIRA_API_KEY to .env file"
echo "2. Run: npm run test:sample"
echo "3. Check your FIRA dashboard for the created invoice"
echo ""
