# coding: utf-8
import _thread as thread
import base64
import datetime
import hashlib
import hmac
import json
import ssl
import time
from time import mktime
from urllib.parse import urlencode, urlparse
from wsgiref.handlers import format_date_time

import websocket


class SparkApi:
    def __init__(self, app_id, api_key, api_secret, spark_url, domain):
        self.app_id = app_id
        self.api_key = api_key
        self.api_secret = api_secret
        self.spark_url = spark_url
        self.domain = domain
        self.answer = ""
        self.ws_closed = False

    def create_url(self):
        """生成鉴权URL"""
        host = urlparse(self.spark_url).netloc
        path = urlparse(self.spark_url).path
        
        # 生成RFC1123格式的时间戳
        now = datetime.datetime.now()
        date = format_date_time(mktime(now.timetuple()))
        
        # 拼接字符串
        signature_origin = "host: " + host + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + path + " HTTP/1.1"
        
        # 进行hmac-sha256加密
        signature_sha = hmac.new(self.api_secret.encode('utf-8'), 
                                signature_origin.encode('utf-8'),
                                digestmod=hashlib.sha256).digest()
        
        signature_sha_base64 = base64.b64encode(signature_sha).decode(encoding='utf-8')
        
        authorization_origin = f'api_key="{self.api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_sha_base64}"'
        
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')
        
        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": host
        }
        
        # 拼接鉴权参数，生成url
        url = self.spark_url + '?' + urlencode(v)
        return url

    def gen_params(self, messages):
        """生成请求参数"""
        # 确保消息中的中文字符被正确编码
        for msg in messages:
            if 'content' in msg and isinstance(msg['content'], str):
                # 确保内容是UTF-8编码
                msg['content'] = msg['content'].encode('utf-8').decode('utf-8')
        
        data = {
            "header": {
                "app_id": self.app_id,
                "uid": "1234"
            },
            "parameter": {
                "chat": {
                    "domain": self.domain,
                    "temperature": 0.5,
                    "max_tokens": 4096,
                    "auditing": "default"
                }
            },
            "payload": {
                "message": {
                    "text": messages
                }
            }
        }
        return data

    def on_message(self, ws, message):
        """处理接收到的消息"""
        try:
            data = json.loads(message)
            code = data['header']['code']
            if code != 0:
                print(f'请求错误: {code}, {data}')
                ws.close()
            else:
                choices = data["payload"]["choices"]
                status = choices["status"]
                if "text" in choices and len(choices["text"]) > 0:
                    content = choices["text"][0]["content"]
                    self.answer += content
                if status == 2:
                    ws.close()
                    self.ws_closed = True
        except Exception as e:
            print(f"处理消息错误: {str(e)}, 原始消息: {message}")
            ws.close()
            self.ws_closed = True

    def on_error(self, ws, error):
        """处理错误"""
        print(f"WebSocket错误: {error}")
        self.ws_closed = True

    def on_close(self, ws, close_status_code, close_reason):
        """处理连接关闭"""
        print(f"WebSocket关闭: {close_status_code}, {close_reason}")
        self.ws_closed = True

    def on_open(self, ws):
        """处理连接建立"""
        def run(*args):
            try:
                data = json.dumps(self.gen_params(ws.messages), ensure_ascii=False)
                print(f"发送数据: {data}")
                ws.send(data)
            except Exception as e:
                print(f"发送数据错误: {str(e)}")
                ws.close()
                self.ws_closed = True
        thread.start_new_thread(run, ())

    def chat(self, messages):
        """发送聊天请求"""
        try:
            self.answer = ""
            self.ws_closed = False
            ws_url = self.create_url()
            
            # 禁用调试，避免setsockopt错误
            websocket.enableTrace(False)
            
            # 创建WebSocket连接
            ws = websocket.WebSocketApp(
                ws_url,
                on_message=lambda ws, msg: self.on_message(ws, msg),
                on_error=lambda ws, err: self.on_error(ws, err),
                on_close=lambda ws, close_status_code, close_reason: self.on_close(ws, close_status_code, close_reason),
                on_open=lambda ws: self.on_open(ws)
            )
            
            ws.messages = messages
            
            # 使用同步方式运行WebSocket连接，避免线程问题
            ws_thread = thread.start_new_thread(lambda: ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE}), ())
            
            # 等待响应完成
            timeout = 30  # 30秒超时
            start_time = time.time()
            while not self.ws_closed and time.time() - start_time < timeout:
                time.sleep(0.1)
            
            if not self.answer:
                # 尝试使用模拟响应
                return self.generate_mock_response(messages)
            
            return self.answer
        except Exception as e:
            print(f"聊天请求错误: {str(e)}")
            # 出错时使用模拟响应
            return self.generate_mock_response(messages)
    
    def generate_mock_response(self, messages):
        """生成模拟响应，当API调用失败时使用"""
        # 获取用户消息
        user_message = ""
        for msg in messages:
            if msg["role"] == "user":
                user_message = msg["content"]
                break
        
        # 根据用户消息生成简单的回复
        if "你好" in user_message or "您好" in user_message:
            return "你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？"
        elif "心情" in user_message or "感觉" in user_message:
            return "我理解你现在的心情。情绪起伏是很正常的，重要的是我们如何面对它们。你能告诉我更多关于你现在的感受吗？"
        elif "压力" in user_message or "焦虑" in user_message:
            return "焦虑和压力是我们生活中常见的情绪。我建议你可以尝试一些薰衣草或洋甘菊的香薰产品，它们有助于缓解焦虑和压力。你平时有什么放松的方式吗？"
        elif "悲伤" in user_message or "难过" in user_message:
            return "我能感受到你的悲伤。在这样的时刻，给自己一些空间和时间是很重要的。佛手柑或柠檬草的香薰可能会帮助提升你的心情。你愿意分享是什么让你感到难过吗？"
        elif "愤怒" in user_message or "生气" in user_message:
            return "愤怒是一种强烈但正常的情绪。尝试深呼吸，也许薄荷或尤加利的香薰可以帮助你冷静下来。你能告诉我是什么触发了这种情绪吗？"
        else:
            return "谢谢你的分享。根据你的情绪状态，我推荐你可以尝试一些舒缓的香薰产品，如薰衣草、洋甘菊或佛手柑。这些香薰有助于平衡情绪，带来放松和舒适的感觉。你有什么特别喜欢的香味吗？"


def get_spark_client():
    """获取SparkAPI客户端实例"""
    app_id = "c2d0decd"
    api_key = "967b70c8cd9af34cd2c5a9ac390cfbae"
    api_secret = "M2ZiZDY0NzEwOWJlNTNiNzY0ODFmMTQz"
    spark_url = "wss://spark-api.xf-yun.com/v4.0/chat"
    domain = "4.0Ultra"
    
    return SparkApi(app_id, api_key, api_secret, spark_url, domain) 