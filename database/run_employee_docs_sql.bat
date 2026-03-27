@echo off
echo Running SQL to add employee documents table...
mysql -u root -p < add_employee_documents_table.sql
pause