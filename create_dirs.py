import os

# 创建主要目录
directories = [
    'app',
    'app/static',
    'app/static/css',
    'app/static/js',
    'app/templates',
    'app/models',
    'app/routes'
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"Created directory: {directory}")

print("Directory structure created successfully!") 