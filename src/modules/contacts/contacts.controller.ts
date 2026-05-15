import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/contacts')
export class ContactsController {
  constructor(private contacts: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Add emergency contact' })
  create(@Req() req: any, @Body() dto: CreateContactDto) {
    return this.contacts.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all emergency contacts' })
  findAll(@Req() req: any) {
    return this.contacts.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove emergency contact' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.contacts.remove(req.user.id, id);
  }
}
