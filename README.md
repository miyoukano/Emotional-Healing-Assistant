# 情绪愈疗助手 Web 应用

这是一个基于AIGC的情绪愈疗助手Web应用，旨在通过对话识别用户情绪，提供情感支持，并根据用户情绪推荐适合的香薰产品。

## 功能特点

- **情绪识别**：通过对话分析用户的情绪状态
- **情绪可视化**：直观展示用户的情绪变化趋势
- **香薰推荐**：根据用户情绪推荐适合的香薰产品
- **多种人设**：支持切换不同风格的AI助手人设
  - 共情型：温暖理解，感同身受
  - 激励型：积极向上，鼓舞人心
  - 分析型：理性分析，提供见解
  - 正念型：专注当下，平静心灵

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **UI设计**：响应式设计，适配不同设备
- **数据可视化**：Chart.js
- **后端**：Flask 3.1.0, MySQL
- **环境**：Python 3.9.15, pip 23.3.2

## 项目结构

```
情绪愈疗助手/
├── app/                # Flask应用目录
│   ├── models/         # 数据库模型
│   ├── routes/         # 路由控制器
│   ├── static/         # 静态资源
│   │   ├── css/        # 样式文件
│   │   ├── js/         # JavaScript文件
│   │   └── images/     # 图片资源
│   ├── templates/      # HTML模板
│   ├── utils/          # 工具函数
│   ├── __init__.py     # 应用初始化
│   └── config.py       # 配置文件
├── data/               # 数据库导出文件
├── migrations/         # 数据库迁移文件
├── init_db.py          # 数据库初始化脚本
├── run.py              # 应用启动脚本
└── README.md           # 项目说明
```

## 安装与设置

### 前提条件

1. Python 3.9+ (推荐使用Python 3.9.15)
2. MySQL 5.7+ (已在MySQL 8.0上测试)
3. pip 23.0+ (推荐使用pip 23.3.2)
4. Windows 10/11 或 Linux/macOS

### 安装步骤

1. 克隆项目到本地
   ```bash
   git clone https://github.com/yourusername/Emotional-Healing-Assistant.git
   cd Emotional-Healing-Assistant
   ```

2. 创建虚拟环境并激活
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

4. 配置数据库
   - 编辑 `app/config.py` 文件，设置你的数据库连接信息
   - 默认配置:
     ```python
     HOSTNAME = "127.0.0.1"
     PORT = "3306"
     DATABASE = "emotional_assistant"
     USERNAME = "root"
     PASSWORD = "123456"
     ```
   - 确保有一个名为 `emotional_assistant` 的MySQL数据库

5. 测试数据库连接
   ```bash
   python test_mysql.py
   ```

6. 导入数据库
   ```bash
   python import_db.py
   ```

7. 运行应用
   ```bash
   python run.py
   ```

8. 访问应用
   - 打开浏览器，访问 http://127.0.0.1:5000

## 数据库管理

### 检查数据库连接

如果你遇到数据库连接问题，可以使用检查脚本：

```bash
python check_db.py
```

这将检查数据库连接和配置是否正确。

### 测试MySQL连接

如果你需要测试MySQL连接，可以使用：

```bash
python test_mysql.py
```

这个脚本会执行全面的数据库连接测试，使用多种方法（PyMySQL直接连接、SQLAlchemy连接、Flask-SQLAlchemy连接）尝试连接到数据库，并提供详细的诊断信息。如果遇到连接问题，脚本会提供可能的原因和解决方案建议。

### 导出数据库

如果你对数据库进行了修改，并希望将这些更改分享给其他人，可以使用导出脚本：

```bash
python export_db.py
```

这将在 `data/` 目录下创建一个SQL文件，包含完整的数据库结构和数据。导出脚本会自动更新data目录下的README.md文件，提供详细的导入说明。

### 导入数据库

如果你是从其他人那里获取的项目，可以使用导入脚本来设置数据库：

```bash
python import_db.py
```

这将使用 `data/` 目录下的SQL文件来创建和填充数据库。

或者你也可以直接使用MySQL命令导入：

```bash
# 创建数据库(如果尚未创建)
mysql -u 用户名 -p -e "CREATE DATABASE IF NOT EXISTS emotional_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据
mysql -u 用户名 -p < data/emotional_assistant.sql
```

导入过程中如果遇到问题，请参考`data/README.md`文件中的详细说明。

### 初始化数据库

如果你想重置数据库到初始状态（包含一些示例数据），可以使用：

```bash
python init_db.py
```

### 模板设计说明

本项目采用单页面应用(SPA)设计，所有功能（包括登录、注册、重置密码等）都在`index.html`一个页面中实现，通过JavaScript控制不同组件的显示和隐藏。

### 数据库连接问题

如果遇到数据库连接问题，请检查：

1. MySQL服务是否正在运行
2. 数据库连接信息是否正确（用户名、密码、主机、端口）
3. 数据库是否存在
4. MySQL用户是否有足够的权限

可以使用 `test_mysql.py` 和 `check_db.py` 脚本来诊断问题。

## 使用方法

1. 注册账户或使用测试账户登录（用户名：test，密码：test123）
2. 开始与情绪愈疗助手对话
3. 尝试切换不同的人设体验不同的对话风格
4. 查看情绪分析结果和香薰产品推荐

## 开发环境

本项目在以下环境中开发和测试：

- 操作系统：Windows 10 (版本 10.0.22631.4890)
- Python：3.9.15
- pip：23.3.2
- MySQL：8.0
- 浏览器：Chrome 最新版、Edge 最新版

## 未来计划

- 添加更多人设选项
- 改进情绪分析算法
- 扩展香薰产品数据库
- 实现真实的产品购买链接
- 修复模板缺失问题
- 添加更多单元测试
- 优化移动端体验

## 贡献

欢迎提交问题和改进建议！

## 许可

MIT 