import { PubSub, withFilter } from 'graphql-subscriptions';
import pc from '@prisma/client';

const pubsub = new PubSub();

const prisma = new pc.PrismaClient();

const resolvers = {
  Subscription: {
    messageCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MESSAGE_CREATED']),
        (payload, variables) => {
          return payload.messageCreated.conversationId == variables.conversationId;
        }
      ),
    },
    inviteSended: {
      subscribe: () => {
        return pubsub.asyncIterator(['INVITE_SEND']);
      },
    },
    conversationAdded: {
      subscribe: () => {
        return pubsub.asyncIterator(['CONVERSATION_ADDED']);
      },

      subscribe: withFilter(
        () => pubsub.asyncIterator(['CONVERSATION_ADDED']),
        (payload, variables) => {
          const match = payload.conversationAdded[0].groupMember.filter((user) => user.userId == variables.userId);

          if (match.length > 0) return true;

          return false;
        }
      ),
    },
  },
  Query: {
    getConversations: (_parent, args, context) => {
      return prisma.groupMember.findMany({
        where: {
          userId: args.userId,
        },
      });
    },

    getConversation: (_parent, args, context) => {
      return prisma.conversation.findUnique({
        where: {
          id: args.conversationId,
        },
        include: {
          messages: true,
        },
      });
    },

    getInvites: (_parent, args, context) => {
      return prisma.invite.findMany({
        where: {
          receiverId: args.userId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });
    },
  },
  Mutation: {
    createMessage: async (_parent, args, context) => {
      const message = await prisma.message.create({
        data: {
          text: args.input.text,
          userId: args.input.userId,
          conversationId: args.input.conversationId,
        },
        include: {
          user: true,
        },
      });

      pubsub.publish('MESSAGE_CREATED', { messageCreated: message });

      return message;
    },
    sendInvite: async (_parent, args, context) => {
      const matchFriendship = await prisma.user.findMany({
        where: {
          id: args.input.senderId,
        },
        include: {
          friends: {
            where: {
              friendShip: {
                friends: {
                  some: {
                    userId: args.input.receiverId,
                  },
                },
              },
            },
          },
        },
      });

      const matchInvite = await prisma.invite.findMany({
        where: {
          senderId: args.input.senderId,
          receiverId: args.input.receiverId,
        },
      });

      if (matchFriendship[0].friends.length > 0 || matchInvite.length > 0) return null;

      const invite = await prisma.invite.create({
        data: {
          senderId: args.input.senderId,
          receiverId: args.input.receiverId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      pubsub.publish('INVITE_SEND', { inviteSended: invite });

      return invite;
    },
    acceptInvite: async (_parent, args, context) => {
      try {
        const invite = await prisma.invite.findUnique({
          where: {
            id: args.id,
          },
        });

        const friendship = await prisma.friendship.create({
          data: {},
        });

        const friends = await prisma.friend.createMany({
          data: [
            {
              friendShipId: friendship.id,
              userId: invite?.senderId,
            },
            {
              friendShipId: friendship.id,
              userId: invite?.receiverId,
            },
          ],
        });

        await prisma.invite.delete({
          where: {
            id: args.id,
          },
        });

        const conversation = await prisma.conversation.create({
          data: {},
        });

        const groupMembers = await prisma.groupMember.createMany({
          data: [
            {
              userId: invite?.senderId,
              conversationId: conversation.id,
            },
            {
              userId: invite?.receiverId,
              conversationId: conversation.id,
            },
          ],
        });

        const conversationData = await prisma.conversation.findMany({
          where: {
            id: conversation.id,
          },
          include: {
            groupMember: {
              include: {
                user: true,
              },
            },
          },
        });

        pubsub.publish('CONVERSATION_ADDED', { conversationAdded: conversationData });

        return {
          message: 'Succesfully added',
        };
      } catch (e) {
        return {
          message: `Error ${e}`,
        };
      }
    },
    denyInvite: async (_parent, args, context) => {
      return prisma.invite.delete({
        where: {
          id: args.id,
        },
      });
    },
  },
  GroupMember: {
    user: (parent, args, context) => {
      return prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      });
    },
  },
  Conversation: {
    messages: (parent, args, context) => {
      return prisma.message.findMany({
        where: {
          conversationId: parent.id,
        },
        include: {
          user: true,
        },
      });
    },
    groupMember: (parent, args, context) => {
      return prisma.groupMember.findMany({
        where: {
          conversationId: parent.id,
        },
      });
    },
  },
};

export default resolvers;
