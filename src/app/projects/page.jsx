export const dynamic = 'force-dynamic';

import { getProjects }  from '@/app/dashboard/_data/getProjects';
import ProjectsClient   from './_components/ProjectsClient';

export const metadata = {
  title: 'Projects — SeniorFreightOS',
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsClient projects={projects} />;
}
