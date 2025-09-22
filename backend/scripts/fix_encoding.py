#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复编码问题的脚本
解决Windows上Python MCP服务器的多字节字符编码错误
"""

import os
import sys
import locale

def fix_encoding():
    """修复Python运行时的编码问题"""
    
    # 1. 设置环境变量
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['LC_ALL'] = 'C.UTF-8'
    os.environ['LANG'] = 'C.UTF-8'
    
    # 2. Windows特定设置
    if sys.platform == 'win32':
        try:
            # 设置控制台代码页为UTF-8
            os.system('chcp 65001 > nul 2>&1')
            
            # 强制设置locale
            try:
                locale.setlocale(locale.LC_ALL, 'C.UTF-8')
            except locale.Error:
                try:
                    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
                except locale.Error:
                    # 如果都失败，使用默认locale
                    pass
                    
        except Exception as e:
            print(f"Warning: Failed to set Windows encoding: {e}")
    
    # 3. 设置标准流编码
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
    if hasattr(sys.stdin, 'reconfigure'):
        sys.stdin.reconfigure(encoding='utf-8')
    
    print("✅ 编码问题修复完成")

if __name__ == "__main__":
    fix_encoding()