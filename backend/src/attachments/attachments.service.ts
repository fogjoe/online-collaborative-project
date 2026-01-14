import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { Buffer } from 'buffer';
import { WebsocketService } from 'src/websocket/websocket.service';
import { AttachmentPayload } from 'src/websocket/websocket.types';
import { createHash } from 'crypto';

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

    const filePath = this.getAttachmentFilePath(file.filename);
    const contentHash = await this.computeFileHash(filePath);
    const projectId = card.list.project.id;

    await this.backfillProjectHashes(projectId);

    const existingOnCard = await this.attachmentRepository.findOne({
      where: { card: { id: cardId }, contentHash },
    });
    if (existingOnCard) {
      await this.removeFileIfExists(filePath);
      return this.formatAttachment(existingOnCard);
    }

    const existingInProject = await this.attachmentRepository
      .createQueryBuilder('attachment')
      .innerJoin('attachment.card', 'card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.project', 'project')
      .where('project.id = :projectId', { projectId })
      .andWhere('attachment.contentHash = :contentHash', { contentHash })
      .orderBy('attachment.createdAt', 'ASC')
      .getMany();

    if (existingInProject.length > 0) {
      const canonical = existingInProject[0];
      const normalizedFileName = canonical.fileName;
      const normalizedUrl = canonical.url;
      const normalizedMimeType = canonical.mimeType;
      const normalizedSize = canonical.size;
      const filesToCleanup = new Set<string>();

      for (const duplicate of existingInProject) {
        if (duplicate.fileName !== normalizedFileName) {
          filesToCleanup.add(duplicate.fileName);
          await this.attachmentRepository.update(
            { id: duplicate.id },
            {
              fileName: normalizedFileName,
              url: normalizedUrl,
              mimeType: normalizedMimeType,
              size: normalizedSize,
              contentHash,
            },
          );
        }
      }

      for (const fileNameToRemove of filesToCleanup) {
        await this.removeFileIfOrphaned(fileNameToRemove);
      }

      await this.removeFileIfExists(filePath);

      const attachment = this.attachmentRepository.create({
        card,
        originalName: this.decodeFileName(file.originalname),
        fileName: normalizedFileName,
        mimeType: normalizedMimeType,
        size: normalizedSize,
        url: normalizedUrl,
        contentHash,
      });
      const savedAttachment = await this.attachmentRepository.save(attachment);
      const formatted = this.formatAttachment(savedAttachment);
      await this.emitAttachmentUpdate(projectId, card.id);
      return formatted;
    }

    const attachment = this.attachmentRepository.create({
      card,
      originalName: this.decodeFileName(file.originalname),
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: fileUrl,
      contentHash,
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

    await this.attachmentRepository.remove(attachment);
    await this.removeFileIfOrphaned(attachment.fileName);

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

  private async backfillProjectHashes(projectId: number) {
    const attachments = await this.attachmentRepository
      .createQueryBuilder('attachment')
      .innerJoin('attachment.card', 'card')
      .innerJoin('card.list', 'list')
      .innerJoin('list.project', 'project')
      .where('project.id = :projectId', { projectId })
      .andWhere('attachment.contentHash IS NULL')
      .getMany();

    for (const attachment of attachments) {
      const filePath = this.getAttachmentFilePath(attachment.fileName);
      if (!existsSync(filePath)) {
        continue;
      }

      const hash = await this.computeFileHash(filePath);
      await this.attachmentRepository.update(
        { id: attachment.id },
        { contentHash: hash },
      );
    }
  }

  private getAttachmentFilePath(fileName: string) {
    return join(process.cwd(), 'uploads', 'attachments', fileName);
  }

  private async removeFileIfExists(filePath: string) {
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  private async removeFileIfOrphaned(fileName: string) {
    const remainingReferences = await this.attachmentRepository.count({
      where: { fileName },
    });
    if (remainingReferences === 0) {
      await this.removeFileIfExists(this.getAttachmentFilePath(fileName));
    }
  }

  private computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }
}
