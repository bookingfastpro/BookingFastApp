import { supabase } from '../lib/supabase';

// Batch query executor
export class QueryBatcher {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private batchSize = 5;
  private batchDelay = 50;

  add<T>(queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(fn => fn()));
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }
}

export const queryBatcher = new QueryBatcher();

// Optimized query builder
export class QueryBuilder {
  private table: string;
  private selectFields: string = '*';
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orderByField?: { column: string; ascending: boolean };
  private limitValue?: number;
  private rangeValue?: { from: number; to: number };

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  filter(column: string, operator: string, value: any) {
    this.filters.push({ column, operator, value });
    return this;
  }

  eq(column: string, value: any) {
    return this.filter(column, 'eq', value);
  }

  neq(column: string, value: any) {
    return this.filter(column, 'neq', value);
  }

  gt(column: string, value: any) {
    return this.filter(column, 'gt', value);
  }

  gte(column: string, value: any) {
    return this.filter(column, 'gte', value);
  }

  lt(column: string, value: any) {
    return this.filter(column, 'lt', value);
  }

  lte(column: string, value: any) {
    return this.filter(column, 'lte', value);
  }

  like(column: string, pattern: string) {
    return this.filter(column, 'like', pattern);
  }

  ilike(column: string, pattern: string) {
    return this.filter(column, 'ilike', pattern);
  }

  in(column: string, values: any[]) {
    return this.filter(column, 'in', values);
  }

  orderBy(column: string, ascending: boolean = true) {
    this.orderByField = { column, ascending };
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeValue = { from, to };
    return this;
  }

  async execute() {
    if (!supabase) throw new Error('Supabase not configured');

    let query = supabase.from(this.table).select(this.selectFields);

    // Apply filters
    for (const filter of this.filters) {
      const { column, operator, value } = filter;
      query = (query as any)[operator](column, value);
    }

    // Apply ordering
    if (this.orderByField) {
      query = query.order(this.orderByField.column, { 
        ascending: this.orderByField.ascending 
      });
    }

    // Apply limit
    if (this.limitValue) {
      query = query.limit(this.limitValue);
    }

    // Apply range
    if (this.rangeValue) {
      query = query.range(this.rangeValue.from, this.rangeValue.to);
    }

    return query;
  }
}

export const query = (table: string) => new QueryBuilder(table);
