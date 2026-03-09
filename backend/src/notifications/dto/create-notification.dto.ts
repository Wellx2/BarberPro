import { IsString, IsEnum, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority, NotificationChannel } from './notification.enums';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'ID do usuário que receberá a notificação' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Dados extras da notificação' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    isArray: true,
    default: [NotificationChannel.IN_APP],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}
