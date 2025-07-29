import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Slide } from './slide.entity';
import { User } from '../users/user.entity'
import { CreateSlideDto } from './dto/create-slide.dto';

@Injectable()
export class SlidesService {
  constructor(
    @InjectRepository(Slide)
    private slidesRepository: Repository<Slide>,
  ) {}

  async createSlide(userId: string, createSlideDto: CreateSlideDto): Promise<Slide> {
    // Generate a unique hash for the preview URL
    const previewHash = uuidv4().replace(/-/g, '').substring(0, 16);
    
    // Convert outline to Slidev markdown format
    const slidevContent = this.convertOutlineToSlidev(createSlideDto.outline);
    
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

  async getSlideByHash(hash: string): Promise<Slide | null> {
    return this.slidesRepository.findOne({ where: { previewHash: hash } });
  }

  private convertOutlineToSlidev(outline: string): string {
    // Split outline into lines and filter out empty lines
    const lines = outline.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
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
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // If line starts with -, treat as bullet point
      if (line.startsWith('-')) {
        slidevMarkdown += `${line}\n`;
      } 
      // If line ends with :, treat as section header
      else if (line.endsWith(':')) {
        slidevMarkdown += `---

## ${line.slice(0, -1)}

`;
      } 
      // Otherwise, treat as content
      else {
        slidevMarkdown += `${line}\n\n`;
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