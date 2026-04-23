import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CrmStore, createEmptyCrmStore } from './crm-store.types';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
  private readonly filePath = join(this.dataDir, 'crm-store.json');
  private readonly tempFilePath = `${this.filePath}.tmp`;
  private writeChain: Promise<unknown> = Promise.resolve();

  async onModuleInit(): Promise<void> {
    await this.ensureStoreFile();
  }

  async readStore(): Promise<CrmStore> {
    await this.ensureStoreFile();
    return this.readStoreFromDisk();
  }

  async writeStore(nextStore: CrmStore): Promise<void> {
    await this.enqueueWrite(async () => {
      await this.ensureStoreFile();
      await this.writeStoreAtomically(nextStore);
    });
  }

  async updateStore(mutator: (current: CrmStore) => CrmStore): Promise<CrmStore> {
    return this.enqueueWrite(async () => {
      await this.ensureStoreFile();

      const current = await this.readStoreFromDisk();
      const next = mutator(current);

      await this.writeStoreAtomically(next);
      return next;
    });
  }

  private async ensureStoreFile(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });

    try {
      await readFile(this.filePath, 'utf-8');
    } catch (error: unknown) {
      if (!this.isFileNotFoundError(error)) {
        throw error;
      }

      const emptyStore = createEmptyCrmStore();
      await this.writeStoreAtomically(emptyStore);
      this.logger.log(`Created CRM storage at ${this.filePath}`);
    }
  }

  private async readStoreFromDisk(): Promise<CrmStore> {
    const raw = await readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as CrmStore;
  }

  private async writeStoreAtomically(store: CrmStore): Promise<void> {
    await writeFile(this.tempFilePath, this.stringify(store), 'utf-8');
    await rename(this.tempFilePath, this.filePath);
  }

  private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const nextOperation = this.writeChain.then(operation, operation);
    this.writeChain = nextOperation.then(() => undefined, () => undefined);
    return nextOperation;
  }

  private isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }

  private stringify(store: CrmStore): string {
    return JSON.stringify(store, null, 2);
  }
}
