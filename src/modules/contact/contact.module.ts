import { Module } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import {
  StorefrontContactController,
  ContactMessagesController,
} from './contact.controller.js';

@Module({
  controllers: [StorefrontContactController, ContactMessagesController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
