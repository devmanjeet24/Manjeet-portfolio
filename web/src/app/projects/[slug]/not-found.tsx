import { NotFoundView } from "@/components/sections/not-found-view";

/** Shown if a project page calls notFound() (the proxy normally catches unknown slugs first). */
export default function ProjectNotFound() {
  return (
    <NotFoundView
      label="Project not found"
      before="That project does not"
      italic="exist"
      body="The link may be old or mistyped. The projects that do exist are all on the list."
    />
  );
}
