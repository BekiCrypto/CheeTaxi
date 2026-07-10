import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssistantService } from './assistant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  chat(
    @CurrentUser('id') userId: string,
    @Body() body: { message: string; language?: string },
  ) {
    return this.assistant.chat(userId, body.message, body.language ?? 'en');
  }

  @Post('voice/transcribe')
  @ApiOperation({ summary: 'Transcribe voice audio to text (ASR)' })
  transcribe(@Body() body: { audio: string; language?: string }) {
    return this.assistant.transcribe(body.audio, body.language ?? 'am');
  }

  @Post('voice/synthesize')
  @ApiOperation({ summary: 'Convert text to speech (TTS)' })
  synthesize(@Body() body: { text: string; language?: string }) {
    return this.assistant.synthesize(body.text, body.language ?? 'am');
  }
}
