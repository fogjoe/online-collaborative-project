import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const statements = [
      `CREATE INDEX IF NOT EXISTS cards_search_idx ON cards USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));`,
      `CREATE INDEX IF NOT EXISTS comments_search_idx ON comments USING GIN (to_tsvector('simple', coalesce(content, '')));`,
      `CREATE INDEX IF NOT EXISTS projects_search_idx ON projects USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));`,
    ];

    for (const statement of statements) {
      try {
        // Create indexes lazily at startup to keep search fast.
        // Note: Index creation is idempotent and cheap on subsequent runs.
        await this.dataSource.query(statement);
      } catch (error) {
        this.logger.warn(
          `Failed to ensure search index: ${statement}. Error: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }
}
