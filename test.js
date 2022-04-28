import pc from '@prisma/client';

const prisma = new pc.PrismaClient();

const get = async () => {
  const data = await prisma.user.findMany({
    where: {
      id: 'cl2dsf06j0950tstm3r7f4ns7',
    },
    include: {
      friends: {
        where: {
          friendShip: {
            friends: {
              some: {
                userId: 'cl2gdfk1i0091k0tm66s31i7v',
              },
            },
          },
        },
      },
    },
  });

  const conversationData = await prisma.conversation.findMany({
    where: {
      id: 'cl2j3shhx0032b0tm5nj8gi4j',
    },
    include: {
      groupMember: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(conversationData[0].groupMember);
};

get();
