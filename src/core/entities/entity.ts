import { UniqueEntityID } from './unique-entity-id'

export abstract class Entity<Props> {
  protected props: Props & { id: string }

  get id() {
    return this.props.id
  }

  protected constructor(props: Props, id?: UniqueEntityID | string | null) {
    this.props = {
      ...props,
      id: id ? id.toString() : new UniqueEntityID().toString(),
    }
  }
}
