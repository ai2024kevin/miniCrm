import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmClient } from '../storage/crm-store.types';
import { StorageService } from '../storage/storage.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly storageService: StorageService) {}

  async create(dto: CreateClientDto): Promise<CrmClient> {
    const now = new Date().toISOString();

    let createdClient!: CrmClient;

    await this.storageService.updateStore((current) => {
      const nextId = current.clients.reduce((maxId, client) => Math.max(maxId, client.id), 0) + 1;

      createdClient = {
        id: nextId,
        name: dto.name,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        company: dto.company ?? null,
        status: dto.status ?? 'active',
        comment: dto.comment ?? null,
        created_at: now,
      };

      return {
        ...current,
        clients: [...current.clients, createdClient],
      };
    });

    return createdClient;
  }

  async findAll(): Promise<CrmClient[]> {
    const store = await this.storageService.readStore();
    return store.clients;
  }

  async remove(id: number): Promise<void> {
    await this.storageService.updateStore((current) => {
      const hasClient = current.clients.some((client) => client.id === id);

      if (!hasClient) {
        throw new NotFoundException(`Client ${id} not found`);
      }

      const hasLinkedDeals = current.deals.some((deal) => deal.client_id === id);

      if (hasLinkedDeals) {
        throw new BadRequestException(`Client ${id} has linked deals`);
      }

      return {
        ...current,
        clients: current.clients.filter((client) => client.id !== id),
      };
    });
  }
}
