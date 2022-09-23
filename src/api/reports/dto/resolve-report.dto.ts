import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum resolveDecide {
  Resolve = 'Resolve',
  Refuse = 'Refuse',
}

export class ResolveReportDto {
  @ApiProperty({ enum: resolveDecide })
  @IsEnum(resolveDecide)
  @IsNotEmpty()
  decide: resolveDecide;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
