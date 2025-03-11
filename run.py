# -*- coding: utf-8 -*-
import sys
import os

# 设置默认编码为UTF-8
if sys.version_info[0] < 3:
    reload(sys)
    sys.setdefaultencoding('utf-8')
else:
    # Python 3已经默认使用UTF-8，但我们仍然可以设置环境变量
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True) 