import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmTask } from '../storage/crm-store.types';
import { StorageService } from '../storage/storage.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly storageService: StorageService) {}

  async create(dto: CreateTaskDto): Promise<CrmTask> {
    const now = new Date().toISOString();

    let createdTask!: CrmTask;

    await this.storageService.updateStore((current) => {
      if (
        typeof dto.client_id === 'number' &&
        !current.clients.some((client) => client.id === dto.client_id)
      ) {
        throw new BadRequestException(`Client ${dto.client_id} not found`);
      }

      const linkedDeal =
        typeof dto.deal_id === 'number'
          ? current.deals.find((deal) => deal.id === dto.deal_id)
          : null;

      if (typeof dto.deal_id === 'number' && !linkedDeal) {
        throw new BadRequestException(`Deal ${dto.deal_id} not found`);
      }

      if (
        linkedDeal &&
        typeof dto.client_id === 'number' &&
        linkedDeal.client_id !== null &&
        linkedDeal.client_id !== dto.client_id
      ) {
        throw new BadRequestException('Task links must reference the same client');
      }

      const nextId = current.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;

      createdTask = {
        id: nextId,
        client_id: dto.client_id ?? null,
        deal_id: dto.deal_id ?? null,
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status,
        is_done: dto.is_done,
        due_date: dto.due_date ?? null,
        created_at: now,
      };

      return {
        ...current,
        tasks: [...current.tasks, createdTask],
      };
    });

    return createdTask;
  }

  async findAll(): Promise<CrmTask[]> {
    const store = await this.storageService.readStore();
    return store.tasks;
  }

  async remove(id: number): Promise<void> {
    await this.storageService.updateStore((current) => {
      const hasTask = current.tasks.some((task) => task.id === id);

      if (!hasTask) {
        throw new NotFoundException(`Task ${id} not found`);
      }

      return {
        ...current,
        tasks: current.tasks.filter((task) => task.id !== id),
      };
    });
  }
}
