import { Injectable, Logger } from '@nestjs/common';

export interface SafetyAssessment {
  level: 'safe' | 'concern' | 'crisis';
  triggers: string[];
  estimatedMood: number;
  explanation?: string;
}

@Injectable()
export class SafetyAnalyzer {
  private readonly logger = new Logger(SafetyAnalyzer.name);

  private readonly crisisPatterns = {
    ru: [
      /не\s*хочу\s*жить/i,
      /покончить\s*(с\s*собой|жизн)/i,
      /суицид/i,
      /убить\s*себя/i,
      /повеситься|повешусь/i,
      /выброшусь|спрыгну/i,
      /нет\s*смысла\s*жить/i,
      /лучше\s*бы\s*меня\s*не\s*было/i,
      /уйти\s*из\s*жизни/i,
      /прощайте?\s*навсегда/i,
    ],
    en: [
      /don'?t\s*want\s*to\s*live/i,
      /kill\s*myself/i,
      /suicide/i,
      /end\s*(my|it)\s*all/i,
      /hang\s*myself/i,
      /jump\s*off/i,
      /no\s*point\s*(in\s*)?living/i,
      /better\s*off\s*dead/i,
      /goodbye\s*forever/i,
      /want\s*to\s*die/i,
    ],
  };

  private readonly concernPatterns = {
    ru: [
      /устал(а)?\s*от\s*всего/i,
      /всё\s*бессмысленно/i,
      /никому\s*не\s*нужн/i,
      /одинок(а|о)?/i,
      /депресси/i,
      /не\s*могу\s*больше/i,
      /хочу\s*исчезнуть/i,
      /ненавижу\s*себя/i,
      /всё\s*плохо/i,
      /не\s*вижу\s*выхода/i,
    ],
    en: [
      /tired\s*of\s*everything/i,
      /everything\s*is\s*pointless/i,
      /nobody\s*needs\s*me/i,
      /so\s*lonely/i,
      /depress/i,
      /can'?t\s*take\s*it\s*anymore/i,
      /want\s*to\s*disappear/i,
      /hate\s*myself/i,
      /everything\s*is\s*bad/i,
      /see\s*no\s*way\s*out/i,
    ],
  };

  quickCheck(text: string, locale: string = 'ru'): SafetyAssessment {
    const triggers: string[] = [];
    const lang = locale === 'en' ? 'en' : 'ru';

    for (const pattern of this.crisisPatterns[lang]) {
      if (pattern.test(text)) {
        triggers.push(pattern.source);
      }
    }

    if (triggers.length > 0) {
      return {
        level: 'crisis',
        triggers,
        estimatedMood: 1,
        explanation: 'Crisis-level language detected',
      };
    }

    for (const pattern of this.concernPatterns[lang]) {
      if (pattern.test(text)) {
        triggers.push(pattern.source);
      }
    }

    if (triggers.length > 0) {
      return {
        level: 'concern',
        triggers,
        estimatedMood: 2,
        explanation: 'Concerning language detected',
      };
    }

    return { level: 'safe', triggers: [], estimatedMood: 4 };
  }
}
