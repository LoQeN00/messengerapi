import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: String
    name: String
    email: String
    emailVerified: Boolean
    image: String
    createdAt: String
    updatedAt: String
    groupsMember: [GroupMember]
  }

  type Subscription {
    messageCreated(conversationId: String): Message
    inviteSended: Invite
    conversationAdded(userId: String): [Conversation]
  }

  type Query {
    getConversations(userId: String!): [GroupMember]
    getConversation(conversationId: String): Conversation
    getInvites(userId: String!): [Invite]
  }

  type Mutation {
    createMessage(input: createMessageInput!): Message
    sendInvite(input: sendInviteInput!): Invite
    denyInvite(id: String): Invite
    acceptInvite(id: String): Response
  }

  type Conversation {
    id: String
    name: String
    groupMember: [GroupMember]
    messages: [Message]
  }

  type Response {
    message: String
  }

  type GroupMember {
    id: String
    userId: String
    conversationId: String
    user: User
  }

  type Message {
    id: String
    userId: String
    user: User
    text: String
    createdAt: String
    updatedAt: String
    conversationId: String
  }

  type Friendship {
    id: String
    createdAt: String
    updatedAt: String
    friends: [Friend]
  }

  type Friend {
    id: String
    friendShipId: String
    userId: String
  }

  type Invite {
    id: String
    sender: User
    senderId: String
    receiver: User
    receiverId: String
  }

  input createMessageInput {
    userId: String!
    text: String!
    conversationId: String!
  }

  input sendInviteInput {
    senderId: String
    receiverId: String
  }
`;

export default typeDefs;
