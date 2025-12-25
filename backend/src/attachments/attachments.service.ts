import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(cardId: number, file: Express.Multer.File, fileUrl: string) {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const attachment = this.attachmentRepository.create({
      card,
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: fileUrl,
    });

    return this.attachmentRepository.save(attachment);
  }

  async findByCard(cardId: number) {
    await this.ensureCardExists(cardId);

    return this.attachmentRepository.find({
      where: { card: { id: cardId } },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment #${id} not found`);
    }

    const filePath = join(
      process.cwd(),
      'uploads',
      'attachments',
      attachment.fileName,
    );
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    await this.attachmentRepository.remove(attachment);

    return { message: 'Attachment deleted successfully' };
  }

  private async ensureCardExists(cardId: number) {
    const exists = await this.cardRepository.exists({ where: { id: cardId } });
    if (!exists) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }
  }
}
