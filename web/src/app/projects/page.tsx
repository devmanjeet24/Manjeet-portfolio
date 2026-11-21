import { redirect } from "next/navigation";

/** There is no separate list page: the projects live on the home page. */
export default function ProjectsIndex() {
  redirect("/#projects");
}
