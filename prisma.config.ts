import { PrismaConfig } from '@prisma/config';

export default {
  // Future mein agar hume Prisma ke experimental/early-access 
  // features chahiye (like Typed SQL), toh ise true rakhte hain.
  earlyAccess: true,

  // Explicitly define kar rahe hain ki hamara schema kahan hai.
  // Yeh monorepos ya AWS ECS deployments me path issues se bachata hai.
  schema: 'prisma/schema.prisma',

} satisfies PrismaConfig;