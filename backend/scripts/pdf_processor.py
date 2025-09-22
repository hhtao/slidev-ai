#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF处理脚本 - 使用pdfplumber库
需要安装: pip install pdfplumber
"""

import sys
import json
import traceback
import pdfplumber
from pathlib import Path
import os

# 设置环境变量确保UTF-8编码
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Windows平台设置控制台编码
if sys.platform == 'win32':
    import locale
    try:
        # 设置控制台代码页为UTF-8
        os.system('chcp 65001 > nul 2>&1')
        # 强制设置locale
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass

def extract_pdf_content(pdf_path):
    """
    使用pdfplumber提取PDF内容
    """
    try:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF文件不存在: {pdf_path}")
        
        result = {
            "success": True,
            "content": "",
            "tables": [],
            "metadata": {
                "pages": 0,
                "has_text": False,
                "has_tables": False,
                "file_size": pdf_path.stat().st_size,
                "encoding_info": "UTF-8 processed"
            }
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            result["metadata"]["pages"] = len(pdf.pages)
            all_text = []
            all_tables = []
            
            for page_num, page in enumerate(pdf.pages):
                # 提取文本
                page_text = page.extract_text()
                if page_text:
                    # 清理和标准化文本
                    cleaned_text = clean_text_content(page_text)
                    if cleaned_text.strip():
                        all_text.append(f"=== 第 {page_num + 1} 页 ===\n{cleaned_text}\n")
                
                # 提取表格
                tables = page.extract_tables()
                if tables:
                    for table_num, table in enumerate(tables):
                        table_text = f"\n=== 第 {page_num + 1} 页 表格 {table_num + 1} ===\n"
                        for row in table:
                            if row and any(cell for cell in row if cell):  # 过滤空行
                                cleaned_row = [clean_text_content(str(cell)) if cell else "" for cell in row]
                                table_text += " | ".join(cleaned_row) + "\n"
                        all_tables.append(table_text)
            
            # 合并所有内容
            content_parts = []
            if all_text:
                content_parts.extend(all_text)
                result["metadata"]["has_text"] = True
            
            if all_tables:
                content_parts.append("\n=== 表格数据 ===\n")
                content_parts.extend(all_tables)
                result["metadata"]["has_tables"] = True
            
            final_content = "\n".join(content_parts).strip()
            
            # 最终的文本清理
            final_content = clean_and_validate_content(final_content)
            
            # 添加调试信息
            result["metadata"]["debug_info"] = {
                "raw_content_length": len("\n".join(content_parts).strip()) if content_parts else 0,
                "cleaned_content_length": len(final_content),
                "content_preview_raw": "\n".join(content_parts).strip()[:100] if content_parts else "",
                "content_preview_cleaned": final_content[:100] if final_content else ""
            }
            
            # 检查内容质量
            if not final_content or len(final_content.strip()) < 5:
                result["content"] = f"[PDF文档] 共 {result['metadata']['pages']} 页，未能提取到有效文本内容。可能是扫描版PDF或图片格式。"
                result["metadata"]["note"] = "扫描版PDF或无文本内容"
                result["metadata"]["has_text"] = False
            else:
                result["content"] = final_content
                result["metadata"]["has_text"] = True
                # 添加调试信息
                result["metadata"]["content_preview"] = final_content[:100]
                result["metadata"]["actual_length"] = len(final_content)
            
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def clean_text_content(text):
    """
    清理和标准化文本内容
    """
    if not text:
        return ""
    
    # 处理常见的编码问题
    try:
        # 如果是字节串，尝试解码
        if isinstance(text, bytes):
            # 尝试多种编码
            for encoding in ['utf-8', 'gbk', 'gb2312', 'latin1']:
                try:
                    text = text.decode(encoding)
                    break
                except:
                    continue
    except:
        pass
    
    # 确保是字符串
    text = str(text)
    
    # 清理特殊字符
    text = text.replace('\x00', '')  # 删除null字符
    text = text.replace('\ufeff', '')  # 删除BOM
    
    # 清理多余空白
    text = ' '.join(text.split())
    
    return text

def clean_and_validate_content(content):
    """
    最终清理和验证内容
    """
    if not content:
        return ""
    
    # 清理特殊字符和控制字符
    cleaned = ''.join(char for char in content if ord(char) >= 32 or char in '\n\t')
    
    # 清理多余的空行
    lines = cleaned.split('\n')
    cleaned_lines = [line.strip() for line in lines if line.strip()]
    
    return '\n'.join(cleaned_lines)

def main():
    if len(sys.argv) != 2:
        result = {
            "success": False,
            "error": "Usage: python pdf_processor.py <pdf_path>"
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = extract_pdf_content(pdf_path)
    
    # 确保输出为UTF-8编码的JSON，avoid乱码
    output_json = json.dumps(result, ensure_ascii=False, indent=2)
    print(output_json)

if __name__ == "__main__":
    main()