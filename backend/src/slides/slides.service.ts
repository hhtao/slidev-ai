import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Slide } from './slide.entity';
import { User } from '../users/user.entity'
import { CreateSlideDto } from './dto/create-slide.dto';
import { Multer } from 'multer';
import * as fs from 'fs';

// 定义文件类型
type MulterFile = Express.Multer.File;

@Injectable()
export class SlidesService {
  constructor(
    @InjectRepository(Slide)
    private slidesRepository: Repository<Slide>,
  ) {}

  async createSlide(userId: string, createSlideDto: CreateSlideDto, file?: MulterFile): Promise<Slide> {
    // Generate a unique hash for the preview URL
    const previewHash = uuidv4().replace(/-/g, '').substring(0, 16);
    
    // Convert outline or file content to Slidev markdown format
    let slidevContent = '';
    if (createSlideDto.outline) {
      slidevContent = this.convertOutlineToSlidev(createSlideDto.outline);
    } else if (file) {
      slidevContent = await this.convertFileToSlidev(file);
    } else {
      slidevContent = this.getDefaultSlidevContent();
    }
    
    const slide = this.slidesRepository.create({
      title: createSlideDto.title,
      content: slidevContent,
      previewHash,
      userId,
    });
    
    return this.slidesRepository.save(slide);
  }

  async getUserSlides(userId: string): Promise<Slide[]> {
    return this.slidesRepository.find({ where: { userId } });
  }

  async getPublicSlides(skip: number, take: number): Promise<[Slide[], number]> {
    return this.slidesRepository
      .createQueryBuilder('slide')
      .leftJoinAndSelect('slide.user', 'user')
      .select([
        'slide.id',
        'slide.title',
        'slide.previewHash',
        'slide.createdAt',
        'user.username'
      ])
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  async getSlideByHash(hash: string): Promise<Slide | null> {
    return this.slidesRepository.findOne({ where: { previewHash: hash } });
  }

  private async convertFileToSlidev(file: MulterFile): Promise<string> {
    // Read file content
    const fileContent = fs.readFileSync(file.path, 'utf-8');
    
    // Delete the file after reading
    fs.unlinkSync(file.path);
    
    // For now, we'll create a simple slide with the file content
    // In a real implementation, you might want to parse the file content more intelligently
    let content = fileContent;
    
    // If it's a markdown file, we can use it as-is
    if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md')) {
      return fileContent;
    }
    
    // For other file types, create a simple slide
    return `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

# ${file.originalname}

---

## File Content

\`\`\`
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}
\`\`\`

---

## Thank You

Questions?
`;
  }

  private getDefaultSlidevContent(): string {
    return `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

# New Presentation

---

## Introduction

Content here...

---

## Thank You

Questions?
`;
  }

  private convertOutlineToSlidev(outline: string): string {
    // Split outline into lines and filter out empty lines
    const lines = outline.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return this.getDefaultSlidevContent();
    }

    // Start building the Slidev markdown
    let slidevMarkdown = `---
theme: default
background: https://source.unsplash.com/collection/94734569/1920x1080
---

`;

    // Add title slide
    slidevMarkdown += `# ${lines[0]}

`;

    // Process the rest of the outline
    let inList = false;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // If line starts with -, treat as bullet point
      if (line.startsWith('-')) {
        // If this is the first list item, start a new slide
        if (!inList) {
          slidevMarkdown += `---

`;
          inList = true;
        }
        slidevMarkdown += `${line}\n`;
      } 
      // If line ends with :, treat as section header
      else if (line.endsWith(':')) {
        // Close previous list if needed
        if (inList) {
          inList = false;
        }
        slidevMarkdown += `---

## ${line.slice(0, -1)}

`;
      } 
      // Otherwise, treat as content
      else {
        // Close previous list if needed
        if (inList) {
          inList = false;
        }
        // If this is not an empty line, add as content
        if (line !== '') {
          slidevMarkdown += `${line}\n\n`;
        }
      }
    }

    // Add closing slide
    slidevMarkdown += `---

## Thank You

Questions?
`;

    return slidevMarkdown;
  }
}