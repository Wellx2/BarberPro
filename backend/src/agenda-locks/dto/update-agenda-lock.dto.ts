import { PartialType } from '@nestjs/swagger';
import { CreateAgendaLockDto } from './create-agenda-lock.dto';

export class UpdateAgendaLockDto extends PartialType(CreateAgendaLockDto) {}
