@echo off
echo ================================================
echo Increasing MySQL max_allowed_packet size
echo ================================================
echo.
echo This will set max_allowed_packet to 64MB
echo You may need to enter your MySQL root password
echo.

echo Step 1: Setting global max_allowed_packet...
mysql -u root -p -P 3307 -e "SET GLOBAL max_allowed_packet = 67108864;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set max_allowed_packet!
    echo Please make sure MySQL is running and you have admin rights
    pause
    exit /b 1
)

echo.
echo Step 2: Verifying change...
mysql -u root -p -P 3307 -e "SHOW VARIABLES LIKE 'max_allowed_packet';"

echo.
echo ================================================
echo Change applied! Note: This is temporary.
echo For permanent change, edit my.ini and add:
echo [mysqld]
echo max_allowed_packet=64M
echo ================================================
pause
