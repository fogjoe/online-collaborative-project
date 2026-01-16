import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { User } from 'src/user/entities/user.entity';

type SearchType = 'projects' | 'cards' | 'comments';

interface SearchQuery {
  q: string;
  types: SearchType[];
  projectId?: number;
  assignedUserId?: number;
  labelIds?: number[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isCompleted?: boolean;
}

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: Record<string, string | string[]>, @Req() req) {
    const parsedQuery = this.parseQuery(query);
    const user = req.user as User;
    return this.searchService.search(parsedQuery, user);
  }

  private parseQuery(query: Record<string, string | string[]>) {
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const filters = this.parseStringArray(
      query.filters ?? query['filters[]'],
    );
    const types = this.normalizeTypes(filters);

    return {
      q,
      types,
      projectId: this.parseNumber(query.projectId),
      assignedUserId: this.parseNumber(query.assignedUserId),
      labelIds: this.parseNumberArray(query.labelIds),
      dueDateFrom: this.parseDate(query.dueDateFrom),
      dueDateTo: this.parseDate(query.dueDateTo),
      isCompleted: this.parseBoolean(query.isCompleted),
    } satisfies SearchQuery;
  }

  private parseStringArray(value?: string | string[]): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.flatMap((entry) => entry.split(',')).map((entry) => entry.trim()).filter(Boolean);
    }
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private normalizeTypes(filters: string[]): SearchType[] {
    const allowed: SearchType[] = ['projects', 'cards', 'comments'];
    const normalized = filters
      .map((entry) => entry.toLowerCase())
      .filter((entry): entry is SearchType => allowed.includes(entry as SearchType));

    return normalized.length ? normalized : allowed;
  }

  private parseNumber(value?: string | string[]): number | undefined {
    if (Array.isArray(value)) {
      return this.parseNumber(value[0]);
    }
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseNumberArray(value?: string | string[]): number[] | undefined {
    const entries = this.parseStringArray(value);
    const parsed = entries
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : undefined;
  }

  private parseBoolean(value?: string | string[]): boolean | undefined {
    if (Array.isArray(value)) {
      return this.parseBoolean(value[0]);
    }
    if (!value) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private parseDate(value?: string | string[]): Date | undefined {
    if (Array.isArray(value)) {
      return this.parseDate(value[0]);
    }
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
