import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/customers/customer")({
  beforeLoad: () => {
    redirect({
      to: "/customers",
      throw: true,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
