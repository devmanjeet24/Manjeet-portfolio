import { NotFoundView } from "@/components/sections/not-found-view";

export default function NotFound() {
  return (
    <NotFoundView
      label="Page not found"
      before="That page does not"
      italic="exist"
      body="The link may be old or mistyped. You can head back home or look at the projects."
    />
  );
}
