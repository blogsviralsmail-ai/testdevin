import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactGroupsController } from './contact-groups.controller';
import { ContactGroupsService } from './contact-groups.service';

@Module({
  controllers: [ContactsController, ContactGroupsController],
  providers: [ContactsService, ContactGroupsService],
  exports: [ContactsService],
})
export class ContactsModule {}
