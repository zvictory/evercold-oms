import { z } from "zod";

export const confirmReceiptSchema = z.object({
  routeId: z.string().min(1),
  orderIds: z.array(z.string()).min(1),
  confirmedAt: z.date().default(() => new Date()),
});
