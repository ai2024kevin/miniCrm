import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CrmClient } from '../storage/crm-store.types';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto): Promise<CrmClient> {
    return this.clientsService.create(dto);
  }

  @Get()
  findAll(): Promise<CrmClient[]> {
    return this.clientsService.findAll();
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.clientsService.remove(id);
  }
}
