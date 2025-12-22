import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { Project } from 'src/project/entities/project.entity';

@Injectable()
export class LabelsService {
  constructor(@InjectRepository(Label) private labelRepo: Repository<Label>) {}

  async create(projectId: number, name: string, color: string) {
    const label = this.labelRepo.create({
      name,
      color,
      project: { id: projectId } as Project,
    });
    return this.labelRepo.save(label);
  }

  async findAll(projectId: number) {
    return this.labelRepo.find({
      where: { project: { id: projectId } },
    });
  }
}
