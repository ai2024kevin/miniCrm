import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmDeal } from '../storage/crm-store.types';
import { StorageService } from '../storage/storage.service';
import { CreateDealDto } from './dto/create-deal.dto';

@Injectable()
export class DealsService {
  constructor(private readonly storageService: StorageService) {}

  async create(dto: CreateDealDto): Promise<CrmDeal> {
    const now = new Date().toISOString();

    let createdDeal!: CrmDeal;

    await this.storageService.updateStore((current) => {
      if (
        typeof dto.client_id === 'number' &&
        !current.clients.some((client) => client.id === dto.client_id)
      ) {
        throw new BadRequestException(`Client ${dto.client_id} not found`);
      }

      const nextId = current.deals.reduce((maxId, deal) => Math.max(maxId, deal.id), 0) + 1;

      createdDeal = {
        id: nextId,
        client_id: dto.client_id ?? null,
        title: dto.title,
        amount: dto.amount,
        stage: dto.stage,
        comment: dto.comment ?? null,
        close_date: dto.close_date ?? null,
        created_at: now,
      };

      return {
        ...current,
        deals: [...current.deals, createdDeal],
      };
    });

    return createdDeal;
  }

  async findAll(): Promise<CrmDeal[]> {
    const store = await this.storageService.readStore();
    return store.deals;
  }

  async remove(id: number): Promise<void> {
    await this.storageService.updateStore((current) => {
      const hasDeal = current.deals.some((deal) => deal.id === id);

      if (!hasDeal) {
        throw new NotFoundException(`Deal ${id} not found`);
      }

      return {
        ...current,
        deals: current.deals.filter((deal) => deal.id !== id),
      };
    });
  }
}
