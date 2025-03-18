import re
from datetime import datetime

def count_tokens(text):
    """
    简单估算文本中的token数量
    中文约每1.5个字符算1个token，英文约每4个字符算1个token
    
    Args:
        text: 要计算的文本
        
    Returns:
        int: 估算的token数量
    """
    if not text:
        return 0
    
    # 将文本分为中文和非中文部分
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    non_chinese_chars = re.sub(r'[\u4e00-\u9fff]', '', text)
    
    # 估算token数量
    chinese_tokens = len(chinese_chars) / 1.5
    non_chinese_tokens = len(non_chinese_chars) / 4
    
    return int(chinese_tokens + non_chinese_tokens)

def estimate_chat_tokens(messages):
    """
    估算一组聊天消息的token数量
    
    Args:
        messages: 消息列表，格式为[{"role": "...", "content": "..."}]
        
    Returns:
        int: 估算的输入token数量
    """
    total_tokens = 0
    
    for message in messages:
        content = message.get("content", "")
        total_tokens += count_tokens(content)
        # 每条消息额外添加一些系统token
        total_tokens += 4  
    
    # 整个请求的系统开销
    total_tokens += 10
    
    return int(total_tokens)

def estimate_completion_tokens(text):
    """
    估算生成文本的token数量
    
    Args:
        text: 生成的文本
        
    Returns:
        int: 估算的输出token数量
    """
    return count_tokens(text) 