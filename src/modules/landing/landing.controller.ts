import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class LandingController {
  @Get()
  root(@Req() req: Request, @Res() res: Response) {
    const lang = req.acceptsLanguages('ru', 'en') || 'en';
    const preferred = lang === 'ru' ? 'ru' : 'en';
    res.redirect(302, `/${preferred}`);
  }

  @Get('ru')
  ru(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', '..', 'public', 'ru.html'));
  }

  @Get('en')
  en(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', '..', '..', 'public', 'en.html'));
  }
}
