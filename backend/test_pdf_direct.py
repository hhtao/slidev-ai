#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接测试PDF处理脚本
"""

import sys
import os

# 将scripts目录添加到路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

# 导入PDF处理模块
from pdf_processor import extract_pdf_content

def test_pdf_processing():
    # 测试已上传的PDF文件
    pdf_files = [
        "uploads/knowledge/bf24dc81-c843-458a-8863-2e7460f7df1c.pdf"
    ]
    
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"测试文件: {pdf_file}")
            result = extract_pdf_content(pdf_file)
            
            print(f"处理结果:")
            print(f"- 成功: {result.get('success', False)}")
            print(f"- 页数: {result.get('metadata', {}).get('pages', 0)}")
            print(f"- 内容长度: {len(result.get('content', ''))}")
            print(f"- 内容前100字符:")
            content = result.get('content', '')
            print(repr(content[:100]))
            print("="*50)
        else:
            print(f"文件不存在: {pdf_file}")

if __name__ == "__main__":
    test_pdf_processing()