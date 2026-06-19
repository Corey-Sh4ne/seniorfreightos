import { getProjects }    from './_data/getProjects';
import DashboardClient    from './_components/DashboardClient';

export default async function DashboardPage() {
  const projects = await getProjects();

  return <DashboardClient projects={projects} />;
}
