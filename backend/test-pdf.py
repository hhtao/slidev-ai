#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建测试PDF文件的脚本
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

def create_test_pdf():
    filename = "test_document.pdf"
    
    # 创建PDF文档
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # 添加内容
    c.drawString(100, height - 100, "测试文档标题")
    c.drawString(100, height - 150, "这是一个用于测试BGE-M3向量模型的PDF文档。")
    c.drawString(100, height - 200, "文档包含中英文混合内容，用于验证向量化功能。")
    c.drawString(100, height - 250, "This document contains mixed Chinese and English content.")
    c.drawString(100, height - 300, "用于测试知识库系统的文档处理和向量化能力。")
    c.drawString(100, height - 350, "Testing document processing and vectorization capabilities.")
    
    # 保存PDF
    c.save()
    print(f"测试PDF文件已创建: {filename}")
    return filename

if __name__ == "__main__":
    create_test_pdf()