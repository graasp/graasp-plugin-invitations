import { UniqueIntegrityConstraintViolationError } from 'slonik';

import { Actor, DatabaseTransactionHandler, Item, MemberService, TaskStatus } from '@graasp/sdk';

import { BaseInvitation } from '../base-invitation';
import { InvitationService } from '../db-service';
import { DuplicateInvitationError, MemberAlreadyExistForEmailError } from '../errors';
import Invitation from '../interfaces/invitation';
import { BaseTask } from './base-task';

export type CreateInvitationTaskInputType = {
  invitation?: Partial<Invitation>;
  item?: Item;
};

// TODO: it would be better to correctly check the permissions as done when we create membership
// ex: cannot add a lower permission below, remove unnecessary permissions
// currently it is resolved automatically when creating the memberships
// how to prettily refactor and reuse the logic of membership?

class CreateInvitationTask extends BaseTask<Actor, Invitation> {
  memberService: MemberService;

  get name(): string {
    return CreateInvitationTask.name;
  }

  input: CreateInvitationTaskInputType;
  getInput: () => CreateInvitationTaskInputType;

  constructor(
    actor: Actor,
    service: InvitationService,
    memberService: MemberService,
    input?: CreateInvitationTaskInputType,
  ) {
    super(actor, service);
    this.memberService = memberService;
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { invitation, item } = this.input;

    const { permission, email: originalEmail, name } = invitation;

    // lowercase email
    const email = originalEmail.toLowerCase();

    // check no member has this email already -> a membership should be created right away
    const members = await this.memberService.getMatching({ email }, handler);
    if (members.length) {
      throw new MemberAlreadyExistForEmailError({ email });
    }

    try {
      this._result = await this.invitationService.create(
        new BaseInvitation(this.actor.id, item.path, { permission, name, email }),
        handler,
      );
    } catch (e) {
      // throw if an invitation for the pair item id and email already exists
      if (e instanceof UniqueIntegrityConstraintViolationError) {
        throw new DuplicateInvitationError({ permission, itemPath: item.path, email });
      }
      throw e;
    }

    this.status = TaskStatus.OK;
  }
}

export default CreateInvitationTask;
