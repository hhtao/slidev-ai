#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json

# 测试中文输出
test_data = {
    "success": True,
    "content": "测试中文内容：这是一个中文测试文档。包含中英文混合内容。This is English content.",
    "metadata": {
        "pages": 1,
        "has_text": True,
        "note": "中文编码测试"
    }
}

# 输出JSON，确保中文正确显示
output = json.dumps(test_data, ensure_ascii=False, indent=2)

# 在Windows上确保控制台输出正确的UTF-8
if sys.platform == 'win32':
    import os
    os.system('chcp 65001 > nul 2>&1')  # 设置控制台为UTF-8编码

# 明确使用UTF-8编码输出
sys.stdout.buffer.write(output.encode('utf-8'))
sys.stdout.buffer.flush()