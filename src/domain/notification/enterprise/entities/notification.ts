import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface NotificationProps {
  emails: string[]
  title: string
  content: string
  adminId?: string
  createdAt: Date
}

export class Notification extends Entity<NotificationProps> {
  get emails() {
    return this.props.emails
  }

  get title() {
    return this.props.title
  }

  get content() {
    return this.props.content
  }

  get adminId() {
    return this.props.adminId
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<NotificationProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const notification = new Notification(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return notification
  }
}
