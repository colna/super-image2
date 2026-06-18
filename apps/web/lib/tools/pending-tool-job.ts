/**
 * 工具触发的「待执行生成任务」内存暂存。
 *
 * 工具栏在创建新会话后跳转到对应路由，由 ChatArea 在 loadMessages 完成后
 * 取出任务执行（与已有的 sessionStorage pending-prompt 机制同理）。但参考
 * 图片是 File 对象，无法序列化进 sessionStorage，故用模块级 Map 在内存中传递。
 */
export interface PendingToolJob {
  toolId: string;
  prompt: string;
  files: File[];
  params: { size: string; quality: string; n: number };
}

const jobs = new Map<string, PendingToolJob>();

export function setPendingToolJob(sessionId: string, job: PendingToolJob): void {
  jobs.set(sessionId, job);
}

/** 取出并移除指定会话的待执行任务（一次性消费，避免重复触发）。 */
export function takePendingToolJob(sessionId: string): PendingToolJob | undefined {
  const job = jobs.get(sessionId);
  jobs.delete(sessionId);
  return job;
}

export function hasPendingToolJob(sessionId: string): boolean {
  return jobs.has(sessionId);
}
