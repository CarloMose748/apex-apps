#!/bin/bash
# Hamburger Menu Integration Verification Script
# This script checks if all HTML pages have proper hamburger menu integration

echo "=== Hamburger Menu Integration Verification ==="
echo ""

# List of HTML pages to check
pages=(
    "main.html"
    "dashboard.html" 
    "jobs.html"
    "oil-collection.html"
    "profile.html"
    "map.html"
    "job-detail.html"
    "admin.html"
    "verification-pending.html"
)

echo "Checking hamburger menu integration for ${#pages[@]} pages..."
echo ""

total_issues=0

for page in "${pages[@]}"; do
    echo "Checking $page..."
    
    # Check if hamburger menu script is included
    if grep -q "js/hamburger-menu.js" "$page"; then
        echo "  ✅ Script included"
    else
        echo "  ❌ Script NOT included"
        ((total_issues++))
    fi
    
    # Check if hamburger menu div exists
    if grep -q '<div id="hamburger-menu"></div>' "$page"; then
        echo "  ✅ Menu container found"
    else
        echo "  ❌ Menu container NOT found"
        ((total_issues++))
    fi
    
    # Check if initialization script exists
    if grep -q "new HamburgerMenu()" "$page"; then
        echo "  ✅ Initialization script found"
    else
        echo "  ❌ Initialization script NOT found"
        ((total_issues++))
    fi
    
    echo ""
done

echo "=== Verification Summary ==="
if [ $total_issues -eq 0 ]; then
    echo "🎉 All pages properly integrated with hamburger menu!"
else
    echo "⚠️  Found $total_issues integration issues"
fi

echo ""
echo "=== Component Files Status ==="

# Check hamburger menu JavaScript file
if [ -f "js/hamburger-menu.js" ]; then
    echo "✅ js/hamburger-menu.js exists"
    lines=$(wc -l < "js/hamburger-menu.js")
    echo "   File size: $lines lines"
else
    echo "❌ js/hamburger-menu.js missing"
fi

# Check CSS styles
if grep -q ".hamburger-menu" "styles/global.css"; then
    echo "✅ Hamburger menu styles found in global.css"
else
    echo "❌ Hamburger menu styles NOT found in global.css"
fi

echo ""
echo "=== Test Recommendations ==="
echo "1. Open test-menu.html to verify component functionality"
echo "2. Test navigation between pages using the hamburger menu"
echo "3. Verify menu opens/closes correctly on mobile devices"
echo "4. Check browser console for any JavaScript errors"
echo "5. Test accessibility with screen readers and keyboard navigation"