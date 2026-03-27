@echo off
REM ============================================
REM DATABASE UPDATE - STORE FILES AS BASE64
REM ============================================
REM This batch file runs the SQL migration to update
REM the database to store files as Base64 strings
REM ============================================

echo.
echo ============================================
echo UPDATING DATABASE TO BASE64 STORAGE
echo ============================================
echo.
echo This will update the following tables:
echo - children (profile_photo)
echo - child_legal_documents (document_file)
echo - child_medical_records (medical_report_file)
echo - child_education_records (certificate_file)
echo - employees (profile_image)
echo.
echo All file uploads will be stored as Base64
echo directly in the database instead of file paths.
echo.
pause

REM Run the SQL migration script
mysql -u root -p sokapptest < database\UPDATE_TO_BASE64_STORAGE.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Database updated successfully
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Test file uploads
    echo 3. Verify files are stored in database
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR! Failed to update database
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. You have correct permissions
    echo 3. The database 'sokapptest' exists
    echo.
)

pause
