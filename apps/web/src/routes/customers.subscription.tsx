import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  customerId: z.string().optional(),
});

export const Route = createFileRoute("/customers/subscription")({
  component: RouteComponent,
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    redirect({
      to: "/customers",
      search: search.customerId ? { customerId: search.customerId } : {},
      throw: true,
    });
  },
});

function RouteComponent() {
  return null;
}
