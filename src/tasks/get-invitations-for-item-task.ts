import { Actor, DatabaseTransactionHandler, Item, TaskStatus } from '@graasp/sdk';

import { InvitationService } from '../db-service';
import Invitation from '../interfaces/invitation';
import { BaseTask } from './base-task';

export type GetInvitationsForItemTaskInputType = {
  item?: Item;
};

class GetInvitationsForItemTask extends BaseTask<Actor, readonly Invitation[]> {
  get name(): string {
    return GetInvitationsForItemTask.name;
  }

  input: GetInvitationsForItemTaskInputType;
  getInput: () => GetInvitationsForItemTaskInputType;

  constructor(
    actor: Actor,
    service: InvitationService,
    input?: GetInvitationsForItemTaskInputType,
  ) {
    super(actor, service);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    this._result = await this.invitationService.getForItem(this.input.item.path, handler);

    this.status = TaskStatus.OK;
  }
}

export default GetInvitationsForItemTask;
