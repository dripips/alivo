import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsageService } from '../../modules/billing/usage.service';

@Injectable()
export class AiQuotaGuard implements CanActivate {
  constructor(private usage: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return true;

    const allowed = await this.usage.checkQuota(userId, 'ai_message');
    if (!allowed) {
      throw new ForbiddenException(
        'AI message limit reached for this month. Upgrade your plan.',
      );
    }

    return true;
  }
}
