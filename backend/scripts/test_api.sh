#!/bin/bash
# Test script to verify the Life OS API is working correctly

set -e

BASE_URL="http://localhost:8000"
COOKIE_FILE="/tmp/lifeos_test_cookies.txt"

echo "================================"
echo "Life OS API Test Suite"
echo "================================"
echo ""

# Clean up old cookies
rm -f $COOKIE_FILE

# Test 1: Health check
echo "Test 1: Health Check"
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "Response: $HEALTH"
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✓ PASSED"
else
    echo "✗ FAILED"
    exit 1
fi
echo ""

# Test 2: Root endpoint
echo "Test 2: Root Endpoint"
ROOT=$(curl -s "$BASE_URL/")
echo "Response: $ROOT"
if echo "$ROOT" | grep -q '"message":"Life OS API"'; then
    echo "✓ PASSED"
else
    echo "✗ FAILED"
    exit 1
fi
echo ""

# Test 3: Login
echo "Test 3: Login"
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"testpass123"}' \
    -c $COOKIE_FILE)
echo "Response: $LOGIN"
if echo "$LOGIN" | grep -q '"username":"testuser"'; then
    echo "✓ PASSED"
else
    echo "✗ FAILED"
    exit 1
fi
echo ""

# Test 4: Check cookies were set
echo "Test 4: Verify Cookies"
if grep -q "access_token" $COOKIE_FILE && grep -q "refresh_token" $COOKIE_FILE; then
    echo "✓ PASSED - Both tokens set"
else
    echo "✗ FAILED - Cookies not set"
    exit 1
fi
echo ""

# Test 5: Logout
echo "Test 5: Logout"
LOGOUT=$(curl -s -X POST "$BASE_URL/api/auth/logout" -b $COOKIE_FILE)
echo "Response: $LOGOUT"
if echo "$LOGOUT" | grep -q '"message":"Logged out successfully"'; then
    echo "✓ PASSED"
else
    echo "✗ FAILED"
    exit 1
fi
echo ""

# Test 6: Invalid credentials
echo "Test 6: Login with Invalid Credentials"
INVALID=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"wrongpassword"}')
HTTP_CODE=$(echo "$INVALID" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    echo "✓ PASSED - Got 401 as expected"
else
    echo "✗ FAILED - Expected 401, got $HTTP_CODE"
    exit 1
fi
echo ""

echo "================================"
echo "All tests passed! ✓"
echo "================================"

# Cleanup
rm -f $COOKIE_FILE
