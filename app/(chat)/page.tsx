import { cookies } from 'next/headers';
import { createAgent, getAgentById, getTools, getUser } from '@/db/queries';
import { Agent } from '@/db/schema';

import { Chat } from '@/components/custom/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/model';
import { generateUUID } from '@/lib/utils';
import { AgentDefault } from '@/ai/default-agent';
import { auth } from '@/app/(auth)/auth';
import { notFound } from 'next/navigation';
import { Dashboard } from '@/components/custom/dashboard-root';


export default async function Page(props: { searchParams: Promise<any> }) {
  const session: any = await auth()
  const id = generateUUID();
  const searchParams = await props.searchParams;
  const { startAgent } = searchParams;

  // let agent: Agent;
  // if (startAgent) {
  //   agent = await getAgentById(startAgent)
  // }
  // // else {
  // //   AgentDefault.userId = session?.user?.id;
  // //   [agent] = await createAgent(AgentDefault)
  // // }
  // if (!agent) {
  //   return notFound()
  // }
  // const tools = await getTools(agent.tool as any);
  const cookieStore = await cookies();
  const value = cookieStore.get('model')?.value;
  const selectedModelName =
    models.find((m) => m.name === value)?.name || DEFAULT_MODEL_NAME;

  return (
    // <Chat
    //   username={session.user.username}
    //   key={id}
    //   id={id}
    //   initialMessages={[]}
    //   selectedModelName={selectedModelName}
    //   tools={tools}
    //   agent={agent}
    // />
    <Dashboard session={session} />
  );
}
