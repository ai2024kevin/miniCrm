import { Controller, Post } from '@nestjs/common';
import { ReportResponse } from './report-builder';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('clients')
  createClientsReport(): Promise<ReportResponse> {
    return this.reportsService.build('clients');
  }

  @Post('deals')
  createDealsReport(): Promise<ReportResponse> {
    return this.reportsService.build('deals');
  }

  @Post('tasks')
  createTasksReport(): Promise<ReportResponse> {
    return this.reportsService.build('tasks');
  }
}
