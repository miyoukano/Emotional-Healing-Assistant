@echo off
echo 正在导入数据库...
python import_db.py
echo.
echo 如果导入成功，数据库已准备就绪。
echo 按任意键退出...
pause > nul 