@echo off
echo 正在导出数据库...
python export_db.py
echo.
echo 如果导出成功，数据库文件将保存在data目录中。
echo 按任意键退出...
pause > nul 