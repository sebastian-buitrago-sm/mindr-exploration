import { IRemovalRequestRepository } from '../../domain/ports/IRemovalRequestRepository';
import { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';

export class GetRemovalRequestsUseCase {
  constructor(private readonly repository: IRemovalRequestRepository) {}

  async execute(): Promise<RemovalRequestRecord[]> {
    return this.repository.findAll();
  }
}
