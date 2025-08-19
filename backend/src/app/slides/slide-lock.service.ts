import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

export interface SlideLockState {
  operation: string;
  startedAt: number;
}

/**
 * 内存级锁：同一 slideId 限制并发执行多个长任务。
 * 多实例部署需改为分布式锁（如 Redis + redlock）。
 */
@Injectable()
export class SlideLockService {
  private mutexes = new Map<number, Mutex>();
  private states = new Map<number, SlideLockState>();

  private getMutex(id: number) {
    let m = this.mutexes.get(id);
    if (!m) {
      m = new Mutex();
      this.mutexes.set(id, m);
    }
    return m;
  }

  getState(id: number) {
    return this.states.get(id);
  }

  async withLock<T>(id: number, operation: string, fn: () => Promise<T>): Promise<T> {
    const mutex = this.getMutex(id);
    if (mutex.isLocked()) {
      const s = this.states.get(id);
      const err: any = new Error('Slide is busy');
      err.code = 'SLIDE_BUSY';
      err.current = s;
      throw err;
    }
    return mutex.runExclusive(async () => {
      this.states.set(id, { operation, startedAt: Date.now() });
      try {
        return await fn();
      } finally {
        this.states.delete(id);
      }
    });
  }
}
