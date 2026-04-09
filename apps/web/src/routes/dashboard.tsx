import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: () => {
    redirect({
      to: "/",
      throw: true,
    });
  },
});

function RouteComponent() {
  return null;
}
