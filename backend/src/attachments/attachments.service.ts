import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { Buffer } from 'buffer';
import { WebsocketService } from 'src/websocket/websocket.service';
import { AttachmentPayload } from 'src/websocket/websocket.types';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly websocketService: WebsocketService,
  ) {}

  async create(cardId: number, file: Express.Multer.File, fileUrl: string) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['list', 'list.project'],
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    const attachment = this.attachmentRepository.create({
      card,
      originalName: this.decodeFileName(file.originalname),
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: fileUrl,
    });

    const savedAttachment = await this.attachmentRepository.save(attachment);
    const formatted = this.formatAttachment(savedAttachment);

    await this.emitAttachmentUpdate(card.list.project.id, card.id);

    return formatted;
  }

  async findByCard(cardId: number): Promise<AttachmentPayload[]> {
    await this.ensureCardExists(cardId);

    const attachments = await this.attachmentRepository.find({
      where: { card: { id: cardId } },
      order: { createdAt: 'DESC' },
    });

    return attachments.map((attachment) => this.formatAttachment(attachment));
  }

  async remove(id: number) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['card', 'card.list', 'card.list.project'],
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

    if (attachment.card?.list?.project) {
      await this.emitAttachmentUpdate(
        attachment.card.list.project.id,
        attachment.card.id,
      );
    }

    return { message: 'Attachment deleted successfully' };
  }

  private async ensureCardExists(cardId: number) {
    const exists = await this.cardRepository.exists({ where: { id: cardId } });
    if (!exists) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }
  }

  private decodeFileName(name?: string): string {
    if (!name) return '';

    if (!this.needsDecoding(name)) {
      return name;
    }

    try {
      const decoded = Buffer.from(name, 'latin1').toString('utf8');

      // If decoding produced replacement chars, reject it
      if (decoded.includes('�')) {
        return name;
      }

      return decoded;
    } catch {
      return name;
    }
  }

  private needsDecoding(name: string): boolean {
    // Already contains Chinese/Japanese/Korean → correct UTF-8
    if (/[\u4E00-\u9FFF]/.test(name)) {
      return false;
    }

    // Common mojibake characters when UTF-8 is misread as latin1
    // å ä ç è é ï º · ¸ etc.
    return /[åäçèéïº·¸]/i.test(name);
  }

  private formatAttachment(attachment: Attachment): AttachmentPayload {
    return {
      id: attachment.id,
      originalName: this.decodeFileName(attachment.originalName),
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: Number(attachment.size),
      url: attachment.url,
      createdAt:
        attachment.createdAt instanceof Date
          ? attachment.createdAt.toISOString()
          : (attachment.createdAt as unknown as string),
    };
  }

  private async emitAttachmentUpdate(projectId: number, cardId: number) {
    const attachments = await this.findByCard(cardId);
    this.websocketService.emitAttachmentsUpdated({
      projectId,
      cardId,
      attachments,
    });
  }
}
