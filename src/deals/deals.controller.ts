import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CrmDeal } from '../storage/crm-store.types';
import { CreateDealDto } from './dto/create-deal.dto';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  create(@Body() dto: CreateDealDto): Promise<CrmDeal> {
    return this.dealsService.create(dto);
  }

  @Get()
  findAll(): Promise<CrmDeal[]> {
    return this.dealsService.findAll();
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.dealsService.remove(id);
  }
}
