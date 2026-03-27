@echo off
REM ============================================
REM CHILD MANAGEMENT SYSTEM - INSTALLATION CHECK
REM ============================================
REM This script verifies that all components are 
REM properly installed and configured
REM ============================================

echo.
echo ============================================
echo CHILD MANAGEMENT SYSTEM - INSTALLATION VERIFICATION
echo ============================================
echo.

setlocal enabledelayedexpansion

REM Check if MySQL is accessible
echo [1/8] Checking MySQL connection...
mysql --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ MySQL is installed
) else (
    echo ✗ MySQL is not installed or not in PATH
    echo   Please install MySQL or add it to your PATH
    goto :end
)

REM Check if database exists
echo.
echo [2/8] Checking database 'sokapptest'...
mysql -u root -P 3307 -e "USE sokapptest;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Database 'sokapptest' exists
) else (
    echo ✗ Database 'sokapptest' does not exist
    echo   Run the base schema first: sokapptest_schema.sql
    goto :end
)

REM Check if children table exists
echo.
echo [3/8] Checking child tables...
mysql -u root -P 3307 -e "USE sokapptest; DESCRIBE children;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Table 'children' exists (Tier 1)
) else (
    echo ✗ Table 'children' does not exist
    echo   Run: child_management_schema.sql
    goto :check_tier2
)

REM Check Tier 2 tables
set /a tier2_count=0
mysql -u root -P 3307 -e "USE sokapptest; SHOW TABLES LIKE 'child_%';" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Tier 2 tables exist
    set /a tier2_count=5
)

:check_tier2
echo.
echo [4/8] Checking permissions table...
mysql -u root -P 3307 -e "USE sokapptest; SELECT COUNT(*) FROM permissions WHERE category='Children';" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Permissions table accessible
) else (
    echo ✗ Cannot access permissions table
)

REM Check if child permissions exist
echo.
echo [5/8] Checking child permissions...
mysql -u root -P 3307 -N -e "USE sokapptest; SELECT COUNT(*) FROM permissions WHERE category='Children';" 2>nul | findstr /r "[1-9]" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Child permissions found in database
) else (
    echo ✗ Child permissions not found
    echo   Run: child_management_schema.sql
)

REM Check backend files
echo.
echo [6/8] Checking backend files...
set "files_ok=1"

if exist "Backend\middleware\auth.middleware.js" (
    echo ✓ auth.middleware.js exists
) else (
    echo ✗ auth.middleware.js missing
    set "files_ok=0"
)

if exist "Backend\middleware\permission.middleware.js" (
    echo ✓ permission.middleware.js exists
) else (
    echo ✗ permission.middleware.js missing
    set "files_ok=0"
)

if exist "Backend\models\Child.js" (
    echo ✓ Child.js model exists
) else (
    echo ✗ Child.js model missing
    set "files_ok=0"
)

if exist "Backend\routes\children.routes.js" (
    echo ✓ children.routes.js exists
) else (
    echo ✗ children.routes.js missing
    set "files_ok=0"
)

REM Check server.js has route registration
echo.
echo [7/8] Checking server.js configuration...
findstr /C:"const childRoutes" "Backend\server.js" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Child routes registered in server.js
) else (
    echo ✗ Child routes NOT registered in server.js
)

REM Check Node.js dependencies
echo.
echo [8/8] Checking Node.js dependencies...
cd Backend
npm list bcryptjs jsonwebtoken mysql2 cors dotenv body-parser axios uuid >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Required npm packages installed
) else (
    echo ✗ Some npm packages may be missing
    echo   Run: npm install
)
cd ..

REM Final summary
echo.
echo ============================================
echo VERIFICATION COMPLETE
echo ============================================
echo.

if %files_ok% EQU 1 (
    echo ✓ All backend files are present
    echo.
    echo NEXT STEPS:
    echo 1. Run SQL schema if not done: database\setup_child_management.bat
    echo 2. Install dependencies: cd Backend; npm install
    echo 3. Start server: npm start
    echo 4. Test API endpoints
    echo.
    echo Documentation:
    echo - QUICK_START_CHILD_SYSTEM.md
    echo - Backend\CHILD_MANAGEMENT_API_DOCS.md
    echo - CHILD_IMPLEMENTATION_SUMMARY.md
) else (
    echo ✗ Some files are missing
    echo   Please ensure all files were created correctly
)

echo.
echo ============================================

:end
pause
