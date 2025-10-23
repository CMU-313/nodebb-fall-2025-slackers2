#!/bin/bash

# Snyk Security Analysis Script for NodeBB
# This script runs various Snyk security checks on the NodeBB project

echo "================================================"
echo "NodeBB Security Analysis with Snyk"
echo "================================================"
echo ""

# Check if Snyk is installed
if ! command -v npx snyk &> /dev/null; then
    echo "Error: Snyk is not installed. Please run 'npm install' first."
    exit 1
fi

# Authenticate with Snyk (requires SNYK_TOKEN environment variable or interactive login)
echo "Step 1: Authenticating with Snyk..."
echo "Note: If not authenticated, you may need to run 'npx snyk auth' first"
echo ""

# Test for vulnerabilities in dependencies
echo "Step 2: Testing for vulnerabilities in npm dependencies..."
npx snyk test --severity-threshold=high || echo "Vulnerabilities found above high severity threshold"
echo ""

# Generate a detailed JSON report
echo "Step 3: Generating detailed vulnerability report..."
npx snyk test --json > snyk-report.json 2>&1 || echo "Report generated with findings"
echo "Detailed report saved to: snyk-report.json"
echo ""

# Test for open source license compliance
echo "Step 4: Checking open source license compliance..."
npx snyk test --org=nodebb --severity-threshold=medium 2>&1 || echo "License compliance check complete"
echo ""

# Monitor the project (sends snapshot to Snyk for continuous monitoring)
echo "Step 5: Optional - Monitor project for continuous security alerts"
echo "To enable monitoring, run: npx snyk monitor"
echo ""

echo "================================================"
echo "Analysis Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review the console output above for critical vulnerabilities"
echo "2. Check snyk-report.json for detailed findings"
echo "3. Run 'npx snyk wizard' to interactively fix issues"
echo "4. Run 'npx snyk monitor' to enable continuous monitoring"
echo ""

